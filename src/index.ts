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

while (true) {
  const input = await ask("> ");
  if (!input.trim()) continue;
  const reply = await chat(input);
  console.log(reply);
}
