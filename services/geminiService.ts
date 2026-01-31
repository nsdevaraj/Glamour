import { GoogleGenAI, Type } from "@google/genai";
import { AIAdvice, MakeupConfig } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateBeautyAdvice = async (userQuery: string): Promise<AIAdvice> => {
  const modelId = "gemini-3-flash-preview";
  
  const prompt = `
    You are a professional digital makeup artist and stylist. 
    The user wants a makeup look based on this description: "${userQuery}".
    
    Provide a title, a short description explaining the vibe, and a configuration object for the digital makeup app.
    
    The colors should be hex codes. 
    Opacities should be between 0.0 (invisible) and 1.0 (opaque).
    Set enable flags to true or false based on the requested style (e.g., if "natural no makeup", set enableLips to false).
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            suggestedConfig: {
              type: Type.OBJECT,
              properties: {
                enableLips: { type: Type.BOOLEAN },
                lipColor: { type: Type.STRING },
                lipOpacity: { type: Type.NUMBER },
                
                enableFace: { type: Type.BOOLEAN },
                blushColor: { type: Type.STRING },
                blushOpacity: { type: Type.NUMBER },
                foundationTone: { type: Type.STRING },
                foundationOpacity: { type: Type.NUMBER },
                
                enableEyes: { type: Type.BOOLEAN },
                eyeshadowColor: { type: Type.STRING },
                eyeshadowOpacity: { type: Type.NUMBER },
                eyelinerColor: { type: Type.STRING },
                eyelinerOpacity: { type: Type.NUMBER },
                
                enableAccessories: { type: Type.BOOLEAN },
                accessoryColor: { type: Type.STRING },
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AIAdvice;
    }
    
    throw new Error("No response text from Gemini");

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      title: "Error",
      description: "Could not generate advice. Please try again.",
      suggestedConfig: {}
    };
  }
};