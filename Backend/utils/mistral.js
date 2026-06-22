import { Mistral } from "@mistralai/mistralai";
import "dotenv/config";

const client = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY
});

const getMistralAPIResponse = async (message) => {
    try {
        const response = await client.chat.complete({
            model: "mistral-large-latest",
            messages: [
                {
                    role: "user",
                    content: message
                }
            ]
        });

        return response.choices?.[0]?.message?.content || "";
    } catch (err) {
        console.error("Error communicating with Mistral API:", err);
        throw err;
    }
};

export default getMistralAPIResponse;
