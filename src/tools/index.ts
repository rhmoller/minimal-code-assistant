import type { Tool } from "../types.js";
import { bash } from "./bash.js";
import { read_file } from "./read_file.js";
import { write_file } from "./write_file.js";
import { edit_file } from "./edit_file.js";
import { grep } from "./grep.js";
import { fuzzy_find } from "./fuzzy_find.js";

const tools: Tool[] = [bash, read_file, write_file, edit_file, grep, fuzzy_find];

export const toolDefinitions = tools.map((t) => t.definition);

export async function executeTool(name: string, argsJson: string): Promise<string> {
  const args = JSON.parse(argsJson) as Record<string, unknown>;
  const tool = tools.find((t) => t.definition.function.name === name);
  if (!tool) return `Unknown tool: ${name}`;
  return tool.execute(args);
}
