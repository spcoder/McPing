# Copilot Instructions for McPing

## Project Overview

- McPing is a Model Context Protocol (MCP) server implemented in Deno, designed to provide system notifications and beeps via a simple protocol interface.
- The main entry point is `main.ts`, which registers MCP tools and starts the stdio transport loop.

## Architecture & Key Files

- `main.ts`: Contains all server logic, tool registration, and transport setup. No submodules or complex directory structure.
- MCP tools are registered directly in `main.ts` using the `McpServer` API. Each tool is defined with a title, description, input schema (using `zod`), and an async handler.
- The server uses `@modelcontextprotocol/sdk` for MCP and stdio transport, and `zod` for input validation.

## Tool Patterns

- Tools are registered with `server.registerTool`. Example:
  ```typescript
  server.registerTool(
    'beep',
    { title: 'Beep', description: 'Plays the default system beep sound.', inputSchema: {} },
    async () => {
      /* ... */
    }
  );
  ```
- Input validation for tools uses `zod` schemas. Example:
  ```typescript
  inputSchema: { title: z.string(), message: z.string() }
  ```
- Tool handlers use `Deno.Command` to invoke system-level notifications or sounds, with OS-specific logic for macOS, Linux, and Windows.

## Developer Workflows

- **Run the server:**
  ```bash
  deno run --allow-run --allow-read main.ts
  ```
- No build step required; Deno runs TypeScript directly.
- No test suite or test files present.
- Debugging is done by running the server and observing stdout/stderr.

## Conventions & Patterns

- All code is in a single file (`main.ts`).
- Comments should be lowercase (per user instruction).
- Use async/await for all tool handlers.
- Return results in the MCP content format: `{ content: [{ type: 'text', text: '...' }] }`.
- OS detection uses `Deno.build.os` for branching logic.
- External dependencies are imported via npm specifiers (Deno supports this).

## Integration Points

- MCP protocol via `@modelcontextprotocol/sdk`.
- System notifications via platform-specific commands (`osascript`, `notify-send`, `powershell`).
- Input validation via `zod`.

## Example: Registering a Tool

```typescript
server.registerTool(
  'desktopNotification',
  {
    title: 'Desktop Notification',
    description: 'Shows a desktop notification.',
    inputSchema: { title: z.string(), message: z.string() },
  },
  async ({ title, message }) => {
    // os-specific notification logic
    // ...existing code...
    return { content: [{ type: 'text', text: `Notification shown: ${title}` }] };
  }
);
```

## References

- See `main.ts` for all logic and patterns.
- See [Model Context Protocol SDK](https://www.npmjs.com/package/@modelcontextprotocol/sdk) for MCP details.
- See [Deno documentation](https://deno.com/manual) for runtime details.
