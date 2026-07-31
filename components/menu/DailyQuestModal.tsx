'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Flame, Award, CheckCircle2, Shield, Zap, Sparkles, X, Heart } from 'lucide-react';
import { DailyProgressionSystem, DailyQuest, RestBuff } from '../../game/Systems/Progression/DailyProgressionSystem';
import { FantasySFX } from '../../game/Systems/FantasySFX';

interface DailyQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyQuestModal: React.FC<DailyQuestModalProps> = ({ isOpen, onClose }) => {
  const [quests, setQuests] = useState<DailyQuest[]>(() => DailyProgressionSystem.getInstance().getQuests());
  const [streakDays, setStreakDays] = useState<number>(() => DailyProgressionSystem.getInstance().getStreakDays());
  const [streakBonus, setStreakBonus] = useState<number>(() => DailyProgressionSystem.getInstance().getStreakExpBonus());
  const [activeBuff, setActiveBuff] = useState<RestBuff | null>(() => DailyProgressionSystem.getInstance().getActiveRestBuff());

  const refreshState = () => {
    const dailySys = DailyProgressionSystem.getInstance();
    setQuests([...dailySys.getQuests()]);
    setStreakDays(dailySys.getStreakDays());
    setStreakBonus(dailySys.getStreakExpBonus());
    setActiveBuff(dailySys.getActiveRestBuff());
  };

  if (!isOpen) return null;

  const handleRest = () => {
    DailyProgressionSystem.getInstance().restAtCampfire();
    refreshState();
    FantasySFX.getInstance().playHealChime();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-serif tracking-wide">
                Jornada Diaria & Misiones (10-20 Min)
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Avanza a tu ritmo diario con bonificaciones exclusivas
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              FantasySFX.getInstance().playButtonClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 font-sans">
          {/* Daily Streak & Bonus Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-900 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-lg">
                <Flame className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-amber-200">
                    Racha Diaria: {streakDays} día{streakDays > 1 ? 's' : ''}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                    +{streakBonus}% EXP Bonus
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  ¡Sigue jugando a diario para maximizar tus recompensas!
                </p>
              </div>
            </div>
          </div>

          {/* Campfire Rest Section */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Hoguera de Descanso
                  {activeBuff && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Activo ({activeBuff.battlesRemaining} batallas)
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400">
                  Recupera tu vitalidad y activa el vigor (+20% EXP por 3 batallas)
                </p>
              </div>
            </div>

            <button
              onClick={handleRest}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-lg active:scale-95 shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <Flame className="w-4 h-4" /> Descansar
            </button>
          </div>

          {/* Daily Quests List */}
          <div>
            <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2 font-serif">
              <Award className="w-4 h-4 text-amber-400" /> Misiones de Hoy
            </h3>

            <div className="space-y-3">
              {quests.map((q) => (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border transition-all ${
                    q.completed
                      ? 'bg-emerald-950/20 border-emerald-500/40'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        {q.title}
                        {q.completed && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 inline" />
                        )}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">{q.description}</p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 shrink-0">
                      {q.rewardText}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                      <span>Progreso</span>
                      <span>
                        {q.current} / {q.target}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full transition-all duration-500 ${
                          q.completed ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                        style={{ width: `${Math.min(100, (q.current / q.target) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 text-center">
          <button
            onClick={() => {
              FantasySFX.getInstance().playButtonClick();
              onClose();
            }}
            className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Aceptar & Cerrar
          </button>
        </div>
      </motion.div>
    </div>
  );
};
