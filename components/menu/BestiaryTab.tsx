'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, BookOpen, Shield, Sword, Eye, EyeOff, Award, Sparkles, MapPin, Skull, Heart, Zap, Flame, Lock } from 'lucide-react';
import { BestiarySystem, BestiaryEntry } from '../../game/Systems/Progression/BestiarySystem';
import { FantasySFX } from '../../game/Systems/FantasySFX';

export const BestiaryTab: React.FC = () => {
  const bestiarySystem = BestiarySystem.getInstance();
  const [entries, setEntries] = useState<BestiaryEntry[]>(() => bestiarySystem.getEntries());
  const [selectedId, setSelectedId] = useState<string>(entries[0]?.id || 'slime');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const stats = bestiarySystem.getUnlockedCount();

  const filteredEntries = entries.filter((e) => {
    const matchesCategory = filterCategory === 'ALL' || e.category === filterCategory;
    const isUnlocked = e.isSeen || e.defeatedCount > 0;
    const displayName = isUnlocked ? e.name : '???';
    const matchesSearch = displayName.toLowerCase().includes(searchQuery.toLowerCase()) || e.numberId.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  const selectedEntry = entries.find((e) => e.id === selectedId) || entries[0];
  const isSelectedUnlocked = selectedEntry?.isSeen || selectedEntry?.defeatedCount > 0;

  const getRankBadge = (count: number) => {
    if (count === 0) return { label: 'Avistado', color: 'text-slate-400 bg-slate-800/60 border-slate-700' };
    if (count < 3) return { label: '★ Novato', color: 'text-amber-300 bg-amber-950/40 border-amber-500/40' };
    if (count < 5) return { label: '★★ Cazador', color: 'text-emerald-300 bg-emerald-950/40 border-emerald-500/40' };
    return { label: '★★★ Maestro Bestiario', color: 'text-purple-300 bg-purple-950/40 border-purple-500/40' };
  };

  const getCategoryColor = (cat: BestiaryEntry['category']) => {
    switch (cat) {
      case 'SLIME': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      case 'BEAST': return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      case 'HUMANOID': return 'text-sky-400 border-sky-500/30 bg-sky-500/10';
      case 'BOSS': return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
      default: return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[72vh] max-h-[600px] overflow-hidden font-sans text-slate-200">
      {/* Left Column: Index & Search */}
      <div className="w-full lg:w-5/12 flex flex-col gap-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
        {/* Top Header & Progress */}
        <div className="space-y-2 pb-2 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white font-serif tracking-wide">
                ENCICLOPEDIA & BESTIARIO
              </h3>
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
              {stats.discovered} / {stats.total} ({Math.round((stats.discovered / stats.total) * 100)}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
              style={{ width: `${(stats.discovered / stats.total) * 100}%` }}
            />
          </div>
        </div>

        {/* Search Bar & Category Filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o #Nº..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-semibold">
            {[
              { id: 'ALL', label: 'TODOS' },
              { id: 'SLIME', label: 'LIMOS' },
              { id: 'BEAST', label: 'BESTIAS' },
              { id: 'HUMANOID', label: 'HUMANOIDES' },
              { id: 'BOSS', label: 'JEFES' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  FantasySFX.getInstance().playButtonClick();
                  setFilterCategory(cat.id);
                }}
                className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition-all cursor-pointer ${
                  filterCategory === cat.id
                    ? 'bg-amber-500/20 text-amber-200 border-amber-500/50 shadow'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Monster Entries List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {filteredEntries.map((entry) => {
            const isUnlocked = entry.isSeen || entry.defeatedCount > 0;
            const isSelected = entry.id === selectedId;

            return (
              <button
                key={entry.id}
                onClick={() => {
                  FantasySFX.getInstance().playButtonClick();
                  setSelectedId(entry.id);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left cursor-pointer ${
                  isSelected
                    ? 'bg-amber-950/40 border-amber-500/60 shadow-md ring-1 ring-amber-500/30'
                    : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-amber-400/80 font-bold">
                    #{entry.numberId}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-base shrink-0 shadow-inner">
                    {isUnlocked ? entry.spriteIcon : '❓'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-snug">
                      {isUnlocked ? entry.name : '???'}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      {isUnlocked ? entry.location : 'Lugar Desconocido'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isUnlocked ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Kills: {entry.defeatedCount}
                    </span>
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: Selected Pokédex Style Monster Card */}
      <div className="w-full lg:w-7/12 bg-slate-950/80 p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col justify-between overflow-y-auto">
        {selectedEntry && (
          <div className="space-y-4">
            {/* Top Display Banner */}
            <div className="relative p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center gap-4 overflow-hidden">
              <div className="relative w-20 h-20 rounded-2xl bg-slate-950 border-2 border-amber-500/40 flex items-center justify-center text-4xl shadow-[0_0_15px_rgba(245,158,11,0.2)] shrink-0">
                {isSelectedUnlocked ? selectedEntry.spriteIcon : '❓'}
              </div>

              <div className="space-y-1 text-center sm:text-left flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="font-mono text-xs font-bold text-amber-400">
                    Nº {selectedEntry.numberId}
                  </span>
                  {isSelectedUnlocked && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryColor(selectedEntry.category)}`}>
                      {selectedEntry.category}
                    </span>
                  )}
                  {isSelectedUnlocked && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getRankBadge(selectedEntry.defeatedCount).color}`}>
                      {getRankBadge(selectedEntry.defeatedCount).label}
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-bold text-white font-serif tracking-wide">
                  {isSelectedUnlocked ? selectedEntry.name : '??? (Monstruo Desconocido)'}
                </h2>

                <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1 font-sans">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Hábitat: {isSelectedUnlocked ? selectedEntry.location : 'Aún no descubierto'}
                  </span>
                </p>
              </div>
            </div>

            {/* Lock Guard if not unlocked */}
            {!isSelectedUnlocked ? (
              <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center space-y-3 my-auto">
                <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center text-slate-400">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-300 font-serif">
                  Entrada del Bestiario Bloqueada
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Avista o derrota a este enemigo en tus travesías por Eldoria para descifrar sus estadísticas, debilidades elementales e historia.
                </p>
              </div>
            ) : (
              /* Unlocked Entry Information Grid */
              <div className="space-y-4">
                {/* 1. Weakness Chart (Debilidades) */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 font-serif">
                    <Zap className="w-4 h-4 text-amber-400" /> Debilidades Elementales (Sistema Octopath)
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedEntry.weaknesses.map((w) => {
                      const isRevealed = selectedEntry.discoveredWeaknesses.includes(w.type) || selectedEntry.defeatedCount >= 1;

                      return (
                        <div
                          key={w.type}
                          className={`p-2 rounded-lg border flex items-center gap-2 transition-all ${
                            isRevealed
                              ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                              : 'bg-slate-950/60 border-slate-800 text-slate-500'
                          }`}
                        >
                          <span className="text-base">{isRevealed ? w.icon : '❓'}</span>
                          <div>
                            <span className="text-xs font-bold block leading-none">
                              {isRevealed ? w.label : '???'}
                            </span>
                            <span className="text-[9px] text-slate-400 block mt-0.5">
                              {isRevealed ? w.description : 'Debilidad Oculta'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Combat Stats Grid */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 font-serif">
                    <Shield className="w-4 h-4 text-sky-400" /> Atributos de Combate
                  </h4>

                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-semibold">Salud (HP)</span>
                      <span className="font-bold text-emerald-400 font-mono">{selectedEntry.hp}</span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-semibold">Ataque (ATK)</span>
                      <span className="font-bold text-rose-400 font-mono">{selectedEntry.atk}</span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-semibold">Defensa (DEF)</span>
                      <span className="font-bold text-sky-400 font-mono">{selectedEntry.def}</span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-semibold">Velocidad</span>
                      <span className="font-bold text-yellow-400 font-mono">{selectedEntry.speed}</span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-semibold">Escudos</span>
                      <span className="font-bold text-amber-400 font-mono">{selectedEntry.shieldMax}🛡️</span>
                    </div>
                  </div>
                </div>

                {/* 3. Lore Story */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 font-serif">
                    <BookOpen className="w-4 h-4 text-amber-400" /> Historia & Origen
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans italic">
                    &ldquo;{selectedEntry.lore}&rdquo;
                  </p>
                </div>

                {/* 4. Drops & Recompensas */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 font-serif">
                    <Award className="w-4 h-4 text-emerald-400" /> Botines Registrados
                  </h4>

                  <div className="flex flex-wrap gap-1.5">
                    {selectedEntry.drops.map((drop, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-slate-950 text-emerald-300 border border-emerald-500/30"
                      >
                        💎 {drop}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
