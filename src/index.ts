import readline from "readline";
import type { ChatRequest, ChatResponse, Message } from "./types.js";
import { toolDefinitions, executeTool } from "./tools/index.js";

const API_URL = "http://localhost:1234/v1/chat/completions";
const MODEL = "qwen/qwen3-coder-next";

const messages: Message[] = [
  { role: "system", content: "You are a helpful coding assistant." },
];

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const ask = (prompt: string): Promise<string> =>
  new Promise((resolve) => rl.question(prompt, resolve));

async function callApi(): Promise<ChatResponse> {
  const request: ChatRequest = { model: MODEL, messages, tools: toolDefinitions };
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
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
      const result = await executeTool(toolCall.function.name, toolCall.function.arguments);
      messages.push({ role: "tool", tool_call_id: toolCall.id, content: result });
    }
  }
}

function handleSlashCommand(input: string): void {
  switch (input) {
    case "/exit":
      process.exit(0);
    case "/reset":
      messages.length = 1;
      console.log("Conversation history cleared.");
      break;
    case "/tools":
      for (const tool of toolDefinitions) {
        console.log(`${tool.function.name} - ${tool.function.description}`);
      }
      break;
    case "/dump":
      console.log("--- Conversation History ---");
      for (const msg of messages) {
        console.log(`[${msg.role}]${msg.tool_call_id ? ` ${msg.tool_call_id}` : ""}`);
        if (msg.content) console.log(msg.content);
        if (msg.tool_calls) console.log(JSON.stringify(msg.tool_calls, null, 2));
        console.log();
      }
      console.log("--- End of History ---");
      break;
    default:
      console.log(`Unknown command: ${input}`);
  }
}

while (true) {
  const input = await ask("> ");
  if (!input.trim()) continue;
  if (input.startsWith("/")) { handleSlashCommand(input); continue; }
  const reply = await chat(input);
  console.log(reply);
}
