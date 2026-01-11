
import React from 'react';
import { Camera, Image, FileText, Download, ShieldCheck, Zap, Wand2, FileDigit, FileOutput } from 'lucide-react';

interface ToolsOverlayProps {
  onClose: () => void;
}

const ToolsOverlay: React.FC<ToolsOverlayProps> = ({ onClose }) => {
  const tools = [
    { name: 'Photo Enhance (Low to High)', icon: Wand2, color: 'text-yellow-400' },
    { name: 'CamScanner Pro', icon: Camera, color: 'text-blue-400' },
    { name: 'OCR (Copy Text from Image)', icon: FileDigit, color: 'text-green-400' },
    { name: 'Image to PDF Maker', icon: FileOutput, color: 'text-purple-400' },
    { name: 'App Bio-Lock', icon: ShieldCheck, color: 'text-red-400' },
    { name: 'Export Project Files', icon: Download, color: 'text-zinc-400' },
  ];

  return (
    <div className="fixed inset-0 bg-black/98 z-50 flex flex-col p-8 backdrop-blur-3xl animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-12">
        <h2 className="text-3xl font-orbitron text-white">SYSTEM UTILITIES</h2>
        <button onClick={onClose} className="px-6 py-2 bg-white/5 rounded-xl text-zinc-500 hover:text-white border border-white/10 transition-all">Close Console</button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
        {tools.map((tool) => (
          <div 
            key={tool.name} 
            className="bg-zinc-900/50 border border-white/5 p-8 rounded-[2.5rem] flex flex-col items-center gap-4 hover:bg-zinc-800/80 hover:border-white/20 transition-all group cursor-pointer"
          >
            <div className="p-5 bg-black/40 rounded-3xl group-hover:scale-110 transition-transform shadow-2xl">
                <tool.icon className={`w-10 h-10 ${tool.color}`} />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-center">{tool.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToolsOverlay;
