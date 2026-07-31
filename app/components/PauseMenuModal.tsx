'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Volume2, Shield, Settings, RotateCcw } from 'lucide-react';
import { EventBus } from '@/game/Core/EventBus';

interface PauseMenuModalProps {
  isOpen: boolean;
  onResume: () => void;
}

export const PauseMenuModal: React.FC<PauseMenuModalProps> = ({ isOpen, onResume }) => {
  if (!isOpen) return null;

  const handleResume = () => {
    onResume();
  };

  const handleResetToSanctuary = () => {
    EventBus.getInstance().emit('map:change_request', {
      targetMapId: 'village',
      targetX: 0,
      targetZ: 2,
    });
    onResume();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 10 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-[#0d1117]/95 p-6 shadow-2xl text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-amber-100 font-serif">Juego En Pausa</h2>
                <p className="text-xs text-slate-400">Estado global del juego</p>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-slate-800 text-amber-400 border border-amber-500/20">
              PAUSED
            </span>
          </div>

          {/* Action Menu */}
          <div className="space-y-3 mb-6">
            <button
              onClick={handleResume}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold transition-all shadow-lg shadow-amber-500/20 group"
            >
              <span className="flex items-center gap-2.5">
                <Play className="w-5 h-5 fill-slate-950" />
                Continuar Expedición
              </span>
              <span className="text-xs font-mono opacity-80 group-hover:translate-x-0.5 transition-transform">[P / ESC]</span>
            </button>

            <button
              onClick={handleResetToSanctuary}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 text-sm font-medium transition-all"
            >
              <span className="flex items-center gap-2.5">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                Volver al Santuario (Pueblo)
              </span>
            </button>
          </div>

          {/* Controls hint */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-xs text-slate-400 space-y-2">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-amber-400" /> Atajos de Teclado
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="flex justify-between"><span>Mover:</span> <span className="text-amber-300">WASD</span></div>
              <div className="flex justify-between"><span>Interactuar:</span> <span className="text-amber-300">E / Espacio</span></div>
              <div className="flex justify-between"><span>Inventario:</span> <span className="text-amber-300">I / B</span></div>
              <div className="flex justify-between"><span>Menú / Pausa:</span> <span className="text-amber-300">P / M</span></div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
