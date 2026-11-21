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
    console.log(`[grep] grep ${flags} ${pattern} ${path}`);
    // Pass the model's values as environment variables instead of pasting them
    // into the command string. The shell substitutes "$PATTERN", but never runs
    // its contents as code, so `$(rm -rf ~)` or `${user}` are searched literally.
    // $FLAGS is deliberately unquoted so "-r -n" is split into two arguments.
    const command = `grep $FLAGS "$PATTERN" "$SEARCH_PATH"`;
    try {
      const { stdout, stderr } = await execAsync(command, {
        env: { ...process.env, FLAGS: flags, PATTERN: pattern, SEARCH_PATH: path },
      });
      return (stdout + stderr).trim() || "(no matches)";
    } catch (err: unknown) {
      // grep exits with code 1 when there are no matches
      const result = err as { stdout?: string; stderr?: string };
      if (result.stdout !== undefined) return result.stdout.trim() || "(no matches)";
      return String(err);
    }
  },
};
