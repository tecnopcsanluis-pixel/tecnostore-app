
import { GoogleGenAI, Type } from "@google/genai";
import { Product } from "../types";

// Ensure API Key is handled safely for build process
const API_KEY = process.env.API_KEY || 'BUILD_KEY';

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const GeminiService = {
  /**
   * Parses unstructured text (copy-pasted from Excel) into structured Product objects.
   */
  parseInventoryFromText: async (text: string): Promise<Omit<Product, 'id'>[]> => {
    if (!text.trim()) return [];

    try {
      const model = "gemini-2.5-flash";
      
      const response = await ai.models.generateContent({
        model,
        contents: `
          I have a raw text list of products from an old inventory file. 
          Please parse this text and extract product information.
          If a category is not clear, infer it (e.g., Fundas, Cargadores, Audio, Varios).
          Return the result as a strict JSON array.
          
          Here is the text data:
          ${text}
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Product name" },
                category: { type: Type.STRING, description: "Product category" },
                price: { type: Type.NUMBER, description: "Price per unit" },
                stock: { type: Type.NUMBER, description: "Quantity available" },
                description: { type: Type.STRING, description: "Short description if available" }
              },
              required: ["name", "price", "stock", "category"]
            }
          }
        }
      });

      const jsonStr = response.text;
      if (!jsonStr) return [];
      
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("Error parsing inventory with Gemini:", error);
      // In production, we might want to fail silently or return empty
      return [];
    }
  },

  /**
   * Generate a business insight based on sales data (Simple implementation)
   */
  generateSalesInsight: async (salesDataSummary: string): Promise<string> => {
    try {
       const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `
          Act as a business consultant for 'TecnoStore'. 
          Analyze this brief sales summary and give me 2 short, encouraging tips or observations in Spanish.
          
          Summary:
          ${salesDataSummary}
        `,
      });
      return response.text || "Sigue vendiendo para obtener más consejos.";
    } catch (error) {
      console.error(error);
      return "No se pudieron generar consejos en este momento.";
    }
  },

  /**
   * Generates an image for a product using Gemini.
   * Returns the Base64 string of the image.
   */
  generateProductImage: async (productName: string): Promise<string | null> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: `Professional product photography of ${productName}. White background, studio lighting, high resolution, sleek, modern technology accessory. Center the object.`
            },
          ],
        },
      });

      // Fix: Robust null checking for TypeScript strict mode
      const candidate = response.candidates?.[0];
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.data) {
            return part.inlineData.data;
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Error generating image:", error);
      // Return null instead of throwing to prevent app crash
      return null;
    }
  }
};

