
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  startVideoGeneration, 
  pollVideoOperation, 
  fetchVideoBlob, 
  generateVideoWithReferences,
  extendVideoGeneration 
} from '../services/geminiService';
import { VideoClip, ColorGrading, Keyframe } from '../types';

interface VideoEditorProps {
  onClose: () => void;
  pendingImage: string | null;
}

const Waveform: React.FC<{ seed: string }> = ({ seed }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Pseudo-random but consistent waveform based on seed
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(79, 70, 229, 0.5)';
      ctx.lineWidth = 1;

      const bars = 40;
      const spacing = canvas.width / bars;
      
      let seedNum = 0;
      for (let i = 0; i < seed.length; i++) seedNum += seed.charCodeAt(i);

      for (let i = 0; i < bars; i++) {
        const h = Math.abs(Math.sin(seedNum + i * 0.5) * canvas.height * 0.8);
        const x = i * spacing;
        const y = (canvas.height - h) / 2;
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + h);
      }
      ctx.stroke();
    };

    draw();
  }, [seed]);

  return <canvas ref={canvasRef} width={200} height={40} className="w-full h-full opacity-40" />;
};

const VideoEditor: React.FC<VideoEditorProps> = ({ onClose, pendingImage }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [activeClipId, setActiveClipId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [mediaPool, setMediaPool] = useState<string[]>(pendingImage ? [pendingImage] : []);
  const [lastOperation, setLastOperation] = useState<any>(null);
  const [videoTimeline, setVideoTimeline] = useState<VideoClip[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  // Studio UI States
  const [isRecording, setIsRecording] = useState(false);
  const [showMixer, setShowMixer] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [activeTab, setActiveTab] = useState<'tools' | 'grading' | 'keyframes'>('tools');
  const [bgMusic, setBgMusic] = useState<string | null>(null);
  const [exportSettings, setExportSettings] = useState({ res: '1080p', format: 'mp4' });

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const activeClip = useMemo(() => videoTimeline.find(c => c.id === activeClipId), [videoTimeline, activeClipId]);

  const styleLibrary = [
    { name: "CINEMATIC", prompt: "cinematic lighting, 35mm film, shallow depth of field, high contrast" },
    { name: "DRONE", prompt: "aerial drone view, bird's eye view, wide landscape, sweeping camera motion" },
    { name: "HANDHELD", prompt: "shaky handheld camera, realistic movement, low-angle perspective" },
    { name: "ANIME", prompt: "anime style, vibrant saturated colors, smooth character animation" },
    { name: "TIMELAPSE", prompt: "fast-paced time-lapse, long exposure trails, dramatic clouds" }
  ];

  const reassuringMessages = [
    "হিনাটা আপনার জন্য একটি সুন্দর দৃশ্য কল্পনা করছে...",
    "ফ্রেমগুলো সাজানো হচ্ছে, একটু সময় দিন...",
    "আপনার ভাবনার রঙগুলো ভিডিওতে প্রাণ পাচ্ছে...",
    "প্রায় শেষ পর্যায়ে, হিনাটা ফিনিশিং টাচ দিচ্ছে...",
    "ভিডিওটি এনকোড করা হচ্ছে, আর কয়েক সেকেন্ড..."
  ];

  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      let i = 0;
      setStatusMessage(reassuringMessages[0]);
      interval = setInterval(() => {
        i = (i + 1) % reassuringMessages.length;
        setStatusMessage(reassuringMessages[i]);
        setProgress(prev => Math.min(prev + 5, 95));
      }, 8000);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && mediaPool.length < 3) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPool(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        const newId = 'rec-' + Date.now();
        setVideoTimeline(prev => [...prev, { 
          id: newId, url, isExtended: false, volume: 100, startTrim: 0, endTrim: 0, transition: 'none',
          colorGrading: { exposure: 0, contrast: 0, tint: 0, temperature: 0 },
          keyframes: [{ time: 0, scale: 1, opacity: 1 }, { time: 1, scale: 1, opacity: 1 }]
        }]);
        setVideoUrl(url);
        setActiveClipId(newId);
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      setIsRecording(true);
    } catch (err) { alert("Camera access denied."); }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleGenerate = async (extension = false) => {
    if (!prompt.trim()) return alert("অনুগ্রহ করে ভিডিওর জন্য একটি প্রম্পট দিন।");
    try {
      if (!(window as any).aistudio?.hasSelectedApiKey || !(await (window as any).aistudio.hasSelectedApiKey())) {
        if ((window as any).aistudio?.openSelectKey) await (window as any).aistudio.openSelectKey();
      }
      setIsGenerating(true);
      setProgress(10);
      let operation;
      if (extension && lastOperation?.response?.generatedVideos?.[0]?.video) {
        operation = await extendVideoGeneration(prompt, lastOperation.response.generatedVideos[0].video);
      } else if (mediaPool.length > 1) {
        operation = await generateVideoWithReferences(prompt, mediaPool);
      } else {
        operation = await startVideoGeneration(prompt, mediaPool[0] || undefined);
      }
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await pollVideoOperation(operation);
      }
      if (operation.response?.generatedVideos?.[0]?.video?.uri) {
        const url = await fetchVideoBlob(operation.response.generatedVideos[0].video.uri);
        const newId = Date.now().toString();
        setVideoUrl(url);
        setActiveClipId(newId);
        setLastOperation(operation);
        setVideoTimeline(prev => [...prev, { 
          id: newId, url, isExtended: extension, volume: 100, startTrim: 0, endTrim: 0, transition: 'none',
          colorGrading: { exposure: 0, contrast: 0, tint: 0, temperature: 0 },
          keyframes: [{ time: 0, scale: 1, opacity: 1 }, { time: 1, scale: 1, opacity: 1 }]
        }]);
        setProgress(100);
      } else { throw new Error("Video generation failed."); }
    } catch (error) { alert("ভিডিও তৈরি করতে সমস্যা হয়েছে।"); } finally { setIsGenerating(false); }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newTimeline = [...videoTimeline];
    const draggedItem = newTimeline[draggedIndex];
    newTimeline.splice(draggedIndex, 1);
    newTimeline.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    setVideoTimeline(newTimeline);
  };

  const selectClip = (id: string, url: string) => {
    setVideoUrl(url);
    setActiveClipId(id);
  };

  const updateClip = (id: string, updates: Partial<VideoClip>) => {
    setVideoTimeline(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleExport = () => {
    setIsGenerating(true);
    setStatusMessage("আপনার প্রজেক্ট রেন্ডার করা হচ্ছে...");
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          setShowExport(false);
          const link = document.createElement('a');
          link.href = videoTimeline[0]?.url || '#';
          link.download = `HINATA_EXPORT_${Date.now()}.${exportSettings.format}`;
          link.click();
          return 100;
        }
        return p + 10;
      });
    }, 500);
  };

  const handleAddKeyframe = () => {
    if (!activeClipId || !videoRef.current) return;
    const currentTime = videoRef.current.currentTime / videoRef.current.duration;
    const existing = activeClip?.keyframes || [];
    const updated = [...existing, { time: currentTime, scale: 1, opacity: 1 }].sort((a, b) => a.time - b.time);
    updateClip(activeClipId, { keyframes: updated });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] text-slate-300 flex flex-col orbitron overflow-hidden select-none">
      
      {/* Header Bar */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-black/60 backdrop-blur-xl z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-900/20">
              <i className="fa-solid fa-film text-xs"></i>
            </div>
            <h1 className="font-black tracking-tighter text-white text-sm">VEO_STUDIO <span className="text-[9px] text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full ml-1">MASTER_SUITE</span></h1>
          </div>
          <div className="h-4 w-px bg-white/10"></div>
          <div className="flex gap-4">
             <button onClick={() => setShowMixer(!showMixer)} className={`text-[10px] font-bold uppercase tracking-widest transition-all ${showMixer ? 'text-indigo-400' : 'text-slate-400'}`}>Mixer</button>
             <button onClick={() => setShowExport(true)} className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest">Export</button>
          </div>
        </div>
        <button onClick={onClose} className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-red-900/20 hover:text-red-500 text-[10px] font-black tracking-widest transition-all border border-white/5">
          EXIT_WORKSPACE
        </button>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: Library & Grading */}
        <div className="w-80 border-r border-white/5 bg-[#080808] flex flex-col">
           <div className="flex border-b border-white/5 h-12">
              <button onClick={() => setActiveTab('tools')} className={`flex-1 text-[8px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'tools' ? 'border-indigo-500 text-white bg-white/5' : 'border-transparent text-slate-500'}`}>Library</button>
              <button onClick={() => setActiveTab('grading')} className={`flex-1 text-[8px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'grading' ? 'border-emerald-500 text-white bg-white/5' : 'border-transparent text-slate-500'}`}>Color</button>
              <button onClick={() => setActiveTab('keyframes')} className={`flex-1 text-[8px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'keyframes' ? 'border-orange-500 text-white bg-white/5' : 'border-transparent text-slate-500'}`}>Animate</button>
           </div>

           <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {activeTab === 'tools' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                   <div className="flex justify-between items-center mb-4">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Assets</label>
                      <button onClick={isRecording ? stopRecording : startRecording} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isRecording ? 'bg-red-600 animate-pulse text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                        <i className={`fa-solid ${isRecording ? 'fa-stop' : 'fa-video'} text-[10px]`}></i>
                      </button>
                   </div>
                   <div className="grid grid-cols-1 gap-4">
                      {mediaPool.map((img, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-white/10 bg-black aspect-video">
                          <img src={img} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all" />
                          <button onClick={() => setMediaPool(prev => prev.filter((_, i) => i !== idx))} className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all scale-75">
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        </div>
                      ))}
                      {mediaPool.length < 3 && (
                        <label className="aspect-video rounded-xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-slate-600 cursor-pointer hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all">
                          <i className="fa-solid fa-plus mb-1"></i>
                          <span className="text-[8px] font-black uppercase">Add Ref</span>
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                      )}
                   </div>
                   <div className="space-y-2 mt-6">
                      <p className="text-[8px] font-bold text-slate-600 uppercase">Transitions</p>
                      <div className="grid grid-cols-2 gap-2">
                         {['fade', 'wipe', 'dissolve', 'none'].map(t => (
                           <button key={t} onClick={() => activeClipId && updateClip(activeClipId, { transition: t as any })} className={`p-2 rounded-lg border border-white/5 text-[9px] font-black uppercase transition-all ${activeClip && activeClip.transition === t ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}>{t}</button>
                         ))}
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'grading' && (
                <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                   {!activeClipId ? (
                     <div className="text-center py-10 text-[10px] text-slate-600 font-bold uppercase tracking-widest">Select a clip to grade</div>
                   ) : (
                     <>
                        <div className="flex items-center gap-3 mb-6">
                           <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                           <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Color Correction</h4>
                        </div>
                        <GradingSlider label="Exposure" value={activeClip?.colorGrading?.exposure || 0} min={-100} max={100} onChange={v => updateClip(activeClipId, { colorGrading: { ...activeClip?.colorGrading!, exposure: v }})} />
                        <GradingSlider label="Contrast" value={activeClip?.colorGrading?.contrast || 0} min={-100} max={100} onChange={v => updateClip(activeClipId, { colorGrading: { ...activeClip?.colorGrading!, contrast: v }})} />
                        <GradingSlider label="Temperature" value={activeClip?.colorGrading?.temperature || 0} min={-100} max={100} onChange={v => updateClip(activeClipId, { colorGrading: { ...activeClip?.colorGrading!, temperature: v }})} />
                        <GradingSlider label="Tint" value={activeClip?.colorGrading?.tint || 0} min={-100} max={100} onChange={v => updateClip(activeClipId, { colorGrading: { ...activeClip?.colorGrading!, tint: v }})} />
                        <div className="pt-6 border-t border-white/5 space-y-3">
                           <p className="text-[8px] font-bold text-slate-600 uppercase">Presets</p>
                           <button onClick={() => updateClip(activeClipId, { colorGrading: { exposure: 10, contrast: 40, temperature: 20, tint: -10 }})} className="w-full py-2 bg-white/5 rounded-lg text-[9px] font-black text-white uppercase border border-white/5 hover:bg-white/10 transition-all">Lush Forest</button>
                           <button onClick={() => updateClip(activeClipId, { colorGrading: { exposure: -10, contrast: 20, temperature: -50, tint: 30 }})} className="w-full py-2 bg-white/5 rounded-lg text-[9px] font-black text-white uppercase border border-white/5 hover:bg-white/10 transition-all">Cold Blue</button>
                           <button onClick={() => updateClip(activeClipId, { colorGrading: { exposure: 20, contrast: 10, temperature: 40, tint: 20 }})} className="w-full py-2 bg-white/5 rounded-lg text-[9px] font-black text-white uppercase border border-white/5 hover:bg-white/10 transition-all">Sunset Warmth</button>
                        </div>
                     </>
                   )}
                </div>
              )}

              {activeTab === 'keyframes' && (
                <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                   {!activeClipId ? (
                     <div className="text-center py-10 text-[10px] text-slate-600 font-bold uppercase tracking-widest">Select a clip to animate</div>
                   ) : (
                     <>
                        <div className="flex justify-between items-center mb-6">
                           <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Transform Engine</h4>
                           <button onClick={handleAddKeyframe} className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/40">
                              <i className="fa-solid fa-plus text-[10px]"></i>
                           </button>
                        </div>
                        <div className="space-y-4">
                           {activeClip?.keyframes?.map((kf, i) => (
                             <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4 group">
                                <div className="flex justify-between items-center">
                                   <span className="text-[9px] font-black text-indigo-400 uppercase">Keyframe_{i+1}</span>
                                   <span className="text-[8px] text-slate-600">{(kf.time * 100).toFixed(0)}% Point</span>
                                </div>
                                <GradingSlider label="Scale" value={kf.scale * 100 - 100} min={-50} max={100} onChange={v => {
                                   const updated = [...activeClip.keyframes!];
                                   updated[i].scale = (v + 100) / 100;
                                   updateClip(activeClipId, { keyframes: updated });
                                }} />
                                <GradingSlider label="Opacity" value={kf.opacity * 100} min={0} max={100} onChange={v => {
                                   const updated = [...activeClip.keyframes!];
                                   updated[i].opacity = v / 100;
                                   updateClip(activeClipId, { keyframes: updated });
                                }} />
                             </div>
                           ))}
                        </div>
                     </>
                   )}
                </div>
              )}
           </div>
        </div>

        {/* Center: Monitor */}
        <div className="flex-1 bg-black flex flex-col relative">
           <div className="flex-1 flex items-center justify-center p-8 relative">
              <div className={`w-full max-w-5xl aspect-video bg-[#0a0a0a] rounded-[2rem] border-2 shadow-2xl flex items-center justify-center relative overflow-hidden transition-all duration-500 ${activeClipId ? 'border-indigo-500/40' : 'border-white/10'}`}>
                 {isGenerating ? (
                   <div className="text-center space-y-8 z-10 px-12 animate-in zoom-in-95 duration-500">
                      <div className="relative w-32 h-32 mx-auto">
                        <div className="absolute inset-0 rounded-full border-4 border-white/5"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-t-red-500 animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center font-black text-white text-xs">{progress}%</div>
                      </div>
                      <p className="text-white font-black text-lg tracking-tight animate-pulse">{statusMessage}</p>
                   </div>
                 ) : videoUrl ? (
                   <video ref={videoRef} src={videoUrl} controls className="w-full h-full object-contain" style={{
                     filter: activeClip?.colorGrading ? `brightness(${100 + activeClip.colorGrading.exposure}%) contrast(${100 + activeClip.colorGrading.contrast}%) hue-rotate(${activeClip.colorGrading.tint}deg) sepia(${activeClip.colorGrading.temperature > 0 ? activeClip.colorGrading.temperature : 0}%)` : 'none'
                   }} />
                 ) : (
                   <div className="text-center space-y-4 opacity-20">
                      <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center mx-auto border border-white/10 shadow-inner">
                        <i className="fa-solid fa-clapperboard text-2xl text-slate-700"></i>
                      </div>
                      <p className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase">Monitor_Offline</p>
                   </div>
                 )}
              </div>
              
              {showMixer && (
                <div className="absolute right-10 top-10 w-64 bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-white/10 p-6 z-[60] shadow-2xl animate-in slide-in-from-right-4">
                   <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-6">Master_Audio</h4>
                   <div className="space-y-6 max-h-80 overflow-y-auto custom-scrollbar">
                      {videoTimeline.map((clip, i) => (
                        <div key={clip.id} className="space-y-2">
                           <div className="flex justify-between text-[8px] font-bold text-slate-500 uppercase"><span>Clip_0{i+1}</span><span>{clip.volume}%</span></div>
                           <input type="range" min="0" max="100" value={clip.volume} onChange={(e) => updateClip(clip.id, { volume: parseInt(e.target.value) })} className="w-full h-1 bg-slate-800 rounded-full appearance-none accent-indigo-500" />
                        </div>
                      ))}
                   </div>
                </div>
              )}
           </div>

           <div className="h-16 border-t border-white/5 flex items-center justify-center gap-10 bg-black/40 backdrop-blur-md">
              <button className="text-slate-500 hover:text-white"><i className="fa-solid fa-backward-step text-lg"></i></button>
              <button onClick={() => videoRef.current?.play()} className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-white hover:bg-indigo-500 shadow-xl shadow-indigo-900/20 transition-all -mt-4 active:scale-90"><i className="fa-solid fa-play text-xl translate-x-0.5"></i></button>
              <button className="text-slate-500 hover:text-white"><i className="fa-solid fa-forward-step text-lg"></i></button>
           </div>
        </div>

        {/* Right Panel: AI Commands */}
        <div className="w-80 border-l border-white/5 bg-[#080808] p-6 flex flex-col">
           <h3 className="text-[10px] font-black text-white mb-6 tracking-widest flex items-center gap-3">
              <i className="fa-solid fa-microchip text-red-500"></i> AI_DIRECTOR
           </h3>
           <textarea 
             value={prompt} onChange={(e) => setPrompt(e.target.value)}
             placeholder="ভিডিওর জন্য প্রম্পট লিখুন..."
             className="flex-1 bg-black border border-white/5 rounded-2xl p-5 text-xs text-white outline-none focus:border-red-500/50 resize-none mb-6 font-bold leading-relaxed"
           />
           <div className="space-y-3">
              <button onClick={() => handleGenerate(false)} disabled={isGenerating} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 rounded-2xl text-[11px] font-black text-white tracking-widest shadow-xl border border-white/10 flex items-center justify-center gap-3 transition-all active:scale-95"><i className="fa-solid fa-bolt"></i> RENDER_CLIP</button>
              {videoUrl && <button onClick={() => handleGenerate(true)} disabled={isGenerating} className="w-full py-4 bg-white/5 hover:bg-white/10 disabled:opacity-20 rounded-2xl text-[11px] font-black text-white tracking-widest flex items-center justify-center gap-3 border border-white/10"><i className="fa-solid fa-plus"></i> EXTEND_CLIP</button>}
           </div>
        </div>
      </div>

      {/* Advanced Timeline */}
      <div className="h-64 border-t border-white/5 bg-[#050505] flex flex-col">
         <div className="h-10 border-b border-white/5 flex items-center justify-between px-6 bg-black/40">
            <div className="flex gap-6 items-center">
               <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Master_Sequence</span>
               <div className="h-4 w-px bg-white/10"></div>
               <span className="text-[10px] font-bold text-slate-500">00:00:00:00</span>
            </div>
            {activeClipId && (
              <div className="flex gap-4 items-center bg-indigo-500/10 px-4 rounded-full border border-indigo-500/20">
                 <span className="text-[9px] font-black text-indigo-400 uppercase">Trim:</span>
                 <input type="range" min="0" max="50" value={activeClip?.startTrim} onChange={(e) => updateClip(activeClipId, { startTrim: parseInt(e.target.value) })} className="w-16 h-1 accent-indigo-500" />
                 <input type="range" min="0" max="50" value={activeClip?.endTrim} onChange={(e) => updateClip(activeClipId, { endTrim: parseInt(e.target.value) })} className="w-16 h-1 accent-indigo-500" />
              </div>
            )}
         </div>
         
         <div className="flex-1 p-6 flex gap-2 overflow-x-auto custom-scrollbar relative">
            {videoTimeline.map((clip, i) => (
              <div 
                key={clip.id} draggable onDragStart={(e) => handleDragStart(e, i)} onDragOver={(e) => handleDragOver(e, i)}
                className={`h-full min-w-[280px] rounded-xl border-2 flex flex-col p-4 transition-all relative cursor-grab active:cursor-grabbing ${activeClipId === clip.id ? 'border-indigo-500 bg-indigo-500/10' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                onClick={() => selectClip(clip.id, clip.url)}
              >
                 <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-black uppercase text-indigo-400">Clip_0{i+1}</span>
                    <div className="flex gap-2">
                       {clip.keyframes && clip.keyframes.length > 0 && <i className="fa-solid fa-diamond text-[8px] text-orange-400"></i>}
                       <i className="fa-solid fa-volume-high text-[8px] text-slate-600"></i>
                    </div>
                 </div>
                 
                 <div className="flex-1 relative rounded-lg overflow-hidden bg-black border border-white/5 mb-3">
                    <img src={clip.url + '#t=0.5'} className="w-full h-full object-cover opacity-20 blur-[1px]" alt="" />
                    <div className="absolute inset-0 flex flex-col justify-end p-2">
                       <div className="h-full w-full">
                          <Waveform seed={clip.id} />
                       </div>
                    </div>
                 </div>

                 <div className="flex justify-between items-center mt-auto">
                    <div className="flex gap-4">
                       <span className="text-[8px] font-bold text-slate-600">Vol: {clip.volume}%</span>
                       <span className="text-[8px] font-bold text-slate-600">Graded</span>
                    </div>
                    {activeClipId === clip.id && <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>}
                 </div>
              </div>
            ))}
            
            {videoTimeline.length === 0 && (
              <div className="flex-1 flex items-center justify-center border border-dashed border-white/5 rounded-2xl text-[10px] font-black text-slate-800 tracking-widest uppercase">Drop Clips Here</div>
            )}
         </div>
      </div>

      {/* Export Interface */}
      {showExport && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
           <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95">
              <h3 className="text-xl font-black text-white mb-8 orbitron tracking-tighter uppercase">Render_Queue</h3>
              <div className="space-y-8 mb-10">
                 <div className="space-y-3">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Target_Resolution</label>
                    <div className="grid grid-cols-3 gap-2">
                       {['720p', '1080p', '4K'].map(r => (
                         <button key={r} onClick={() => setExportSettings(s=>({...s, res: r}))} className={`py-4 rounded-2xl text-[10px] font-black transition-all ${exportSettings.res === r ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}>{r}</button>
                       ))}
                    </div>
                 </div>
                 <div className="space-y-3">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Encoding_Format</label>
                    <div className="grid grid-cols-2 gap-2">
                       {['mp4', 'mov'].map(f => (
                         <button key={f} onClick={() => setExportSettings(s=>({...s, format: f}))} className={`py-4 rounded-2xl text-[10px] font-black transition-all ${exportSettings.format === f ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}>{f.toUpperCase()}</button>
                       ))}
                    </div>
                 </div>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setShowExport(false)} className="flex-1 py-5 bg-slate-800 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest">Cancel</button>
                 <button onClick={handleExport} className="flex-2 py-5 bg-indigo-600 rounded-2xl text-[10px] font-black text-white hover:bg-indigo-500 uppercase tracking-widest shadow-xl shadow-indigo-900/20">Render_Now</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const GradingSlider = ({ label, value, min, max, onChange }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center text-[9px] font-black text-slate-500 uppercase tracking-widest">
       <span>{label}</span>
       <span className="text-indigo-400">{value}</span>
    </div>
    <div className="relative h-1 bg-slate-800 rounded-full overflow-hidden">
       <div className="absolute h-full bg-indigo-600 transition-all" style={{ width: `${((value - min) / (max - min)) * 100}%` }}></div>
       <input type="range" min={min} max={max} value={value} onChange={e => onChange(parseInt(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
    </div>
  </div>
);

export default VideoEditor;
