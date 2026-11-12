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

    const start = new Date(`${input.date}T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    const slots = await prisma.orm.public.Schedule.where({
      status: "AVAILABLE",
      doctorId: input.id,
    }) // equality filters: object form
      .where((s) => s.startTime.gte(start)) // comparisons: callback form
      .where((s) => s.startTime.lt(end))
      .all();

    return {
      available_slots: slots,
    };
  },
  {
    name: "get_available_slots_for_appointment",
    description:
      "get available slots for appointment with provided doctor at provided date",
    schema: z.object({
      id: z
        .string()
        .describe("The id of the doctor to book an appointment with"),
      date: z.string().describe("The date for the appointment e.g 2026-10-13"),
    }),
  },
);

const get_current_date_time = tool(
  async (input, runtime: ToolRuntime<MessagesStateType>) => {
    const localDate = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Dhaka",
    });

    return localDate;
  },
  {
    name: "get_current_date_time",
    description: "get current date/time e.g today",
    schema: z.object({}),
  },
);

// Augment the LLM with tools
export const toolsByName = {
  [search_doctor.name]: search_doctor,
  [get_available_slots.name]: get_available_slots,
  [get_current_date_time.name]: get_current_date_time,
};

export const tools = Object.values(toolsByName);
