import { Request, Response } from "express";
import { HumanMessage } from "@langchain/core/messages";
import { agent } from "./utils/agent.js";

const getWeatherData = async (req: Request, res: Response) => {
  const config = { configurable: { thread_id: "1" } };

  try {
    // Set up streaming response
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.flushHeaders(); // Headers are sent here!

    const stream = await agent.streamEvents(
      {
        messages: [new HumanMessage(req.body.prompt)],
      },
      { ...config, version: "v3" },
    );

    // Stream text tokens as they arrive
    for await (const message of stream.messages) {
      for await (const token of message.text) {
        res.write(token);
      }
    }

    await stream.output;
    res.end();
  } catch (error) {
    console.error("Error fetching medical data:", error);

    // Check if headers were already sent to the client
    if (res.headersSent) {
      // If streaming already started, we can't send a 500 JSON response.
      // We can optionally write an error chunk or just end the stream cleanly.
      res.write("\n[Error: Failed to complete stream]");
      return res.end();
    }

    // If the error happened BEFORE headers were flushed, safe to send JSON:
    return res.status(500).json({ error: "Failed to fetch medical data" });
  }
};

export const weatherAgentController = {
  getWeatherData,
};
