import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { IMAGE_GEN_MODEL, CHAT_MODEL } from '../constants';
import { ChatMessage } from '../types';

/**
 * Generates a coloring page image based on the provided prompt.
 * @param prompt The prompt for image generation.
 * @returns A base64 encoded string of the generated image.
 * @throws Error if image generation fails or no image is returned.
 */
export async function generateColoringPageImage(prompt: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const fullPrompt = `${prompt}, black and white, thick lines, coloring book style, simple, clear, no shading`;

  try {
    const response = await ai.models.generateImages({
      model: IMAGE_GEN_MODEL,
      prompt: fullPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png', // Use PNG for transparent backgrounds or line art
        aspectRatio: '1:1', // Square aspect ratio is versatile
      },
    });

    const base64ImageBytes: string | undefined = response.generatedImages[0]?.image?.imageBytes;

    if (!base64ImageBytes) {
      throw new Error("No image data received from the model.");
    }

    return `data:image/png;base64,${base64ImageBytes}`;
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error(`Failed to generate image: ${(error as Error).message}`);
  }
}

/**
 * Sends a message to the Gemini chat model and receives a response.
 * @param history An array of previous chat messages to maintain context.
 * @param newMessage The new message from the user.
 * @returns The text content of the model's response.
 * @throws Error if chat message sending fails or no response is received.
 */
export async function sendChatMessage(history: ChatMessage[], newMessage: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const chat = ai.chats.create({
    model: CHAT_MODEL,
    config: {
      temperature: 0.7,
      topP: 0.95,
      topK: 64,
      systemInstruction: "You are a friendly, helpful, and imaginative assistant designed to chat with children. Keep your responses positive, encouraging, and easy to understand. Avoid complex topics and always prioritize safety and appropriateness for young audiences. Use simple language and fun imagery.",
    },
  });

  // Convert ChatMessage[] to the format expected by Gemini API
  const apiHistory = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  try {
    const response: GenerateContentResponse = await chat.sendMessage({
      history: apiHistory,
      message: newMessage,
    });

    const textResponse = response.text;
    if (!textResponse) {
      throw new Error("No text response received from the chatbot.");
    }
    return textResponse;
  } catch (error) {
    console.error("Error sending chat message:", error);
    throw new Error(`Failed to get chat response: ${(error as Error).message}`);
  }
}