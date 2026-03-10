#!/usr/bin/env node
import { readFileSync } from "fs";
import readline from "readline";
import type { ChatRequest, ChatResponse, Message } from "./types.js";
import { tools } from "./tools/index.js";
import { discoverSkills, buildSkillCatalog, buildActivateSkillTool } from "./skills.js";

let API_URL: string;
let MODEL: string;
let API_KEY: string | undefined;

function setModel(modelName: string): void {
  const modelConfig = config.models.find((m: { name: string }) => m.name === modelName);
  if (!modelConfig) {
    console.log(`Model "${modelName}" not found. Available models:`);
    for (const m of config.models) console.log(`  ${m.name}`);
    return;
  }
  API_URL = modelConfig.baseUrl;
  MODEL = modelConfig.name;
  API_KEY = modelConfig.apiKey ?? undefined;
  console.log(`Switched to model: ${MODEL} (${API_URL})`);
}

const config = JSON.parse(readFileSync("config.json", "utf-8"));
setModel(config.defaultModel);

// Discover skills and build unified tool registry
const skills = await discoverSkills();
const allTools = [...tools, ...(skills.size > 0 ? [buildActivateSkillTool(skills)] : [])];
const toolMap = new Map(allTools.map(t => [t.definition.function.name, t]));
const allToolDefs = allTools.map(t => t.definition);

const cwd = process.cwd();

// Build system prompt
const systemPromptParts = ["You are a helpful coding assistant.", `Current working directory: ${cwd}`];
if (skills.size > 0) {
  systemPromptParts.push(
    "",
    "The following skills provide specialized instructions for specific tasks.",
    "When a task matches a skill's description, call the activate_skill tool with the skill's name to load its full instructions.",
    "",
    buildSkillCatalog(skills),
  );
}

const messages: Message[] = [
  { role: "system", content: systemPromptParts.join("\n") },
];

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const ask = (prompt: string): Promise<string> =>
  new Promise((resolve) => rl.question(prompt, resolve));

async function callApi(): Promise<ChatResponse> {
  const request: ChatRequest = { model: MODEL, messages, tools: allToolDefs };
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (API_KEY) headers["Authorization"] = `Bearer ${API_KEY}`;
  const response = await fetch(API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error(`API error ${response.status}: ${await response.text()}`);
  return response.json() as Promise<ChatResponse>;
}

async function chat(userMessage: string): Promise<string> {
  messages.push({ role: "user", content: userMessage });

  while (true) {
    const data = await callApi();
    const choice = data.choices[0];
    if (!choice) return "";

    messages.push(choice.message);

    if (choice.finish_reason !== "tool_calls") {
      return choice.message.content ?? "";
    }

    for (const toolCall of choice.message.tool_calls ?? []) {
      const args = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
      const tool = toolMap.get(toolCall.function.name);
      const result = tool ? await tool.execute(args) : `Unknown tool: ${toolCall.function.name}`;
      messages.push({ role: "tool", tool_call_id: toolCall.id, content: result });
    }
  }
}

function handleSlashCommand(input: string): void {
  const [cmd, ...args] = input.split(" ");
  switch (cmd) {
    case "/exit":
      process.exit(0);
    case "/reset":
      messages.length = 1;
      console.log("Conversation history cleared.");
      break;
    case "/model":
      if (args.length === 0) {
        console.log(`Current model: ${MODEL} (${API_URL})`);
      } else {
        setModel(args[0]!);
      }
      break;
    case "/models":
      for (const model of config.models) {
        const selected = model.name === MODEL ? " *" : "";
        console.log(`${model.name}${selected}`);
      }
      break;
    case "/tools":
      for (const tool of allToolDefs) {
        console.log(`${tool.function.name} - ${tool.function.description}`);
      }
      break;
    case "/dump":
      for (const msg of messages) {
        console.log("--------------------");
        console.log(`[${msg.role}]${msg.tool_call_id ? ` ${msg.tool_call_id}` : ""}`);
        if (msg.content) console.log(msg.content);
        if (msg.tool_calls) console.log(JSON.stringify(msg.tool_calls, null, 2));
      }
      console.log("--------------------");
      break;
    default:
      console.log(`Unknown command: ${input}`);
  }
}

while (true) {
  const input = await ask("> ");
  if (!input.trim()) continue;
  if (input.startsWith("/")) { handleSlashCommand(input); continue; }
  try {
    const reply = await chat(input);
    console.log(reply);
  } catch (err) {
    console.error(`Error: ${err}`);
  }
}
