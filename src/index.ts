import readline from "readline";
import type { ChatRequest, ChatResponse } from "./types.js";

const API_URL = "http://localhost:1234/v1/chat/completions";
const MODEL = "qwen/qwen3-coder-next";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const ask = (prompt: string): Promise<string> =>
  new Promise((resolve) => rl.question(prompt, resolve));

async function chat(userMessage: string): Promise<string> {
  const request: ChatRequest = {
    model: MODEL,
    messages: [{ role: "user", content: userMessage }],
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  const data = await response.json() as ChatResponse;
  return data.choices[0]?.message.content ?? "";
}

while (true) {
  const input = await ask("> ");
  if (!input.trim()) continue;
  const reply = await chat(input);
  console.log(reply);
}
