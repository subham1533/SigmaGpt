import { Mistral } from "@mistralai/mistralai";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const FALLBACK_MODELS = ["ministral-8b-latest", "ministral-3b-latest", "open-mistral-7b"];

const getClient = () => {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
        throw new Error("MISTRAL_API_KEY is not defined in environment variables");
    }
    return new Mistral({ apiKey });
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const formatMessages = (input) => {
    if (Array.isArray(input)) {
        return input.map(m => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: String(m.content ?? "")
        }));
    }
    return [{ role: "user", content: String(input ?? "") }];
};

export const getMistralAPIResponse = async (input, options = {}) => {
    const client = getClient();
    const formattedMessages = formatMessages(input);

    const configuredModel = options.model || process.env.MISTRAL_MODEL || "ministral-8b-latest";
    const modelsToTry = [
        configuredModel,
        ...FALLBACK_MODELS.filter(m => m !== configuredModel)
    ];

    let lastError = null;

    for (let i = 0; i < modelsToTry.length; i++) {
        const model = modelsToTry[i];
        try {
            const response = await client.chat.complete({
                model,
                messages: formattedMessages
            });

            const content = response.choices?.[0]?.message?.content;
            if (typeof content === "string") {
                return content;
            }
            return "";
        } catch (err) {
            lastError = err;
            const statusCode = err?.statusCode;
            const isRecoverable = statusCode === 429 || statusCode === 403 || statusCode === 404;

            if (isRecoverable && i < modelsToTry.length - 1) {
                const nextModel = modelsToTry[i + 1];
                console.warn(
                    `[Mistral] Model '${model}' failed with status ${statusCode}. Falling back to '${nextModel}'...`
                );
                continue;
            }

            // Retry on 5xx server errors
            if (statusCode >= 500 && (options.retries ?? 1) > 0) {
                await wait(1000);
                return getMistralAPIResponse(input, { ...options, model, retries: (options.retries ?? 1) - 1 });
            }

            console.error(`[Mistral] Error communicating with Mistral API (model: ${model}):`, err.message || err);
            break;
        }
    }

    throw lastError;
};

export default getMistralAPIResponse;
