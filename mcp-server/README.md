# CRM MCP Server

Model Context Protocol (MCP) server for the Multi-Tenant CRM System. This server exposes CRM functionality as tools that AI assistants can use to interact with customer data, tasks, and interactions.

## Features

### Tools

| Tool | Description |
|------|-------------|
| `list_customers` | List all customers with pagination and search |
| `get_customer` | Get detailed customer information |
| `search_customers` | Search customers by name, email, or company |
| `create_customer` | Create a new customer |
| `update_customer` | Update customer details |
| `list_tasks` | List tasks with status/priority filters |
| `get_task` | Get task details |
| `create_task` | Create a new task |
| `update_task_status` | Update task status |
| `list_interactions` | List customer interactions |
| `log_interaction` | Log a new interaction |
| `get_dashboard_stats` | Get CRM dashboard metrics |
| `get_recent_activities` | Get recent CRM activities |
| `list_accounts` | List business accounts |
| `get_account` | Get account details |

### Resources

| Resource URI | Description |
|--------------|-------------|
| `crm://dashboard` | CRM dashboard with key metrics |
| `crm://customers` | All customers list |
| `crm://tasks/pending` | Pending tasks |
| `crm://activities/recent` | Recent activities |
| `crm://customer/{id}` | Specific customer details |
| `crm://task/{id}` | Specific task details |
| `crm://customer/{id}/interactions` | Customer interaction history |

## Installation

```bash
cd mcp-server
pip install -r requirements.txt
```

## Configuration

Create a `.env` file or set environment variables:

```bash
# CRM Backend API URL
MCP_CRM_API_URL=http://localhost:8080/api

# Authentication token (JWT)
MCP_API_TOKEN=your-jwt-token-here

# Tenant ID for multi-tenant isolation
MCP_TENANT_ID=your-tenant-id
```

## Usage

### Running Standalone

```bash
python server.py
```

### With Claude Desktop

Add to your Claude Desktop configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "crm": {
      "command": "python",
      "args": ["/path/to/mcp-server/server.py"],
      "env": {
        "MCP_CRM_API_URL": "http://localhost:8080/api",
        "MCP_API_TOKEN": "your-token",
        "MCP_TENANT_ID": "your-tenant-id"
      }
    }
  }
}
```

### With Cursor IDE

Add to your Cursor settings (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "crm": {
      "command": "python",
      "args": ["server.py"],
      "cwd": "/path/to/mcp-server",
      "env": {
        "MCP_CRM_API_URL": "http://localhost:8080/api",
        "MCP_API_TOKEN": "your-token"
      }
    }
  }
}
```

## Example Interactions

Once connected, you can ask the AI assistant:

- "List all customers in the CRM"
- "Create a new customer named John Doe with email john@example.com"
- "Show me all pending tasks"
- "Log a call with customer ID 123 about product demo"
- "What are the current dashboard statistics?"
- "Search for customers from Acme Corp"

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   AI Assistant  │────▶│   MCP Server    │────▶│   CRM Backend   │
│  (Claude/etc)   │◀────│   (Python)      │◀────│  (Spring Boot)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │    MCP Protocol       │    REST API           │
        │    (stdio/SSE)        │    (HTTP/JSON)        │
```

## Development

### Testing Tools

```python
import asyncio
from crm_client import CRMClient

async def test():
    client = CRMClient(token="your-token")
    customers = await client.list_customers()
    print(customers)

asyncio.run(test())
```

### Adding New Tools

1. Add the API method to `crm_client.py`
2. Add the tool definition in `list_tools()` in `server.py`
3. Add the handler in `_execute_tool()` in `server.py`

## Security Notes

- Always use environment variables for tokens
- Never commit `.env` files
- Use HTTPS in production
- Tokens should have minimal required permissions

## License

MIT License - Part of Multi-Tenant CRM System by Team NeoBit

