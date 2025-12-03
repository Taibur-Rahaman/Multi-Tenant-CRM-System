# NeoBit CRM - Telegram Bot Dockerfile

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -s /bin/bash neobit
USER neobit

# Copy requirements first for better caching
COPY --chown=neobit:neobit requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --user -r requirements.txt

# Add local bin to PATH
ENV PATH="/home/neobit/.local/bin:$PATH"

# Copy application code
COPY --chown=neobit:neobit . .

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:8081/health || exit 1

# Expose port
EXPOSE 8081

# Run the bot
CMD ["python", "bot.py"]

