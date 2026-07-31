'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Skull, 
  Coins, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { ExpeditionManager } from '../../game/Systems/Expedition/ExpeditionManager';

interface ExpeditionSummaryModalProps {
  onClose: () => void;
}

export const ExpeditionSummaryModal: React.FC<ExpeditionSummaryModalProps> = ({ onClose }) => {
  const summary = ExpeditionManager.getInstance().getLastSummary();

  if (!summary) return null;

  const isVictory = summary.type === 'EXTRACTION_VICTORY';
  const stats = summary.stats;

  const minutes = Math.floor(stats.durationSeconds / 60);
  const seconds = stats.durationSeconds % 60;
  const formattedTime = `${minutes}m ${seconds}s`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className={`relative w-full max-w-lg rounded-3xl bg-slate-950 border p-6 shadow-2xl overflow-hidden ${
            isVictory
              ? 'border-amber-400/80 shadow-[0_0_50px_rgba(245,158,11,0.3)]'
              : 'border-rose-600/80 shadow-[0_0_50px_rgba(225,29,72,0.3)]'
          }`}
        >
          {/* BACKGROUND GLOW ACCENT */}
          <div className={`absolute -top-24 -left-24 w-64 h-64 rounded-full blur-3xl opacity-25 pointer-events-none ${
            isVictory ? 'bg-amber-400' : 'bg-rose-600'
          }`} />

          {/* HEADER BANNER */}
          <div className="flex flex-col items-center text-center gap-2 mb-6">
            <div className={`p-4 rounded-2xl border shadow-xl flex items-center justify-center ${
              isVictory
                ? 'bg-gradient-to-br from-amber-500 to-yellow-600 border-amber-300 text-slate-950 shadow-amber-500/30'
                : 'bg-gradient-to-br from-rose-700 to-red-900 border-rose-500 text-white shadow-rose-700/30'
            }`}>
              {isVictory ? <Trophy className="w-8 h-8" /> : <Skull className="w-8 h-8 animate-bounce" />}
            </div>

            <h2 className="text-xl sm:text-2xl font-black font-serif uppercase tracking-wider text-slate-100 mt-1">
              {isVictory ? '¡REGRESO VICTORIOSO AL SANTUARIO!' : 'DERROTA EN LA EXPEDICIÓN'}
            </h2>

            <p className="text-xs font-mono text-slate-300 max-w-sm">
              {isVictory
                ? 'Has extraído con vida a Midgard-Loka. Todo tu botín y recursos han sido guardados a salvo en el depósito.'
                : 'Caíste en combate. Los Kshatriya te rescataron de emergencia, pero parte del botín no asegurado se perdió.'}
            </p>
          </div>

          {/* METRICS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl flex flex-col items-center text-center">
              <Clock className="w-4 h-4 text-sky-400 mb-1" />
              <span className="text-[10px] font-mono text-slate-400 uppercase">Tiempo</span>
              <span className="text-xs font-mono font-bold text-slate-200">{formattedTime}</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl flex flex-col items-center text-center">
              <Skull className="w-4 h-4 text-rose-400 mb-1" />
              <span className="text-[10px] font-mono text-slate-400 uppercase">Derrotados</span>
              <span className="text-xs font-mono font-bold text-slate-200">{stats.monstersDefeated} Monstruos</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl flex flex-col items-center text-center">
              <Coins className="w-4 h-4 text-amber-400 mb-1" />
              <span className="text-[10px] font-mono text-slate-400 uppercase">Oro Bankeado</span>
              <span className="text-xs font-mono font-bold text-amber-300">+{summary.goldBanked}</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl flex flex-col items-center text-center">
              <Sparkles className="w-4 h-4 text-emerald-400 mb-1" />
              <span className="text-[10px] font-mono text-slate-400 uppercase">Bono Extraer</span>
              <span className="text-xs font-mono font-bold text-emerald-300">+{summary.expBonusGained} EXP</span>
            </div>
          </div>

          {/* LOOT BREAKDOWN SECTION */}
          <div className="space-y-3 mb-6">
            {/* SECURED LOOT */}
            <div className="bg-slate-900/80 border border-emerald-500/30 p-3 rounded-2xl">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 uppercase mb-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Botín Asegurado ({summary.itemsBanked.length} Objetos)</span>
              </div>

              {summary.itemsBanked.length === 0 ? (
                <div className="text-xs text-slate-500 italic">No había objetos para guardar.</div>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {summary.itemsBanked.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-[11px] font-medium text-emerald-200 flex items-center gap-1"
                    >
                      {item.name} <strong className="text-amber-300">x{item.count}</strong>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* LOST LOOT IF DEFEATED */}
            {!isVictory && (
              <div className="bg-slate-900/80 border border-rose-500/40 p-3 rounded-2xl">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-rose-400 uppercase mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Botín Perdido ({summary.itemsLost.length} Objetos | -{summary.goldLost} Oro)</span>
                </div>

                {summary.itemsLost.length === 0 ? (
                  <div className="text-xs text-slate-500 italic">No se perdieron objetos clave.</div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {summary.itemsLost.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded-lg bg-rose-950/60 border border-rose-500/40 text-[11px] font-medium text-rose-300 line-through opacity-80"
                      >
                        {item.name} x{item.count}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ACTION BUTTON */}
          <button
            onClick={() => {
              ExpeditionManager.getInstance().clearLastSummary();
              onClose();
            }}
            className={`w-full py-3 rounded-2xl font-bold font-sans text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all active:scale-98 ${
              isVictory
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:from-amber-400 hover:to-yellow-300 shadow-amber-500/30'
                : 'bg-gradient-to-r from-slate-800 to-slate-900 text-slate-200 border border-slate-700 hover:bg-slate-800'
            }`}
          >
            <span>Continuar Aventuras</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
