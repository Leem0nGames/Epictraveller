'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Star,
  Award,
  TrendingUp,
  Sword,
  Shield,
  Heart,
  Zap,
  CheckCircle2,
  ChevronRight,
  Crown,
  BookOpen,
} from 'lucide-react';
import { EventBus } from '../../game/Core/EventBus';

export interface LevelUpData {
  level: number;
  previousLevel?: number;
  stats: {
    atk: number;
    def: number;
    hp: number;
    mp: number;
    talentPoints?: number;
  };
  newUnlocks?: Array<{
    name: string;
    icon: string;
    description: string;
    type: string;
  }>;
  archetypeUnlocked?: boolean;
  archetype?: string | null;
}

interface LevelUpOverlayProps {
  onOpenTalents?: () => void;
}

// Pure deterministic pseudo-random generator
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// Pre-generate static particle structures using deterministic mathematical formulas
const AMBIENT_PARTICLES = Array.from({ length: 28 }).map((_, i) => {
  const colors = ['#fef08a', '#fbbf24', '#f59e0b', '#38bdf8', '#ffffff'];
  const r1 = pseudoRandom(i * 7 + 1);
  const r2 = pseudoRandom(i * 7 + 2);
  const r3 = pseudoRandom(i * 7 + 3);
  const r4 = pseudoRandom(i * 7 + 4);
  const r5 = pseudoRandom(i * 7 + 5);

  return {
    id: i,
    left: r1 * 100,
    top: r2 * 100,
    size: r3 * 6 + 3,
    color: colors[i % colors.length],
    duration: r4 * 3 + 2.5,
    delay: r5 * 2,
    xOffset: (r1 - 0.5) * 40,
  };
});

const BURST_PARTICLES = Array.from({ length: 16 }).map((_, i) => {
  const count = 16;
  const angle = (i * 360) / count;
  const rad = (angle * Math.PI) / 180;
  const r1 = pseudoRandom(i * 3 + 100);
  const r2 = pseudoRandom(i * 3 + 200);
  const distance = r1 * 100 + 160;

  return {
    id: i,
    x: Math.cos(rad) * distance,
    y: Math.sin(rad) * distance,
    size: r2 * 8 + 4,
    delay: r1 * 0.15,
  };
});

