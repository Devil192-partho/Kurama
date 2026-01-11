
import React from 'react';

interface VoiceButtonProps {
  isActive: boolean;
  onClick: () => void;
  disabled: boolean;
}

const VoiceButton: React.FC<VoiceButtonProps> = ({ isActive, onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative p-8 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95 group shadow-2xl ${
        isActive ? 'bg-red-500 shadow-red-500/50' : 'bg-blue-600 shadow-blue-500/50'
      } ${disabled ? 'opacity-20 grayscale pointer-events-none' : ''}`}
    >
      <div className={`absolute inset-0 rounded-full border-4 border-white/20 transition-all ${isActive ? 'animate-ping' : ''}`}></div>
      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {isActive ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        )}
      </svg>
      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-blue-400 opacity-0 group-hover:opacity-100 uppercase tracking-widest whitespace-nowrap">
        Hold to speak
      </span>
    </button>
  );
};

export default VoiceButton;
