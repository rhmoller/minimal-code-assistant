import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
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
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read the full contents of a file.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Path to the file to read." },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description: "Write content to a file, creating or overwriting it.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Path to the file to write." },
          content: { type: "string", description: "Content to write to the file." },
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "edit_file",
      description: "Replace the first occurrence of old_string with new_string in a file.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Path to the file to edit." },
          old_string: { type: "string", description: "Exact string to search for." },
          new_string: { type: "string", description: "String to replace it with." },
        },
        required: ["path", "old_string", "new_string"],
      },
    },
  },
  {
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
  {
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
];

export async function executeTool(name: string, argsJson: string): Promise<string> {
  const args = JSON.parse(argsJson) as Record<string, unknown>;

  switch (name) {
    case "bash": {
      const command = args["command"] as string;
      console.log(`[bash] $ ${command}`);
      try {
        const { stdout, stderr } = await execAsync(command);
        return (stdout + stderr).trim();
      } catch (err) {
        return String(err);
      }
    }

    case "read_file": {
      const path = args["path"] as string;
      console.log(`[read_file] ${path}`);
      try {
        return await fs.readFile(path, "utf-8");
      } catch (err) {
        return String(err);
      }
    }

    case "write_file": {
      const path = args["path"] as string;
      const content = args["content"] as string;
      console.log(`[write_file] ${path}`);
      try {
        await fs.writeFile(path, content, "utf-8");
        return `Written ${content.length} characters to ${path}`;
      } catch (err) {
        return String(err);
      }
    }

    case "edit_file": {
      const path = args["path"] as string;
      const oldString = args["old_string"] as string;
      const newString = args["new_string"] as string;
      console.log(`[edit_file] ${path}`);
      try {
        const original = await fs.readFile(path, "utf-8");
        if (!original.includes(oldString)) return `Error: old_string not found in ${path}`;
        await fs.writeFile(path, original.replace(oldString, newString), "utf-8");
        return `Replaced in ${path}`;
      } catch (err) {
        return String(err);
      }
    }

    case "grep": {
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
        const result = (err as { stdout?: string; stderr?: string });
        if (result.stdout !== undefined) return result.stdout.trim() || "(no matches)";
        return String(err);
      }
    }

    case "fuzzy_find": {
      const query = args["query"] as string;
      const path = (args["path"] as string | undefined) ?? ".";
      const command = `find ${JSON.stringify(path)} -type f | fzf --filter=${JSON.stringify(query)}`;
      console.log(`[fuzzy_find] query="${query}" in ${path}`);
      try {
        const { stdout } = await execAsync(command);
        return stdout.trim() || "(no matches)";
      } catch (err: unknown) {
        const result = (err as { stdout?: string });
        if (result.stdout !== undefined) return result.stdout.trim() || "(no matches)";
        return String(err);
      }
    }

    default:
      return `Unknown tool: ${name}`;
  }
}
