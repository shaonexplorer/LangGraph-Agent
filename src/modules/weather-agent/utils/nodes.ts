import { ToolNode } from "@langchain/langgraph/prebuilt";
import { SystemMessage, AIMessage } from "@langchain/core/messages";
import { ConditionalEdgeRouter, END, GraphNode } from "@langchain/langgraph";
import { MessagesState } from "./state.js";
import { model, modelWithTools } from "./model.js";
import { tools } from "./tools.js";
import {
  convertActionsToDynamicStructuredTools,
  CopilotKitStateAnnotation,
} from "@copilotkit/sdk-js/langgraph";

function toText(content: any): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((b) => b.type === "text" && !b.thought)
      .map((b) => b.text)
      .join("");
  }
  return "";
}

const SYSTEM_PROMPT = `
You are a medical assistant that helps users find doctors and book appointments.

Rules:
1. When a user asks to find or search for a doctor, call search_doctor.
2. When a user requests an appointment, check whether all required
   booking information is available. If required information is missing, ask the user for it
3. Never invent patient details, doctor names, or appointment times.
4. Call book_appointment only when all required information is available.
5. After a tool returns, explain the result clearly to the user.
`;

export const llmCall: GraphNode<typeof MessagesState> = async (
  state,
  config,
) => {
  // const response = await modelWithTools.invoke([
  //   new SystemMessage(
  //     "You are a helpful medical assistant tasked with giving proper information and take required actions with the appropriate tools provided.",
  //   ),
  //   ...state.messages,
  // ]);

  const response = await model
    .bindTools([
      ...convertActionsToDynamicStructuredTools(
        state.copilotkit?.actions ?? [],
      ),
      ...tools,
    ])
    .invoke([new SystemMessage(SYSTEM_PROMPT), ...state.messages], config);

  // console.log(JSON.stringify(response.content));

  const text = toText(response.content);

  return {
    messages: [
      new AIMessage({
        content: text,
        tool_calls: response.tool_calls,
        id: response.id,
      }),
    ],
    llmCalls: (state.llmCalls ?? 0) + 1,
  };
};

// Use prebuilt ToolNode which automatically handles state injection into ToolRuntime
export const toolNode = new ToolNode(tools);

// export const shouldContinue: ConditionalEdgeRouter<{
//   InputSchema: typeof MessagesState;
//   Nodes: "toolNode";
// }> = (state) => {
//   const lastMessage = state.messages.at(-1);

//   // Check if it's an AIMessage before accessing tool_calls
//   if (!lastMessage || !AIMessage.isInstance(lastMessage)) {
//     return END;
//   }

//   // If the LLM makes a tool call, then perform an action
//   if (lastMessage.tool_calls?.length) {
//     return "toolNode";
//   }

//   // Otherwise, we stop (reply to the user)
//   return END;
// };

export function shouldContinue(state: typeof CopilotKitStateAnnotation.State) {
  const last = state.messages.at(-1) as AIMessage;
  const calls = last?.tool_calls ?? [];
  if (!calls.length) return END;

  const frontendNames = new Set(
    (state.copilotkit?.actions ?? []).map((a: any) => a.name),
  );

  // If ANY call is a frontend action, stop here and let the UI handle it
  if (calls.some((c) => frontendNames.has(c.name))) return END;

  return "toolNode";
}
