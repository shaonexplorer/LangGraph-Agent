import {
  Annotation,
  messagesStateReducer,
  BaseMessage,
} from "@langchain/langgraph";
import { CopilotKitStateAnnotation } from "@copilotkit/sdk-js/langgraph";

export const MessagesState = Annotation.Root({
  ...CopilotKitStateAnnotation.spec,
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  llmCalls: Annotation<number>({
    reducer: (current, update) => update ?? 0,
    default: () => 0,
  }),
  selected_doctor: Annotation<
    { id: string; doctor_name: string; speciality: string } | undefined
  >({
    reducer: (current, update) => update ?? current,
    default: () => undefined,
  }),
  search_doctors: Annotation<
    Array<{ id: string; doctor_name: string; speciality: string }> | undefined
  >({
    reducer: (current, update) => update ?? current,
    default: () => undefined,
  }),
  appointment_time: Annotation<string | undefined>({
    reducer: (current, update) => update ?? current,
    default: () => undefined,
  }),
  selected_appointment_date: Annotation<string | undefined>({
    reducer: (current, update) => update ?? current,
    default: () => undefined,
  }),
  selected_slot_id: Annotation<string | undefined>({
    reducer: (current, update) => update ?? current,
    default: () => undefined,
  }),
});

export type MessagesStateType = typeof MessagesState.State;
