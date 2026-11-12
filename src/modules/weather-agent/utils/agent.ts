import { END, MemorySaver, START, StateGraph } from "@langchain/langgraph";
import { MessagesState } from "./state.js";
import { llmCall, shouldContinue, toolNode } from "./nodes.js";

const checkpointer = new MemorySaver();

export const agent = new StateGraph(MessagesState)
  .addNode("llmCall", llmCall)
  .addNode("toolNode", toolNode)
  .addEdge(START, "llmCall")
  .addConditionalEdges("llmCall", shouldContinue, ["toolNode", END])
  .addEdge("toolNode", "llmCall")
  .compile();
