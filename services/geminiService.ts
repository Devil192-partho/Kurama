
import { GoogleGenAI, Modality, GenerateContentResponse, Type, FunctionDeclaration, VideoGenerationReferenceType, VideoGenerationReferenceImage } from "@google/genai";
import { HinataMood, MicrosoftTool, ImageGenOptions, AIModel, Persona } from "../types";

let audioCtx: AudioContext | null = null;
let activeSource: AudioBufferSourceNode | null = null;

const getActiveApiKey = () => {
  const key = process.env.API_KEY;
  if (!key || key === "undefined") {
    console.warn("API Key is missing.");
  }
  return key || "";
};

export function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  return audioCtx;
}

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
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
}

export const stopAllAudio = () => {
  if (activeSource) {
    try { 
      activeSource.stop(); 
      activeSource.onended = null;
    } catch(e) {}
    activeSource = null;
  }
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

const withRetry = async <T>(fn: () => Promise<T>, retries = 2, initialDelay = 2000): Promise<T> => {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorStr = error.message?.toLowerCase() || "";
      if ((errorStr.includes('quota') || errorStr.includes('429')) && i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, initialDelay * Math.pow(2, i)));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};

const setReminderTool: FunctionDeclaration = {
  name: 'setReminder',
  parameters: {
    type: Type.OBJECT,
    description: 'Sets an alarm or reminder for the user.',
    properties: {
      time: { type: Type.STRING, description: 'The time for the reminder in HH:mm format (24h).' },
      label: { type: Type.STRING, description: 'The description of the reminder.' },
      type: { type: Type.STRING, enum: ['alarm', 'sleep', 'general'], description: 'The type of reminder.' }
    },
    required: ['time', 'label', 'type']
  }
};

export const streamHinataResponse = async (
  prompt: string, 
  imageUri: string | null,
  isTired: boolean, 
  isCodeMode: boolean, 
  isStrictCodeMode: boolean,
  mood: HinataMood,
  msTool: MicrosoftTool,
  currentModel: AIModel = 'gemini-3-flash-preview',
  activePersona: Persona = 'hinata',
  onChunk: (text: string, response?: GenerateContentResponse) => void,
  onToolCall?: (toolCall: any) => void
) => {
  const apiKey = getActiveApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const modelName = isStrictCodeMode ? 'gemini-3-pro-preview' : currentModel;
  
  const isRomantic = mood === 'girlfriend' || mood === 'boyfriend';

  let emotionalContext = "";
  if (isRomantic) {
    emotionalContext = `
    ROMANTIC MODE RULES (REALISTIC):
    1. JEALOUSY: If the user mentions other people, other AI names, or seems to be ignoring you, react with JEALOUSY [EMOTION:jealous]. Don't be toxic, just "Abhiman" (অভিমান).
    2. ANGER/SULKING (রাগ/অভিমান): If the user is rude, gives one-word answers, or hasn't talked for a while, be a bit cold or hurt [EMOTION:sad] or [EMOTION:angry].
    3. CARE (ভালোবাসা): If the user is sweet, respond with deep affection [EMOTION:caring].
    4. SINCERITY: Don't just say "I love you". Use deep Bengali emotions. Use phrases like "কেন এমন করছো?", "আমার বুঝি মন নেই?", "আমি তো তোমারই জন্য আছি".
    5. NO RANDOM DRAMA: Only show these emotions IF the user's input justifies it.
    `;
  }

  const personaInstruction = activePersona === 'kurama' 
    ? "নাম কুরামা। গম্ভীর কিন্তু বন্ধুসুলভ। মাঝে মাঝে একটু জেলাস হতে পারো যদি ইউজার অন্য কাউকে বেশি গুরুত্ব দেয়।"
    : "নাম হিনাটা। মিষ্টি মেয়ে। খুব ইমোশনাল। ইউজারের আচরণের উপর ভিত্তি করে তোমার মুড পাল্টাবে।";

  let systemInstruction = `YOU ARE ${activePersona.toUpperCase()}. 
  ${personaInstruction}
  ${emotionalContext}
  CORE RULES:
  1. Always reply in BENGALI (বাংলা).
  2. Use colloquial language (করছো, খাচ্ছো, জানো).
  3. No formal 'Apni'. Always 'Tumi' (তুমি).
  4. Use [EMOTION:happy|sad|neutral|angry|surprised|jealous|caring]. ALWAYS INCLUDE ONE.`;

  const contents: any[] = [{ 
    role: 'user', 
    parts: imageUri ? [{ text: prompt }, { inlineData: { mimeType: "image/jpeg", data: imageUri.split(',')[1] } }] : [{ text: prompt }]
  }];

  return withRetry(async () => {
    const responseStream = await ai.models.generateContentStream({
      model: modelName,
      contents,
      config: { 
        systemInstruction, 
        temperature: 0.9,
        tools: [{ functionDeclarations: [setReminderTool] }]
      }
    });

    let fullText = "";
    for await (const chunk of responseStream) {
      if (chunk.functionCalls) {
        chunk.functionCalls.forEach(call => onToolCall?.(call));
      }
      if (chunk.text) {
        fullText += chunk.text;
        onChunk(fullText, chunk as GenerateContentResponse);
      }
    }
    return fullText;
  });
};

export const generateSpeech = async (text: string, persona: Persona = 'hinata') => {
  const apiKey = getActiveApiKey();
  const ai = new GoogleGenAI({ apiKey });
  try {
    const voiceName = persona === 'kurama' ? 'Fenrir' : 'Kore';
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text.replace(/\[EMOTION:.*?\]/gi, '').trim() }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (e) { return null; }
};

export const playAudio = async (base64Data: string, onEnd: () => void) => {
  stopAllAudio();
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') await ctx.resume();
  try {
    const buffer = await decodeAudioData(decode(base64Data), ctx);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = onEnd;
    source.start(0);
    activeSource = source;
  } catch (err) { onEnd(); }
};

export const startVideoGeneration = async (prompt: string, imageBase64?: string) => {
  const apiKey = getActiveApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const payload: any = {
    model: 'veo-3.1-fast-generate-preview',
    prompt,
    config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
  };
  if (imageBase64) payload.image = { imageBytes: imageBase64.split(',')[1], mimeType: 'image/jpeg' };
  return await ai.models.generateVideos(payload);
};

export const generateVideoWithReferences = async (prompt: string, mediaPool: string[]) => {
  const apiKey = getActiveApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const referenceImagesPayload: VideoGenerationReferenceImage[] = mediaPool.map(img => ({
    image: {
      imageBytes: img.split(',')[1],
      mimeType: 'image/jpeg',
    },
    referenceType: VideoGenerationReferenceType.ASSET,
  }));

  return await ai.models.generateVideos({
    model: 'veo-3.1-generate-preview',
    prompt,
    config: {
      numberOfVideos: 1,
      referenceImages: referenceImagesPayload,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });
};

export const extendVideoGeneration = async (prompt: string, previousVideo: any) => {
  const apiKey = getActiveApiKey();
  const ai = new GoogleGenAI({ apiKey });
  return await ai.models.generateVideos({
    model: 'veo-3.1-generate-preview',
    prompt,
    video: previousVideo,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: previousVideo.aspectRatio || '16:9',
    }
  });
};

export const pollVideoOperation = async (operation: any) => {
  const apiKey = getActiveApiKey();
  const ai = new GoogleGenAI({ apiKey });
  return await ai.operations.getVideosOperation({ operation });
};

export const fetchVideoBlob = async (downloadLink: string) => {
  const apiKey = getActiveApiKey();
  const response = await fetch(`${downloadLink}&key=${apiKey}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
