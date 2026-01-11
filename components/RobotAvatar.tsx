
import React from 'react';

interface RobotAvatarProps {
  emotion: 'calm' | 'serious' | 'happy' | 'jealous' | 'strict';
  isListening: boolean; // Also represents isSpeaking in the parent state
}

const RobotAvatar: React.FC<RobotAvatarProps> = ({ emotion, isListening }) => {
  return (
    <div className="relative w-80 h-80 flex items-center justify-center">
      {/* Background Glows */}
      <div className={`absolute inset-0 rounded-full blur-[80px] transition-all duration-1000 ${
        isListening ? 'bg-cyan-500/40' : 
        emotion === 'jealous' ? 'bg-red-500/30' : 
        emotion === 'happy' ? 'bg-pink-500/30' : 'bg-blue-600/20'
      }`}></div>

      {/* Dynamic Wave Container */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Core Eye / Orb */}
        <div className={`w-32 h-32 rounded-full border-2 border-white/20 flex items-center justify-center z-10 transition-all duration-500 ${isListening ? 'scale-90 shadow-[0_0_50px_rgba(255,255,255,0.2)]' : 'scale-100'}`}>
            <div className={`w-12 h-12 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all ${
              isListening ? 'bg-white scale-125' : 'bg-blue-400'
            }`}></div>
        </div>

        {/* Gemini-style Waves - synced with voice activity */}
        <div className={`absolute inset-0 flex items-center justify-center gap-2 pointer-events-none transition-opacity duration-500 ${isListening ? 'opacity-100' : 'opacity-30'}`}>
          {[...Array(7)].map((_, i) => (
            <div 
              key={i} 
              className={`w-1.5 rounded-full transition-all bg-gradient-to-t from-transparent via-blue-400 to-transparent`}
              style={{
                height: isListening ? '90%' : '15%',
                animation: isListening ? `wave ${0.6 + i * 0.15}s ease-in-out infinite alternate` : 'none',
                opacity: 0.3 + (i * 0.1),
                filter: isListening ? 'blur(1px)' : 'none'
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes wave {
          0% { transform: scaleY(0.3); opacity: 0.4; }
          100% { transform: scaleY(1.4); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default RobotAvatar;
