import fs from "fs/promises";
import type { Dirent } from "fs";
import path from "path";
import os from "os";
import type { Tool } from "./types.js";

export interface Skill {
  name: string;
  description: string;
  /** Absolute path to the SKILL.md file. */
  location: string;
  /** Parsed body of SKILL.md (frontmatter stripped), stored at discovery time. */
  body: string;
}

function parseFrontmatter(content: string): { name: string | undefined; description: string | undefined; body: string } | null {
  const match = content.match(/^---[\r\n]([\s\S]*?)[\r\n]---[\r\n]?([\s\S]*)$/);
  if (!match) return null;

  const fm = match[1] ?? "";
  const body = (match[2] ?? "").trim();

  const fields: Record<string, string> = {};
  let lastKey: string | undefined;
  for (const line of fm.split("\n")) {
    // An indented line continues the previous field (a multi-line YAML value).
    if (/^\s/.test(line) && lastKey) {
      fields[lastKey] = `${fields[lastKey]} ${line.trim()}`.trim();
      continue;
    }
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();
    // ">" and "|" mean "the value starts on the next line".
    if ([">", ">-", "|", "|-"].includes(value)) value = "";
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    fields[key] = value;
    lastKey = key;
  }

  return { name: fields["name"], description: fields["description"], body };
}

async function tryLoadSkill(dir: string, entry: Dirent): Promise<Skill | null> {
  if (entry.name.startsWith(".") || entry.name === "node_modules") return null;
  if (!entry.isDirectory() && !entry.isSymbolicLink()) return null;

  if (entry.isSymbolicLink()) {
    try {
      const stat = await fs.stat(path.join(dir, entry.name));
      if (!stat.isDirectory()) return null;
    } catch {
      return null;
    }
  }

  const skillMdPath = path.join(dir, entry.name, "SKILL.md");
  let content;
  try {
    content = await fs.readFile(skillMdPath, "utf-8");
  } catch {
    return null;
  }

  const parsed = parseFrontmatter(content);
  if (!parsed?.description) {
    console.warn(`[skills] Skipping ${skillMdPath}: missing description`);
    return null;
  }

  return {
    name: parsed.name ?? entry.name,
    description: parsed.description,
    location: skillMdPath,
    body: parsed.body,
  };
}

async function scanSkillsDir(dir: string): Promise<Skill[]> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const results = await Promise.all(entries.map(entry => tryLoadSkill(dir, entry)));
  return results.filter((s): s is Skill => s !== null);
}

async function listFilesRecursive(dir: string, prefix = ""): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isFile()) {
      files.push(rel);
    } else if (entry.isDirectory() && !entry.name.startsWith(".")) {
      const nested = await listFilesRecursive(path.join(dir, entry.name), rel);
      for (const f of nested) files.push(f);
    }
  }
  return files;
}

export async function discoverSkills(): Promise<Map<string, Skill>> {
  const cwd = process.cwd();
  const home = os.homedir();

  // Higher index = higher priority (project overrides user). Deduplicated for when cwd === home.
  const scanDirs = [...new Set([
    path.join(home, ".agents", "skills"),
    path.join(home, ".claude", "skills"),
    path.join(cwd, ".agents", "skills"),
    path.join(cwd, ".claude", "skills"),
  ])];

  const allResults = await Promise.all(scanDirs.map(scanSkillsDir));

  const skills = new Map<string, Skill>();
  for (const dirSkills of allResults) {
    for (const skill of dirSkills) {
      if (skills.has(skill.name)) {
        console.warn(`[skills] "${skill.name}" overridden by higher-priority location`);
      }
      skills.set(skill.name, skill);
    }
  }

  if (skills.size > 0) {
    console.log(`[skills] Loaded ${skills.size} skill(s): ${[...skills.keys()].join(", ")}`);
  }

  return skills;
}

export function buildSkillCatalog(skills: Map<string, Skill>): string {
  const entries = [...skills.values()]
    .map(s =>
      `  <skill>\n    <name>${s.name}</name>\n    <description>${s.description}</description>\n    <location>${s.location}</location>\n  </skill>`
    )
    .join("\n");
  return `<available_skills>\n${entries}\n</available_skills>`;
}

export function buildActivateSkillTool(skills: Map<string, Skill>): Tool {
  return {
    definition: {
      type: "function",
      function: {
        name: "activate_skill",
        description: "Load the full instructions for a skill by name. Call this when a task matches a skill's description.",
        parameters: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name of the skill to activate.",
              enum: [...skills.keys()],
            },
          },
          required: ["name"],
        },
      },
    },
    async execute(args) {
      const name = args["name"] as string;
      const skill = skills.get(name);
      if (!skill) return `Unknown skill: ${name}`;

      const skillDir = path.dirname(skill.location);

      let resources = "";
      try {
        const files = (await listFilesRecursive(skillDir)).filter(f => f !== "SKILL.md");
        if (files.length > 0) {
          resources = `\n<skill_resources>\n${files.map(f => `  <file>${f}</file>`).join("\n")}\n</skill_resources>`;
        }
      } catch { /* ignore */ }

      return [
        `<skill_content name="${name}">`,
        skill.body,
        ``,
        `Skill directory: ${skillDir}`,
        `Relative paths in this skill are relative to the skill directory.`,
        resources,
        `</skill_content>`,
      ].join("\n");
    },
  };
}
