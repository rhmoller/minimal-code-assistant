import { exec } from "child_process";
import { promisify } from "util";
import type { Tool } from "../types.js";

const execAsync = promisify(exec);

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
      return String(err);
    }
  },
};
