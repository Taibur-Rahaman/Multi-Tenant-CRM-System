#!/usr/bin/env python3
"""
Multi-Tenant CRM MCP Server

This MCP server exposes CRM functionality as tools that AI assistants
can use to interact with the CRM system.

Tools provided:
- Customer management (list, search, create, update)
- Task management (list, create, update status)
- Interaction logging
- Dashboard insights
"""

import asyncio
import json
from typing import Any
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import (
    Tool,
    TextContent,
    Resource,
    ResourceTemplate,
)

from config import settings
from crm_client import CRMClient

# Initialize MCP server
server = Server(settings.SERVER_NAME)

# CRM client instance
crm = CRMClient()


# ==================== Tools ====================

@server.list_tools()
async def list_tools() -> list[Tool]:
    """List all available CRM tools"""
    return [
        # Customer Tools
        Tool(
            name="list_customers",
            description="List all customers in the CRM with pagination. Returns customer names, emails, companies, and IDs.",
            inputSchema={
                "type": "object",
                "properties": {
                    "page": {
                        "type": "integer",
                        "description": "Page number (0-indexed)",
                        "default": 0
                    },
                    "size": {
                        "type": "integer",
                        "description": "Number of customers per page",
                        "default": 20
                    },
                    "search": {
                        "type": "string",
                        "description": "Optional search query to filter customers"
                    }
                }
            }
        ),
        Tool(
            name="get_customer",
            description="Get detailed information about a specific customer by their ID",
            inputSchema={
                "type": "object",
                "properties": {
                    "customer_id": {
                        "type": "string",
                        "description": "The unique ID of the customer"
                    }
                },
                "required": ["customer_id"]
            }
        ),
        Tool(
            name="search_customers",
            description="Search for customers by name, email, or company name",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query string"
                    }
                },
                "required": ["query"]
            }
        ),
        Tool(
            name="create_customer",
            description="Create a new customer in the CRM system",
            inputSchema={
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Customer's full name"
                    },
                    "email": {
                        "type": "string",
                        "description": "Customer's email address"
                    },
                    "phone": {
                        "type": "string",
                        "description": "Customer's phone number"
                    },
                    "company": {
                        "type": "string",
                        "description": "Customer's company name"
                    },
                    "notes": {
                        "type": "string",
                        "description": "Additional notes about the customer"
                    }
                },
                "required": ["name", "email"]
            }
        ),
        Tool(
            name="update_customer",
            description="Update an existing customer's information",
            inputSchema={
                "type": "object",
                "properties": {
                    "customer_id": {
                        "type": "string",
                        "description": "The unique ID of the customer to update"
                    },
                    "name": {"type": "string", "description": "New name"},
                    "email": {"type": "string", "description": "New email"},
                    "phone": {"type": "string", "description": "New phone"},
                    "company": {"type": "string", "description": "New company"},
                    "notes": {"type": "string", "description": "New notes"}
                },
                "required": ["customer_id"]
            }
        ),
        
        # Task Tools
        Tool(
            name="list_tasks",
            description="List all tasks with optional filters for status and priority",
            inputSchema={
                "type": "object",
                "properties": {
                    "page": {
                        "type": "integer",
                        "description": "Page number (0-indexed)",
                        "default": 0
                    },
                    "size": {
                        "type": "integer",
                        "description": "Number of tasks per page",
                        "default": 20
                    },
                    "status": {
                        "type": "string",
                        "enum": ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
                        "description": "Filter by task status"
                    },
                    "priority": {
                        "type": "string",
                        "enum": ["LOW", "MEDIUM", "HIGH", "URGENT"],
                        "description": "Filter by priority level"
                    }
                }
            }
        ),
        Tool(
            name="get_task",
            description="Get detailed information about a specific task",
            inputSchema={
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "string",
                        "description": "The unique ID of the task"
                    }
                },
                "required": ["task_id"]
            }
        ),
        Tool(
            name="create_task",
            description="Create a new task in the CRM system",
            inputSchema={
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "Task title"
                    },
                    "description": {
                        "type": "string",
                        "description": "Detailed task description"
                    },
                    "customer_id": {
                        "type": "string",
                        "description": "Associated customer ID (optional)"
                    },
                    "due_date": {
                        "type": "string",
                        "description": "Due date in ISO format (YYYY-MM-DD)"
                    },
                    "priority": {
                        "type": "string",
                        "enum": ["LOW", "MEDIUM", "HIGH", "URGENT"],
                        "description": "Task priority level",
                        "default": "MEDIUM"
                    },
                    "assigned_to": {
                        "type": "string",
                        "description": "User ID to assign the task to"
                    }
                },
                "required": ["title"]
            }
        ),
        Tool(
            name="update_task_status",
            description="Update the status of an existing task",
            inputSchema={
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "string",
                        "description": "The unique ID of the task"
                    },
                    "status": {
                        "type": "string",
                        "enum": ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
                        "description": "New status for the task"
                    }
                },
                "required": ["task_id", "status"]
            }
        ),
        
        # Interaction Tools
        Tool(
            name="list_interactions",
            description="List customer interactions/communications history",
            inputSchema={
                "type": "object",
                "properties": {
                    "customer_id": {
                        "type": "string",
                        "description": "Filter by customer ID"
                    },
                    "page": {
                        "type": "integer",
                        "description": "Page number",
                        "default": 0
                    },
                    "size": {
                        "type": "integer",
                        "description": "Results per page",
                        "default": 20
                    }
                }
            }
        ),
        Tool(
            name="log_interaction",
            description="Log a new interaction/communication with a customer",
            inputSchema={
                "type": "object",
                "properties": {
                    "customer_id": {
                        "type": "string",
                        "description": "Customer ID for the interaction"
                    },
                    "type": {
                        "type": "string",
                        "enum": ["CALL", "EMAIL", "MEETING", "NOTE", "OTHER"],
                        "description": "Type of interaction"
                    },
                    "subject": {
                        "type": "string",
                        "description": "Subject/title of the interaction"
                    },
                    "content": {
                        "type": "string",
                        "description": "Detailed content/notes of the interaction"
                    },
                    "channel": {
                        "type": "string",
                        "enum": ["PHONE", "EMAIL", "IN_PERSON", "VIDEO_CALL", "CHAT", "OTHER"],
                        "description": "Communication channel used",
                        "default": "OTHER"
                    }
                },
                "required": ["customer_id", "type", "subject", "content"]
            }
        ),
        
        # Dashboard Tools
        Tool(
            name="get_dashboard_stats",
            description="Get CRM dashboard statistics including customer count, task metrics, and interaction summaries",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
        Tool(
            name="get_recent_activities",
            description="Get recent activities and events from the CRM",
            inputSchema={
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "Number of recent activities to retrieve",
                        "default": 10
                    }
                }
            }
        ),
        
        # Account Tools
        Tool(
            name="list_accounts",
            description="List all business accounts in the CRM",
            inputSchema={
                "type": "object",
                "properties": {
                    "page": {
                        "type": "integer",
                        "description": "Page number",
                        "default": 0
                    },
                    "size": {
                        "type": "integer",
                        "description": "Results per page",
                        "default": 20
                    }
                }
            }
        ),
        Tool(
            name="get_account",
            description="Get detailed information about a specific business account",
            inputSchema={
                "type": "object",
                "properties": {
                    "account_id": {
                        "type": "string",
                        "description": "The unique ID of the account"
                    }
                },
                "required": ["account_id"]
            }
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    """Execute a CRM tool and return results"""
    try:
        result = await _execute_tool(name, arguments)
        return [TextContent(
            type="text",
            text=json.dumps(result, indent=2, default=str)
        )]
    except Exception as e:
        return [TextContent(
            type="text",
            text=json.dumps({
                "error": True,
                "message": str(e),
                "tool": name
            }, indent=2)
        )]


async def _execute_tool(name: str, args: dict[str, Any]) -> dict[str, Any]:
    """Route tool calls to appropriate handlers"""
    
    # Customer tools
    if name == "list_customers":
        return await crm.list_customers(
            page=args.get("page", 0),
            size=args.get("size", 20),
            search=args.get("search")
        )
    elif name == "get_customer":
        return await crm.get_customer(args["customer_id"])
    elif name == "search_customers":
        return await crm.search_customers(args["query"])
    elif name == "create_customer":
        return await crm.create_customer(
            name=args["name"],
            email=args["email"],
            phone=args.get("phone"),
            company=args.get("company"),
            notes=args.get("notes")
        )
    elif name == "update_customer":
        customer_id = args.pop("customer_id")
        return await crm.update_customer(customer_id, **args)
    
    # Task tools
    elif name == "list_tasks":
        return await crm.list_tasks(
            page=args.get("page", 0),
            size=args.get("size", 20),
            status=args.get("status"),
            priority=args.get("priority")
        )
    elif name == "get_task":
        return await crm.get_task(args["task_id"])
    elif name == "create_task":
        return await crm.create_task(
            title=args["title"],
            description=args.get("description"),
            customer_id=args.get("customer_id"),
            due_date=args.get("due_date"),
            priority=args.get("priority", "MEDIUM"),
            assigned_to=args.get("assigned_to")
        )
    elif name == "update_task_status":
        return await crm.update_task_status(
            task_id=args["task_id"],
            status=args["status"]
        )
    
    # Interaction tools
    elif name == "list_interactions":
        return await crm.list_interactions(
            customer_id=args.get("customer_id"),
            page=args.get("page", 0),
            size=args.get("size", 20)
        )
    elif name == "log_interaction":
        return await crm.create_interaction(
            customer_id=args["customer_id"],
            interaction_type=args["type"],
            subject=args["subject"],
            content=args["content"],
            channel=args.get("channel", "OTHER")
        )
    
    # Dashboard tools
    elif name == "get_dashboard_stats":
        return await crm.get_dashboard_stats()
    elif name == "get_recent_activities":
        return await crm.get_recent_activities(limit=args.get("limit", 10))
    
    # Account tools
    elif name == "list_accounts":
        return await crm.list_accounts(
            page=args.get("page", 0),
            size=args.get("size", 20)
        )
    elif name == "get_account":
        return await crm.get_account(args["account_id"])
    
    else:
        raise ValueError(f"Unknown tool: {name}")


# ==================== Resources ====================

@server.list_resources()
async def list_resources() -> list[Resource]:
    """List available CRM resources"""
    return [
        Resource(
            uri="crm://dashboard",
            name="CRM Dashboard",
            description="Current CRM dashboard with key metrics and statistics",
            mimeType="application/json"
        ),
        Resource(
            uri="crm://customers",
            name="Customer List",
            description="List of all customers in the CRM",
            mimeType="application/json"
        ),
        Resource(
            uri="crm://tasks/pending",
            name="Pending Tasks",
            description="All pending tasks that need attention",
            mimeType="application/json"
        ),
        Resource(
            uri="crm://activities/recent",
            name="Recent Activities",
            description="Recent activities and events in the CRM",
            mimeType="application/json"
        ),
    ]


@server.list_resource_templates()
async def list_resource_templates() -> list[ResourceTemplate]:
    """List resource templates for dynamic resources"""
    return [
        ResourceTemplate(
            uriTemplate="crm://customer/{customer_id}",
            name="Customer Details",
            description="Get detailed information about a specific customer"
        ),
        ResourceTemplate(
            uriTemplate="crm://task/{task_id}",
            name="Task Details",
            description="Get detailed information about a specific task"
        ),
        ResourceTemplate(
            uriTemplate="crm://customer/{customer_id}/interactions",
            name="Customer Interactions",
            description="Get all interactions for a specific customer"
        ),
    ]


@server.read_resource()
async def read_resource(uri: str) -> str:
    """Read a CRM resource by URI"""
    try:
        if uri == "crm://dashboard":
            result = await crm.get_dashboard_stats()
        elif uri == "crm://customers":
            result = await crm.list_customers(size=100)
        elif uri == "crm://tasks/pending":
            result = await crm.list_tasks(status="PENDING")
        elif uri == "crm://activities/recent":
            result = await crm.get_recent_activities(limit=20)
        elif uri.startswith("crm://customer/") and "/interactions" in uri:
            customer_id = uri.split("/")[2]
            result = await crm.list_interactions(customer_id=customer_id)
        elif uri.startswith("crm://customer/"):
            customer_id = uri.split("/")[-1]
            result = await crm.get_customer(customer_id)
        elif uri.startswith("crm://task/"):
            task_id = uri.split("/")[-1]
            result = await crm.get_task(task_id)
        else:
            result = {"error": f"Unknown resource: {uri}"}
        
        return json.dumps(result, indent=2, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})


# ==================== Main ====================

async def main():
    """Run the MCP server"""
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )


if __name__ == "__main__":
    asyncio.run(main())

