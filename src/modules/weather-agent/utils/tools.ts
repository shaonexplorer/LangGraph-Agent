import { tool, ToolRuntime } from "@langchain/core/tools";
import z from "zod";

import { MessagesStateType } from "./state.js";
import { Command } from "@langchain/langgraph";
import { ToolMessage } from "@langchain/core/messages";
import { prisma } from "../../../lib/prisma.js";

const search_doctor = tool(
  async (input, runtime: ToolRuntime<MessagesStateType>) => {
    const doctors = await prisma.orm.public.DoctorProfile.where((d) =>
      d.specialty.ilike(input.speciality),
    )
      .include("user")
      .all();

    console.log({ doctors });

    return new Command({
      update: {
        search_doctors: doctors,
        messages: [
          new ToolMessage({
            content: JSON.stringify({
              search_results: doctors,
            }),
            tool_call_id: runtime.toolCallId,
            name: "search_doctor",
          }),
        ],
      },
    });
  },
  {
    name: "search_doctor",
    description:
      "Search for a doctor with a given speciality and return their contact information.",
    schema: z.object({
      speciality: z
        .enum([
          "Neurology",
          "Cardiology",
          "Dermatology",
          "Internal Medicine",
          "Pediatrics",
          "Orthopedics",
          "Psychiatry",
          "Oncology",
          "Ophthalmology",
          "ENT",
          "Urology",
          "Gastroenterology",
          "Cardiology",
        ])
        .describe("The medical speciality of the doctor to search for"),
    }),
  },
);

const get_available_slots = tool(
  async (input, runtime: ToolRuntime<MessagesStateType>) => {
    // const state = runtime.state;

    return {
      available_slots: ["10:00 AM", "10:30 AM", "11:00 AM"],
    };
  },
  {
    name: "get_available_slots_for_appointment",
    description:
      "get available slots for appointment with provided doctor at provided date",
    schema: z.object({
      name: z
        .string()
        .describe("The name of the doctor to book an appointment with"),
      date: z.string().describe("The date for the appointment"),
    }),
  },
);

// Augment the LLM with tools
export const toolsByName = {
  [search_doctor.name]: search_doctor,
  [get_available_slots.name]: get_available_slots,
};

export const tools = Object.values(toolsByName);
