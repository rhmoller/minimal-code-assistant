import type { Tool } from "../types.js";
import { execAsync } from "./exec.js";

export const grep: Tool = {
  definition: {
    type: "function",
    function: {
      name: "grep",
      description: "Search files recursively for a regex pattern and return matching lines with line numbers.",
      parameters: {
        type: "object",
        properties: {
          pattern: { type: "string", description: "Regex pattern to search for." },
          path: { type: "string", description: "File or directory to search in. Defaults to current directory." },
          flags: { type: "string", description: "Extra grep flags, e.g. '-i' (ignore case) or '-F' (fixed string)." },
        },
        required: ["pattern"],
      },
    },
  },
  async execute(args) {
    const pattern = args["pattern"] as string;
    const path = (args["path"] as string | undefined) ?? ".";
    const flags = (args["flags"] as string | undefined) ?? "";
    console.log(`[grep] grep -r -n ${flags} ${pattern} ${path}`);
    // Pass the model's values as environment variables instead of pasting them
    // into the command string. The shell substitutes "$PATTERN", but never runs
    // its contents as code, so `$(rm -rf ~)` or `${user}` are searched literally.
    // $FLAGS is deliberately unquoted so "-i -F" is split into two arguments.
    // -r and -n are always on, so the model's flags add to them instead of replacing them.
    const command = `grep -r -n $FLAGS "$PATTERN" "$SEARCH_PATH"`;
    try {
      const { stdout, stderr } = await execAsync(command, {
        env: { ...process.env, FLAGS: flags, PATTERN: pattern, SEARCH_PATH: path },
      });
      return (stdout + stderr).trim() || "(no matches)";
    } catch (err: unknown) {
      // grep exits with 1 when nothing matched, and 2 on errors such as an
      // invalid regex. Return its output so the model can see what went wrong.
      const { stdout = "", stderr = "" } = err as { stdout?: string; stderr?: string };
      return (stdout + stderr).trim() || "(no matches)";
    }
  },
};
