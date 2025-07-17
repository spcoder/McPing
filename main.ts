// mcp_server.ts
import { McpServer } from 'npm:@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from 'npm:@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'npm:zod';

// Initialize MCP server
const server = new McpServer({
  name: 'beep-notify-server',
  version: '1.0.0',
});

// Register beep tool
server.registerTool(
  'beep',
  {
    title: 'Beep',
    description: 'Plays the default system beep sound.',
    inputSchema: {},
  },
  async () => {
    const cmd = Deno.build.os === 'windows' ? ['cmd', '/c', 'echo', '\x07'] : ['printf', '\x07'];
    await new Deno.Command(cmd[0], { args: cmd.slice(1) }).spawn().output();
    return { content: [{ type: 'text', text: 'Beep played' }] };
  }
);

// Register desktopNotification tool
server.registerTool(
  'desktopNotification',
  {
    title: 'Desktop Notification',
    description: 'Shows a desktop notification.',
    inputSchema: {
      title: z.string(),
      message: z.string(),
    },
  },
  async ({ title, message }: { title: string; message: string }) => {
    if (Deno.build.os === 'darwin') {
      await new Deno.Command('osascript', {
        args: ['-e', `display notification "${message}" with title "${title}"`],
      })
        .spawn()
        .output();
    } else if (Deno.build.os === 'linux') {
      await new Deno.Command('notify-send', {
        args: [title, message],
      })
        .spawn()
        .output();
    } else if (Deno.build.os === 'windows') {
      await new Deno.Command('powershell', {
        args: ['-Command', `New-BurntToastNotification -Text '${title}', '${message}'`],
      })
        .spawn()
        .output();
    }
    return {
      content: [{ type: 'text', text: `Notification shown: ${title}` }],
    };
  }
);

// Start the stdio transport loop
const transport = new StdioServerTransport();
await server.connect(transport);
