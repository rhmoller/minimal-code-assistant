import fs from "fs/promises";
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
    const path = args["path"] as string;
    const content = args["content"] as string;
    console.log(`[write_file] ${path}`);
    try {
      await fs.writeFile(path, content, "utf-8");
      return `Written ${content.length} characters to ${path}`;
    } catch (err) {
      return String(err);
    }
  },
};
