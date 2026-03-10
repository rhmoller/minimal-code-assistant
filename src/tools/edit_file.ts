import fs from "fs/promises";
import path from "path";
import type { Tool } from "../types.js";

export const edit_file: Tool = {
  definition: {
    type: "function",
    function: {
      name: "edit_file",
      description: "Replace old_string with new_string in a file. old_string must appear exactly once.",
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
    const filePath = path.resolve(process.cwd(), args["path"] as string);
    const oldString = args["old_string"] as string;
    const newString = args["new_string"] as string;
    console.log(`[edit_file] ${filePath}`);
    try {
      const original = await fs.readFile(filePath, "utf-8");
      const count = original.split(oldString).length - 1;
      if (count === 0) return `Error: old_string not found in ${filePath}`;
      if (count > 1) return `Error: old_string found ${count} times in ${filePath}, must be unique`;
      await fs.writeFile(filePath, original.replace(oldString, newString), "utf-8");
      return `Replaced in ${filePath}`;
    } catch (err) {
      return String(err);
    }
  },
};
