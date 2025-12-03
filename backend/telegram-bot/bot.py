#!/usr/bin/env python3
"""
NeoBit CRM - Telegram Bot Service

Handles:
- Incoming messages from Telegram users
- Webhook/Polling mode configuration
- Message routing to tenant inboxes
- Auto-replies and customer linking

Security:
- Bot token stored in environment variables
- Webhook secret validation
- Rate limiting per chat
"""
impor os
import logging
import hashlib
import hmac
import json
import asyncio
from datetime import datetime
from typing import Optional, Dict, Any
from dataclasses import dataclass

import httpx
from telegram import Update, Bot
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    filters,
    ContextTypes,
)
from fastapi import FastAPI, Request, HTTPException, Header
from fastapi.responses import JSONResponse
import uvicorn
import redis
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
WEBHOOK_URL = os.getenv("TELEGRAM_WEBHOOK_URL")
WEBHOOK_SECRET = os.getenv("TELEGRAM_WEBHOOK_SECRET", "")
BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:8080")
BACKEND_API_KEY = os.getenv("BACKEND_API_KEY", "")
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
USE_WEBHOOK = os.getenv("USE_WEBHOOK", "true").lower() == "true"
PORT = int(os.getenv("PORT", "8081"))

# Logging setup
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Redis client for rate limiting and caching
redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

# HTTP client for backend API calls
http_client = httpx.AsyncClient(
    base_url=BACKEND_URL,
    headers={"X-API-Key": BACKEND_API_KEY},
    timeout=30.0
)


@dataclass
class TenantConfig:
    """Tenant-specific bot configuration"""
    tenant_id: str
    welcome_message: str
    auto_reply_enabled: bool
    auto_reply_message: str


# ============================================================
# TELEGRAM MESSAGE HANDLERS
# ============================================================

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """
    Handle /start command - Welcome new users
    
    Flow:
    1. Check if chat is linked to a tenant
    2. Send appropriate welcome message
    3. Log interaction in backend
    """
    chat_id = update.effective_chat.id
    user = update.effective_user
    
    logger.info(f"Start command from chat {chat_id}, user: {user.username or user.id}")
    
    # Try to find tenant for this chat
    tenant_config = await get_tenant_config(chat_id)
    
    if tenant_config:
        welcome_msg = tenant_config.welcome_message or (
            f"Hello {user.first_name}! 👋\n\n"
            "Welcome to our support channel. How can we help you today?\n\n"
            "An agent will respond to your message shortly."
        )
    else:
        welcome_msg = (
            f"Hello {user.first_name}! 👋\n\n"
            "This bot is part of the NeoBit CRM system.\n"
            "If you're a customer, please contact your vendor for the correct support channel."
        )
    
    await update.message.reply_text(welcome_msg)
    
    # Log the start interaction
    await log_interaction(chat_id, user, "COMMAND", "/start")


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /help command"""
    help_text = (
        "📚 *Available Commands*\n\n"
        "/start - Start the bot\n"
        "/help - Show this help message\n"
        "/status - Check if support is available\n\n"
        "Simply send a message to reach our support team!"
    )
    
    await update.message.reply_text(help_text, parse_mode="Markdown")


async def status_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /status command - Check support availability"""
    chat_id = update.effective_chat.id
    
    tenant_config = await get_tenant_config(chat_id)
    
    if tenant_config:
        status_msg = (
            "✅ *Support Status*\n\n"
            "We're here to help! Send us a message and "
            "an agent will respond as soon as possible.\n\n"
            "Average response time: < 2 hours"
        )
    else:
        status_msg = "❓ This chat is not connected to any support channel."
    
    await update.message.reply_text(status_msg, parse_mode="Markdown")


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """
    Handle incoming text messages
    
    Flow:
    1. Rate limit check
    2. Find tenant for this chat
    3. Create customer if not exists
    4. Log message as interaction
    5. Send auto-reply if enabled
    6. Notify backend (for real-time updates)
    """
    chat_id = update.effective_chat.id
    user = update.effective_user
    message = update.message
    text = message.text
    
    logger.info(f"Message from chat {chat_id}: {text[:50]}...")
    
    # Rate limiting
    if not await check_rate_limit(chat_id):
        await message.reply_text(
            "⚠️ You're sending messages too quickly. Please wait a moment."
        )
        return
    
    # Get tenant configuration
    tenant_config = await get_tenant_config(chat_id)
    
    if not tenant_config:
        # Try to link chat to tenant or create new customer
        tenant_config = await try_link_chat(chat_id, user)
        
        if not tenant_config:
            await message.reply_text(
                "This chat is not connected to any support channel.\n"
                "Please contact your vendor for assistance."
            )
            return
    
    # Log the message as an interaction
    interaction_id = await create_interaction(
        tenant_id=tenant_config.tenant_id,
        chat_id=chat_id,
        user=user,
        message_text=text,
        message_id=message.message_id
    )
    
    # Send auto-reply if enabled
    if tenant_config.auto_reply_enabled:
        auto_reply = tenant_config.auto_reply_message or (
            "Thank you for your message! 📬\n\n"
            "An agent will respond shortly."
        )
        await message.reply_text(auto_reply)
    
    # Notify backend for real-time updates (WebSocket)
    await notify_backend(tenant_config.tenant_id, chat_id, interaction_id)


