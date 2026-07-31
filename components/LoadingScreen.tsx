'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sparkles, Flame, Sword, Backpack, Compass, Zap, ShieldAlert, Cpu } from 'lucide-react';

interface LoadingScreenProps {
  progress: number; // 0 to 1
  isReady: boolean;
}

const LORE_TIPS = [
  {
    icon: <Shield className="w-4 h-4 text-amber-400 shrink-0" />,
    title: 'Mecánica de Ruptura (Break)',
    tip: 'Atacar las debilidades de los enemigos reduce sus puntos de escudo hasta romper su guardia, dejándolos vulnerables e inhabilitados.',
  },
  {
    icon: <Flame className="w-4 h-4 text-orange-400 shrink-0" />,
    title: 'Puntos de Impulso (BP)',
    tip: 'Acumulas 1 BP al inicio de cada turno. ¡Utilízalos para potenciar tus habilidades hasta 4 veces más destructivas!',
  },
  {
    icon: <Sparkles className="w-4 h-4 text-yellow-300 shrink-0" />,
    title: 'Resonancia de Eco (Echo Chain)',
    tip: 'Asestar un golpe elemental contra un enemigo en estado de Ruptura desata una Resonancia de Daño Crítico adicional.',
  },
  {
    icon: <Flame className="w-4 h-4 text-rose-400 shrink-0" />,
    title: 'Hoguera de Descanso',
    tip: 'Visita el menú diario o una hoguera en el overworld para restaurar la salud de Eldor y activar el Vigor de Experiencia (+20% EXP).',
  },
  {
    icon: <Backpack className="w-4 h-4 text-emerald-400 shrink-0" />,
    title: 'Gestión de Equipamiento',
    tip: 'Equipa armas primarias y reliquias en la Mochila para adaptar tus atributos según el tipo de monstruo o jefe al que enfrentes.',
  },
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress, isReady }) => {
  const [tipIndex, setTipIndex] = useState(0);

  // Rotate tips every 3.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % LORE_TIPS.length);
    }, 3800);
    return () => clearInterval(interval);
  }, []);

  if (isReady) return null;

  const currentTip = LORE_TIPS[tipIndex];
  const percent = Math.min(100, Math.round(progress * 100));

  // Determine current milestone text
  let statusText = 'Iniciando Motor Gráfico 3D & Luces...';
  if (percent >= 25 && percent < 50) {
    statusText = 'Cargando Texturas, Mallas y Sprites del Héroe...';
  } else if (percent >= 50 && percent < 75) {
    statusText = 'Generando Aldea de Eldoria, Bosques y Colisiones...';
  } else if (percent >= 75 && percent < 95) {
    statusText = 'Sincronizando Sistema Octopath & Mochila de Objetos...';
  } else if (percent >= 95) {
    statusText = '¡El Reino de Eldoria está listo! Entrando...';
  }

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-between bg-slate-950 p-6 md:p-12 overflow-hidden select-none"
    >
      {/* Subtle Animated Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-950/20 via-slate-950 to-slate-950 pointer-events-none" />
      
      {/* Background Ember Particles Simulation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              x: `${(i * 8.3) % 100}%`,
              y: '110%',
              opacity: 0.2 + (i % 5) * 0.15,
              scale: 0.5 + (i % 3) * 0.3,
            }}
            animate={{
              y: '-10%',
              opacity: [0, 0.8, 0],
              x: [`${(i * 8.3) % 100}%`, `${((i * 8.3) + (i % 2 === 0 ? 5 : -5)) % 100}%`],
            }}
            transition={{
              duration: 4 + (i % 4) * 2,
              repeat: Infinity,
              delay: i * 0.4,
              ease: 'linear',
            }}
            className="absolute w-2 h-2 rounded-full bg-amber-400 blur-[1px] shadow-[0_0_8px_#f59e0b]"
          />
        ))}
      </div>

      {/* Top Header / System Badges */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[10px] tracking-[0.25em] uppercase">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          HD-2D JRPG TACTICAL ENGINE
        </div>
        <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
      </div>

      {/* Central Title & Arcane Emblem */}
      <div className="relative z-10 text-center space-y-5 my-auto max-w-xl">
        {/* Arcane Rotating Ring Logo */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-2 border-dashed border-amber-500/40"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-1 rounded-full border border-amber-400/20"
          />
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-950/80 via-slate-900 to-slate-950 border border-amber-500/60 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.25)]">
            <Sword className="w-7 h-7 text-amber-400 transform -rotate-45" />
          </div>
        </div>

        {/* Game Title */}
        <div className="space-y-1.5">
          <motion.h1
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 1 }}
            className="font-serif font-extrabold text-3xl sm:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-amber-500 tracking-[0.15em] drop-shadow-[0_2px_10px_rgba(245,158,11,0.2)]"
          >
            ELDOR: REINOS
          </motion.h1>
          <div className="text-xs sm:text-sm font-sans font-medium text-amber-200/80 tracking-[0.3em] uppercase">
            SISTEMA DE RUPTURA & RESONANCIA
          </div>
        </div>

        {/* Rotating Gameplay Tip Card */}
        <div className="pt-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={tipIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-xl text-left max-w-lg mx-auto"
            >
              <div className="flex items-center gap-2 mb-1.5 font-serif text-xs font-bold text-amber-300">
                {currentTip.icon}
                <span>{currentTip.title}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {currentTip.tip}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Loading Bar Section */}
      <div className="relative z-10 w-full max-w-md space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-mono text-slate-300 font-semibold tracking-wider">
            <span className="flex items-center gap-1.5 text-slate-400 font-sans text-[11px]">
              <Cpu className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              {statusText}
            </span>
            <span className="text-amber-400 font-mono font-bold text-sm">{percent}%</span>
          </div>

          {/* Progress Bar Container */}
          <div className="h-2 w-full bg-slate-900/90 rounded-full overflow-hidden border border-slate-800 p-0.5 shadow-inner">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: `${percent}%` }}
              transition={{ ease: 'easeOut', duration: 0.3 }}
              className="h-full rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 shadow-[0_0_12px_rgba(245,158,11,0.6)] relative"
            >
              {/* Highlight flare on bar tip */}
              <div className="absolute top-0 right-0 bottom-0 w-2 bg-white/80 rounded-full blur-[1px]" />
            </motion.div>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-slate-500 pt-1">
          <span className="flex items-center gap-1">
            <Compass className="w-3 h-3 text-slate-400" /> Cámara Iso-3D
          </span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-slate-400" /> Audio WebAudio
          </span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-slate-400" /> Combate Octopath
          </span>
        </div>
      </div>
    </motion.div>
  );
};
