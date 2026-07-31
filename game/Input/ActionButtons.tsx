'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Game } from '../Core/Game';
import { MobileConfig } from '../Mobile/MobileConfig';
import { MessageSquare, Sparkles, Sword, Gift, DoorOpen, Compass, Flame } from 'lucide-react';
import { EventBus } from '../Core/EventBus';

interface ActionButtonsProps {
  isVisible: boolean;
}

/**
 * Ergonomic Contextual Action Cluster for JRPG Overworld.
 * Features 1 Dynamic Contextual Action Button (adapts to nearby NPCs, Chests, Pickups, Portals, Objects)
 * and 1 Combat Attack Button.
 */
export const ActionButtons: React.FC<ActionButtonsProps> = ({ isVisible }) => {
  const [interaction, setInteraction] = useState<{ type: string; near: boolean } | null>(null);

  useEffect(() => {
    const eventBus = EventBus.getInstance();
    const handler = (data: any) => {
      if (data.near) {
        setInteraction({ type: data.type, near: true });
      } else {
        setInteraction(null);
      }
    };
    eventBus.on('interaction:proximity', handler);
    return () => eventBus.off('interaction:proximity', handler);
  }, []);

  const handleButtonDown = (action: string) => {
    const game = (window as any)._gameInstance || Game.getInstance();
    if (game?.input) {
      game.input.triggerActionDown(action);
    }
  };

  const handleButtonUp = (action: string) => {
    const game = (window as any)._gameInstance || Game.getInstance();
    if (game?.input) {
      game.input.triggerActionUp(action);
    }
  };

  if (!isVisible) return null;

  // Determine dynamic button visual styling, icon, and label based on interaction proximity
  let buttonStyle = "from-[#111827] to-[#1f2937] border-amber-500/50 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.2)]";
  let buttonText = "EXAMINAR";
  let IconComponent = Sparkles;

  if (interaction?.near) {
    switch (interaction.type) {
      case 'NPC':
        buttonStyle = "from-[#064e3b] to-[#047857] border-emerald-400 text-emerald-100 shadow-[0_0_25px_rgba(16,185,129,0.4)]";
        buttonText = "HABLAR";
        IconComponent = MessageSquare;
        break;
      case 'ENEMY':
        buttonStyle = "from-[#7f1d1d] to-[#b91c1c] border-red-400 text-red-100 shadow-[0_0_25px_rgba(239,68,68,0.4)]";
        buttonText = "ATACAR";
        IconComponent = Sword;
        break;
      case 'CHEST':
        buttonStyle = "from-[#78350f] to-[#b45309] border-amber-300 text-amber-100 shadow-[0_0_25px_rgba(245,158,11,0.4)]";
        buttonText = "ABRIR";
        IconComponent = Gift;
        break;
      case 'PICKUP':
        buttonStyle = "from-[#0c4a6e] to-[#0284c7] border-sky-300 text-sky-100 shadow-[0_0_25px_rgba(56,189,248,0.4)]";
        buttonText = "TOMAR";
        IconComponent = Sparkles;
        break;
      case 'DOOR':
      case 'PORTAL':
        buttonStyle = "from-[#164e63] to-[#0891b2] border-cyan-300 text-cyan-100 shadow-[0_0_25px_rgba(6,182,212,0.4)]";
        buttonText = "ENTRAR";
        IconComponent = DoorOpen;
        break;
      default:
        buttonStyle = "from-[#78350f] to-[#b45309] border-amber-400 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.35)]";
        buttonText = "USAR";
        IconComponent = Compass;
        break;
    }
  }

  return (
    <div 
      className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 select-none pointer-events-auto flex items-end gap-3 sm:gap-4"
      style={{
        paddingBottom: MobileConfig.SAFE_AREA.NOTCH_PADDING_BOTTOM,
        paddingRight: MobileConfig.SAFE_AREA.NOTCH_PADDING_RIGHT,
      }}
    >
      {/* Attack Button (Secondary Action) */}
      <div className="flex flex-col items-center gap-1 -translate-y-2 sm:-translate-y-3">
        <motion.button
          whileTap={{ scale: 0.88 }}
          className="w-12 h-12 sm:w-15 sm:h-15 rounded-full bg-gradient-to-br from-[#450a0a] to-[#991b1b] border-2 border-red-500/80 hover:border-red-400 flex items-center justify-center shadow-[0_6px_20px_rgba(0,0,0,0.8)] cursor-pointer transition-all active:scale-90"
          onPointerDown={() => handleButtonDown('ATTACK')}
          onPointerUp={() => handleButtonUp('ATTACK')}
          onPointerLeave={() => handleButtonUp('ATTACK')}
          title="Atacar"
        >
          <Flame className="w-6 h-6 sm:w-7 sm:h-7 text-red-200" />
        </motion.button>
        <span className="font-mono text-[8px] bg-[#0c1017]/90 text-red-300 font-bold tracking-wider px-1.5 py-0.5 rounded border border-red-950 shadow-md">
          ATACAR
        </span>
      </div>

      {/* Primary Dynamic Contextual Action Button */}
      <div className="flex flex-col items-center gap-1">
        <motion.button
          key={buttonText}
          initial={{ scale: 0.9, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          whileTap={{ scale: 0.92 }}
          className={`w-18 h-18 sm:w-22 sm:h-22 rounded-full bg-gradient-to-br border-2 flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all duration-200 backdrop-blur-md ${buttonStyle}`}
          onPointerDown={() => handleButtonDown('ACTION')}
          onPointerUp={() => handleButtonUp('ACTION')}
          onPointerLeave={() => handleButtonUp('ACTION')}
        >
          <IconComponent className="w-6 h-6 sm:w-8 sm:h-8 drop-shadow-md animate-pulse" style={{ animationDuration: '3s' }} />
          <span className="font-sans font-black text-[10px] sm:text-xs tracking-widest leading-none drop-shadow-md">
            {buttonText}
          </span>
        </motion.button>
        <span className="font-mono text-[8px] bg-[#0c1017]/90 text-amber-300 font-bold tracking-widest px-1.5 py-0.5 rounded border border-amber-500/30 shadow-md hidden sm:inline-block">
          TECLA [E]
        </span>
      </div>
    </div>
  );
};

