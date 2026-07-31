'use client';

import React from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { Trophy, Award, Coins, Sword, Shield, Box, Heart, Sparkles, PackageCheck, ArrowRight, CheckCircle2, AlertTriangle, Star } from 'lucide-react';
import { Rarity } from '@/game/Systems/Items/Rarity';
import { ClaudecraftAssets } from '@/game/Assets/ClaudecraftAssets';

export interface LootRewardItem {
  name: string;
  rarity: string;
  count: number;
  added: boolean;
  definitionId: string;
  category?: string;
  description?: string;
  equipmentSlot?: string;
}

export interface LootSummaryData {
  expGained: number;
  goldGained: number;
  items: LootRewardItem[];
  enemyName?: string;
}

interface LootSummaryPanelProps {
  data: LootSummaryData | null;
  onClose: () => void;
  onOpenInventory?: () => void;
}

export const LootSummaryPanel: React.FC<LootSummaryPanelProps> = ({
  data,
  onClose,
  onOpenInventory,
}) => {
  if (!data) return null;

  const getRarityColors = (rarityStr?: string) => {
    const rarity = rarityStr?.toUpperCase();
    switch (rarity) {
      case 'LEGENDARY':
        return {
          border: 'border-amber-400/90',
          bg: 'bg-amber-950/40',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-400/60',
          glow: 'shadow-[0_0_20px_rgba(245,158,11,0.25)]',
          text: 'text-amber-200',
        };
      case 'MYTHIC':
        return {
          border: 'border-rose-400/90',
          bg: 'bg-rose-950/40',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-400/60',
          glow: 'shadow-[0_0_20px_rgba(244,63,94,0.25)]',
          text: 'text-rose-200',
        };
      case 'EPIC':
        return {
          border: 'border-purple-400/80',
          bg: 'bg-purple-950/40',
          badge: 'bg-purple-500/20 text-purple-300 border-purple-400/50',
          glow: 'shadow-[0_0_15px_rgba(168,85,247,0.2)]',
          text: 'text-purple-200',
        };
      case 'RARE':
        return {
          border: 'border-sky-400/80',
          bg: 'bg-sky-950/40',
          badge: 'bg-sky-500/20 text-sky-300 border-sky-400/50',
          glow: 'shadow-[0_0_15px_rgba(56,189,248,0.2)]',
          text: 'text-sky-200',
        };
      case 'UNCOMMON':
        return {
          border: 'border-emerald-400/70',
          bg: 'bg-emerald-950/40',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
          glow: 'shadow-[0_0_12px_rgba(52,211,153,0.15)]',
          text: 'text-emerald-200',
        };
      case 'COMMON':
      default:
        return {
          border: 'border-slate-700/80',
          bg: 'bg-slate-900/60',
          badge: 'bg-slate-800 text-slate-300 border-slate-700',
          glow: 'shadow-md',
          text: 'text-slate-200',
        };
    }
  };

  const getItemIcon = (category?: string, slot?: string) => {
    if (category === 'WEAPON' || slot === 'weapon') return <Sword className="w-5 h-5 text-amber-300" />;
    if (category === 'ARMOR' || slot === 'shield' || slot === 'helmet') return <Shield className="w-5 h-5 text-sky-300" />;
    if (category === 'CONSUMABLE') return <Heart className="w-5 h-5 text-rose-300" />;
    return <Box className="w-5 h-5 text-purple-300" />;
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9, y: 30 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25,
        staggerChildren: 0.08,
      },
    },
    exit: { opacity: 0, scale: 0.95, y: -20, transition: { duration: 0.2 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: -25, scale: 0.95 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { type: 'spring', stiffness: 350, damping: 22 },
    },
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md select-none">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative w-full max-w-lg bg-[#0d121f] border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-[0_0_60px_rgba(245,158,11,0.25)] overflow-hidden flex flex-col gap-4 max-h-[90vh]"
        >
          {/* Top Decorative Shimmer */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-600" />
          <div className="absolute -top-20 -left-20 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center gap-3.5 pb-3 border-b border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-sans font-black text-lg sm:text-xl text-amber-200 tracking-wide uppercase">
                  ¡VICTORIA Y BOTÍN!
                </h3>
                <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
              </div>
              <p className="text-xs font-mono text-slate-400">
                {data.enemyName ? `Derrotaste a: ${data.enemyName}` : 'Recompensas obtenidas en el combate'}
              </p>
            </div>
          </div>

          {/* Currency / EXP Stat Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* EXP Card */}
            <motion.div
              variants={itemVariants}
              className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-3 flex items-center gap-3 shadow-md"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-emerald-300 uppercase tracking-wider block">EXPERIENCIA</span>
                <span className="font-mono font-black text-emerald-100 text-sm sm:text-base">+{data.expGained} EXP</span>
              </div>
            </motion.div>

            {/* Gold Card */}
            <motion.div
              variants={itemVariants}
              className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-3 flex items-center gap-3 shadow-md"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0 p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ClaudecraftAssets.COIN} alt="Oro" className="w-6 h-6 object-contain drop-shadow" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-amber-300 uppercase tracking-wider block">ORO DEL REINO</span>
                <span className="font-mono font-black text-amber-100 text-sm sm:text-base">+{data.goldGained} ORO</span>
              </div>
            </motion.div>
          </div>

          {/* Items Section Header */}
          <div className="space-y-2 flex-1 min-h-0 flex flex-col">
            <div className="flex justify-between items-center text-xs font-mono text-slate-400 px-1">
              <span className="font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> OBJETOS CONSEGUIDOS ({data.items.length})
              </span>
              <span className="text-[10px] text-slate-500">Guardados en Mochila</span>
            </div>

            {/* Items List Container */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[35vh]">
              {data.items.length === 0 ? (
                <div className="p-6 text-center bg-slate-900/40 border border-slate-800 rounded-2xl space-y-2">
                  <Box className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-mono text-slate-400">
                    No cayeron objetos raros en este combate, ¡pero has ganado oro y experiencia!
                  </p>
                </div>
              ) : (
                data.items.map((item, index) => {
                  const colors = getRarityColors(item.rarity);

                  return (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      className={`p-3 rounded-2xl border ${colors.border} ${colors.bg} ${colors.glow} flex items-center justify-between gap-3`}
                    >
                      {/* Left Icon */}
                      <div className="w-10 h-10 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-center shrink-0 p-1 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={ClaudecraftAssets.getItemIcon(item.definitionId)}
                          alt={item.name}
                          className="w-full h-full object-contain drop-shadow"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-sans font-black text-xs sm:text-sm truncate ${colors.text}`}>
                            {item.name}
                          </h4>
                          <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border shrink-0 ${colors.badge}`}>
                            {item.rarity}
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                          {item.description || 'Objeto de aventura'}
                        </p>
                      </div>

                      {/* Right Tag & Count */}
                      <div className="text-right shrink-0 space-y-1">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-amber-300 font-mono font-black text-xs">
                          x{item.count}
                        </span>
                        <div className="flex items-center gap-1 text-[9px] font-mono text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Guardado</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row gap-2.5">
            {onOpenInventory && (
              <button
                onClick={() => {
                  onClose();
                  onOpenInventory();
                }}
                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-200 border border-slate-700 font-sans font-bold text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <PackageCheck className="w-4 h-4 text-amber-400" /> Abrir Mochila
              </button>
            )}

            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 active:scale-95 text-slate-950 font-sans font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Continuar Aventura</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
