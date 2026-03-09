import { exec } from "child_process";
import { promisify } from "util";
import type { ToolDefinition } from "./types.js";

const execAsync = promisify(exec);

export const toolDefinitions: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "bash",
      description: "Execute a bash command and return its stdout and stderr.",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string", description: "The bash command to execute." },
        },
        required: ["command"],
      },
    },
  },
];

export async function executeTool(name: string, argsJson: string): Promise<string> {
  const args = JSON.parse(argsJson) as Record<string, unknown>;

  if (name === "bash") {
    const command = args["command"] as string;
    console.log(`[bash] $ ${command}`);
    try {
      const { stdout, stderr } = await execAsync(command);
      return (stdout + stderr).trim();
    } catch (err) {
      return String(err);
    }
  }

  return `Unknown tool: ${name}`;
}
