
import React from 'react';
import { SliderType, PersonaMode } from '../types';

interface SidebarSlidersProps {
  activeSlider: SliderType;
  persona: PersonaMode;
  setPersona: (p: PersonaMode) => void;
  onClose: () => void;
}

const SidebarSliders: React.FC<SidebarSlidersProps> = ({ activeSlider, persona, setPersona, onClose }) => {
  return (
    <>
      {/* PERSONA SLIDER */}
      <div className={`fixed top-0 right-0 h-full w-full md:w-[450px] glass z-[150] transition-transform duration-500 border-l border-white/10 p-10 flex flex-col ${
        activeSlider === SliderType.PERSONA ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <h2 className="text-3xl font-black mb-10 flex items-center gap-4">🎭 PERSONA MODES</h2>
        <div className="space-y-4">
          {[
            { id: 'GF', label: 'AI Girlfriend', desc: 'Emotional, caring, and slightly jealous. 💕', icon: '👩‍❤️‍👨' },
            { id: 'FRIEND', label: 'Best Friend', desc: 'Chill, funny, and casual talk. 🤜🤛', icon: '🤝' },
            { id: 'NORMAL', label: 'AI Assistant', desc: 'Standard, polite, and helpful. 🤖', icon: '⚖️' },
            { id: 'STRICT', label: 'Professional Strict', desc: 'High intelligence, direct, and senior. 👔', icon: '👨‍💼' }
          ].map(m => (
            <button 
              key={m.id}
              onClick={() => setPersona(m.id as PersonaMode)}
              className={`w-full p-6 rounded-3xl text-left border transition-all ${
                persona === m.id ? 'bg-blue-600 border-blue-400 shadow-xl' : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">{m.icon}</span>
                <div>
                  <h4 className="font-bold text-lg">{m.label}</h4>
                  <p className="text-xs opacity-60">{m.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* MICROSOFT OFFICE PRO SLIDER */}
      <div className={`fixed top-0 left-0 h-full w-full md:w-[500px] glass z-[150] transition-transform duration-500 border-r border-white/10 p-10 flex flex-col ${
        activeSlider === SliderType.MICROSOFT ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <h2 className="text-3xl font-black mb-8 flex items-center gap-4">🏢 MICROSOFT SUITE</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { name: 'EXCEL', icon: '📊', color: 'bg-green-600', desc: 'Data & Analysis' },
            { name: 'WORD', icon: '📝', color: 'bg-blue-600', desc: 'Advanced Writing' },
            { name: 'PPT', icon: '📽️', color: 'bg-orange-600', desc: 'Visual Slides' },
            { name: 'OTHER', icon: '🌐', color: 'bg-purple-600', desc: 'Outlook & Access' }
          ].map(tool => (
            <button key={tool.name} className="p-8 glass rounded-[32px] border-white/5 hover:border-white/20 transition-all text-center group">
               <div className={`w-16 h-16 ${tool.color} rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl shadow-2xl group-hover:scale-110 transition-all`}>{tool.icon}</div>
               <h4 className="font-black text-sm">{tool.name}</h4>
               <p className="text-[10px] opacity-40 mt-1 uppercase tracking-widest">{tool.desc}</p>
            </button>
          ))}
        </div>
        <div className="mt-10 p-6 bg-white/5 rounded-3xl border border-white/10">
            <h4 className="text-xs font-bold uppercase mb-4 opacity-40">Recent Generated Files</h4>
            <div className="space-y-3">
               <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl text-xs">
                  <span>Q4_Financial_Report.xlsx</span>
                  <button className="text-blue-400 font-bold">DOWNLOAD</button>
               </div>
               <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl text-xs">
                  <span>Presentation_Final_Draft.pptx</span>
                  <button className="text-blue-400 font-bold">DOWNLOAD</button>
               </div>
            </div>
        </div>
      </div>
    </>
  );
};

export default SidebarSliders;
