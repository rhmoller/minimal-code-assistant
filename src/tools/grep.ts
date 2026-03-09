import type { Tool } from "../types.js";
import { execAsync } from "./exec.js";

export const grep: Tool = {
  definition: {
    type: "function",
    function: {
      name: "grep",
      description: "Search for a regex pattern in files and return matching lines.",
      parameters: {
        type: "object",
        properties: {
          pattern: { type: "string", description: "Regex pattern to search for." },
          path: { type: "string", description: "File or directory to search in. Defaults to current directory." },
          flags: { type: "string", description: "Extra grep flags, e.g. '-r', '-i', '-n'." },
        },
        required: ["pattern"],
      },
    },
  },
  async execute(args) {
    const pattern = args["pattern"] as string;
    const path = (args["path"] as string | undefined) ?? ".";
    const flags = (args["flags"] as string | undefined) ?? "-r -n";
    const command = `grep ${flags} ${JSON.stringify(pattern)} ${JSON.stringify(path)}`;
    console.log(`[grep] ${command}`);
    try {
      const { stdout, stderr } = await execAsync(command);
      return (stdout + stderr).trim() || "(no matches)";
    } catch (err: unknown) {
      // grep exits with code 1 when there are no matches
      const result = err as { stdout?: string; stderr?: string };
      if (result.stdout !== undefined) return result.stdout.trim() || "(no matches)";
      return String(err);
    }
  },
};
