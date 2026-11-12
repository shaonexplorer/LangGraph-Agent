import express from "express";
import { weatherAgentController } from "./controller.js";

const router = express.Router();

// Example route for weather data

router.get("/weather", weatherAgentController.getWeatherData);

export const weatherAgentRouter = router;
