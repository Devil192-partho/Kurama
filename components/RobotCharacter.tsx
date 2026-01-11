
import React, { useEffect, useRef } from 'react';
import { RobotMood } from '../types';

interface RobotCharacterProps {
  mood: RobotMood;
  isSpeaking: boolean;
  isListening?: boolean;
}

const RobotCharacter: React.FC<RobotCharacterProps> = ({ mood, isSpeaking, isListening }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: { x: number; y: number; r: number; color: string; speed: number; angle: number }[] = [];
    
    for(let i = 0; i < 20; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 2 + 1,
            color: 'rgba(255, 255, 255, 0.3)',
            speed: Math.random() * 0.5 + 0.2,
            angle: Math.random() * Math.PI * 2
        });
    }

    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      const moodColor = getBaseColor(mood);
      const bgGradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, 150);
      bgGradient.addColorStop(0, moodColor.replace('1)', '0.15)'));
      bgGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Unique Listening Ripple
      if (isListening) {
         ctx.beginPath();
         ctx.arc(centerX, centerY, 100 + Math.sin(time * 10) * 10, 0, Math.PI * 2);
         ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
         ctx.lineWidth = 2;
         ctx.stroke();
      }

      const layers = isSpeaking ? 4 : (isListening ? 3 : 2);
      for (let l = 0; l < layers; l++) {
        ctx.beginPath();
        const layerOpacity = isSpeaking ? (0.6 - l * 0.1) : (isListening ? 0.4 : 0.3 - l * 0.1);
        ctx.strokeStyle = isListening ? `rgba(239, 68, 68, ${layerOpacity})` : moodColor.replace('1)', `${layerOpacity})`);
        ctx.lineWidth = isSpeaking ? 3 : 1.5;
        
        const layerTime = time * (1 + l * 0.2);
        const baseRadius = 70 + (l * 15);
        const amp = isSpeaking ? (30 + l * 5) : (isListening ? 15 : 8);

        for (let a = 0; a <= Math.PI * 2.1; a += 0.05) {
          const noise = Math.sin(a * 3 + layerTime) * Math.cos(a * 2 - layerTime * 0.5);
          const r = baseRadius + noise * amp;
          const x = centerX + r * Math.cos(a);
          const y = centerY + r * Math.sin(a);
          
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      ctx.beginPath();
      const coreR = isSpeaking ? 8 + Math.sin(time * 5) * 2 : (isListening ? 10 : 6);
      ctx.arc(centerX, centerY, coreR, 0, Math.PI * 2);
      ctx.fillStyle = isListening ? '#ef4444' : '#fff';
      ctx.shadowBlur = isListening ? 30 : 20;
      ctx.shadowColor = isListening ? '#ef4444' : '#fff';
      ctx.fill();
      ctx.shadowBlur = 0;

      time += isSpeaking ? 0.08 : (isListening ? 0.12 : 0.02);
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [mood, isSpeaking, isListening]);

  const getBaseColor = (m: RobotMood) => {
    switch (m) {
      case RobotMood.STRICT: return 'rgba(239, 68, 68, 1)';
      case RobotMood.SOFT: return 'rgba(34, 211, 238, 1)';
      case RobotMood.THINKING: return 'rgba(251, 191, 36, 1)';
      case RobotMood.DANCING: return 'rgba(236, 72, 153, 1)';
      default: return 'rgba(139, 92, 246, 1)';
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center">
      <canvas 
        ref={canvasRef} 
        width={400} 
        height={400} 
        className="w-[350px] h-[350px]"
      />
      <div className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] pointer-events-none">
         <div className={`w-24 h-24 rounded-full border transition-all duration-700 ${isSpeaking || isListening ? 'scale-150 opacity-0 border-red-500' : 'scale-100 opacity-100 border-white/5 bg-white/5 backdrop-blur-sm'}`} />
      </div>
    </div>
  );
};

export default RobotCharacter;
