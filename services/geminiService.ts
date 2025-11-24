import { GoogleGenAI, Type } from "@google/genai";
import { Product } from "../types";

const API_KEY = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey: API_KEY });

export const GeminiService = {
  parseInventoryFromText: async (text: string): Promise<Omit<Product, 'id'>[]> => {
    if (!API_KEY) throw new Error("Falta API KEY de Gemini en Vercel/Entorno.");
    if (!text.trim()) return [];

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `
          Parse this text into a JSON array of products (name, category, price, stock).
          Infer category if missing.
          Text: ${text}
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                category: { type: Type.STRING },
                price: { type: Type.NUMBER },
                stock: { type: Type.NUMBER },
                image: { type: Type.STRING, description: "Leave empty string" }
              },
              required: ["name", "price", "stock", "category"]
            }
          }
        }
      });

      return JSON.parse(response.text || '[]');
    } catch (error: any) {
      console.error("Error AI:", error);
      throw new Error(error.message || "Error al procesar con IA");
    }
  },

  generateSalesInsight: async (salesDataSummary: string): Promise<string> => {
    if (!API_KEY) return "Configura la API Key para ver consejos.";
    try {
       const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Analiza este resumen de ventas de 'TecnoStore' y dame 2 consejos breves en español: ${salesDataSummary}`,
      });
      return response.text || "Sin datos suficientes.";
    } catch (error) {
      return "No se pudo conectar con la IA.";
    }
  }
};