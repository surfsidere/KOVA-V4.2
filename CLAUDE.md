# Project Configuration

## MCP Servers

```json
{
  "mcpServers": {
    "superclaude": {
      "command": "superclaude",
      "args": [],
      "env": {}
    },
    "sequential-thinking": {
      "command": "python",
      "args": ["-m", "mcp_server_sequential_thinking"],
      "env": {}
    },
    "context7": {
      "command": "npx",
      "args": ["@context7/mcp-server"],
      "env": {}
    },
    "magic": {
      "command": "npx",
      "args": ["@twentyfirst/magic-mcp-server"],
      "env": {
        "TWENTYFIRST_API_KEY": "b73ed2ad3fa5e14b3e8cf3b54b0f03299d50964924d48b1bdc84afe29cbe96bc"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["@executeautomation/playwright-mcp-server"],
      "env": {}
    }
  }
}
```