export const LevelUpOverlay: React.FC<LevelUpOverlayProps> = ({ onOpenTalents }) => {
  const [levelUpData, setLevelUpData] = useState<LevelUpData | null>(null);
  const [isTransitioningToTalents, setIsTransitioningToTalents] = useState(false);

  useEffect(() => {
    const handleLevelUp = (data: LevelUpData) => {
      setLevelUpData(data);
      setIsTransitioningToTalents(false);
    };

    EventBus.getInstance().on('progression:level_up', handleLevelUp);
    return () => {
      EventBus.getInstance().off('progression:level_up', handleLevelUp);
    };
  }, []);

  if (!levelUpData) return null;

  const previousLvl = levelUpData.previousLevel || Math.max(1, levelUpData.level - 1);

  const handleUseTalents = () => {
    if (!onOpenTalents) {
      setLevelUpData(null);
      return;
    }

    setIsTransitioningToTalents(true);

    // Smooth transition delay before switching to the talent modal
    setTimeout(() => {
      onOpenTalents();
      setLevelUpData(null);
      setIsTransitioningToTalents(false);
    }, 320);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none overflow-hidden"
      >
        {/* Transition Flash overlay when switching to Talents */}
        <AnimatePresence>
          {isTransitioningToTalents && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 2.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="absolute inset-0 bg-gradient-to-r from-amber-500/80 via-yellow-300/90 to-amber-500/80 blur-3xl z-50 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Ambient Floating Gold Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {AMBIENT_PARTICLES.map((p) => (
            <motion.div
              key={p.id}
              initial={{
                opacity: 0,
                x: `${p.left}%`,
                y: `${p.top}%`,
                scale: 0.2,
              }}
              animate={{
                opacity: [0, 0.9, 0],
                y: [`${p.top}%`, `${p.top - 20}%`],
                x: [`${p.left}%`, `${p.left + p.xOffset}%`],
                scale: [0.2, 1, 0.2],
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
                ease: 'easeInOut',
              }}
              style={{
                position: 'absolute',
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: '50%',
                boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
              }}
            />
          ))}
        </div>

        {/* Explosive Radial Spark Burst on Mount */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          {BURST_PARTICLES.map((bp) => (
            <motion.div
              key={bp.id}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: bp.x,
                y: bp.y,
                opacity: 0,
                scale: 0.2,
              }}
              transition={{
                duration: 0.8,
                delay: bp.delay,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="absolute rounded-full bg-gradient-to-r from-yellow-200 via-amber-400 to-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.9)]"
              style={{ width: bp.size, height: bp.size }}
            />
          ))}
        </div>

        {/* Animated Rotating Background Light Rays */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="w-[850px] h-[850px] rounded-full bg-[radial-gradient(circle,_rgba(245,158,11,0.45)_0%,_rgba(217,119,6,0.15)_45%,_transparent_70%)] blur-2xl"
          />
        </div>

        {/* Level Up Card Container */}
        <motion.div
          initial={{ scale: 0.75, y: 40, opacity: 0, filter: 'blur(10px)' }}
          animate={
            isTransitioningToTalents
              ? { scale: 1.12, y: -10, opacity: 0, filter: 'blur(12px)' }
              : { scale: 1, y: 0, opacity: 1, filter: 'blur(0px)' }
          }
          exit={{ scale: 0.8, y: 20, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="relative bg-gradient-to-b from-[#1c1535] via-[#10162a] to-[#090d18] border-2 border-amber-400/90 rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-[0_0_90px_rgba(245,158,11,0.5),0_0_30px_rgba(234,179,8,0.3)] flex flex-col items-center gap-4 sm:gap-5 text-center text-slate-100 z-10 overflow-hidden"
        >
          {/* Shimmer Light Line Sweep */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '250%' }}
            transition={{
              repeat: Infinity,
              repeatDelay: 3.5,
              duration: 1.6,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-amber-300/15 to-transparent -skew-x-12 pointer-events-none"
          />

          {/* Top Floating Glow Emblem */}
          <motion.div
            initial={{ scale: 0, rotate: -25 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 350, damping: 18 }}
            className="relative"
          >
            {/* Glowing Aura Ring */}
            <motion.div
              animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 blur-lg opacity-70"
            />

            <div className="relative w-18 h-18 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 border-2 border-yellow-100 flex items-center justify-center text-3xl sm:text-4xl shadow-[0_0_40px_rgba(245,158,11,0.8)]">
              👑
            </div>

            <motion.div
              animate={{ scale: [1, 1.3, 1], rotate: [0, 15, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-2.5 -right-2.5 p-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 font-black shadow-lg"
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-950" />
            </motion.div>
          </motion.div>

          {/* Header Title with Golden Typography & Glow */}
          <div className="space-y-1.5 relative w-full">
            {/* Filigree decorative wings */}
            <div className="flex items-center justify-center gap-2 text-amber-400/80">
              <span className="text-amber-400 font-serif text-sm">⚜️</span>
              <motion.span
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-xs sm:text-sm font-mono font-black tracking-[0.3em] text-amber-300 uppercase block drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]"
              >
                ¡NIVEL AUMENTADO!
              </motion.span>
              <span className="text-amber-400 font-serif text-sm">⚜️</span>
            </div>

            {/* Main Level Title in Golden Sheen & Glow */}
            <motion.h2
              initial={{ opacity: 0, scale: 0.85, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ delay: 0.2, type: 'spring', damping: 20, stiffness: 250 }}
              className="font-cinzel font-black text-3xl sm:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-amber-300 via-yellow-400 to-amber-600 tracking-wider uppercase drop-shadow-[0_0_30px_rgba(245,158,11,0.9)] [text-shadow:_0_0_20px_rgba(251,191,36,0.9),_0_0_40px_rgba(217,119,6,0.7)]"
            >
              NIVEL {levelUpData.level}
            </motion.h2>

            <div className="flex items-center justify-center gap-2 pt-0.5 font-mono text-xs text-amber-300/90">
              <span className="opacity-80">Nivel {previousLvl}</span>
              <ChevronRight className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="font-black text-amber-200 text-sm drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]">
                Nivel {levelUpData.level}
              </span>
            </div>
          </div>

          {/* Stat Increases Grid */}
          <div className="w-full space-y-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-widest block text-left px-1">
              MEJORAS DE ATRIBUTOS OBTENIDAS
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {/* Talent Points */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="col-span-2 sm:col-span-1 bg-gradient-to-r from-amber-950/80 to-yellow-950/80 border border-amber-400/90 rounded-2xl p-2.5 flex items-center gap-2.5 shadow-[0_0_20px_rgba(245,158,11,0.25)]"
              >
                <div className="p-2 rounded-xl bg-amber-500/25 text-amber-300 border border-amber-400/50 shrink-0">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400 animate-pulse" />
                </div>
                <div className="text-left min-w-0">
                  <span className="text-[9px] font-mono text-amber-300 uppercase block font-bold">TALENTO</span>
                  <span className="font-mono font-black text-xs sm:text-sm text-amber-100">+1 Punto</span>
                </div>
              </motion.div>

              {/* Max HP */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-emerald-950/50 border border-emerald-500/60 rounded-2xl p-2.5 flex items-center gap-2.5"
              >
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shrink-0">
                  <Heart className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-left min-w-0">
                  <span className="text-[9px] font-mono text-emerald-300 uppercase block font-bold">HP MAX</span>
                  <span className="font-mono font-bold text-xs sm:text-sm text-emerald-200">+{levelUpData.stats.hp}</span>
                </div>
              </motion.div>

              {/* Max MP */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-indigo-950/50 border border-indigo-500/60 rounded-2xl p-2.5 flex items-center gap-2.5"
              >
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 shrink-0">
                  <Zap className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-left min-w-0">
                  <span className="text-[9px] font-mono text-indigo-300 uppercase block font-bold">MP MAX</span>
                  <span className="font-mono font-bold text-xs sm:text-sm text-indigo-200">+{levelUpData.stats.mp}</span>
                </div>
              </motion.div>

              {/* Attack */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-rose-950/50 border border-rose-500/60 rounded-2xl p-2.5 flex items-center gap-2.5"
              >
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-400/40 shrink-0">
                  <Sword className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-left min-w-0">
                  <span className="text-[9px] font-mono text-rose-300 uppercase block font-bold">ATAQUE</span>
                  <span className="font-mono font-bold text-xs sm:text-sm text-rose-200">+{levelUpData.stats.atk}</span>
                </div>
              </motion.div>

              {/* Defense */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="col-span-1 sm:col-span-2 bg-sky-950/50 border border-sky-500/60 rounded-2xl p-2.5 flex items-center gap-2.5"
              >
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-400/40 shrink-0">
                  <Shield className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-left min-w-0">
                  <span className="text-[9px] font-mono text-sky-300 uppercase block font-bold">DEFENSA</span>
                  <span className="font-mono font-bold text-xs sm:text-sm text-sky-200">+{levelUpData.stats.def}</span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Archetype Unlock Banner (Level 5 Special) */}
          {levelUpData.archetypeUnlocked && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="w-full bg-gradient-to-r from-amber-950 via-yellow-950 to-amber-950 border-2 border-amber-400 p-3.5 rounded-2xl flex items-center gap-3 text-left shadow-[0_0_25px_rgba(245,158,11,0.4)] relative overflow-hidden"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-2xl text-amber-950 font-black shrink-0 shadow-md">
                👑
              </div>
              <div>
                <h4 className="font-cinzel font-bold text-xs text-amber-200 uppercase tracking-wide">
                  ¡SISTEMA DE ARQUETIPOS DESBLOQUEADO!
                </h4>
                <p className="text-[10px] text-slate-300 font-sans leading-tight mt-0.5">
                  Elige entre Kshatriya, Gandiva, Brahma o Dharma y desata poderosas técnicas de combate en Midgard-Loka.
                </p>
              </div>
            </motion.div>
          )}

          {/* Unlocked Talent Tier / Skills Preview */}
          {levelUpData.newUnlocks && levelUpData.newUnlocks.length > 0 && (
            <div className="w-full space-y-1.5 text-left">
              <span className="text-[10px] font-mono text-amber-400 uppercase font-bold tracking-widest block">
                NUEVAS HABILIDADES Y TALENTOS DISPONIBLES
              </span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {levelUpData.newUnlocks.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-slate-900/80 border border-amber-500/40 flex items-center gap-2.5"
                  >
                    <span className="text-lg shrink-0">{item.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs text-amber-100">{item.name}</span>
                        <span className="text-[9px] font-mono font-bold text-amber-300 bg-amber-950 px-1.5 py-0.2 rounded border border-amber-800">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate font-sans">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="w-full flex items-center gap-2.5 pt-2.5 border-t border-slate-800/80">
            {onOpenTalents && (
              <button
                onClick={handleUseTalents}
                disabled={isTransitioningToTalents}
                className="flex-1 py-3 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-amber-950 font-mono text-xs font-black border border-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-950 animate-spin" style={{ animationDuration: '6s' }} />
                <span>USAR TALENTOS</span>
              </button>
            )}

            <button
              onClick={() => setLevelUpData(null)}
              disabled={isTransitioningToTalents}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>ACEPTAR</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
