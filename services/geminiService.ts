
import { GoogleGenAI, Type, Modality } from "@google/genai";

export const analyzeCleaningQuality = async (imageBase64: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } },
          { text: "Analyse cette photo de nettoyage. Évalue la propreté, identifie les zones oubliées s'il y en a, et donne un score de 1 à 10. Réponds en français de manière professionnelle." }
        ]
      }
    });
    return response.text;
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return "Désolé, l'analyse IA a échoué.";
  }
};

export const getSiteInstructionsTTS = async (instructionText: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Lis ces instructions de nettoyage pour l'agent de manière claire: ${instructionText}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("TTS generation failed:", error);
    return null;
  }
};

export const getSmartPlanningAdvice = async (currentStats: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Voici les statistiques actuelles de la société de nettoyage à Lyon: ${JSON.stringify(currentStats)}. Donne 3 conseils stratégiques pour optimiser la rentabilité ou le planning cette semaine. Utilise la recherche Google si nécessaire pour les tendances actuelles du secteur à Lyon.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    return {
      text: response.text,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks
    };
  } catch (error) {
    console.error("Smart advice failed:", error);
    return { text: "Impossible de récupérer des conseils pour le moment.", sources: [] };
  }
};

export const getFinancialSummaryIA = async (invoices: any[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const dataSummary = invoices.map(i => ({ number: i.number, status: i.status, total: i.totalTTC }));
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyse cette liste de factures : ${JSON.stringify(dataSummary)}. 
      Résume la santé financière de l'entreprise en 2 phrases, identifie les clients à relancer prioritairement et mentionne une opportunité d'optimisation de trésorerie. Réponds en français.`,
    });
    return response.text;
  } catch (error) {
    return "Analyse financière indisponible.";
  }
};
