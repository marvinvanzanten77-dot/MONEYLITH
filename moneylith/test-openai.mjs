import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  project: process.env.OPENAI_PROJECT_ID,
});

async function main() {
  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "Je bent een testassistent voor de Moneylith app.",
        },
        {
          role: "user",
          content: "Geef één korte zin terug als deze test werkt.",
        },
      ],
    });

    console.log("ANTWOORD VAN GPT:");
    console.log(completion.choices[0].message.content);
  } catch (err) {
    console.error("ER GING IETS MIS:");
    console.error(err);
  }
}

main();
