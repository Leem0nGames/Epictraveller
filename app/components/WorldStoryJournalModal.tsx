'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Sparkles, Skull, Compass, Home, X, Clock } from 'lucide-react';
import { DynamicWorldEventsSystem, StoryLogEntry } from '../../game/Systems/DynamicWorldEventsSystem';

interface WorldStoryJournalModalProps {
  onClose: () => void;
}

export const WorldStoryJournalModal: React.FC<WorldStoryJournalModalProps> = ({ onClose }) => {
  const [log, setLog] = React.useState<StoryLogEntry[]>([]);

  React.useEffect(() => {
    const sys = DynamicWorldEventsSystem.getInstance();
    const update = () => setLog(sys.getStoryLog());
    update();
    return sys.subscribe(update);
  }, []);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg rounded-3xl bg-slate-950 border border-slate-800 p-6 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-900 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* HEADER */}
          <div className="flex items-center gap-3 mb-4 shrink-0">
            <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300">
              <BookOpen className="w-6 h-6" />
            </div>

            <div className="flex flex-col">
              <h2 className="text-lg font-bold font-serif text-slate-100 uppercase tracking-wider">
                Bitácora de Historias del Mundo
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                Relatos y acontecimientos únicos emergidos de tus expediciones
              </span>
            </div>
          </div>

          {/* STORY LOG ENTRIES LIST */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {log.length === 0 ? (
              <div className="text-center py-12 text-slate-500 italic text-xs">
                No has registrado acontecimientos en esta expedición aún.<br />
                Explora el mapa para desencadenar historias dinámicas.
              </div>
            ) : (
              log.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3"
                >
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 shrink-0 mt-0.5">
                    {entry.type === 'ELITE_BOSS' && <Skull className="w-4 h-4 text-rose-400" />}
                    {entry.type === 'EVENT' && <Sparkles className="w-4 h-4 text-amber-400" />}
                    {entry.type === 'EXTRACTION' && <Home className="w-4 h-4 text-emerald-400" />}
                    {entry.type === 'DISCOVERY' && <Compass className="w-4 h-4 text-sky-400" />}
                  </div>

                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-200">
                        {entry.title}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" /> {entry.timestamp}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {entry.outcomeText}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
