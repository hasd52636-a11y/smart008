
import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";
import { KnowledgeItem } from "../types";

export class GeminiService {
  // Removed ai property to use fresh instances in methods for up-to-date API key usage

  /**
   * Generates a response based on the product's knowledge base.
   */
  async getSmartResponse(prompt: string, knowledge: KnowledgeItem[], systemInstruction: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const knowledgeContext = knowledge
      .map(item => `[${item.type}] ${item.title}: ${item.content}`)
      .join('\n\n');

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Context:\n${knowledgeContext}\n\nQuestion: ${prompt}`,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text;
  }

  /**
   * Analyzes an image for installation verification or troubleshooting.
   */
  async analyzeInstallation(imageBuffer: string, visionPrompt: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBuffer.split(',')[1], // Remove data:image/jpeg;base64,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          imagePart,
          { text: visionPrompt }
        ]
      }
    });

    return response.text;
  }

  /**
   * Converts text to speech using Gemini's TTS model.
   */
  async generateSpeech(text: string, voiceName: string): Promise<string | undefined> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (error) {
      console.error("TTS Error:", error);
      return undefined;
    }
  }
}

export const gemini = new GeminiService();
