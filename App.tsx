
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Avatar from './components/Avatar';
import ChatInterface from './components/ChatInterface';
import Widgets from './components/Widgets';
import PhotoEditor from './components/PhotoEditor';
import VideoEditor from './components/VideoEditor';
import CodeRunner from './components/CodeRunner';
import { Message, Emotion, HinataMood, MicrosoftTool, Reminder, PhotoEditSettings, AIModel, Persona } from './types';
import { streamHinataResponse, generateSpeech, playAudio, stopAllAudio, getAudioContext } from './services/geminiService';

const DEFAULT_PHOTO_SETTINGS: PhotoEditSettings = {
  brightness: 100, contrast: 100, saturation: 100, sepia: 0, grayscale: 0, hueRotate: 0, blur: 0
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [emotion, setEmotion] = useState<Emotion>('neutral');
  const [mood, setMood] = useState<HinataMood>('normal');
  const [msTool, setMsTool] = useState<MicrosoftTool>('none');
  const [activeModel, setActiveModel] = useState<AIModel>('gemini-3-flash-preview');
  const [activePersona, setActivePersona] = useState<Persona>('hinata');
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGlobalVoiceOn, setIsGlobalVoiceOn] = useState(true);
  const [isAutonomyEnabled, setIsAutonomyEnabled] = useState(true); 
  const [isCodeMode, setIsCodeMode] = useState(false);
  const [isStrictCodeMode, setIsStrictCodeMode] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [runningCode, setRunningCode] = useState<string | null>(null);
  const [photoEditSettings, setPhotoEditSettings] = useState<PhotoEditSettings>(DEFAULT_PHOTO_SETTINGS);
  const [isListening, setIsListening] = useState(false);

  const lastInteractionRef = useRef<number>(Date.now());
  const recognitionRef = useRef<any>(null);

  const unlockAudio = useCallback(async () => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') try { await ctx.resume(); } catch (e) {}
  }, []);

  // MASTER AUTONOMY ENGINE
  useEffect(() => {
    if (!isAutonomyEnabled) return; 

    const idleCheck = setInterval(() => {
      const idleTime = Date.now() - lastInteractionRef.current;
      
      // If idle for 45s and system is quiet, the AI initiates contact
      if (idleTime > 45000 && !isThinking && !isSpeaking && messages.length > 0) {
        lastInteractionRef.current = Date.now(); 
        handleSend(false, "PROACTIVE_SYSTEM_CHECK: User is silent. Check in on them naturally based on your persona.");
      }
    }, 5000);
    return () => clearInterval(idleCheck);
  }, [isThinking, isSpeaking, messages.length, isAutonomyEnabled]);

  useEffect(() => {
    if (!isGlobalVoiceOn) {
      stopAllAudio();
      setIsSpeaking(false);
    }
  }, [isGlobalVoiceOn]);

  const handleUpgradeKey = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
    } else {
      window.open("https://ai.google.dev/gemini-api/docs/billing", "_blank");
    }
  };

  useEffect(() => {
    const welcome = activePersona === 'kurama' ? "আমি কুরামা। বলো কি সাহায্য করতে পারি? 🔥" : "হিনাটা এখানে! তোমার দিনটি কেমন যাচ্ছে? ✨";
    setMessages([{ id: 'welcome', role: 'ai', text: welcome, timestamp: Date.now() }]);
  }, [activePersona]);

  const handleInputChange = (val: string) => {
    setInputValue(val);
    lastInteractionRef.current = Date.now(); 
  };

  const handleSend = async (isVoice: boolean = false, overrideText?: string) => {
    lastInteractionRef.current = Date.now();
    await unlockAudio();
    
    const isProactive = overrideText?.startsWith("PROACTIVE_SYSTEM_CHECK:");
    const textToSend = overrideText || inputValue.trim();
    
    if ((!textToSend && !pendingImage) || isThinking) return;
    
    if (isStrictCodeMode || msTool !== 'none') {
      const hasKey = (window as any).aistudio?.hasSelectedApiKey ? await (window as any).aistudio.hasSelectedApiKey() : true;
      if (!hasKey) {
        const confirm = window.confirm("This tool requires a Paid API Key. Open key selection?");
        if (confirm) await handleUpgradeKey();
      }
    }

    if (!isProactive) {
      stopAllAudio();
      setIsSpeaking(false);
    }

    if (!isProactive) {
      const userMsgId = 'u-'+Date.now();
      setMessages(prev => [...prev, { id: userMsgId, role: 'user', text: textToSend || 'Shared an image.', timestamp: Date.now(), imageUrl: pendingImage || undefined }]);
    }

    setInputValue('');
    const currentImage = pendingImage;
    setPendingImage(null);
    setIsThinking(true);
    setEmotion('thinking');

    try {
      const aiMsgId = 'ai-'+Date.now();
      setMessages(prev => [...prev, { id: aiMsgId, role: 'ai', text: '', timestamp: Date.now() }]);
      
      let detectedEmotion: Emotion = 'neutral';
      const final = await streamHinataResponse(
        textToSend, 
        currentImage, 
        false, 
        isCodeMode, 
        isStrictCodeMode, 
        mood, 
        msTool, 
        activeModel, 
        activePersona,
        (text) => {
          const emoMatch = text.match(/\[EMOTION:(.*?)\]/i);
          if (emoMatch) {
            detectedEmotion = emoMatch[1].toLowerCase() as Emotion;
            setEmotion(detectedEmotion);
          }
          setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: text.replace(/\[EMOTION:.*?\]/gi, ''), emotion: detectedEmotion } : m));
        }
      );
      
      setIsThinking(false);
      
      if (isGlobalVoiceOn && final.trim()) {
        setIsSpeaking(true);
        const audio = await generateSpeech(final, activePersona);
        if (audio && isGlobalVoiceOn) {
          await playAudio(audio, () => {
            setIsSpeaking(false);
            setEmotion('neutral');
          });
        } else {
          setIsSpeaking(false);
          setEmotion('neutral');
        }
      } else {
        setEmotion('neutral');
      }
    } catch (e: any) {
      setIsThinking(false);
      setEmotion('sad');
      if (e.message?.includes("entity was not found") || e.message?.includes("key")) {
        alert("API Key problem. Please select your Paid Key again.");
        handleUpgradeKey();
      }
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Your browser does not support voice recognition.");
    
    if (recognitionRef.current) recognitionRef.current.stop();
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'bn-BD';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      lastInteractionRef.current = Date.now(); 
      stopAllAudio(); 
      setIsSpeaking(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      handleSend(true, transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    
    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 lg:p-6 bg-slate-950 text-white selection:bg-indigo-500/30">
      <div className="w-full max-w-[1600px] grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        <div className="lg:col-span-4 flex flex-col py-6">
           <div className="flex items-center gap-4 mb-8 px-6">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black orbitron ${activePersona === 'kurama' ? 'bg-orange-600 shadow-[0_0_15px_rgba(234,88,12,0.5)]' : 'bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.5)]'}`}>K</div>
              <div>
                <h1 className="orbitron font-black text-xl tracking-tighter uppercase">Korema_AI</h1>
                <p className="text-[9px] orbitron text-slate-500 font-bold tracking-widest uppercase">System_v5.5_Master_Control</p>
              </div>
           </div>
           
           <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
              <Avatar emotion={emotion} isThinking={isThinking} isSpeaking={isSpeaking} isTired={false} isCodeMode={isCodeMode} isStrictCodeMode={isStrictCodeMode} mood={mood} msTool={msTool} persona={activePersona} />
           </div>

           <div className="px-6 mb-4">
              <div className="bg-slate-900/50 p-4 rounded-3xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isAutonomyEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                    <i className="fa-solid fa-brain text-xs"></i>
                  </div>
                  <div>
                    <div className="text-[9px] orbitron font-bold text-slate-500 uppercase tracking-widest">AI Autonomy</div>
                    <div className="text-[10px] font-bold text-slate-300">{isAutonomyEnabled ? 'ON - Active Agent' : 'OFF - Standard Chat'}</div>
                  </div>
                </div>
                <button onClick={() => {
                  setIsAutonomyEnabled(!isAutonomyEnabled);
                  lastInteractionRef.current = Date.now();
                }} className={`w-12 h-6 rounded-full transition-all relative ${isAutonomyEnabled ? 'bg-emerald-600' : 'bg-slate-800'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isAutonomyEnabled ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
           </div>

           <div className="hidden lg:block">
              <Widgets reminders={reminders} onToggle={() => {}} onDelete={() => {}} />
           </div>
        </div>
        <div className="lg:col-span-8 h-[85vh] lg:h-[880px] self-center">
          <ChatInterface 
            messages={messages} inputValue={inputValue} setInputValue={handleInputChange} 
            onSend={() => handleSend(false)} onReplay={(t) => handleSend(false, t)} isThinking={isThinking} 
            isGlobalVoiceOn={isGlobalVoiceOn} setIsGlobalVoiceOn={setIsGlobalVoiceOn}
            isCodeMode={isCodeMode} setIsCodeMode={setIsCodeMode} 
            isStrictCodeMode={isStrictCodeMode} setIsStrictCodeMode={setIsStrictCodeMode}
            isConnected={true} mood={mood} setMood={setMood} msTool={msTool} setMsTool={setMsTool}
            onImageUpload={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setPendingImage(reader.result as string);
                reader.readAsDataURL(file);
              }
              lastInteractionRef.current = Date.now();
            }}
            pendingImage={pendingImage} setPendingImage={setPendingImage}
            onVoiceInput={startListening} isListening={isListening}
            imageGenOptions={{aspectRatio:'1:1', style:'', negativePrompt:''}} setImageGenOptions={()=>{}}
            activeModel={activeModel} setActiveModel={setActiveModel}
            activePersona={activePersona} setActivePersona={setActivePersona}
            onRunCode={setRunningCode} onOpenEditor={() => setShowPhotoEditor(true)}
            onUpgradeKey={handleUpgradeKey} groundingMetadata={{}}
          />
        </div>
      </div>
      {showPhotoEditor && pendingImage && <PhotoEditor imageUrl={pendingImage} settings={photoEditSettings} onSettingsChange={setPhotoEditSettings} onClose={() => setShowPhotoEditor(false)} onApply={() => setShowPhotoEditor(false)} onAiSuggest={() => {}} />}
      {msTool === 'video' && <VideoEditor onClose={() => setMsTool('none')} pendingImage={pendingImage} />}
      {runningCode && <CodeRunner code={runningCode} onClose={() => setRunningCode(null)} />}
    </div>
  );
};

export default App;
