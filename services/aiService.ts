
import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";
import { KnowledgeItem, AIProvider } from "../types";

const ZHIPU_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4';

export class AIService {
  private geminiApiKey: string | undefined;
  private zhipuApiKey: string | undefined;

  // 设置Gemini API密钥
  setGeminiApiKey(key: string) {
    this.geminiApiKey = key;
  }

  // 设置智谱API密钥
  setZhipuApiKey(key: string) {
    this.zhipuApiKey = key;
  }

  // 获取Gemini API密钥（优先使用用户设置的密钥，其次使用环境变量）
  private getGeminiApiKey(): string {
    return this.geminiApiKey || process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  }

  // 获取智谱API密钥（优先使用用户设置的密钥，其次使用环境变量）
  private getZhipuApiKey(): string {
    return this.zhipuApiKey || process.env.ZHIPU_API_KEY || process.env.API_KEY || '';
  }

  private async zhipuFetch(endpoint: string, body: any, isBinary: boolean = false) {
    const key = this.getZhipuApiKey();
    const response = await fetch(`${ZHIPU_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err?.error?.message || 'Zhipu API Error');
    }

    return isBinary ? response.arrayBuffer() : response.json();
  }

  /**
   * Simulated RAG Logic (Retrieval Augmented Generation)
   */
  private retrieveRelevantKnowledge(prompt: string, knowledge: KnowledgeItem[]): KnowledgeItem[] {
    const query = prompt.toLowerCase();
    return knowledge.filter(item => 
      item.title.toLowerCase().includes(query) || 
      item.content.toLowerCase().includes(query) ||
      (item.tags && item.tags.some(t => t.toLowerCase().includes(query)))
    ).slice(0, 5); 
  }

  async getSmartResponse(prompt: string, knowledge: KnowledgeItem[], provider: AIProvider, systemInstruction: string) {
    const relevantItems = this.retrieveRelevantKnowledge(prompt, knowledge);
    const context = relevantItems.length > 0 
      ? relevantItems.map(item => `[Knowledge Item: ${item.title}]\n${item.content}`).join('\n\n')
      : "No direct match in custom knowledge base. Use general product knowledge if appropriate.";

    const fullPrompt = `You are a product support AI. Use the following context to answer the user accurately.\n\nContext:\n${context}\n\nUser Question: ${prompt}`;

    if (provider === AIProvider.ZHIPU) {
      const data = await this.zhipuFetch('/chat/completions', {
        model: 'glm-4.7',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: fullPrompt }
        ],
        temperature: 0.1,
      });
      return data.choices[0].message.content;
    }

    // Creating fresh instance right before call as per @google/genai guidelines
    const ai = new GoogleGenAI({ apiKey: this.getGeminiApiKey() });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: fullPrompt,
      config: { systemInstruction, temperature: 0.1 },
    });

    return response.text;
  }

  async analyzeInstallation(imageBuffer: string, visionPrompt: string, provider: AIProvider) {
    const base64Data = imageBuffer.split(',')[1];
    if (provider === AIProvider.ZHIPU) {
      const data = await this.zhipuFetch('/chat/completions', {
        model: 'glm-4.6v',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: visionPrompt },
            { type: 'image_url', image_url: { url: imageBuffer } }
          ]
        }]
      });
      return data.choices[0].message.content;
    }

    const ai = new GoogleGenAI({ apiKey: this.getGeminiApiKey() });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ inlineData: { mimeType: 'image/jpeg', data: base64Data } }, { text: visionPrompt }] }
    });
    return response.text;
  }

  async generateSpeech(text: string, voiceName: string, provider: AIProvider): Promise<string | undefined> {
    if (provider === AIProvider.ZHIPU) {
      try {
        const buffer = await this.zhipuFetch('/audio/speech', {
          model: 'glm-tts',
          input: text,
          voice: voiceName || 'tongtong',
          response_format: 'wav'
        }, true);
        
        const uint8 = new Uint8Array(buffer as ArrayBuffer);
        let binary = '';
        for (let i = 0; i < uint8.byteLength; i++) binary += String.fromCharCode(uint8[i]);
        return window.btoa(binary);
      } catch (e) {
        console.error("Zhipu TTS Failed", e);
        return undefined;
      }
    }

    try {
      const ai = new GoogleGenAI({ apiKey: this.getGeminiApiKey() });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (error) {
      return undefined;
    }
  }

  async generateVideoGuide(prompt: string, provider: AIProvider) {
    if (provider === AIProvider.ZHIPU) {
       return "https://cdn.bigmodel.cn/static/platform/videos/doc_solutions/Realtime-%E5%94%B1%E6%AD%8C.m4v";
    }
    
    // Mandatory check for API key selection when using Veo models
    if (typeof (window as any).aistudio !== 'undefined') {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }
    }
    
    try {
      // Create a fresh instance right before the video generation call
      const ai = new GoogleGenAI({ apiKey: this.getGeminiApiKey() });
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
      });
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({operation: operation});
      }
      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      return downloadLink ? `${downloadLink}&key=${this.getGeminiApiKey()}` : undefined;
    } catch (e) {
      // If request fails with "Requested entity was not found.", reset key selection
      if (e instanceof Error && e.message.includes("Requested entity was not found.")) {
        if (typeof (window as any).aistudio !== 'undefined') {
          await (window as any).aistudio.openSelectKey();
        }
      }
      return "https://media.w3.org/2010/05/sintel/trailer.mp4"; 
    }
  }
}

export const aiService = new AIService();
