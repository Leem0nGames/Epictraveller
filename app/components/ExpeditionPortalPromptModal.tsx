'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Compass, Home, Swords, X } from 'lucide-react';
import { DANGER_ZONES } from '../../game/Systems/Expedition/ExpeditionManager';

interface ExpeditionPortalPromptModalProps {
  targetMapId: string;
  targetName: string;
  onConfirmAdvance: () => void;
  onExtractSanctuary: () => void;
  onClose: () => void;
}

export const ExpeditionPortalPromptModal: React.FC<ExpeditionPortalPromptModalProps> = ({
  targetMapId,
  targetName,
  onConfirmAdvance,
  onExtractSanctuary,
  onClose,
}) => {
  const zone = DANGER_ZONES[targetMapId] || {
    level: 'HIGH',
    name: targetName,
    badge: 'ZONA DE PELIGRO',
    color: 'from-amber-500 to-rose-600',
    borderColor: 'border-amber-500',
    multiplier: 1.5,
    expBonusPercent: 30,
    description: 'Nuevos peligros te aguardan. El botín no asegurado estará expuesto en caso de caer.',
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className={`relative w-full max-w-md rounded-3xl bg-slate-950 border p-6 shadow-2xl overflow-hidden ${zone.borderColor}`}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full bg-slate-900 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* ICON HEADER */}
          <div className="flex flex-col items-center text-center gap-2 mb-5">
            <div className={`p-3.5 rounded-2xl bg-gradient-to-r ${zone.color} text-white shadow-xl animate-pulse`}>
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-amber-400">
                {zone.badge}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                Recompensas x{zone.multiplier}
              </span>
            </div>

            <h2 className="text-xl font-black font-serif text-slate-100">
              ¿Cruzar Portal hacia {zone.name}?
            </h2>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded-2xl border border-slate-800 mt-2">
              {zone.description}
            </p>
          </div>

          {/* BUTTONS */}
          <div className="space-y-2.5">
            <button
              onClick={onConfirmAdvance}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all active:scale-98"
            >
              <Swords className="w-4 h-4" />
              <span>Avanzar a la Expedición</span>
            </button>

            <button
              onClick={onExtractSanctuary}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <Home className="w-4 h-4 text-emerald-400" />
              <span>Permanecer en el Pueblo</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
