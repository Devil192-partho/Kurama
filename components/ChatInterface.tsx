
import React, { useRef, useEffect, useState } from 'react';
import { Message, HinataMood, MicrosoftTool, ImageGenOptions, AIModel, Persona } from '../types';
import { generateExcel, generateWord, generatePPT, generatePDF } from '../services/FileService';

interface ChatInterfaceProps {
  messages: Message[];
  inputValue: string;
  setInputValue: (val: string) => void;
  onSend: (isVoice: boolean) => void;
  onReplay: (text: string) => void;
  isThinking: boolean;
  isGlobalVoiceOn: boolean;
  setIsGlobalVoiceOn: (val: boolean) => void;
  isCodeMode: boolean;
  setIsCodeMode: (val: boolean) => void;
  isStrictCodeMode: boolean;
  setIsStrictCodeMode: (val: boolean) => void;
  isConnected: boolean;
  mood: HinataMood;
  setMood: (mood: HinataMood) => void;
  msTool: MicrosoftTool;
  setMsTool: (tool: MicrosoftTool) => void;
  groundingMetadata: any;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  pendingImage: string | null;
  setPendingImage: (val: string | null) => void;
  onVoiceInput: () => void;
  isListening: boolean;
  imageGenOptions: ImageGenOptions;
  setImageGenOptions: (opts: ImageGenOptions) => void;
  onOpenEditor?: () => void;
  onUpgradeKey?: () => void;
  activeModel: AIModel;
  setActiveModel: (model: AIModel) => void;
  activePersona: Persona;
  setActivePersona: (p: Persona) => void;
  onRunCode: (code: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, inputValue, setInputValue, onSend, onReplay, isThinking, 
  isGlobalVoiceOn, setIsGlobalVoiceOn, isCodeMode, setIsCodeMode, 
  isStrictCodeMode, setIsStrictCodeMode,
  isConnected, mood, setMood, msTool, setMsTool, groundingMetadata,
  onImageUpload, pendingImage, setPendingImage, onVoiceInput, isListening,
  imageGenOptions, setImageGenOptions, onOpenEditor, onUpgradeKey,
  activeModel, setActiveModel, activePersona, setActivePersona,
  onRunCode
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [saveAsModal, setSaveAsModal] = useState<{ show: boolean, config: any | null }>({ show: false, config: null });
  const [customFileName, setCustomFileName] = useState('');
  const [hasPersonalKey, setHasPersonalKey] = useState(false);

  const coreMoods: HinataMood[] = ['soft', 'friend', 'normal', 'strict'];

  useEffect(() => {
    const checkKey = async () => {
      if ((window as any).aistudio?.hasSelectedApiKey) {
        const has = await (window as any).aistudio.hasSelectedApiKey();
        setHasPersonalKey(has);
      }
    };
    checkKey();
    const interval = setInterval(checkKey, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isThinking]);

  const handleFinalDownload = () => {
    if (!saveAsModal.config) return;
    const { type, data, images } = saveAsModal.config;
    const extension = type === 'excel' ? '.xlsx' : type === 'word' ? '.docx' : type === 'ppt' ? '.pptx' : '.pdf';
    const finalName = customFileName.endsWith(extension) ? customFileName : customFileName + extension;
    try {
      if (type === 'excel') generateExcel(data, finalName);
      if (type === 'word') generateWord(saveAsModal.config.title || "Document", data, finalName);
      if (type === 'ppt') generatePPT(data, finalName);
      if (type === 'pdf') generatePDF(images || data, finalName);
      setSaveAsModal({ show: false, config: null });
    } catch (e) { alert("Error generating file."); }
  };

  const renderMessageContent = (msg: Message) => {
    const fileJsonRegex = /^\s*\{\s*"type":\s*"(excel|word|ppt|pdf)"[\s\S]*\}\s*$/;
    if (fileJsonRegex.test(msg.text.trim())) {
      try {
        const config = JSON.parse(msg.text.trim());
        const icons = { excel: 'fa-file-excel text-emerald-500', word: 'fa-file-word text-blue-500', ppt: 'fa-file-powerpoint text-orange-500', pdf: 'fa-file-pdf text-red-500' };
        return (
          <div className="p-6 rounded-3xl border-2 border-indigo-500/30 bg-indigo-500/5 flex flex-col gap-4 min-w-[280px]">
            <div className="flex items-center gap-4">
              <i className={`fa-solid ${icons[config.type as keyof typeof icons]} text-2xl`}></i>
              <div>
                <p className="text-[10px] orbitron font-black text-slate-500 uppercase tracking-widest">{config.type} Project</p>
                <h4 className="text-sm font-black text-white">{config.title || "Untitled"}</h4>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setSaveAsModal({ show: true, config }); setCustomFileName(config.title || "Project"); }} className="flex-1 py-3 rounded-xl bg-indigo-600 text-white orbitron text-[9px] font-black transition-all">SAVE</button>
              <button onClick={() => onRunCode(msg.text)} className="flex-1 py-3 rounded-xl bg-slate-800 text-white orbitron text-[9px] font-black transition-all border border-white/5">PREVIEW</button>
            </div>
          </div>
        );
      } catch (e) { return <div>{msg.text}</div>; }
    }

    const codeMatch = msg.text.match(/```(?:html|javascript|js)?([\s\S]*?)```/i);
    if (codeMatch && codeMatch[1]) {
      return (
        <div className="space-y-3">
          <div className="whitespace-pre-wrap">{msg.text.replace(/```[\s\S]*?```/g, '[Code Content Below]')}</div>
          <div className="p-4 bg-black/40 rounded-2xl border border-white/10 flex items-center justify-between">
            <span className="text-[10px] orbitron font-bold text-slate-500 tracking-widest uppercase">Source_Code_Detected</span>
            <button onClick={() => onRunCode(codeMatch[1])} className="px-5 py-2 rounded-xl bg-emerald-600 text-white orbitron text-[9px] font-black shadow-lg shadow-emerald-900/20 hover:scale-105 transition-all">RUN_CODE</button>
          </div>
        </div>
      );
    }

    return <div className="whitespace-pre-wrap">{msg.text}</div>;
  };