async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle photo messages"""
    chat_id = update.effective_chat.id
    user = update.effective_user
    message = update.message
    
    tenant_config = await get_tenant_config(chat_id)
    
    if not tenant_config:
        return
    
    # Get largest photo
    photo = message.photo[-1]
    file = await context.bot.get_file(photo.file_id)
    
    # Create interaction with attachment
    await create_interaction(
        tenant_id=tenant_config.tenant_id,
        chat_id=chat_id,
        user=user,
        message_text=message.caption or "[Photo]",
        message_id=message.message_id,
        attachment_type="photo",
        attachment_url=file.file_path
    )
    
    await message.reply_text("Photo received! An agent will review it shortly.")


async def handle_document(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle document messages"""
    chat_id = update.effective_chat.id
    user = update.effective_user
    message = update.message
    document = message.document
    
    tenant_config = await get_tenant_config(chat_id)
    
    if not tenant_config:
        return
    
    file = await context.bot.get_file(document.file_id)
    
    await create_interaction(
        tenant_id=tenant_config.tenant_id,
        chat_id=chat_id,
        user=user,
        message_text=message.caption or f"[Document: {document.file_name}]",
        message_id=message.message_id,
        attachment_type="document",
        attachment_url=file.file_path,
        attachment_name=document.file_name
    )
    
    await message.reply_text("Document received! An agent will review it shortly.")


# ============================================================
# BACKEND API CALLS
# ============================================================

async def get_tenant_config(chat_id: int) -> Optional[TenantConfig]:
    """Get tenant configuration for a chat from cache or backend"""
    
    # Check cache first
    cache_key = f"telegram:chat:{chat_id}:config"
    cached = redis_client.get(cache_key)
    
    if cached:
        data = json.loads(cached)
        return TenantConfig(**data)
    
    # Fetch from backend
    try:
        response = await http_client.get(
            f"/api/internal/telegram/chat/{chat_id}/config"
        )
        
        if response.status_code == 200:
            data = response.json()
            config = TenantConfig(
                tenant_id=data["tenantId"],
                welcome_message=data.get("welcomeMessage", ""),
                auto_reply_enabled=data.get("autoReplyEnabled", True),
                auto_reply_message=data.get("autoReplyMessage", "")
            )
            
            # Cache for 5 minutes
            redis_client.setex(
                cache_key,
                300,
                json.dumps(config.__dict__)
            )
            
            return config
        
        return None
        
    except Exception as e:
        logger.error(f"Error fetching tenant config: {e}")
        return None


