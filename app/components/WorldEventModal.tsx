'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Coins, 
  Swords, 
  FlaskConical, 
  EyeOff, 
  Shield, 
  Lock, 
  Heart, 
  MapPin, 
  ArrowRight, 
  Skull, 
  X,
  Compass,
  AlertCircle
} from 'lucide-react';
import { DynamicWorldEventsSystem, WorldEventChoice } from '../../game/Systems/DynamicWorldEventsSystem';

const ICON_MAP: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-4 h-4 text-emerald-400" />,
  Coins: <Coins className="w-4 h-4 text-amber-400" />,
  Swords: <Swords className="w-4 h-4 text-rose-400" />,
  FlaskConical: <FlaskConical className="w-4 h-4 text-emerald-400" />,
  EyeOff: <EyeOff className="w-4 h-4 text-sky-400" />,
  Shield: <Shield className="w-4 h-4 text-amber-400" />,
  Lock: <Lock className="w-4 h-4 text-purple-400" />,
  Heart: <Heart className="w-4 h-4 text-rose-400" />,
  MapPin: <MapPin className="w-4 h-4 text-sky-400" />,
  ArrowRight: <ArrowRight className="w-4 h-4 text-slate-400" />,
  Skull: <Skull className="w-4 h-4 text-rose-500" />,
  X: <X className="w-4 h-4 text-slate-400" />,
};

export const WorldEventModal: React.FC = () => {
  const [eventData, setEventData] = React.useState(DynamicWorldEventsSystem.getInstance().getActiveEvent());

  React.useEffect(() => {
    const sys = DynamicWorldEventsSystem.getInstance();
    const update = () => setEventData(sys.getActiveEvent());
    update();
    return sys.subscribe(update);
  }, []);

  if (!eventData) return null;

  const handleChoiceClick = (choiceId: string) => {
    DynamicWorldEventsSystem.getInstance().resolveEventChoice(choiceId);
  };

  const handleDismiss = () => {
    DynamicWorldEventsSystem.getInstance().dismissActiveEvent();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md select-none">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg rounded-3xl bg-slate-950 border border-amber-500/60 p-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-900 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* EVENT BANNER HEADER */}
          <div className="flex flex-col items-center text-center gap-2 mb-5">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-[10px] font-mono font-bold text-amber-300 uppercase tracking-widest">
              <Compass className="w-3.5 h-3.5" />
              <span>{eventData.badge}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black font-serif text-slate-100 mt-1">
              {eventData.title}
            </h2>

            <span className="text-xs font-mono text-amber-400/90 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {eventData.locationName}
            </span>

            <p className="text-xs text-slate-300 leading-relaxed max-w-md mt-2 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
              {eventData.description}
            </p>
          </div>

          {/* CHOICE OPTIONS LIST */}
          <div className="space-y-2.5 mb-2">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-between">
              <span>Toma una decisión estratégica</span>
              <span className="text-amber-400">Historia del Mundo</span>
            </div>

            {eventData.choices.map((choice: WorldEventChoice) => {
              const iconNode = ICON_MAP[choice.icon] || <ArrowRight className="w-4 h-4 text-slate-400" />;

              return (
                <button
                  key={choice.id}
                  onClick={() => handleChoiceClick(choice.id)}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all duration-200 group flex items-start justify-between gap-3 active:scale-98 ${
                    choice.type === 'COMBAT'
                      ? 'bg-rose-950/40 border-rose-500/50 hover:bg-rose-900/50 hover:border-rose-400'
                      : choice.type === 'RESOURCE'
                      ? 'bg-amber-950/40 border-amber-500/50 hover:bg-amber-900/50 hover:border-amber-400'
                      : choice.type === 'PURIFY'
                      ? 'bg-emerald-950/40 border-emerald-500/50 hover:bg-emerald-900/50 hover:border-emerald-400'
                      : choice.type === 'STEALTH'
                      ? 'bg-sky-950/40 border-sky-500/50 hover:bg-sky-900/50 hover:border-sky-400'
                      : 'bg-slate-900/90 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 shrink-0 mt-0.5">
                      {iconNode}
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-100 group-hover:text-amber-200 transition-colors">
                          {choice.label}
                        </span>

                        {choice.type === 'STEALTH' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-sky-950 text-sky-300 border border-sky-500/30">
                            SIGILO
                          </span>
                        )}
                        {choice.type === 'COMBAT' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-500/30">
                            COMBATE
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] text-slate-400 group-hover:text-slate-300">
                        {choice.sublabel}
                      </span>
                    </div>
                  </div>

                  {/* REQUIREMENT COST BADGES */}
                  <div className="shrink-0 flex items-center gap-1">
                    {choice.requiredGold && (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/40 font-mono text-[10px] font-bold">
                        {choice.requiredGold} Oro
                      </span>
                    )}
                    {choice.requiredItem && (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-mono text-[10px] font-bold">
                        Poción
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
