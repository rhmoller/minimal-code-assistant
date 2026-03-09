import readline from "readline";
import type { ChatRequest, ChatResponse, Message } from "./types.js";

const API_URL = "http://localhost:1234/v1/chat/completions";
const MODEL = "qwen/qwen3-coder-next";

const messages: Message[] = [
  { role: "system", content: "You are a helpful coding assistant." },
];

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const ask = (prompt: string): Promise<string> =>
  new Promise((resolve) => rl.question(prompt, resolve));

async function chat(userMessage: string): Promise<string> {
  messages.push({ role: "user", content: userMessage });

  const request: ChatRequest = { model: MODEL, messages };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  const data = await response.json() as ChatResponse;
  const reply = data.choices[0]?.message.content ?? "";

  messages.push({ role: "assistant", content: reply });
  return reply;
}

function handleSlashCommand(input: string): boolean {
  switch (input) {
    case "/exit":
      process.exit(0);
    case "/dump":
      for (const msg of messages) {
        console.log(`[${msg.role}]\n${msg.content}\n`);
      }
      return true;
    default:
      console.log(`Unknown command: ${input}`);
      return true;
  }
}

while (true) {
  const input = await ask("> ");
  if (!input.trim()) continue;
  if (input.startsWith("/")) { handleSlashCommand(input); continue; }
  const reply = await chat(input);
  console.log(reply);
}
