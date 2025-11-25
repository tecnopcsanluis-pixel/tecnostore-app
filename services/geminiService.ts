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
          Act as a data entry specialist for a phone accessory store 'TecnoStore'.
          Parse the provided raw inventory text into a strict JSON array.
          
          CRITICAL CATEGORIZATION RULES (Apply these strictly):
          1. LANGUAGE: All Categories and Names MUST be in SPANISH.
          2. HOLDERS: Any car holder, bike holder, desk holder, ring holder -> Category: "Soportes".
          3. HEADPHONES: 
             - If bluetooth/wireless -> Category: "Auriculares Inalámbricos".
             - If wired/aux/type-c cable -> Category: "Auriculares Con Cable".
          4. LIGHTING: Ring lights, flashlights, usb lamps -> Category: "Iluminación".
          5. GAMER: Any gaming trigger, cooler, finger sleeve, gaming headset -> Category: "Gamer".
          6. GLASS: 
             - Standard/Clear/2D -> Category: "Vidrios Comunes".
             - 5D/9D/11D/21D/Ceramic/Full Cover -> Category: "Vidrios 9D/Full".
          7. CASES: Silicon cases, hard cases -> Category: "Fundas".
          8. CABLES: USB cables -> Category: "Cables".
          9. CHARGERS: Wall chargers, car chargers -> Category: "Cargadores".
          10. OTHERS: Anything else -> "Varios".

          Infer the category based on the product name if not explicit.
          
          Raw Text Data:
          ${text}
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
                image: { type: Type.STRING, description: "Always leave this as empty string" }
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