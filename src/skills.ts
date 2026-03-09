import fs from "fs/promises";
import path from "path";
import os from "os";
import type { Tool } from "./types.js";

export interface Skill {
  name: string;
  description: string;
  /** Absolute path to the SKILL.md file. */
  location: string;
}

function parseFrontmatter(content: string): { name: string | undefined; description: string | undefined; body: string } | null {
  const match = content.match(/^---[\r\n]([\s\S]*?)[\r\n]---[\r\n]?([\s\S]*)$/);
  if (!match) return null;

  const fm = match[1] ?? "";
  const body = (match[2] ?? "").trim();

  const fields: Record<string, string> = {};
  for (const line of fm.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    fields[key] = value;
  }

  return { name: fields["name"], description: fields["description"], body };
}

async function scanSkillsDir(dir: string): Promise<Skill[]> {
  const skills: Skill[] = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return skills; // directory doesn't exist
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".") || entry.name === "node_modules") continue;

    const skillMdPath = path.join(dir, entry.name, "SKILL.md");
    let content;
    try {
      content = await fs.readFile(skillMdPath, "utf-8");
    } catch {
      continue;
    }

    const parsed = parseFrontmatter(content);
    if (!parsed?.description) {
      console.warn(`[skills] Skipping ${skillMdPath}: missing description`);
      continue;
    }

    skills.push({
      name: parsed.name ?? entry.name,
      description: parsed.description,
      location: skillMdPath,
    });
  }

  return skills;
}

async function listFilesRecursive(dir: string, prefix = ""): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isFile()) {
      files.push(rel);
    } else if (entry.isDirectory() && !entry.name.startsWith(".")) {
      files.push(...await listFilesRecursive(path.join(dir, entry.name), rel));
    }
  }
  return files;
}

export async function discoverSkills(): Promise<Map<string, Skill>> {
  const cwd = process.cwd();
  const home = os.homedir();

  // Higher index = higher priority (project overrides user)
  const scanDirs = [
    path.join(home, ".agents", "skills"),
    path.join(home, ".claude", "skills"),
    path.join(cwd, ".agents", "skills"),
    path.join(cwd, ".claude", "skills"),
  ];

  const skills = new Map<string, Skill>();

  for (const dir of scanDirs) {
    for (const skill of await scanSkillsDir(dir)) {
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

      const content = await fs.readFile(skill.location, "utf-8");
      const parsed = parseFrontmatter(content);
      const body = parsed?.body ?? content;
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
        body,
        ``,
        `Skill directory: ${skillDir}`,
        `Relative paths in this skill are relative to the skill directory.`,
        resources,
        `</skill_content>`,
      ].join("\n");
    },
  };
}