  const toolsList = [
    { id: 'none', label: 'Chat', icon: 'fa-message', color: 'bg-slate-800', category: 'Core' },
    { id: 'video', label: 'Video Studio', icon: 'fa-film', color: 'bg-red-600', category: 'Creative' },
    { id: 'photo', label: 'Photo Editor', icon: 'fa-camera-retro', color: 'bg-emerald-600', category: 'Creative' },
    { id: 'image_gen', label: 'Image AI', icon: 'fa-wand-magic-sparkles', color: 'bg-purple-600', category: 'Creative' },
    { id: 'excel', label: 'Excel Core', icon: 'fa-file-excel', color: 'bg-green-600', category: 'Office' },
    { id: 'word', label: 'Word Core', icon: 'fa-file-word', color: 'bg-blue-600', category: 'Office' },
    { id: 'pdf', label: 'PDF Suite', icon: 'fa-file-pdf', color: 'bg-red-500', category: 'Office' },
    { id: 'ppt', label: 'PowerPoint', icon: 'fa-file-powerpoint', color: 'bg-orange-600', category: 'Office' },
  ];

  const activeSliderMood = mood === 'girlfriend' || mood === 'boyfriend' ? 'soft' : mood;
  const sliderIndex = coreMoods.indexOf(activeSliderMood);

