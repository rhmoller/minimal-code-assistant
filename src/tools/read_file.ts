import fs from "fs/promises";
import type { Tool } from "../types.js";

export const read_file: Tool = {
  definition: {
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
  async execute(args) {
    const path = args["path"] as string;
    console.log(`[read_file] ${path}`);
    try {
      return await fs.readFile(path, "utf-8");
    } catch (err) {
      return String(err);
    }
  },
};
