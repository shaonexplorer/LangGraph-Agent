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

    // console.log({ doctors });

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
      date: z.string().describe("The date for the appointment e.g 2026-10-13"),
    }),
  },
);

const search_available_slots = tool(
  async (input, runtime: ToolRuntime<MessagesStateType>) => {
    const state = runtime.state;

    const id = input.id ?? state.selected_doctor?.id;

    const date = input.date ?? state.selected_appointment_date;

    if (!date)
      return {
        message:
          "No Appointment Date selected. Ask the user to select an appointment date first",
      };

    if (!id)
      return {
        message: "No Doctor selected. Ask the user to select a doctor first",
      };

    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    const slots = await prisma.orm.public.Schedule.where({
      status: "AVAILABLE",
      doctorId: id,
    }) // equality filters: object form
      .where((s) => s.startTime.gte(start)) // comparisons: callback form
      .where((s) => s.startTime.lt(end))
      .include("doctor")
      .select("doctorId", "startTime", "id")
      .all();

    return {
      available_slots: slots.length > 0 ? slots : "No available slots found",
      next_action: "View the available slots to the user",
    };
  },
  {
    name: "search_available_slots_for_appointment",
    description:
      "search available slots for appointment with provided doctorId and date if date is not available then ask the user for the date",
    schema: z.object({
      id: z
        .string()
        .optional()
        .describe("The id of the doctor to book an appointment with"),
      date: z
        .string()
        .optional()
        .describe("The date for the appointment e.g 2026-10-13"),
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

const set_appointment_date = tool(
  async (input, runtime: ToolRuntime<MessagesStateType>) => {
    return new Command({
      update: {
        selected_appointment_date: input.date,
        messages: [
          new ToolMessage({
            content: JSON.stringify({
              selected_appointment_date: input.date,
            }),
            tool_call_id: runtime.toolCallId,
            name: "set_appointment_date",
          }),
        ],
      },
    });
  },
  {
    name: "set_appointment_date",
    description: "set the date for appointment  e.g 2026-10-13",
    schema: z.object({
      date: z
        .string()
        .describe("selected date by user for the appointment e.g 2026-10-13"),
    }),
  },
);

// Augment the LLM with tools
export const toolsByName = {
  [search_doctor.name]: search_doctor,
  [search_available_slots.name]: search_available_slots,
  [get_current_date_time.name]: get_current_date_time,
  [set_appointment_date.name]: set_appointment_date,
};

export const tools = Object.values(toolsByName);
