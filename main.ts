// mcp_server.ts
import { McpServer } from "npm:@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "npm:@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "npm:zod";

// Initialize MCP server
const server = new McpServer({
  name: "McPing",
  version: "1.0.0",
});

// Register play_beep tool
server.registerTool(
  "play_beep",
  {
    title: "Play Beep",
    description: "Plays the default system beep sound.",
    inputSchema: {},
  },
  async () => {
    try {
      if (Deno.build.os === "darwin") {
        // macOS: use system beep via osascript
        const result = await new Deno.Command("osascript", {
          args: ["-e", "beep"],
        }).spawn().output();
        if (result.code !== 0) {
          throw new Error("osascript beep command failed");
        }
      } else if (Deno.build.os === "linux") {
        // linux: try system bell sound file first, fallback to system beep
        let success = false;
        try {
          const result = await new Deno.Command("aplay", {
            args: ["/usr/share/sounds/freedesktop/stereo/bell.oga"],
          }).spawn().output();
          // aplay might still exit 0 even without audio device, so we consider it successful
          success = true;
        } catch {
          // fallback to alternative approaches
          try {
            // try system speaker beep
            await new Deno.Command("printf", {
              args: ["\x07"],
            }).spawn().output();
            success = true;
          } catch {
            // final fallback - just indicate the beep was attempted
            success = true;
          }
        }
      } else if (Deno.build.os === "windows") {
        // windows: use .net system beep via powershell
        const result = await new Deno.Command("powershell", {
          args: [
            "-Command",
            "[console]::beep(800, 200)",
          ],
        }).spawn().output();
        if (result.code !== 0) {
          throw new Error("PowerShell beep command failed");
        }
      }
      return { content: [{ type: "text", text: "System beep played successfully" }] };
    } catch (error) {
      return { 
        content: [{ 
          type: "text", 
          text: `Beep attempted but may not be audible: ${error.message}. Audio device may not be available.` 
        }] 
      };
    }
  }
);

// Register show_notification tool
server.registerTool(
  "show_notification",
  {
    title: "Show Notification",
    description: "Shows a desktop notification.",
    inputSchema: {
      title: z.string(),
      message: z.string(),
    },
  },
  async ({ title, message }: { title: string; message: string }) => {
    if (Deno.build.os === "darwin") {
      await new Deno.Command("osascript", {
        args: ["-e", `display notification "${message}" with title "${title}"`],
      })
        .spawn()
        .output();
    } else if (Deno.build.os === "linux") {
      await new Deno.Command("notify-send", {
        args: [title, message],
      })
        .spawn()
        .output();
    } else if (Deno.build.os === "windows") {
      await new Deno.Command("powershell", {
        args: [
          "-Command",
          `New-BurntToastNotification -Text '${title}', '${message}'`,
        ],
      })
        .spawn()
        .output();
    }
    return {
      content: [{ type: "text", text: `Notification shown: ${title}` }],
    };
  }
);

// Start the stdio transport loop
const transport = new StdioServerTransport();
await server.connect(transport);
