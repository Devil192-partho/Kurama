
import React, { useState } from 'react';
import { SliderType } from '../types';

interface BottomSlidersProps {
  activeSlider: SliderType;
  onClose: () => void;
}

const BottomSliders: React.FC<BottomSlidersProps> = ({ activeSlider }) => {
  const [alarmTime, setAlarmTime] = useState('08:00');

  return (
    <>
      {/* AI TOOLS SLIDER (PHOTO/VIDEO) */}
      <div className={`fixed bottom-0 left-0 w-full h-[70vh] glass z-[150] transition-transform duration-500 border-t border-white/10 p-12 rounded-t-[50px] ${
        activeSlider === SliderType.TOOLS ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="w-20 h-1.5 bg-white/10 rounded-full mx-auto mb-10"></div>
        <h2 className="text-4xl font-black mb-12 flex items-center gap-4">🛠️ AI MULTIMEDIA ENGINE</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
           {[
             { label: 'Video Edit Assist', icon: '🎬', desc: 'Timeline & Effects' },
             { label: 'Photo Enhance', icon: '✨', desc: 'Upscale to 4K' },
             { label: 'Image to PDF', icon: '📑', desc: 'Batch Convert' },
             { label: 'OCR Scanner', icon: '🔍', desc: 'Copy Text from Image' },
             { label: 'Clean Photo', icon: '🧼', desc: 'AI Object Removal' },
             { label: 'Search Image', icon: '🖼️', desc: 'Reverse Search' },
             { label: 'Download Any', icon: '📥', desc: 'Media Extractor' },
             { label: 'Generate Art', icon: '🎨', desc: 'DALL-E Integration' }
           ].map(tool => (
             <button key={tool.label} className="p-8 glass rounded-[35px] hover:bg-blue-600/20 border-white/5 transition-all flex flex-col items-center text-center">
                <span className="text-4xl mb-4">{tool.icon}</span>
                <h4 className="font-bold text-sm leading-none">{tool.label}</h4>
                <p className="text-[10px] opacity-40 mt-2 uppercase tracking-tighter">{tool.desc}</p>
             </button>
           ))}
        </div>
      </div>

      {/* ALARM & TIMER SLIDER */}
      <div className={`fixed bottom-0 left-0 w-full h-[50vh] glass z-[150] transition-transform duration-500 border-t border-white/10 p-12 rounded-t-[50px] ${
        activeSlider === SliderType.ALARM ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="w-20 h-1.5 bg-white/10 rounded-full mx-auto mb-10"></div>
        <div className="flex flex-col md:flex-row items-center gap-12">
           <div className="flex-1 text-center">
              <h2 className="text-3xl font-black mb-6">SET ALARM</h2>
              <input 
                type="time" 
                value={alarmTime}
                onChange={(e) => setAlarmTime(e.target.value)}
                className="text-6xl font-black bg-transparent border-none focus:ring-0 text-blue-400 text-center"
              />
              <div className="mt-8 flex gap-4 justify-center">
                <button className="px-10 py-4 bg-blue-600 rounded-full font-bold shadow-2xl">SET NOW</button>
                <button className="px-10 py-4 glass rounded-full font-bold">RINGTONE</button>
              </div>
           </div>
           <div className="w-full md:w-1/3 p-8 glass rounded-[40px] border-white/10">
              <h3 className="text-xs font-bold opacity-40 uppercase mb-4">Upcoming Timers</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                   <span>Morning Wake</span>
                   <span className="text-blue-400 font-bold">07:00 AM</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                   <span>Deep Work</span>
                   <span className="text-blue-400 font-bold">45:00 Mins</span>
                </div>
              </div>
           </div>
        </div>
      </div>
    </>
  );
};

export default BottomSliders;
