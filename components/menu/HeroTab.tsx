'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Zap, Sword, Shield, Sparkles, Award, Lock, CheckCircle2, ChevronRight, Star, BookOpen } from 'lucide-react';
import { InventoryManager } from '../../game/Systems/Inventory/InventoryManager';
import { InventoryEvent, InventoryEvents } from '../../game/Systems/Inventory/InventoryEvents';
import { ProgressionManager } from '../../game/Systems/Progression/ProgressionManager';
import { ARCHETYPES } from '../../game/Systems/Progression/Archetypes';
import { TalentTreeModal } from './TalentTreeModal';

interface HeroTabProps {
  heroHp: number;
  heroMaxHp: number;
  heroMp: number;
  heroMaxMp: number;
  onNavigateToTalents?: () => void;
}

export const HeroTab: React.FC<HeroTabProps> = ({
  heroHp,
  heroMaxHp,
  heroMp,
  heroMaxMp,
  onNavigateToTalents,
}) => {
  const manager = InventoryManager.getInstance();
  const stats = manager.getPlayerStats();
  const progressionManager = ProgressionManager.getInstance();

  const [progression, setProgression] = useState(() => progressionManager.getProgression());
  const [playerAtk, setPlayerAtk] = useState(() => stats.getStatValue('attack') || 15);
  const [playerDef, setPlayerDef] = useState(() => stats.getStatValue('defense') || 8);
  const [playerMaxHpStat, setPlayerMaxHpStat] = useState(() => stats.getStatValue('maxHp') || heroMaxHp);
  const [playerMaxMpStat, setPlayerMaxMpStat] = useState(() => stats.getStatValue('maxMp') || heroMaxMp);

  const updateStats = React.useCallback(() => {
    setPlayerAtk(stats.getStatValue('attack') || 15);
    setPlayerDef(stats.getStatValue('defense') || 8);
    setPlayerMaxHpStat(stats.getStatValue('maxHp') || heroMaxHp);
    setPlayerMaxMpStat(stats.getStatValue('maxMp') || heroMaxMp);
    setProgression(progressionManager.getProgression());
  }, [stats, heroMaxHp, heroMaxMp, progressionManager]);

  useEffect(() => {
    InventoryEvents.subscribe(InventoryEvent.ON_INVENTORY_UPDATED, updateStats);
    const unsubProgression = progressionManager.subscribe(() => updateStats());

    return () => {
      InventoryEvents.unsubscribe(InventoryEvent.ON_INVENTORY_UPDATED, updateStats);
      unsubProgression();
    };
  }, [progressionManager, updateStats]);

  const [isTalentTreeOpen, setIsTalentTreeOpen] = useState(false);

  const activeMaxHp = Math.max(heroMaxHp, playerMaxHpStat);
  const activeMaxMp = Math.max(heroMp, playerMaxMpStat);

  const currentArchetype = progression.archetypeId ? ARCHETYPES[progression.archetypeId] : null;
  const isUnlocked = progression.level >= 5;

  const handleSelectArchetype = (archetypeId: string) => {
    progressionManager.setArchetype(archetypeId);
    updateStats();
  };

  return (
    <div className="space-y-4 select-none">
      {/* Talent Tree Quick Banner */}
      <div className="bg-gradient-to-r from-amber-950/80 via-[#121626] to-amber-950/80 border-2 border-amber-500/50 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-[0_0_25px_rgba(245,158,11,0.2)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 border border-amber-300 flex items-center justify-center text-xl sm:text-2xl shadow-lg shrink-0">
            ✨
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-cinzel font-black text-sm sm:text-base text-amber-200 tracking-wide uppercase">
                ÁRBOL DE TALENTOS & TÉCNICAS
              </h4>
              {progression.talentPoints > 0 && (
                <span className="text-[10px] font-mono font-black text-amber-950 bg-amber-400 px-2 py-0.5 rounded-full animate-bounce">
                  +{progression.talentPoints} PTS
                </span>
              )}
            </div>
            <p className="text-[10px] font-mono text-slate-300">
              Desbloquea habilidades activas y mejoras permanentes para {currentArchetype ? currentArchetype.name : 'tu héroe'}.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (onNavigateToTalents) {
              onNavigateToTalents();
            } else {
              setIsTalentTreeOpen(true);
            }
          }}
          className="py-2 sm:py-2.5 px-3.5 sm:px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-amber-950 font-mono text-xs font-black border border-amber-200 shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer transition-all active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-amber-950" />
          <span className="hidden sm:inline">VER TALENTOS</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Hero Profile Overview Card */}
        <div className="bg-[#101522] border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-3 sm:space-y-4 shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 border-2 border-amber-400 flex items-center justify-center text-2xl sm:text-3xl shadow-lg shrink-0">
              {currentArchetype ? currentArchetype.icon : '🛡️'}
            </div>
            <div className="min-w-0">
              <h3 className="font-cinzel font-black text-lg sm:text-xl text-amber-100 uppercase truncate">
                ELDOR
              </h3>
              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                <span className="text-xs font-mono bg-amber-950/80 text-amber-300 border border-amber-600/40 px-2 py-0.5 rounded-md font-bold">
                  Nivel {progression.level}
                </span>
                <span className={`text-xs font-mono px-2 py-0.5 rounded-md font-bold border bg-gradient-to-r ${currentArchetype ? currentArchetype.badgeColor : 'from-slate-800 to-slate-900 text-slate-300 border-slate-700'}`}>
                  {currentArchetype ? currentArchetype.name : 'Aprendiz de Aventurero'}
                </span>
              </div>
            </div>
          </div>

          {/* EXP Bar */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-[10px] font-mono text-amber-400 font-bold">
              <span className="flex items-center gap-1"><Award className="w-3 h-3" /> EXPERIENCIA (EXP)</span>
              <span>{progression.exp} / {progression.maxExp} PTS</span>
            </div>
            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 transition-all duration-300"
                style={{ width: `${Math.min(100, (progression.exp / Math.max(1, progression.maxExp)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Vitality Bars Section */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-bold block">
              ESTADO DE SALUD & MANÁ
            </span>

            {/* HP Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 fill-emerald-500/20" /> Salud (HP)
                </span>
                <span className="text-emerald-200 font-bold">
                  {heroHp} / {activeMaxHp}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-300"
                  style={{ width: `${(heroHp / Math.max(1, activeMaxHp)) * 100}%` }}
                />
              </div>
            </div>

            {/* MP Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-sky-400 font-bold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 fill-sky-500/20" /> Maná (MP)
                </span>
                <span className="text-sky-200 font-bold">
                  {heroMp} / {activeMaxMp}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-sky-600 to-indigo-400 transition-all duration-300"
                  style={{ width: `${(heroMp / Math.max(1, activeMaxMp)) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Wallet / Currency Grid */}
          <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
            <div className="bg-slate-950/60 p-2.5 sm:p-3 rounded-xl border border-amber-500/20 flex items-center gap-2">
              <span className="text-lg sm:text-xl shrink-0">💰</span>
              <div className="min-w-0">
                <span className="text-[8px] font-mono text-slate-400 uppercase font-bold block truncate">
                  ORO DEL REINO
                </span>
                <span className="font-mono font-black text-amber-200 text-xs sm:text-sm">
                  {progression.gold} ORO
                </span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-2.5 sm:p-3 rounded-xl border border-cyan-500/20 flex items-center gap-2">
              <span className="text-lg sm:text-xl shrink-0">💎</span>
              <div className="min-w-0">
                <span className="text-[8px] font-mono text-slate-400 uppercase font-bold block truncate">
                  GEMAS ARCANAS
                </span>
                <span className="font-mono font-black text-cyan-200 text-xs sm:text-sm">
                  {progression.gems} GEMAS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Combat Attributes Card */}
        <div className="bg-[#101522] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
          <div className="flex justify-between items-center pb-1 border-b border-slate-800">
            <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-black block">
              ATRIBUTOS DE COMBATE
            </span>
            {currentArchetype && (
              <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                +Bonos {currentArchetype.name}
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center p-2 sm:p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <span className="text-slate-300 flex items-center gap-2">
                <Sword className="w-4 h-4 text-red-400 shrink-0" /> Ataque Físico
              </span>
              <span className="font-black text-red-300">{playerAtk} PTS</span>
            </div>

            <div className="flex justify-between items-center p-2 sm:p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <span className="text-slate-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-400 shrink-0" /> Defensa Física
              </span>
              <span className="font-black text-sky-300">{playerDef} PTS</span>
            </div>

            <div className="flex justify-between items-center p-2 sm:p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <span className="text-slate-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" /> Velocidad de Acción
              </span>
              <span className="font-black text-amber-300">10 PTS</span>
            </div>

            <div className="flex justify-between items-center p-2 sm:p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <span className="text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" /> Suerte de Botín (Loot)
              </span>
              <span className="font-black text-emerald-300">+15%</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-900">
            * Los atributos aumentan al subir de nivel, elegir un arquetipo y equipar objetos.
          </p>
        </div>
      </div>

      {/* ARQUETIPOS DE HÉROE SECTION */}
      <div className="bg-[#101522] border border-amber-500/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-amber-900/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
              👑
            </div>
            <div>
              <h4 className="font-cinzel font-bold text-sm sm:text-base text-amber-200 uppercase tracking-wide">
                ARQUETIPOS Y CLASES DE HÉROE
              </h4>
              <p className="text-[10px] font-mono text-slate-400">
                {isUnlocked
                  ? 'Especialización desbloqueada (Nivel 5+). Selecciona el camino que seguirá Eldor.'
                  : 'Sistemas de clases locked. Alcanza el Nivel 5 para desbloquear especializaciones.'}
              </p>
            </div>
          </div>

          {!isUnlocked ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-amber-400 font-bold">
              <Lock className="w-3.5 h-3.5" />
              <span>Nivel {progression.level} / 5</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-400/50 text-[10px] font-mono text-amber-300 font-bold animate-pulse">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>¡DESBLOQUEADO!</span>
            </div>
          )}
        </div>

        {/* If locked (< Level 5) */}
        {!isUnlocked && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3 text-amber-300 text-xs font-mono">
              <Lock className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                Para elegir un arquetipo debéis ganar experiencia en batalla hasta alcanzar el <strong>Nivel 5</strong>.
              </span>
            </div>

            {/* Lock Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>PROGRESO DE DESBLOQUEO</span>
                <span className="text-amber-300 font-bold">
                  {Math.min(100, Math.round((progression.level / 5) * 100))}% (Nivel {progression.level}/5)
                </span>
              </div>
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, (progression.level / 5) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Archetypes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.values(ARCHETYPES).map((arch) => {
            const isSelected = progression.archetypeId === arch.id;

            return (
              <div
                key={arch.id}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 relative ${
                  isSelected
                    ? 'bg-amber-950/30 border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                    : isUnlocked
                    ? 'bg-slate-950/60 border-slate-800 hover:border-amber-500/50 hover:bg-slate-900/80'
                    : 'bg-slate-950/30 border-slate-900/60 opacity-60'
                }`}
              >
                {/* Header */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{arch.icon}</span>
                      <div>
                        <h5 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                          {arch.name}
                        </h5>
                        <p className="text-[10px] font-mono text-amber-400/90 leading-tight">
                          {arch.title}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="flex items-center gap-1 text-[9px] font-mono font-black text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-500/50">
                        <CheckCircle2 className="w-3 h-3 text-amber-400" />
                        ACTIVO
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-300 leading-snug">
                    {arch.description}
                  </p>
                </div>

                {/* Passive Perk & Stat Bonuses */}
                <div className="space-y-2 pt-2 border-t border-slate-900">
                  <div className="text-[10px] font-mono text-amber-300/90 bg-amber-950/40 p-1.5 rounded border border-amber-900/40">
                    <span className="font-bold text-amber-400">Pasiva ({arch.passiveName}):</span>{' '}
                    {arch.passiveDescription}
                  </div>

                  {/* Stat bonus badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {arch.statBonuses.attack > 0 && (
                      <span className="text-[9px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-800 px-1.5 py-0.5 rounded">
                        +{arch.statBonuses.attack} Atq
                      </span>
                    )}
                    {arch.statBonuses.defense > 0 && (
                      <span className="text-[9px] font-mono font-bold bg-sky-950/80 text-sky-300 border border-sky-800 px-1.5 py-0.5 rounded">
                        +{arch.statBonuses.defense} Def
                      </span>
                    )}
                    {arch.statBonuses.hp > 0 && (
                      <span className="text-[9px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded">
                        +{arch.statBonuses.hp} HP
                      </span>
                    )}
                    {arch.statBonuses.mp > 0 && (
                      <span className="text-[9px] font-mono font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-800 px-1.5 py-0.5 rounded">
                        +{arch.statBonuses.mp} MP
                      </span>
                    )}
                  </div>

                  {/* Exclusive Skill preview */}
                  {arch.skills.length > 0 && (
                    <div className="text-[9px] font-mono text-slate-400 pt-0.5">
                      <span className="text-amber-400 font-bold">Habilidad Exclusiva:</span>{' '}
                      {arch.skills[0].name} ({arch.skills[0].hitCount} Golpes, {arch.skills[0].mpCost} MP)
                    </div>
                  )}
                </div>

                {/* Select Button */}
                <button
                  onClick={() => handleSelectArchetype(arch.id)}
                  disabled={!isUnlocked || isSelected}
                  className={`w-full py-2 px-3 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-amber-950/80 border border-amber-500/60 text-amber-200 cursor-default'
                      : isUnlocked
                      ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-amber-950 border border-amber-300 shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Arquetipo Equipado</span>
                    </>
                  ) : isUnlocked ? (
                    <>
                      <span>Elegir Arquetipo</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-slate-600" />
                      <span>Bloqueado (Req. Nivel 5)</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* LORE SECTION: YGGDRASIL-SAMSARA */}
      <div className="bg-[#101522] border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
        <div className="flex items-center gap-2.5 border-b border-amber-900/40 pb-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h4 className="font-cinzel font-bold text-sm sm:text-base text-amber-200 uppercase tracking-wide">
              LORE: EL TAPIZ DE YGGDRASIL-SAMSARA
            </h4>
            <p className="text-[10px] font-mono text-slate-400">
              Mitos de las Nornas, la Rueda del Karma y la Sombra de Vritra-Nidhogg
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-sans">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1">
            <span className="font-mono font-bold text-amber-300 text-[11px] block flex items-center gap-1">
              🌿 1. Yggdrasil-Samsara & Lokas
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              El gran Árbol Cósmico sostiene los Nueve Reinos (Lokas). La energía mística que fluye por sus raíces es el <strong>Prana Rúnico</strong>, alimentando la vida y el orden en <strong>Midgard-Loka</strong>.
            </p>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1">
            <span className="font-mono font-bold text-rose-300 text-[11px] block flex items-center gap-1">
              🐉 2. La Sombra de Vritra-Nidhogg
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              El Dragón Serpentino del caos busca devorar el Soma Divino de Yggdrasil, provocando el colapso del Karma y desatando la noche del <strong>Ragnarök-Pralaya</strong> sobre mortales y dioses.
            </p>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1">
            <span className="font-mono font-bold text-emerald-300 text-[11px] block flex items-center gap-1">
              ✨ 3. El Einherjar del Karma
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Las Nornas del Destino han convocado a <strong>Eldor</strong>. Empuñando el arquetipo sagrado de su elección, debe defender el Dharma y restaurar la luz en Asgard-Samsara.
            </p>
          </div>
        </div>
      </div>

      {/* Talent Tree Modal */}
      <TalentTreeModal
        isOpen={isTalentTreeOpen}
        onClose={() => setIsTalentTreeOpen(false)}
      />
    </div>
  );
};
