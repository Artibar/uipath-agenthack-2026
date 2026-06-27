import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

console.log("KEY =", process.env.GROQ_API_KEY);

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export default groq;