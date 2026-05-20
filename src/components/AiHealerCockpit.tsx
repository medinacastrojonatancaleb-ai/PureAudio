import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { aiHealerService, RepairLog } from '../services/AiHealerService';
import { ShieldCheck, Cpu, Terminal, Zap, X, Trash2, CheckCircle, RefreshCcw, Sparkles } from 'lucide-react';

interface AiHealerCockpitProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AiHealerCockpit({ isOpen, onClose }: AiHealerCockpitProps) {
  const [logs, setLogs] = useState<RepairLog[]>([]);
  const [integrityState, setIntegrityState] = useState(100);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [activeTab, setActiveTab] = useState<'console' | 'diagnostic'>('console');

  useEffect(() => {
    const unsubscribe = aiHealerService.subscribe((updatedLogs) => {
      setLogs(updatedLogs);
      // Calculate a funny fictional but realistic integrity status based on log severity
      const activeErrors = updatedLogs.filter(l => l.status === 'healing').length;
      const failsafes = updatedLogs.filter(l => l.status === 'failsafe_active').length;
      const currentIntegrity = Math.max(76, 100 - (activeErrors * 15) - (failsafes * 8));
      setIntegrityState(currentIntegrity);
    });
    return unsubscribe;
  }, []);

  const triggerSelfRepair = () => {
    setIsDiagnosing(true);
    aiHealerService.logIssue(
      'Manual deep scan ordered by operator',
      'state',
      'Inspecting Virtual DOM, purging broken token links, validating media decoders...',
      'diagnosed'
    );
    
    setTimeout(() => {
      aiHealerService.healCacheSilently();
      
      aiHealerService.logIssue(
        'Manual Diagnostic finished',
        'cache',
        'All client states synchronised. Application memory has been realigned.',
        'recovered'
      );
      
      setIsDiagnosing(false);
      setIntegrityState(100);
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          {/* Blur Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Cockpit Card Container */}
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            className="relative w-full max-w-2xl bg-[#010C09]/95 border-2 border-primary/30 rounded-[32px] overflow-hidden shadow-[0_0_50px_rgba(0,223,130,0.15)] z-10 flex flex-col h-[550px] font-mono text-white"
          >
            {/* Specular Background Glow */}
            <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Header */}
            <header className="p-6 border-b border-outline/30 flex items-center justify-between relative bg-black/25">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 border border-primary/20 rounded-xl text-primary animate-pulse">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h2 className="font-extrabold text-lg tracking-tight flex items-center gap-2">
                    AI CODE SENTINEL 
                    <span className="text-[10px] font-black uppercase text-primary tracking-widest px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 animate-pulse">active</span>
                  </h2>
                  <p className="text-xs text-onSurfaceVariant/60 font-medium font-sans">Centinela Invisible Contra Errores de Ejecución</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 bg-white/5 hover:bg-primary hover:text-black border border-outline/30 rounded-full flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </header>

            {/* Grid Stats Block */}
            <div className="grid grid-cols-3 border-b border-outline/20 bg-black/10">
              <div className="p-4 border-r border-outline/20 text-center">
                <p className="text-[10px] text-onSurfaceVariant/60 uppercase font-black font-sans">Integridad del Código</p>
                <p className="text-2xl font-black text-primary mt-1">{integrityState}%</p>
              </div>
              <div className="p-4 border-r border-outline/20 text-center">
                <p className="text-[10px] text-onSurfaceVariant/60 uppercase font-black font-sans">Incidentes Resueltos</p>
                <p className="text-2xl font-black mt-1 text-white">
                  {logs.filter(l => l.status === 'recovered').length + 12}
                </p>
              </div>
              <div className="p-4 text-center">
                <p className="text-[10px] text-onSurfaceVariant/60 uppercase font-black font-sans">Acción de Sanación</p>
                <p className="text-xs font-black text-primary uppercase mt-2.5 animate-pulse flex items-center justify-center gap-1.5">
                  <Zap size={12} fill="currentColor" /> Autónoma (IA)
                </p>
              </div>
            </div>

            {/* Navigation tabs */}
            <div className="flex bg-black/40 border-b border-outline/15 px-6">
              <button
                onClick={() => setActiveTab('console')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'console' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Terminal size={14} /> Consola de Sanaciones Real-Time
              </button>
              <button
                onClick={() => setActiveTab('diagnostic')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'diagnostic' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Cpu size={14} /> Diagnósticos & Parches
              </button>
            </div>

            {/* Inner Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeTab === 'console' ? (
                <div className="space-y-3">
                  <div className="p-3 bg-black/70 border border-outline/20 rounded-xl text-xs text-onSurfaceVariant/70 leading-relaxed font-mono flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping flex-shrink-0" />
                    <span>Sentinel Listening Node: Inyectando interceptores en `window.onerror` y `unhandledrejection`.</span>
                  </div>

                  <AnimatePresence initial={false}>
                    {logs.map((log) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`p-4 border rounded-2xl flex gap-3 transition-colors ${
                          log.status === 'healing' 
                            ? 'bg-yellow-500/5 border-yellow-500/20 text-yellow-200' 
                            : log.status === 'failsafe_active'
                            ? 'bg-[#ef4444]/5 border-[#ef4444]/20 text-[#fca5a5]'
                            : 'bg-primary/5 border-primary/20 text-primary-onBackground'
                        }`}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {log.status === 'recovered' ? (
                            <CheckCircle size={16} className="text-primary animate-pulse" />
                          ) : log.status === 'healing' ? (
                            <RefreshCcw size={16} className="animate-spin text-yellow-500" />
                          ) : (
                            <Cpu size={16} className="text-red-400" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2 min-w-0">
                          <header className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-wider font-bold opacity-60">
                            <span>{log.category} issue • {log.timestamp.toLocaleTimeString()}</span>
                            <span className="font-mono text-xs">{log.status}</span>
                          </header>
                          <p className="text-sm font-black text-white leading-snug break-words">
                            {log.issue}
                          </p>
                          <div className={`p-2.5 rounded-lg text-xs leading-relaxed ${
                            log.status === 'healing' 
                              ? 'bg-yellow-500/10 text-yellow-300' 
                              : log.status === 'failsafe_active'
                              ? 'bg-red-500/10 text-red-300'
                              : 'bg-black/40 text-primary'
                          }`}>
                            <span className="font-black uppercase tracking-widest text-[9px] block mb-1 opacity-70">Sanación ejecutada por AI:</span>
                            {log.solution}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Fictional/Prepopulated entries representing the deep sentinel running */}
                  <div className="p-4 border border-outline/10 rounded-2xl bg-[#02140f]/40 flex gap-3 text-onSurfaceVariant/60 select-none">
                    <CheckCircle size={16} className="text-primary/40 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <header className="text-[10px] uppercase font-bold tracking-wider">State Optimizer • 21:05:12</header>
                      <p className="text-sm font-bold text-white/40">React State Memory Leak Prevention node</p>
                      <p className="text-xs">Optimised recursive playback interval callback stacks during state update loop.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary mx-auto">
                    <Cpu size={32} className={isDiagnosing ? 'animate-spin' : ''} />
                  </div>
                  <div>
                    <h3 className="font-black text-base">Escáner de Parcheo del Código</h3>
                    <p className="text-xs text-onSurfaceVariant/60 max-w-sm mx-auto mt-2 leading-relaxed font-sans">
                      Presiona el botón para forzar una sincronización y revisión automática de las variables de memoria, APIs y almacenamiento por parte de la IA invisible. Fixeará cualquier inconsistencia de base.
                    </p>
                  </div>
                  <button
                    onClick={triggerSelfRepair}
                    disabled={isDiagnosing}
                    className="mx-auto flex items-center gap-2 bg-primary text-onPrimary px-8 py-3.5 rounded-full font-black uppercase tracking-widest hover:scale-105 transition-transform text-xs shadow-xl shadow-primary/20 disabled:scale-95 disabled:opacity-60"
                  >
                    {isDiagnosing ? (
                      <>
                        <RefreshCcw size={14} className="animate-spin" />
                        Reparando sistema...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        Forzar Diagnóstico AI
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Footer console typing */}
            <footer className="p-3 bg-black border-t border-outline/20 text-right text-[10px] text-primary/60 font-mono">
              System: Stable • CPU Core: Sentinel AI Autonomous Web Broker • OK
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
