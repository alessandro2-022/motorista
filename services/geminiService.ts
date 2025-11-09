
import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { GroundingSource } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getChatResponse = async (
  prompt: string,
  useSearch: boolean,
  useMaps: boolean,
  location?: { latitude: number; longitude: number }
): Promise<{ text: string, sources: GroundingSource[] }> => {
  try {
    const tools: any[] = [];
    if (useSearch) tools.push({ googleSearch: {} });
    if (useMaps) tools.push({ googleMaps: {} });

    const config: any = {};
    if (tools.length > 0) {
      config.tools = tools;
    }

    if (useMaps && location) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: location.latitude,
            longitude: location.longitude
          }
        }
      };
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config,
    });

    const text = response.text;
    const sources: GroundingSource[] = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    for (const chunk of groundingChunks) {
      if (chunk.web) {
        sources.push({ uri: chunk.web.uri, title: chunk.web.title || chunk.web.uri, type: 'web' });
      }
      if (chunk.maps) {
        sources.push({ uri: chunk.maps.uri, title: chunk.maps.title || chunk.maps.uri, type: 'maps' });
      }
    }
    
    return { text, sources };
  } catch (error) {
    console.error("Error getting chat response:", error);
    return { text: "Desculpe, encontrei um erro. Por favor, tente novamente.", sources: [] };
  }
};

export const getTextToSpeech = async (text: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio || null;
    } catch (error) {
        console.error("Error generating speech:", error);
        return null;
    }
};
