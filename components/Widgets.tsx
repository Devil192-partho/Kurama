
import React, { useState, useEffect } from 'react';
import { Reminder } from '../types';

interface WidgetsProps {
  reminders: Reminder[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const Widgets: React.FC<WidgetsProps> = ({ reminders, onToggle, onDelete }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getDayProgress = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    return ((hours * 60 + minutes) / 1440) * 100;
  };

  const isDay = currentTime.getHours() >= 6 && currentTime.getHours() < 18;

  return (
    <div className="grid grid-cols-2 gap-3 mt-4">
      {/* Dynamic Reminders/Alarms Widget */}
      <div className="col-span-2 bg-slate-900/50 p-6 rounded-3xl border border-slate-800 max-h-60 overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-4">
          <div className="text-[10px] text-slate-500 font-bold orbitron uppercase tracking-[0.3em]">ACTIVE_RECALLS</div>
          <div className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 text-[9px] orbitron font-bold">{reminders.length}</div>
        </div>
        
        <div className="space-y-3">
          {reminders.length === 0 ? (
            <div className="text-center py-4 text-xs text-slate-600 italic">No active reminders</div>
          ) : (
            reminders.map(rem => (
              <div key={rem.id} className="flex items-center justify-between p-3 bg-slate-950/60 rounded-2xl border border-white/5 group">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${
                    rem.type === 'alarm' ? 'bg-orange-500/10 text-orange-400' : 
                    rem.type === 'sleep' ? 'bg-indigo-500/10 text-indigo-400' : 
                    'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    <i className={`fa-solid ${
                      rem.type === 'alarm' ? 'fa-bell' : 
                      rem.type === 'sleep' ? 'fa-moon' : 
                      'fa-check'
                    }`}></i>
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-200">{rem.time}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[120px]">{rem.label}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => onToggle(rem.id)} className={`w-10 h-6 rounded-full flex items-center px-1 transition-all ${rem.active ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-all ${rem.active ? 'ml-4' : 'ml-0'}`}></div>
                  </button>
                  <button onClick={() => onDelete(rem.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-600 hover:text-red-400 transition-all text-xs">
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Circadian Day/Night Cycle Widget */}
      <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition-all group">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDay ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
            <i className={`fa-solid ${isDay ? 'fa-sun' : 'fa-moon'} text-lg`}></i>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-bold orbitron uppercase tracking-widest">CYCLE_SYNC</div>
            <div className="text-sm font-black text-slate-100">{isDay ? 'Day Time' : 'Night Time'}</div>
          </div>
        </div>
        <div className="mt-4 w-full bg-slate-800/50 h-2 rounded-full overflow-hidden border border-white/5">
          <div 
            className={`h-full transition-all duration-1000 ${isDay ? 'bg-amber-500 shadow-[0_0_15px_#f59e0b]' : 'bg-indigo-500 shadow-[0_0_15px_#6366f1]'}`} 
            style={{ width: `${getDayProgress()}%` }}
          ></div>
        </div>
      </div>

      {/* Security Biometric Widget */}
      <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 hover:border-green-500/50 transition-all group">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-fingerprint text-lg"></i>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-bold orbitron uppercase tracking-widest">ENCRYPT</div>
            <div className="text-[10px] font-black text-slate-100">AES-256 Active</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Widgets;
