import fs from "fs/promises";
import type { Tool } from "../types.js";

export const edit_file: Tool = {
  definition: {
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
  async execute(args) {
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
  },
};
