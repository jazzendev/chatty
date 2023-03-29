import { IConfig } from "./interface";
import dotenv from "dotenv";

dotenv.config();

export const config: IConfig = {
    apikey: process.env.OPENAI_API_KEY || "",
    model: process.env.MODEL || "",
}