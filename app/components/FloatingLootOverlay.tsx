'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EventBus } from '@/game/Core/EventBus';
import { InventoryEvent, InventoryEvents } from '@/game/Systems/Inventory/InventoryEvents';
import { DatabaseManager } from '@/game/Database/DatabaseManager';
import { Rarity } from '@/game/Systems/Items/Rarity';
import { ClaudecraftAssets } from '@/game/Assets/ClaudecraftAssets';
import { Sparkles, Sword, Shield, Award, Coins, Gem, Box, Star } from 'lucide-react';

export interface FloatingLootItem {
  id: string;
  title: string;
  subtitle?: string;
  count?: number;
  rarity?: Rarity;
  type: 'ITEM' | 'GOLD' | 'EXP' | 'GEM';
  icon?: string;
  category?: string;
}

export const FloatingLootOverlay: React.FC = () => {
  const [lootQueue, setLootQueue] = useState<FloatingLootItem[]>([]);

  const addLootItem = (item: FloatingLootItem) => {
    setLootQueue((prev) => {
      // Keep max 5 items visible at once
      const next = [item, ...prev].slice(0, 5);
      return next;
    });

    // Auto dismiss after 3.8 seconds
    setTimeout(() => {
      setLootQueue((prev) => prev.filter((i) => i.id !== item.id));
    }, 3800);
  };

  useEffect(() => {
    // 1. Listen to item added in inventory
    const handleItemAdded = (data: { instance: any; count: number }) => {
      if (!data || !data.instance) return;
      const def = DatabaseManager.getInstance().getItemDefinition(data.instance.definitionId);
      const name = def ? def.name : data.instance.definitionId;
      const rarity = data.instance.rarity || Rarity.COMMON;
      const category = def ? def.category : 'ITEM';

      const newItem: FloatingLootItem = {
        id: `loot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: name,
        subtitle: `x${data.count || 1} Guardado en Mochila`,
        count: data.count || 1,
        rarity: rarity as Rarity,
        type: 'ITEM',
        category,
      };

      addLootItem(newItem);
    };

    // 2. Listen to custom floating loot events (Gold, EXP, Gems, or direct custom loot)
    const handleCustomLoot = (data: Partial<FloatingLootItem>) => {
      if (!data || !data.title) return;
      const newItem: FloatingLootItem = {
        id: `loot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: data.title,
        subtitle: data.subtitle || 'Recompensa Obtenida',
        count: data.count,
        rarity: data.rarity || Rarity.UNCOMMON,
        type: data.type || 'ITEM',
        icon: data.icon,
        category: data.category,
      };

      addLootItem(newItem);
    };

    InventoryEvents.subscribe(InventoryEvent.ON_ITEM_ADDED, handleItemAdded);
    EventBus.getInstance().on('loot:floating', handleCustomLoot);

    return () => {
      InventoryEvents.unsubscribe(InventoryEvent.ON_ITEM_ADDED, handleItemAdded);
      EventBus.getInstance().off('loot:floating', handleCustomLoot);
    };
  }, []);

  const getRarityColors = (rarity?: Rarity, type?: string) => {
    if (type === 'GOLD') {
      return {
        border: 'border-amber-400/80',
        bg: 'bg-amber-950/80',
        glow: 'shadow-[0_0_25px_rgba(245,158,11,0.35)]',
        text: 'text-amber-200',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        particles: 'from-amber-400 to-yellow-200',
      };
    }
    if (type === 'EXP') {
      return {
        border: 'border-emerald-400/80',
        bg: 'bg-emerald-950/80',
        glow: 'shadow-[0_0_25px_rgba(16,185,129,0.35)]',
        text: 'text-emerald-200',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        particles: 'from-emerald-400 to-teal-200',
      };
    }
    if (type === 'GEM') {
      return {
        border: 'border-cyan-400/80',
        bg: 'bg-cyan-950/80',
        glow: 'shadow-[0_0_25px_rgba(6,182,212,0.35)]',
        text: 'text-cyan-200',
        badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        particles: 'from-cyan-400 to-sky-200',
      };
    }

    switch (rarity) {
      case Rarity.LEGENDARY:
        return {
          border: 'border-amber-400/90',
          bg: 'bg-[#181104]/90',
          glow: 'shadow-[0_0_30px_rgba(245,158,11,0.4)]',
          text: 'text-amber-100',
          badge: 'bg-amber-500/30 text-amber-300 border-amber-400/60',
          particles: 'from-amber-400 to-amber-100',
        };
      case Rarity.MYTHIC:
        return {
          border: 'border-rose-400/90',
          bg: 'bg-[#1c080e]/90',
          glow: 'shadow-[0_0_35px_rgba(244,63,94,0.45)]',
          text: 'text-rose-100',
          badge: 'bg-rose-500/30 text-rose-300 border-rose-400/60',
          particles: 'from-rose-400 to-pink-200',
        };
      case Rarity.EPIC:
        return {
          border: 'border-purple-400/80',
          bg: 'bg-[#140b1e]/90',
          glow: 'shadow-[0_0_25px_rgba(168,85,247,0.35)]',
          text: 'text-purple-100',
          badge: 'bg-purple-500/20 text-purple-300 border-purple-400/50',
          particles: 'from-purple-400 to-fuchsia-200',
        };
      case Rarity.RARE:
        return {
          border: 'border-sky-400/80',
          bg: 'bg-[#091524]/90',
          glow: 'shadow-[0_0_20px_rgba(56,189,248,0.3)]',
          text: 'text-sky-100',
          badge: 'bg-sky-500/20 text-sky-300 border-sky-400/50',
          particles: 'from-sky-400 to-blue-200',
        };
      case Rarity.UNCOMMON:
        return {
          border: 'border-emerald-400/70',
          bg: 'bg-[#061811]/90',
          glow: 'shadow-[0_0_18px_rgba(52,211,153,0.25)]',
          text: 'text-emerald-100',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
          particles: 'from-emerald-400 to-teal-200',
        };
      case Rarity.COMMON:
      default:
        return {
          border: 'border-slate-700',
          bg: 'bg-[#0d121d]/90',
          glow: 'shadow-lg',
          text: 'text-slate-100',
          badge: 'bg-slate-800/80 text-slate-300 border-slate-700',
          particles: 'from-slate-400 to-slate-200',
        };
    }
  };

  const getItemIcon = (type: string, title?: string) => {
    if (type === 'GOLD') {
      return (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={ClaudecraftAssets.COIN} alt="Oro" className="w-6 h-6 object-contain drop-shadow" />
      );
    }
    if (type === 'EXP') return <Award className="w-5 h-5 text-emerald-400" />;
    if (type === 'GEM') return <Gem className="w-5 h-5 text-cyan-400" />;

    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={ClaudecraftAssets.getItemIcon(title || '')}
        alt={title || 'Item'}
        className="w-full h-full object-contain drop-shadow"
      />
    );
  };

  return (
    <div className="fixed bottom-20 right-4 sm:right-6 z-50 pointer-events-none flex flex-col-reverse items-end gap-2.5 max-w-sm w-full select-none">
      <AnimatePresence>
        {lootQueue.map((item, index) => {
          const colors = getRarityColors(item.rarity, item.type);

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.7, y: 30, x: 20, rotateX: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -25, filter: 'blur(6px)' }}
              transition={{
                type: 'spring',
                stiffness: 380,
                damping: 24,
                delay: index * 0.05,
              }}
              className={`relative pointer-events-auto backdrop-blur-md ${colors.bg} border ${colors.border} ${colors.glow} rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 w-full max-w-[310px] overflow-hidden`}
            >
              {/* Background 3D Particle Sparkles Ambient Burst */}
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-xl pointer-events-none" />
              
              {/* Floating Star Particles */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                className="absolute top-1 right-2 opacity-40 pointer-events-none"
              >
                <Sparkles className="w-4 h-4 text-white" />
              </motion.div>

              {/* Left Item Icon Container with 3D aura */}
              <div className="relative shrink-0">
                <div className={`w-10 h-10 rounded-xl bg-slate-950/80 border ${colors.border} flex items-center justify-center p-1 shadow-inner relative z-10 overflow-hidden`}>
                  {getItemIcon(item.type, item.title)}
                </div>
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${colors.particles} opacity-30 blur-sm`} />
              </div>

              {/* Center Content Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className={`font-sans font-black text-xs sm:text-sm tracking-wide truncate ${colors.text}`}>
                    {item.title}
                  </h4>
                  {item.rarity && item.type === 'ITEM' && (
                    <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border shrink-0 ${colors.badge}`}>
                      {item.rarity}
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-mono text-slate-300/80 truncate mt-0.5 flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />
                  <span>{item.subtitle}</span>
                </p>
              </div>

              {/* Count / Quantity Badge */}
              {item.count && item.count > 1 && (
                <div className="shrink-0 bg-slate-950/90 border border-slate-700 px-2 py-1 rounded-lg text-xs font-mono font-black text-amber-300">
                  x{item.count}
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
