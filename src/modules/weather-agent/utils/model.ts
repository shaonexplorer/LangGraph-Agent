import { ChatGoogle } from "@langchain/google/node";
import type { Runnable } from "@langchain/core/runnables";
import { tools } from "./tools.js";
import dotenv from "dotenv";
dotenv.config();

export const model = new ChatGoogle({
  model: "gemini-3.5-flash-lite",

  // thinkingBudget: 0,
  apiKey: process.env.GEMINI_API_KEY,
});

export const modelWithTools: Runnable = model.bindTools(tools);
