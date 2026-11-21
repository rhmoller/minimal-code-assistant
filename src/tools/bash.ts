import type { Tool } from "../types.js";
import { execAsync } from "./exec.js";

export const bash: Tool = {
  definition: {
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
  async execute(args) {
    const command = args["command"] as string;
    console.log(`[bash] $ ${command}`);
    try {
      const { stdout, stderr } = await execAsync(command);
      return (stdout + stderr).trim();
    } catch (err) {
      // A failing command (e.g. failing tests) still has useful output, so keep it.
      const { stdout = "", stderr = "", code } = err as { stdout?: string; stderr?: string; code?: number };
      return `${stdout}${stderr}\n[exit code ${code}]`.trim();
    }
  },
};
