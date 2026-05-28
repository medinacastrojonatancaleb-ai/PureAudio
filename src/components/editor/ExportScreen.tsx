import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Check, Sparkles, AlertCircle, Share2, CornerDownRight } from 'lucide-react';

interface ExportScreenProps {
  isExporting: boolean;
  exportProgress: number;
  isExportDone: boolean;
  onCloseExport: () => void;
  onPublish: () => void;
  projectName: string;
}

export default function ExportScreen({
  isExporting,
  exportProgress,
  isExportDone,
  onCloseExport,
  onPublish,
  projectName
}: ExportScreenProps) {

  // Dynamic status description based on current percentage range
  const getProgressStatus = () => {
    if (exportProgress < 25) return 'Analizando pistas síncronas y marcos de video...';
    if (exportProgress < 50) return 'Mezclando pistas de audio e incrustando filtros visuales...';
    if (exportProgress < 75) return 'Inyectando karaoke, subtítulos y empaquetando stickers...';
    if (exportProgress < 95) return 'Generando miniaturas y optimizando peso para feeds móviles...';
    return 'Finalizando empaquetado y subiendo a Firebase Storage...';
  };

  return (
    <>
      <AnimatePresence>
        {isExporting && (
          <div className="fixed inset-0 bg-[#07080B]/95 backdrop-blur-md flex flex-col items-center justify-center z-[130] p-6 text-center select-none">
            <div className="space-y-6 max-w-sm w-full">
              
              {/* Spinner of light nodes */}
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 border-4 border-[#7C4DFF]/10 rounded-full" />
                <div className="absolute inset-0 border-4 border-t-[#7C4DFF] border-r-cyan-400 rounded-full animate-spin" />
                <div className="absolute inset-1.5 border-2 border-dashed border-[#7C4DFF]/20 rounded-full" />
              </div>

              <div className="space-y-2.5">
                <span className="text-[10px] font-mono font-black text-[#7C4DFF] uppercase tracking-[0.25em] block">
                  PROCESANDO EXPORTACIÓN CAPCUT
                </span>
                <h3 className="text-xl font-black text-white uppercase tracking-tight font-sans">
                  COMPILANDO {projectName || 'PROYECTO'}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed px-2 font-medium">
                  {getProgressStatus()}
                </p>
              </div>

              {/* Progress Line */}
              <div className="space-y-1.5 text-left bg-[#12141C] p-4 rounded-2xl border border-white/5">
                <div className="flex justify-between text-[11px] font-mono font-black text-white">
                  <span>PROGRESO:</span>
                  <span className="text-[#7C4DFF]">{exportProgress}%</span>
                </div>
                <div className="w-full h-2 bg-[#252830] rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-[#7C4DFF] to-cyan-400 transition-all duration-300" 
                    style={{ width: `${exportProgress}%` }} 
                  />
                </div>
                <div className="flex items-center gap-1.5 text-[8.5px] text-gray-500 font-bold uppercase mt-1 leading-none">
                  <AlertCircle size={9} className="text-[#7C4DFF]" />
                  <span>No cierres la pestaña del navegador móvil</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExportDone && (
          <div className="fixed inset-0 bg-[#07080B]/95 backdrop-blur-md flex flex-col items-center justify-center z-[130] p-6 text-center select-none">
            <div className="bg-[#12141C] border border-[#7C4DFF]/25 rounded-[32px] p-8 space-y-6 max-w-sm w-full shadow-3xl text-left relative">
              
              {/* Checkmark indicator badge */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-gradient-to-tr from-[#7C4DFF] to-cyan-400 rounded-full flex items-center justify-center border border-white/10 shadow-[0_0_35px_rgba(124,77,255,0.45)]">
                <Check size={32} className="text-black stroke-[3.5px]" />
              </div>
              
              <div className="text-center space-y-2 pt-6">
                <span className="text-[10px] font-mono font-black text-[#7C4DFF] uppercase tracking-[0.25em] block">
                  ÉXITO DE COMPILACIÓN
                </span>
                <h3 className="text-xl font-black text-white font-sans uppercase">
                  ¡LOOP LISTO PARA FEED!
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed font-medium">
                  El clip de video de 15 segundos ha sido codificado, sincronizado con las letras karaoke y guardado en tu biblioteca móvil. Ya puedes compartirlo en los feeds.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={onCloseExport}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-xs font-black uppercase border border-white/5 cursor-pointer text-center select-none active:scale-95 transition-all"
                >
                  Volver a Editar
                </button>
                <button
                  onClick={onPublish}
                  className="flex-1 py-3 bg-[#7C4DFF] hover:bg-[#8C5DFF] text-black rounded-xl text-xs font-black uppercase text-center shadow-lg hover:shadow-[#7C4DFF]/20 cursor-pointer select-none active:scale-95 transition-all flex items-center justify-center gap-1"
                >
                  <Share2 size={12} className="text-black" />
                  <span>Publicar Ahora</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
