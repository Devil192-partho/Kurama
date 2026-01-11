
import React, { useState } from 'react';

interface CodeRunnerProps {
  code: string;
  onClose: () => void;
}

const CodeRunner: React.FC<CodeRunnerProps> = ({ code, onClose }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'source'>('preview');

  // If code is JSON (Excel/Word config), we show a structured preview instead of iframe
  const isJson = code.trim().startsWith('{') && code.trim().endsWith('}');
  let parsedJson: any = null;
  if (isJson) {
    try { parsedJson = JSON.parse(code); } catch(e) {}
  }

  const getBlobUrl = (code: string) => {
    const isFullHtml = code.toLowerCase().includes('<html>');
    const finalCode = isFullHtml ? code : `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 20px; background: #0f172a; color: white; }
          </style>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          ${code}
        </body>
      </html>
    `;
    const blob = new Blob([finalCode], { type: 'text/html' });
    return URL.createObjectURL(blob);
  };

  return (
    <div className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-2xl flex flex-col p-4 lg:p-10">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg">
             <i className="fa-solid fa-play text-xs"></i>
          </div>
          <div>
            <h2 className="orbitron font-black text-white text-sm tracking-widest uppercase">KOREMA_SANDBOX_RUNNER</h2>
            <p className="text-[8px] orbitron text-slate-500 font-bold uppercase tracking-[0.3em]">Safe_Execution_Environment v1.0</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-white/5 mr-4">
            <button onClick={() => setActiveTab('preview')} className={`px-5 py-2 rounded-lg text-[9px] orbitron font-black transition-all ${activeTab === 'preview' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>PREVIEW</button>
            <button onClick={() => setActiveTab('source')} className={`px-5 py-2 rounded-lg text-[9px] orbitron font-black transition-all ${activeTab === 'source' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>SOURCE</button>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-xl bg-slate-900 text-slate-400 hover:bg-red-600 hover:text-white transition-all border border-white/5">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>

      <div className="flex-1 bg-slate-950 rounded-[2.5rem] border border-white/10 overflow-hidden relative shadow-2xl">
         {activeTab === 'preview' ? (
           isJson && parsedJson ? (
             <div className="p-10 overflow-auto h-full space-y-8 animate-in zoom-in-95">
                <div className="p-8 rounded-[2rem] bg-indigo-600/10 border border-indigo-500/20 max-w-2xl mx-auto text-center">
                   <i className="fa-solid fa-file-invoice text-4xl text-indigo-400 mb-4"></i>
                   <h3 className="text-2xl font-black text-white mb-2">{parsedJson.title || "Untitled Project"}</h3>
                   <p className="text-slate-400 text-sm uppercase orbitron font-bold tracking-widest">Type: {parsedJson.type || "Document"}</p>
                </div>
                <div className="max-w-4xl mx-auto bg-slate-900 rounded-3xl p-10 border border-white/5 shadow-inner">
                   <div className="text-[10px] orbitron text-slate-500 mb-6 font-bold uppercase tracking-widest">Project_Data_Snapshot</div>
                   <pre className="text-emerald-400 text-xs font-mono whitespace-pre-wrap leading-relaxed">
                      {JSON.stringify(parsedJson.data, null, 2)}
                   </pre>
                </div>
             </div>
           ) : (
             <iframe src={getBlobUrl(code)} className="w-full h-full border-none bg-white rounded-inner" />
           )
         ) : (
           <div className="p-10 h-full overflow-auto bg-[#0a0a0a]">
              <pre className="text-indigo-400 text-xs font-mono leading-relaxed select-text">
                {code}
              </pre>
           </div>
         )}
      </div>

      <div className="mt-8 flex justify-center">
         <div className="flex items-center gap-6 px-8 py-3 bg-slate-900/50 rounded-full border border-white/5">
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
               <span className="text-[8px] orbitron font-black text-slate-500 uppercase tracking-widest">Running_Environment: Stable</span>
            </div>
            <div className="h-3 w-px bg-white/10"></div>
            <div className="text-[8px] orbitron font-black text-slate-500 uppercase tracking-widest">Resolution: Native_View</div>
         </div>
      </div>
    </div>
  );
};

export default CodeRunner;
