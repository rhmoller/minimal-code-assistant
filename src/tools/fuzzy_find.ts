import type { Tool } from "../types.js";
import { execAsync } from "./exec.js";

export const fuzzy_find: Tool = {
  definition: {
    type: "function",
    function: {
      name: "fuzzy_find",
      description: "Find files using fzf fuzzy matching. Returns a list of matching file paths.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Fuzzy query string to match against file paths." },
          path: { type: "string", description: "Directory to search in. Defaults to current directory." },
        },
        required: ["query"],
      },
    },
  },
  async execute(args) {
    const query = args["query"] as string;
    const path = (args["path"] as string | undefined) ?? ".";
    console.log(`[fuzzy_find] query="${query}" in ${path}`);
    // Values are passed as environment variables, not pasted into the command,
    // so the shell never runs them as code (see grep.ts).
    const command = `find "$SEARCH_PATH" -type f | fzf --filter="$QUERY"`;
    try {
      const { stdout } = await execAsync(command, {
        env: { ...process.env, SEARCH_PATH: path, QUERY: query },
      });
      return stdout.trim() || "(no matches)";
    } catch (err: unknown) {
      const result = err as { stdout?: string };
      if (result.stdout !== undefined) return result.stdout.trim() || "(no matches)";
      return String(err);
    }
  },
};