async def try_link_chat(chat_id: int, user) -> Optional[TenantConfig]:
    """Try to link a new chat to a tenant based on user info"""
    try:
        response = await http_client.post(
            "/api/internal/telegram/chat/link",
            json={
                "chatId": chat_id,
                "chatType": "private",
                "username": user.username,
                "firstName": user.first_name,
                "lastName": user.last_name
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            return TenantConfig(
                tenant_id=data["tenantId"],
                welcome_message=data.get("welcomeMessage", ""),
                auto_reply_enabled=data.get("autoReplyEnabled", True),
                auto_reply_message=data.get("autoReplyMessage", "")
            )
        
        return None
        
    except Exception as e:
        logger.error(f"Error linking chat: {e}")
        return None


async def create_interaction(
    tenant_id: str,
    chat_id: int,
    user,
    message_text: str,
    message_id: int,
    attachment_type: str = None,
    attachment_url: str = None,
    attachment_name: str = None
) -> Optional[str]:
    """Create interaction in backend CRM"""
    try:
        payload = {
            "tenantId": tenant_id,
            "type": "CHAT",
            "channel": "TELEGRAM",
            "direction": "INBOUND",
            "content": message_text,
            "metadata": {
                "telegramChatId": chat_id,
                "telegramMessageId": message_id,
                "telegramUsername": user.username,
                "telegramFirstName": user.first_name,
                "telegramLastName": user.last_name
            }
        }
        
        if attachment_type:
            payload["attachments"] = [{
                "type": attachment_type,
                "url": attachment_url,
                "name": attachment_name
            }]
        
        response = await http_client.post(
            "/api/internal/telegram/interactions",
            json=payload
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            return data.get("id")
        
        logger.error(f"Failed to create interaction: {response.status_code}")
        return None
        
    except Exception as e:
        logger.error(f"Error creating interaction: {e}")
        return None


async def notify_backend(tenant_id: str, chat_id: int, interaction_id: str) -> None:
    """Notify backend of new message for real-time updates"""
    try:
        await http_client.post(
            "/api/internal/telegram/notify",
            json={
                "tenantId": tenant_id,
                "chatId": chat_id,
                "interactionId": interaction_id,
                "event": "new_message"
            }
        )
    except Exception as e:
        logger.error(f"Error notifying backend: {e}")


async def send_outbound_message(
    chat_id: int,
    text: str,
    reply_to_message_id: int = None
) -> bool:
    """Send message from agent to Telegram user"""
    try:
        bot = Bot(token=BOT_TOKEN)
        await bot.send_message(
            chat_id=chat_id,
            text=text,
            reply_to_message_id=reply_to_message_id
        )
        return True
    except Exception as e:
        logger.error(f"Error sending outbound message: {e}")
        return False


# ============================================================
# RATE LIMITING
# ============================================================

async def check_rate_limit(chat_id: int) -> bool:
    """Check if chat is within rate limits"""
    key = f"telegram:ratelimit:{chat_id}"
    
    # Allow 10 messages per minute
    current = redis_client.incr(key)
    
    if current == 1:
        redis_client.expire(key, 60)
    
    return current <= 10


# ============================================================
# WEBHOOK HANDLING (FastAPI)
# ============================================================

app = FastAPI(title="NeoBit Telegram Bot")


def verify_webhook_secret(x_telegram_bot_api_secret_token: str = Header(None)) -> bool:
    """Verify webhook request is from Telegram"""
    if not WEBHOOK_SECRET:
        return True
    
    return hmac.compare_digest(
        x_telegram_bot_api_secret_token or "",
        WEBHOOK_SECRET
    )


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@app.post("/webhook/{tenant_id}")
async def telegram_webhook(
    tenant_id: str,
    request: Request,
    x_telegram_bot_api_secret_token: str = Header(None)
):
    """
    Webhook endpoint for Telegram updates
    
    Called by Telegram servers when a message is received.
    Verifies the request and processes the update.
    """
    # Verify webhook secret
    if not verify_webhook_secret(x_telegram_bot_api_secret_token):
        logger.warning(f"Invalid webhook secret for tenant {tenant_id}")
        raise HTTPException(status_code=403, detail="Invalid secret")
    
    try:
        # Parse update
        data = await request.json()
        logger.debug(f"Webhook update for tenant {tenant_id}: {data}")
        
        # Process update using the application
        update = Update.de_json(data, application.bot)
        await application.process_update(update)
        
        return JSONResponse({"status": "ok"})
        
    except Exception as e:
        logger.error(f"Error processing webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/send")
async def send_message_endpoint(request: Request):
    """
    API endpoint for backend to send messages
    
    Request:
    {
        "chatId": 123456789,
        "text": "Hello from agent!",
        "replyToMessageId": 123  // optional
    }
    """
    try:
        data = await request.json()
        
        success = await send_outbound_message(
            chat_id=data["chatId"],
            text=data["text"],
            reply_to_message_id=data.get("replyToMessageId")
        )
        
        if success:
            return {"status": "sent"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send message")
            
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing field: {e}")


# ============================================================
# MAIN APPLICATION
# ============================================================

# Create Telegram application
application = (
    Application.builder()
    .token(BOT_TOKEN)
    .build()
)

# Register handlers
application.add_handler(CommandHandler("start", start_command))
application.add_handler(CommandHandler("help", help_command))
application.add_handler(CommandHandler("status", status_command))
application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
application.add_handler(MessageHandler(filters.PHOTO, handle_photo))
application.add_handler(MessageHandler(filters.Document.ALL, handle_document))


async def setup_webhook():
    """Setup webhook with Telegram"""
    if USE_WEBHOOK and WEBHOOK_URL:
        await application.bot.set_webhook(
            url=WEBHOOK_URL,
            secret_token=WEBHOOK_SECRET
        )
        logger.info(f"Webhook set to: {WEBHOOK_URL}")
    else:
        await application.bot.delete_webhook()
        logger.info("Webhook deleted, using polling mode")


def main():
    """Main entry point"""
    logger.info("Starting NeoBit Telegram Bot...")
    
    if not BOT_TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN not set!")
        return
    
    if USE_WEBHOOK:
        # Webhook mode - run FastAPI server
        logger.info(f"Running in webhook mode on port {PORT}")
        
        @app.on_event("startup")
        async def startup():
            await setup_webhook()
            await application.initialize()
        
        @app.on_event("shutdown")
        async def shutdown():
            await application.shutdown()
            await http_client.aclose()
        
        uvicorn.run(app, host="0.0.0.0", port=PORT)
    else:
        # Polling mode
        logger.info("Running in polling mode")
        
        async def run_polling():
            await setup_webhook()
            await application.initialize()
            await application.start()
            await application.updater.start_polling()
            
            # Keep running
            while True:
                await asyncio.sleep(1)
        
        asyncio.run(run_polling())


if __name__ == "__main__":
    main()


