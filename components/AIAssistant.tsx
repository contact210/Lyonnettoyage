
import React, { useState, useRef } from 'react';
import { analyzeCleaningQuality, getSiteInstructionsTTS, getSmartPlanningAdvice } from '../services/geminiService';
// Added Sparkles to the named imports
import { Camera, Volume2, Lightbulb, Play, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';

const AIAssistant: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [advice, setAdvice] = useState<any>(null);
  const [isGettingAdvice, setIsGettingAdvice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const result = await analyzeCleaningQuality(base64);
      setAnalysisResult(result);
      setIsAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  // Helper function to decode base64 to Uint8Array as per guidelines
  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  // Helper function to decode raw PCM bytes to AudioBuffer as per guidelines
  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const playInstructions = async () => {
    const text = "Veuillez nettoyer les surfaces vitrées du 3ème étage en utilisant le produit spécifique pour vitres industrielles. N'oubliez pas de vider les corbeilles du local technique.";
    const audioData = await getSiteInstructionsTTS(text);
    if (audioData) {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const buffer = await decodeAudioData(decode(audioData), audioContext, 24000, 1);
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start();
      } catch (err) {
        console.error("Audio playback error:", err);
      }
    }
  };

  const loadAdvice = async () => {
    setIsGettingAdvice(true);
    const result = await getSmartPlanningAdvice({ activeSites: 24, margin: 22, region: 'Lyon' });
    setAdvice(result);
    setIsGettingAdvice(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="text-center">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          Assistant IA Pro <Sparkles className="text-indigo-600" />
        </h1>
        <p className="text-gray-500 mt-2">Optimisez votre exploitation grâce à la puissance de Google Gemini</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Quality Check Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-4 text-indigo-600">
            <Camera />
            <h2 className="text-xl font-bold">Vérification de Qualité</h2>
          </div>
          <p className="text-sm text-gray-600 mb-6">Téléchargez une photo du chantier pour que l'IA analyse la qualité du nettoyage.</p>
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-8 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all mb-4"
          >
            <Camera size={48} className="text-gray-300 mb-4" />
            <p className="text-sm font-medium text-gray-500">Cliquez pour scanner une photo</p>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>

          {isAnalyzing && (
            <div className="bg-indigo-50 p-4 rounded-lg flex items-center gap-3 animate-pulse">
              <Sparkles className="text-indigo-500" size={20} />
              <span className="text-sm font-medium text-indigo-700">Gemini analyse votre image...</span>
            </div>
          )}

          {analysisResult && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h4 className="font-bold text-green-800 text-sm mb-1 flex items-center gap-2">
                <CheckCircle2 size={16} /> Rapport d'Analyse IA
              </h4>
              <p className="text-sm text-green-700 leading-relaxed">{analysisResult}</p>
            </div>
          )}
        </div>

        {/* TTS & Advice Card */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4 text-amber-600">
              <Volume2 />
              <h2 className="text-xl font-bold">Consignes Vocales</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">Générez des instructions vocales automatisées pour vos agents sur le terrain.</p>
            <button 
              onClick={playInstructions}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white font-bold py-3 rounded-xl hover:bg-amber-600 transition-colors shadow-lg shadow-amber-200"
            >
              <Play size={18} fill="white" /> Écouter les Consignes Type
            </button>
          </div>

          <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-xl shadow-indigo-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-800 rounded-full -mr-16 -mt-16 opacity-50"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4 text-indigo-300">
                <Lightbulb />
                <h2 className="text-xl font-bold text-white">Conseils Stratégiques</h2>
              </div>
              <p className="text-sm text-indigo-100 mb-6">Analyse intelligente de votre activité à Lyon avec Google Search Grounding.</p>
              
              <button 
                onClick={loadAdvice}
                disabled={isGettingAdvice}
                className="w-full bg-white text-indigo-900 font-bold py-3 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                {isGettingAdvice ? 'Génération...' : 'Obtenir des conseils'}
              </button>

              {advice && (
                <div className="mt-6 p-4 bg-indigo-800 rounded-xl border border-indigo-700 text-sm leading-relaxed">
                  {advice.text}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
