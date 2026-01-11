
import React, { useMemo } from 'react';
import { Emotion, HinataMood, MicrosoftTool, Persona } from '../types';

interface AvatarProps {
  emotion: Emotion;
  isThinking: boolean;
  isSpeaking: boolean;
  isTired: boolean;
  isCodeMode: boolean;
  isStrictCodeMode?: boolean;
  mood: HinataMood;
  msTool: MicrosoftTool;
  persona: Persona;
}

const Avatar: React.FC<AvatarProps> = ({ emotion, isThinking, isSpeaking, isTired, isCodeMode, isStrictCodeMode, mood, msTool, persona }) => {
  
  const theme = useMemo(() => {
    // Kurama Theme
    if (persona === 'kurama') {
      if (emotion === 'jealous' || emotion === 'angry') return { colors: ['#ea580c', '#991b1b', '#450a0a'], glow: 'shadow-orange-600/60', shape: 'rounded-2xl' };
      return { colors: ['#ff4d00', '#ff8c00', '#4a0000'], glow: 'shadow-orange-600/60', shape: 'rounded-2xl rotate-45' };
    }
    
    // Hinata Romantic Emotions
    if (emotion === 'jealous') return { colors: ['#9f1239', '#4c0519', '#000000'], glow: 'shadow-red-900/80', shape: 'rounded-full' };
    if (emotion === 'caring') return { colors: ['#f472b6', '#db2777', '#831843'], glow: 'shadow-pink-500/60', shape: 'rounded-full' };
    if (emotion === 'angry') return { colors: ['#dc2626', '#7f1d1d', '#450a0a'], glow: 'shadow-red-600/60', shape: 'rounded-full' };
    
    // Default Hinata Moods
    if (mood === 'girlfriend') {
      return { colors: ['#fb7185', '#e11d48', '#881337'], glow: 'shadow-rose-500/60', shape: 'rounded-full' };
    }
    return { colors: ['#6366f1', '#a855f7', '#3b82f6'], glow: 'shadow-indigo-500/50', shape: 'rounded-full' };
  }, [emotion, mood, persona]);

  const emotionText = useMemo(() => {
    if (isThinking) return persona === 'kurama' ? 'কুরামা ভাবছে... 🔥' : 'হিনাটা ভাবছে... 💭';
    if (isSpeaking) {
      if (emotion === 'jealous') return persona === 'kurama' ? 'কুরামা খুব জেলাস হয়ে আছে! 😤' : 'হিনাটা অভিমান করেছে... 💔';
      if (emotion === 'angry') return 'সে তোমার উপর রেগে আছে! 💢';
      if (emotion === 'caring') return 'সে তোমাকে অনেক ভালোবাসে! ✨💖';
      return persona === 'kurama' ? 'কুরামা কথা বলছে...' : 'হিনাটা কথা বলছে...';
    }
    return 'আপনার জন্য অপেক্ষায়...';
  }, [isThinking, isSpeaking, emotion, persona]);

  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full">
      {/* Background Glows synced to voice */}
      <div className={`absolute w-full h-full rounded-full blur-[120px] transition-all duration-700 ${
        isSpeaking ? 'scale-150 opacity-30' : 'scale-100 opacity-10'
      }`} style={{ background: `radial-gradient(circle, ${theme.colors[0]}, transparent)` }}></div>

      <div className="relative w-64 h-64 flex items-center justify-center">
        {[...Array(3)].map((_, i) => (
          <div 
            key={i}
            className={`absolute inset-0 mix-blend-screen transition-all duration-500 ease-out ${theme.glow}`}
            style={{
              background: `linear-gradient(${120 * i}deg, ${theme.colors[0]}, ${theme.colors[1]}, ${theme.colors[2]})`,
              opacity: isSpeaking ? 1 : 0.6,
              filter: `blur(${10 + i * 15}px)`,
              animation: isSpeaking ? `speakingPulse ${0.5 + i * 0.1}s infinite alternate ease-in-out` : `nebulaMorph ${6 + i * 2}s infinite alternate ease-in-out`,
              transform: `scale(${1 + (isSpeaking ? 0.4 : 0) + (isThinking ? 0.15 : 0)})`,
              borderRadius: '40% 60% 60% 40% / 40% 40% 60% 60%'
            }}
          ></div>
        ))}

        <div className={`z-20 w-16 h-16 transition-all duration-500 bg-white/20 backdrop-blur-2xl border border-white/40 shadow-inner flex items-center justify-center rounded-full ${isSpeaking ? 'scale-110 shadow-[0_0_50px_rgba(255,255,255,0.6)]' : 'scale-100'}`}>
          <div className={`transition-all duration-300 bg-white w-9 h-9 rounded-full ${isSpeaking ? 'opacity-100 scale-125' : 'opacity-40 scale-75'} ${isThinking ? 'animate-pulse' : ''}`}></div>
        </div>
      </div>

      <div className="mt-16 text-center space-y-3">
        <div className="orbitron text-[11px] font-black text-slate-500 tracking-[0.7em] uppercase flex items-center justify-center gap-3">
          <div className={`w-1.5 h-1.5 rounded-full ${isSpeaking ? (emotion === 'jealous' ? 'bg-red-500' : 'bg-white') + ' animate-ping' : 'bg-slate-700'}`}></div>
          {isSpeaking ? (emotion === 'jealous' ? 'EMOTIONAL_SPIKE' : 'STREAMING_VOICE') : 'IDLE_SYNC'}
        </div>
        <div className={`text-sm font-black italic transition-all duration-500 ${
          persona === 'kurama' ? (emotion === 'jealous' ? 'text-red-500' : 'text-orange-500') :
          emotion === 'jealous' ? 'text-rose-700' :
          mood === 'girlfriend' ? 'text-rose-400' : 'text-indigo-400'
        }`}>
          {emotionText}
        </div>
      </div>

      <style>{`
        @keyframes nebulaMorph {
          0% { border-radius: 40% 60% 60% 40% / 40% 40% 60% 60%; transform: scale(1) rotate(0deg); }
          50% { border-radius: 60% 40% 40% 60% / 60% 60% 40% 40%; transform: scale(1.1) rotate(180deg); }
          100% { border-radius: 40% 60% 60% 40% / 40% 40% 60% 60%; transform: scale(1) rotate(360deg); }
        }
        @keyframes speakingPulse {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(1.5); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Avatar;