  return (
    <div className={`flex flex-col h-full rounded-[3.5rem] border overflow-hidden transition-all duration-1000 backdrop-blur-3xl shadow-2xl bg-slate-900/40 border-slate-800/60`}>
      {saveAsModal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-indigo-500/30 rounded-[2.5rem] p-8">
            <h3 className="orbitron text-lg font-black text-white mb-2 uppercase">File_Save</h3>
            <input type="text" value={customFileName} onChange={(e) => setCustomFileName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white outline-none mb-6" />
            <div className="flex gap-3">
              <button onClick={() => setSaveAsModal({ show: false, config: null })} className="flex-1 py-4 rounded-2xl bg-slate-800 text-slate-400 orbitron text-[10px] font-black uppercase">Cancel</button>
              <button onClick={handleFinalDownload} className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white orbitron text-[10px] font-black uppercase">Download</button>
            </div>
          </div>
        </div>
      )}

      <div className="p-8 border-b border-slate-800/50 bg-slate-900/60 relative">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-5">
             <button onClick={() => setIsGlobalVoiceOn(!isGlobalVoiceOn)} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isGlobalVoiceOn ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}>
               <i className={`fa-solid ${isGlobalVoiceOn ? 'fa-microphone' : 'fa-microphone-slash'} text-xl`}></i>
             </button>
             <button onClick={() => setShowToolsMenu(!showToolsMenu)} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${showToolsMenu ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500'}`}>
                <i className={`fa-solid ${showToolsMenu ? 'fa-xmark' : 'fa-layer-group'} text-xl`}></i>
             </button>
             
             {showToolsMenu && (
               <div className="absolute top-24 left-10 z-[100] bg-slate-950 border border-slate-800 rounded-[2.5rem] p-6 shadow-2xl w-[380px] animate-in zoom-in-95 backdrop-blur-3xl overflow-y-auto max-h-[70vh] custom-scrollbar">
                  <div className="space-y-6">
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 mb-2">
                      <div className="text-[9px] orbitron font-bold text-indigo-400 uppercase mb-3 flex justify-between items-center">
                        <span>API_AUTH_PROTOCOL</span>
                        {hasPersonalKey ? <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[7px]">PERSONAL_CONNECTED</span> : <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-[7px]">SYSTEM_DEFAULT</span>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => onUpgradeKey?.()} className={`flex-1 p-3 rounded-xl text-[9px] orbitron font-black flex items-center justify-center gap-2 border transition-all ${hasPersonalKey ? 'bg-slate-800 border-white/5 text-slate-400' : 'bg-indigo-600 border-indigo-400 text-white'}`}>
                          <i className="fa-solid fa-user-plus"></i> {hasPersonalKey ? 'UPDATE_KEY' : 'ADD_OWN_KEY'}
                        </button>
                        <button className="p-3 w-12 rounded-xl bg-slate-900 border border-white/5 text-slate-500 hover:text-white" title="View Key Docs" onClick={() => window.open('https://ai.google.dev/gemini-api/docs/billing', '_blank')}>
                          <i className="fa-solid fa-circle-info"></i>
                        </button>
                      </div>
                      <p className="text-[7px] text-slate-500 mt-2 italic px-1">For Excel, Word, and Studio tools, using your own API key is recommended for higher quality.</p>
                    </div>

                    <div>
                      <div className="text-[9px] orbitron font-bold text-slate-600 uppercase mb-3 px-2">SYSTEM_CORE</div>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setIsCodeMode(!isCodeMode)} className={`p-4 rounded-2xl text-[10px] orbitron font-black flex flex-col gap-1 transition-all border ${isCodeMode ? 'bg-amber-600 border-amber-400 text-white' : 'bg-slate-900 border-white/5 text-slate-400'}`}>
                          <i className="fa-solid fa-code mb-1"></i> {isCodeMode ? 'CODE_ON' : 'CODE_OFF'}
                        </button>
                        <button onClick={() => setIsStrictCodeMode(!isStrictCodeMode)} className={`p-4 rounded-2xl text-[10px] orbitron font-black flex flex-col gap-1 transition-all border ${isStrictCodeMode ? 'bg-orange-600 border-orange-400 text-white' : 'bg-slate-900 border-white/5 text-slate-400'}`}>
                          <i className="fa-solid fa-brain mb-1"></i> {isStrictCodeMode ? 'PRO_BRAIN' : 'FLASH_BRAIN'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] orbitron font-bold text-slate-600 uppercase mb-3 px-2">STUDIO_TOOLS</div>
                      <div className="grid grid-cols-3 gap-2">
                        {toolsList.filter(t => t.category === 'Creative').map(tool => (
                          <button key={tool.id} onClick={() => {setMsTool(tool.id as MicrosoftTool); setShowToolsMenu(false); if(tool.id === 'photo') onOpenEditor?.(); if(tool.id === 'video') setMsTool('video');}} className={`p-3 rounded-2xl text-[8px] orbitron font-black flex flex-col items-center gap-2 transition-all border ${msTool === tool.id ? `${tool.color} text-white` : 'bg-slate-900 border-white/5 text-slate-500 hover:bg-slate-800'}`}>
                            <i className={`fa-solid ${tool.icon} text-lg`}></i>
                            <span className="text-center">{tool.label.split(' ')[0]}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] orbitron font-bold text-slate-600 uppercase mb-3 px-2">OFFICE_SUITE</div>
                      <div className="grid grid-cols-4 gap-2">
                        {toolsList.filter(t => t.category === 'Office').map(tool => (
                          <button key={tool.id} onClick={() => {setMsTool(tool.id as MicrosoftTool); setShowToolsMenu(false)}} className={`p-3 rounded-2xl text-[8px] orbitron font-black flex flex-col items-center gap-2 transition-all border ${msTool === tool.id ? `${tool.color} text-white` : 'bg-slate-900 border-white/5 text-slate-500 hover:bg-slate-800'}`}>
                            <i className={`fa-solid ${tool.icon} text-lg`}></i>
                            <span className="text-center">{tool.label.split(' ')[0]}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <button onClick={() => {setMsTool('none'); setIsCodeMode(false); setShowToolsMenu(false)}} className="w-full p-4 bg-slate-800 rounded-2xl text-[10px] orbitron font-black text-slate-400 hover:bg-slate-700 transition-all uppercase">Reset Studio</button>
                  </div>
               </div>
             )}

             <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-white/5 shadow-inner">
                <button 
                  onClick={() => setActivePersona('hinata')} 
                  className={`px-5 py-2.5 rounded-xl text-[10px] orbitron font-black transition-all flex items-center gap-2 ${activePersona === 'hinata' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <i className="fa-solid fa-sparkles"></i> HINATA
                </button>
                <button 
                  onClick={() => setActivePersona('kurama')} 
                  className={`px-5 py-2.5 rounded-xl text-[10px] orbitron font-black transition-all flex items-center gap-2 ${activePersona === 'kurama' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <i className="fa-solid fa-fire"></i> KURAMA
                </button>
             </div>
          </div>
          <div className="flex flex-col items-end gap-3">
             <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                   <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                      <span className="text-[10px] orbitron font-black text-white tracking-widest uppercase">{activePersona}_V3.5</span>
                   </div>
                   <div className="text-[9px] text-slate-500 orbitron uppercase font-bold">{msTool !== 'none' ? `${msTool.toUpperCase()}_ENGINE` : 'CORE_ACTIVE'}</div>
                </div>
             </div>
          </div>
        </div>

        <div className="bg-slate-950/40 p-5 rounded-3xl border border-white/5 space-y-3 relative overflow-visible">
           {activeSliderMood === 'soft' && (
             <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex gap-3 p-2 bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-2 z-[70]">
               <button onClick={() => setMood('girlfriend')} className={`px-4 py-2 rounded-xl text-[9px] orbitron font-black transition-all flex items-center gap-2 ${mood === 'girlfriend' ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/30' : 'bg-slate-950 text-slate-500 hover:text-rose-400'}`}>
                 <i className="fa-solid fa-heart"></i> GF_MODE
               </button>
               <button onClick={() => setMood('boyfriend')} className={`px-4 py-2 rounded-xl text-[9px] orbitron font-black transition-all flex items-center gap-2 ${mood === 'boyfriend' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30' : 'bg-slate-950 text-slate-500 hover:text-indigo-400'}`}>
                 <i className="fa-solid fa-shield-heart"></i> BF_MODE
               </button>
               <button onClick={() => setMood('soft')} className={`px-4 py-2 rounded-xl text-[9px] orbitron font-black transition-all flex items-center gap-2 ${mood === 'soft' ? 'bg-sky-600 text-white' : 'bg-slate-950 text-slate-500 hover:text-sky-400'}`}>
                 REGULAR
               </button>
             </div>
           )}

           <div className="flex justify-between text-[9px] orbitron font-bold text-slate-500 uppercase px-2">
             <span className={activeSliderMood === 'soft' ? 'text-indigo-400' : 'text-slate-600'}>SOFT</span>
             <span className={activeSliderMood === 'friend' ? 'text-teal-400' : 'text-slate-600'}>FRIEND</span>
             <span className={activeSliderMood === 'normal' ? 'text-white' : 'text-slate-600'}>NORMAL</span>
             <span className={activeSliderMood === 'strict' ? 'text-slate-400' : 'text-slate-600'}>STRICT</span>
           </div>
           <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden">
             <div className={`absolute h-full transition-all duration-500 ${activePersona === 'kurama' ? 'bg-orange-600 shadow-[0_0_10px_#ea580c]' : 'bg-indigo-600 shadow-[0_0_10px_#4f46e5]'}`} style={{ width: `${(sliderIndex / (coreMoods.length - 1)) * 100}%` }}></div>
             <input type="range" min="0" max={coreMoods.length - 1} step="1" value={sliderIndex} onChange={(e) => {
               setMood(coreMoods[parseInt(e.target.value)]);
             }} className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer" />
           </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-black/10">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`relative group max-w-[90%] p-6 rounded-[2.5rem] shadow-xl ${msg.role === 'user' ? (activePersona === 'kurama' ? 'bg-orange-700 shadow-orange-900/10' : 'bg-indigo-600 shadow-indigo-900/10') + ' text-white rounded-br-none' : 'bg-slate-800/90 text-slate-100 rounded-bl-none border border-slate-700/50'}`}>
              {msg.imageUrl && <img src={msg.imageUrl} className="rounded-2xl mb-3 max-h-60 object-cover border border-white/10" alt="" />}
              {renderMessageContent(msg)}
              {msg.role === 'ai' && (
                <button onClick={() => isGlobalVoiceOn && onReplay(msg.text)} className={`flex items-center gap-2 mt-3 text-[9px] orbitron font-black uppercase tracking-widest transition-all ${activePersona === 'kurama' ? 'text-orange-400 hover:text-orange-300' : 'text-indigo-400 hover:text-indigo-300'}`}><i className="fa-solid fa-volume-high"></i> Play_Vocal</button>
              )}
            </div>
          </div>
        ))}
        {isThinking && <div className="flex justify-start gap-4 ml-4 items-center animate-in fade-in"><div className={`w-8 h-8 border-4 rounded-full animate-spin ${activePersona === 'kurama' ? 'border-orange-500/20 border-t-orange-500' : 'border-indigo-500/20 border-t-indigo-500'}`}></div><span className={`text-[9px] orbitron tracking-widest uppercase ${activePersona === 'kurama' ? 'text-orange-400' : 'text-indigo-400'}`}>{activePersona}_thinking...</span></div>}
      </div>

      <div className="p-8 bg-slate-950/95 border-t border-slate-800/50">
        <div className="flex gap-4 items-center max-w-5xl mx-auto">
          <label className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-all border border-white/5 active:scale-90"><i className="fa-solid fa-camera text-slate-500 text-xl"></i><input type="file" accept="image/*" onChange={onImageUpload} className="hidden" /></label>
          <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && isConnected && onSend(false)} disabled={!isConnected} placeholder={isListening ? "Listening..." : `Message ${activePersona.toUpperCase()}...`} className="flex-1 bg-slate-900/50 border border-slate-800/40 rounded-3xl px-8 py-5 text-white outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all" />
          <button onClick={onVoiceInput} disabled={!isConnected || isThinking} className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${isListening ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30' : 'bg-slate-800 text-indigo-400 hover:bg-slate-700'}`}><i className="fa-solid fa-microphone text-xl"></i></button>
          <button onClick={() => onSend(false)} disabled={!isConnected || (!inputValue.trim() && !pendingImage) || isThinking} className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white transition-all shadow-xl active:scale-90 ${activePersona === 'kurama' ? 'bg-orange-600 hover:bg-orange-500 shadow-orange-900/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20'}`}><i className="fa-solid fa-paper-plane text-xl"></i></button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
