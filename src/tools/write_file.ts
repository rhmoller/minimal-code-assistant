import fs from "fs/promises";
import path from "path";
import type { Tool } from "../types.js";

export const write_file: Tool = {
  definition: {
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
  async execute(args) {
    const filePath = path.resolve(process.cwd(), args["path"] as string);
    const content = args["content"] as string;
    console.log(`[write_file] ${filePath}`);
    try {
      await fs.writeFile(filePath, content, "utf-8");
      return `Written ${content.length} characters to ${filePath}`;
    } catch (err) {
      return String(err);
    }
  },
};
