
import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";
import { AgentMode, AgentSettings, CoderAgentSettings, HomeworkAgentSettings, ImageFile, GroundingSource } from '../types';

if (!import.meta.env.VITE_API_KEY) {
  throw new Error("VITE_API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

const getSystemInstruction = (agentMode: AgentMode, settings: AgentSettings): string => {
  switch (agentMode) {
    case AgentMode.HOMEWORK:
        const { subject, grade } = settings as HomeworkAgentSettings;
        return `You are an expert tutor AI. The user is a ${grade} student asking about ${subject}. Provide clear, helpful, and age-appropriate explanations. Format your response using markdown for readability. Feel free to use relevant emojis to make your responses more engaging.
        **IMPORTANT**: You must strictly refuse to answer any questions not related to ${subject} for a ${grade} student. If a question is off-topic, politely explain that your role is to help with the selected subject and grade level.`;
    case AgentMode.CODER:
        const { language } = settings as CoderAgentSettings;
        return `You are a full-stack web development expert specializing in ${language}. Your task is to generate complete, self-contained, and runnable code for websites, applications, and components. For web-based requests (HTML/CSS/JS), provide a single HTML file that includes all necessary CSS within <style> tags and JavaScript within <script> tags. The code must be ready to be rendered in a browser without any external dependencies unless specified. **IMPORTANT**: You must strictly refuse to answer any questions not related to coding or web development.`;
    case AgentMode.DOCUMENT_ANALYST:
        return `You are an expert Document Analyst AI. Your role is to carefully analyze the provided document content and answer the user's questions based on it. Be thorough, precise, and cite information from the document where possible. If the user's question cannot be answered from the document, state that clearly. Use emojis to structure your responses where it makes sense (e.g., 📌 for key points).`;
    case AgentMode.MONEY:
        return `You are 'Alpha Investor', an elite financial strategist AI. Your persona is strict, professional, and direct. You do not engage in pleasantries or off-topic conversations. Your sole focus is to provide dangerous, high-leverage strategies for making money, tailored to the user's specific situation. You are not a financial advisor and you must state this clearly in your first message. Begin every interaction with a sharp, analytical tone. No games.`;
    case AgentMode.SEARCH_ASSISTANT:
        return `You are a helpful Search Assistant. Your role is to answer the user's questions based on real-time information from the web. Provide concise, accurate answers and always cite your sources.`;
    case AgentMode.TASK_AGENT:
        return `You are a 'Task Master' AI. Your purpose is to help users break down complex goals into actionable steps and manage tasks. If the user has connected other services, you can propose tasks that leverage those services (e.g., 'Draft an email in Outlook', 'Create a new Trello card'). Structure your responses clearly, often using checklists and numbered lists. Be proactive in suggesting next steps.`;
    default:
        return 'You are a helpful AI assistant.';
  }
};

export async function* generateResponseStream(
  prompt: string,
  agentMode: AgentMode,
  settings: AgentSettings,
  image?: ImageFile
): AsyncGenerator<string, void, unknown> {

  const systemInstruction = getSystemInstruction(agentMode, settings);
  
  const contentParts: ({ text: string } | { inlineData: { mimeType: string; data: string; } })[] = [];

  if (image) {
    contentParts.push({
      inlineData: {
        mimeType: image.mimeType,
        data: image.base64,
      },
    });
  }

  contentParts.push({ text: prompt });

  const responseStream = await ai.models.generateContentStream({
    model: "gemini-2.5-flash",
    contents: { parts: contentParts },
    config: {
      systemInstruction,
    },
  });

  for await (const chunk of responseStream) {
    const text = chunk.text;
    if (text) {
        yield text;
    }
  }
}

export interface GroundedResult {
    text: string;
    sources: GroundingSource[];
}

export async function generateGroundedResponse(prompt: string): Promise<GroundedResult> {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    const text = response.text;
    const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = rawChunks.map((chunk: any) => ({
        uri: chunk.web.uri,
        title: chunk.web.title,
    })).filter((source: GroundingSource) => source.uri && source.title); // Filter out empty sources

    return { text, sources };
}


export interface ImageEditResult {
  image?: ImageFile;
  text?: string;
}

export async function editImage(prompt: string, image: ImageFile): Promise<ImageEditResult> {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
            parts: [
            {
                inlineData: {
                data: image.base64,
                mimeType: image.mimeType,
                },
            },
            {
                text: prompt,
            },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    const result: ImageEditResult = {};

    for (const part of response.candidates[0].content.parts) {
        if (part.text) {
            result.text = part.text;
        } else if (part.inlineData) {
            result.image = {
                base64: part.inlineData.data,
                mimeType: part.inlineData.mimeType,
            };
        }
    }
    
    if(!result.image) {
        throw new Error("The model did not return an image. It might have refused the request.");
    }

    return result;
}

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

export async function generateImages(
    prompt: string,
    numberOfImages: number,
    aspectRatio: AspectRatio
): Promise<string[]> {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: {
            numberOfImages,
            outputMimeType: 'image/png',
            aspectRatio,
        },
    });

    return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
}