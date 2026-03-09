import type { Tool } from "../types.js";
import { bash } from "./bash.js";
import { read_file } from "./read_file.js";
import { write_file } from "./write_file.js";
import { edit_file } from "./edit_file.js";
import { grep } from "./grep.js";
import { fuzzy_find } from "./fuzzy_find.js";

export const tools: Tool[] = [bash, read_file, write_file, edit_file, grep, fuzzy_find];
