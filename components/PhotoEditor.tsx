
import React from 'react';
import { PhotoEditSettings } from '../types';

interface PhotoEditorProps {
  imageUrl: string;
  settings: PhotoEditSettings;
  onSettingsChange: (settings: PhotoEditSettings) => void;
  onClose: () => void;
  onApply: () => void;
  onAiSuggest: () => void;
}

const PhotoEditor: React.FC<PhotoEditorProps> = ({ 
  imageUrl, settings, onSettingsChange, onClose, onApply, onAiSuggest 
}) => {
  const update = (key: keyof PhotoEditSettings, val: number) => {
    onSettingsChange({ ...settings, [key]: val });
  };

  const filters = `
    brightness(${settings.brightness}%)
    contrast(${settings.contrast}%)
    saturate(${settings.saturation}%)
    sepia(${settings.sepia}%)
    grayscale(${settings.grayscale}%)
    hue-rotate(${settings.hueRotate}deg)
    blur(${settings.blur}px)
  `;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-2xl flex flex-col items-center justify-center p-4 lg:p-10">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
        
        {/* Preview Area */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center bg-slate-900/50 rounded-[3rem] border border-white/10 overflow-hidden relative">
          <img 
            src={imageUrl} 
            alt="Preview" 
            className="max-w-full max-h-full object-contain transition-all duration-300"
            style={{ filter: filters }}
          />
          <div className="absolute top-6 left-6 flex gap-3">
             <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-slate-950/80 text-white flex items-center justify-center hover:bg-red-600 transition-all">
                <i className="fa-solid fa-xmark"></i>
             </button>
          </div>
          <div className="absolute bottom-6 flex gap-4">
             <button onClick={onAiSuggest} className="px-6 py-3 rounded-2xl bg-indigo-600 text-white orbitron text-[10px] font-black tracking-widest flex items-center gap-3 shadow-xl hover:scale-105 transition-all">
                <i className="fa-solid fa-wand-magic-sparkles"></i>
                ASK HINATA FOR SUGGESTIONS
             </button>
             <button onClick={onApply} className="px-8 py-3 rounded-2xl bg-emerald-600 text-white orbitron text-[10px] font-black tracking-widest flex items-center gap-3 shadow-xl hover:scale-105 transition-all">
                <i className="fa-solid fa-check"></i>
                APPLY CHANGES
             </button>
          </div>
        </div>

        {/* Controls Area */}
        <div className="lg:col-span-4 bg-slate-900 border border-white/10 rounded-[3rem] p-8 overflow-y-auto custom-scrollbar">
           <h2 className="orbitron text-xl font-black text-white mb-8 tracking-tighter">PHOTO_LAB_v1</h2>
           
           <div className="space-y-8">
              <Control label="Brightness" value={settings.brightness} min={0} max={200} onChange={v => update('brightness', v)} />
              <Control label="Contrast" value={settings.contrast} min={0} max={200} onChange={v => update('contrast', v)} />
              <Control label="Saturation" value={settings.saturation} min={0} max={200} onChange={v => update('saturation', v)} />
              <Control label="Sepia" value={settings.sepia} min={0} max={100} onChange={v => update('sepia', v)} />
              <Control label="Grayscale" value={settings.grayscale} min={0} max={100} onChange={v => update('grayscale', v)} />
              <Control label="Hue Rotate" value={settings.hueRotate} min={0} max={360} unit="°" onChange={v => update('hueRotate', v)} />
              <Control label="Blur" value={settings.blur} min={0} max={20} unit="px" onChange={v => update('blur', v)} />

              <div className="pt-6 border-t border-white/5">
                 <label className="text-[10px] orbitron font-black text-slate-500 mb-4 block uppercase tracking-widest">Quick Filters</label>
                 <div className="grid grid-cols-2 gap-3">
                    <FilterBtn label="Natural" onClick={() => onSettingsChange(defaultSettings)} />
                    <FilterBtn label="Dramatic" onClick={() => onSettingsChange({...defaultSettings, contrast: 150, brightness: 90, saturation: 130})} />
                    <FilterBtn label="Vintage" onClick={() => onSettingsChange({...defaultSettings, sepia: 50, contrast: 90})} />
                    <FilterBtn label="Noir" onClick={() => onSettingsChange({...defaultSettings, grayscale: 100, contrast: 140})} />
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const defaultSettings: PhotoEditSettings = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  sepia: 0,
  grayscale: 0,
  hueRotate: 0,
  blur: 0
};

const Control = ({ label, value, min, max, onChange, unit = "%" }: any) => (
  <div className="space-y-3">
    <div className="flex justify-between items-center px-1">
      <span className="text-[10px] orbitron font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <span className="text-[10px] orbitron font-black text-indigo-400">{value}{unit}</span>
    </div>
    <div className="relative h-1.5 bg-slate-800 rounded-full">
      <input 
        type="range" min={min} max={max} value={value} 
        onChange={e => onChange(parseInt(e.target.value))} 
        className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
      />
      <div className="absolute h-full bg-indigo-500 rounded-full" style={{ width: `${((value - min) / (max - min)) * 100}%` }}></div>
    </div>
  </div>
);

const FilterBtn = ({ label, onClick }: any) => (
  <button 
    onClick={onClick}
    className="px-4 py-3 rounded-xl bg-slate-800 border border-white/5 text-[10px] orbitron font-black text-slate-300 hover:bg-slate-700 hover:border-indigo-500/50 transition-all uppercase tracking-widest"
  >
    {label}
  </button>
);

export default PhotoEditor;
