'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  X,
  Lock,
  CheckCircle2,
  RotateCcw,
  Shield,
  Zap,
  Sword,
  Heart,
  Star,
  Award,
  Plus,
  Minus,
  Activity,
  Flame,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { ProgressionManager, PlayerProgressionData } from '../../game/Systems/Progression/ProgressionManager';
import { ARCHETYPES, ArchetypeDefinition, TalentNode, PassiveTalentDefinition } from '../../game/Systems/Progression/Archetypes';

interface TalentTreeModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOpenArchetypeSelection?: () => void;
  isInline?: boolean;
}

export const TalentTreeModal: React.FC<TalentTreeModalProps> = ({
  isOpen = true,
  onClose,
  onOpenArchetypeSelection,
  isInline = false,
}) => {
  const progressionManager = ProgressionManager.getInstance();
  const [progression, setProgression] = useState<PlayerProgressionData>(() =>
    progressionManager.getProgression()
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'PASSIVE'>('PASSIVE');

  useEffect(() => {
    const updateProgression = () => {
      setProgression(progressionManager.getProgression());
    };
    updateProgression();
    const unsub = progressionManager.subscribe(updateProgression);
    return () => {
      unsub();
    };
  }, [progressionManager]);

  if (!isOpen) return null;

  const isUnlockedLevel5 = progression.level >= 5;

  const currentArchetype = progression.archetypeId
    ? ARCHETYPES[progression.archetypeId]
    : null;

  const activeTalentTree = currentArchetype?.talentTree || [];
  const classPassiveTalents = currentArchetype?.passiveTalents || [];

  // Auto-select first available or unlocked node if none selected
  const selectedNode = activeTalentTree.find((n) => n.id === selectedNodeId) || activeTalentTree[0] || null;

  const handleUnlockTalent = (talentId: string) => {
    const success = progressionManager.unlockTalent(talentId);
    if (success) {
      setProgression(progressionManager.getProgression());
    }
  };

  const handleRankUpPassive = (passiveId: string) => {
    const success = progressionManager.rankUpPassive(passiveId);
    if (success) {
      setProgression(progressionManager.getProgression());
    }
  };

  const handleRankDownPassive = (passiveId: string) => {
    const success = progressionManager.rankDownPassive(passiveId);
    if (success) {
      setProgression(progressionManager.getProgression());
    }
  };

  const handleResetTalents = () => {
    progressionManager.resetTalents();
    setProgression(progressionManager.getProgression());
  };

  const handleSelectArchetype = (archetypeId: string) => {
    progressionManager.setArchetype(archetypeId);
    setProgression(progressionManager.getProgression());
  };

  // Group nodes by Tier (1, 2, 3, 4)
  const tierGroups: Record<number, TalentNode[]> = {
    1: activeTalentTree.filter((n) => n.tier === 1),
    2: activeTalentTree.filter((n) => n.tier === 2),
    3: activeTalentTree.filter((n) => n.tier === 3),
    4: activeTalentTree.filter((n) => n.tier === 4),
  };

  const tierReqLevels: Record<number, number> = {
    1: 5,
    2: 7,
    3: 10,
    4: 12,
  };

  // Calculate total passive stats accumulated
  const totalPassiveStats = classPassiveTalents.reduce(
    (acc, pnode) => {
      const rank = progressionManager.getPassiveRank(pnode.id);
      if (pnode.statPerRank.hp) acc.hp += pnode.statPerRank.hp * rank;
      if (pnode.statPerRank.mp) acc.mp += pnode.statPerRank.mp * rank;
      if (pnode.statPerRank.attack) acc.attack += pnode.statPerRank.attack * rank;
      if (pnode.statPerRank.defense) acc.defense += pnode.statPerRank.defense * rank;
      if (pnode.statPerRank.manaRegen) acc.manaRegen += pnode.statPerRank.manaRegen * rank;
      if (pnode.statPerRank.elementalResist) acc.elementalResist += pnode.statPerRank.elementalResist * rank;
      return acc;
    },
    { hp: 0, mp: 0, attack: 0, defense: 0, manaRegen: 0, elementalResist: 0 }
  );

  const modalContent = (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`${
        isInline
          ? 'bg-transparent w-full h-full'
          : 'bg-[#0c0f1d] border-2 border-amber-500/70 rounded-3xl p-3.5 sm:p-6 max-w-4xl w-full max-h-[94vh] sm:max-h-[90vh] shadow-[0_0_60px_rgba(245,158,11,0.25)]'
      } flex flex-col gap-3 sm:gap-4 text-slate-100 overflow-hidden select-none`}
    >
      {/* Header Bar (Only if not inline or if inline header is desired) */}
      {!isInline && (
        <div className="flex items-center justify-between pb-3 border-b border-amber-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="font-cinzel font-black text-base sm:text-xl text-amber-100 tracking-wider uppercase">
                ÁRBOL DE TALENTOS Y TÉCNICAS
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400 font-sans">
                Invierte Puntos de Habilidad para desbloquear pasivas de clase y habilidades activas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetTalents}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/80 text-slate-300 hover:text-rose-200 border border-slate-800 hover:border-rose-700/60 text-xs font-mono font-bold transition-all cursor-pointer"
              title="Restablecer todos los puntos invertidos"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Reiniciar</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-600 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Archetype & Skill Points Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-950/70 p-3 rounded-2xl border border-amber-900/30 shrink-0">
        {/* Active Archetype Pill */}
        <div className="flex items-center gap-2.5 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
          <span className="text-xl shrink-0">
            {currentArchetype ? currentArchetype.icon : '🛡️'}
          </span>
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-mono text-slate-400 uppercase block font-bold">
              ARQUETIPO ACTUAL
            </span>
            <span className="font-bold text-xs text-amber-200 truncate block">
              {currentArchetype ? currentArchetype.name : 'Ninguno (Seleccionar)'}
            </span>
          </div>
          {onOpenArchetypeSelection && currentArchetype && (
            <button
              onClick={onOpenArchetypeSelection}
              className="text-[10px] font-mono text-amber-400 hover:underline px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800 cursor-pointer"
            >
              Cambiar
            </button>
          )}
        </div>

        {/* Unspent Talent Points Pill */}
        <div className="flex items-center gap-2.5 bg-amber-950/40 p-2 rounded-xl border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
          <Star className="w-5 h-5 text-amber-400 fill-amber-400 shrink-0 animate-pulse" />
          <div>
            <span className="text-[9px] font-mono text-amber-300 uppercase block font-bold">
              PUNTOS DISPONIBLES
            </span>
            <span className="font-mono font-black text-sm sm:text-base text-amber-200">
              {progression.talentPoints} PTS DE HABILIDAD
            </span>
          </div>
        </div>

        {/* Hero Level & Spent Points Pill */}
        <div className="flex items-center justify-between sm:justify-start gap-2.5 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-sky-400 shrink-0" />
            <div>
              <span className="text-[9px] font-mono text-slate-400 uppercase block font-bold">
                NIVEL & INVERSIÓN
              </span>
              <span className="font-mono font-bold text-xs text-sky-200">
                Nivel {progression.level} ({progressionManager.getSpentTalentPoints()} PTS invertidos)
              </span>
            </div>
          </div>

          <button
            onClick={handleResetTalents}
            className="flex sm:hidden items-center gap-1 px-2 py-1 rounded-lg bg-rose-950/80 text-rose-200 border border-rose-800 text-[10px] font-mono font-bold cursor-pointer"
            title="Restablecer talentos"
          >
            <RotateCcw className="w-3 h-3 text-rose-400" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs (Habilidades Activas vs Talentos Pasivos) */}
      {currentArchetype && (
        <div className="flex items-center gap-2 border-b border-amber-900/40 pb-2 shrink-0">
          <button
            onClick={() => setActiveTab('PASSIVE')}
            className={`py-2 px-3.5 sm:px-4 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'PASSIVE'
                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-slate-900/70 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>TALENTOS PASIVOS DE CLASE</span>
          </button>

          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`py-2 px-3.5 sm:px-4 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'ACTIVE'
                ? 'bg-amber-500/20 text-amber-200 border border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-slate-900/70 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>TÉCNICAS ACTIVAS</span>
          </button>
        </div>
      )}

      {/* Main Content View */}
      {!isUnlockedLevel5 ? (
        /* LEVEL 5 LOCKED STATE */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-slate-950/80 rounded-2xl border border-amber-900/40">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center text-3xl shadow-lg">
            🔒
          </div>
          <div className="max-w-md space-y-2">
            <h3 className="font-cinzel font-black text-lg sm:text-xl text-amber-200 uppercase tracking-wide">
              TALENTOS Y ARQUETIPOS BLOQUEADOS
            </h3>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Eldor debe ascender al <strong className="text-amber-300">Nivel 5</strong> para despertar la Rueda del Karma y poder especializarse en un Arquetipo de héroe para gastar Puntos de Habilidad en Talentos Pasivos de Clase.
            </p>
          </div>

          <div className="w-full max-w-xs space-y-1.5 pt-2">
            <div className="flex justify-between text-[10px] font-mono text-amber-400 font-bold">
              <span>PROGRESO DE NIVEL</span>
              <span>Nivel {progression.level} / 5</span>
            </div>
            <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-amber-900/40">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 transition-all duration-300"
                style={{ width: `${Math.min(100, (progression.level / 5) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      ) : !currentArchetype ? (
        /* ARCHETYPE SELECTION GRID FOR LEVEL 5+ PLAYERS */
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
          <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-3.5 text-center space-y-1">
            <h3 className="font-cinzel font-bold text-base text-amber-200 uppercase">
              👑 ELIGE TU ARQUETIPO DE HÉROE (NIVEL 5 ALCANZADO)
            </h3>
            <p className="text-xs text-slate-300 font-sans">
              Selecciona una clase de especialización para Eldor para habilitar la asignación de Puntos de Habilidad en sus Talentos Pasivos y Árbol de Técnicas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.values(ARCHETYPES).map((arch) => (
              <div
                key={arch.id}
                className="p-3.5 rounded-2xl bg-slate-950/80 border border-amber-500/30 hover:border-amber-400/80 transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl sm:text-3xl">{arch.icon}</span>
                    <div>
                      <h4 className="font-bold text-sm text-amber-100">
                        {arch.name}
                      </h4>
                      <p className="text-[10px] font-mono text-amber-400/90">
                        {arch.title}
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-snug">
                    {arch.description}
                  </p>

                  <div className="text-[10px] font-mono text-emerald-300 bg-emerald-950/40 p-2 rounded-xl border border-emerald-800/40">
                    <span className="font-bold text-emerald-400">Especialidad Pasiva:</span> {arch.passiveName} ({arch.passiveDescription})
                  </div>
                </div>

                <button
                  onClick={() => handleSelectArchetype(arch.id)}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-amber-950 font-mono text-xs font-black border border-amber-200 shadow-md cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <span>Seleccionar {arch.name}</span>
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'ACTIVE' ? (
            /* ACTIVE TALENTS TAB */
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3.5 overflow-hidden">
              {/* Left Column: Talent Tree Nodes Flow (7 cols) */}
              <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 sm:p-4 overflow-y-auto space-y-4">
                {[1, 2, 3, 4].map((tier) => {
                  const nodesInTier = tierGroups[tier] || [];
                  const reqLevel = tierReqLevels[tier];
                  const isTierUnlocked = progression.level >= reqLevel;

                  return (
                    <div key={tier} className="space-y-2">
                      {/* Tier Header */}
                      <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700/50">
                            TIER {tier}
                          </span>
                          <span className="text-xs font-bold font-cinzel text-slate-300">
                            Requisito: Nivel {reqLevel}
                          </span>
                        </div>
                        {!isTierUnlocked && (
                          <span className="flex items-center gap-1 text-[10px] font-mono text-rose-400 bg-rose-950/50 px-2 py-0.5 rounded border border-rose-900/50">
                            <Lock className="w-3 h-3" /> Bloqueado
                          </span>
                        )}
                      </div>

                      {/* Tier Nodes Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {nodesInTier.map((node) => {
                          const isUnlocked = progressionManager.isTalentUnlocked(node.id);
                          const check = progressionManager.canUnlockTalent(node.id);
                          const isPurchasable = check.canUnlock;
                          const isSelected = selectedNode?.id === node.id;

                          return (
                            <button
                              key={node.id}
                              onClick={() => setSelectedNodeId(node.id)}
                              className={`p-2.5 rounded-xl border text-left transition-all relative flex items-start gap-2.5 cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-950/40 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/50'
                                  : isUnlocked
                                  ? 'bg-emerald-950/20 border-emerald-500/60 hover:bg-emerald-900/30'
                                  : isPurchasable
                                  ? 'bg-slate-900/90 border-amber-500/60 hover:border-amber-400 hover:bg-slate-800/90 animate-pulse'
                                  : 'bg-slate-950/40 border-slate-800 opacity-60 hover:opacity-80'
                              }`}
                            >
                              <div
                                className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0 border ${
                                  isUnlocked
                                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                                    : isPurchasable
                                    ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                                    : 'bg-slate-900 border-slate-700 text-slate-500'
                                }`}
                              >
                                {node.icon}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <h4 className="font-bold text-xs text-slate-100 truncate">
                                    {node.name}
                                  </h4>
                                  {isUnlocked ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  ) : isPurchasable ? (
                                    <span className="text-[9px] font-mono text-amber-300 bg-amber-950 px-1.5 py-0.2 rounded border border-amber-700">
                                      {node.cost} PTS
                                    </span>
                                  ) : (
                                    <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  )}
                                </div>

                                <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 font-sans">
                                  {node.description}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Node Inspector & Unlock CTA (5 cols) */}
              <div className="lg:col-span-5 bg-slate-950/90 border border-amber-900/40 rounded-2xl p-4 flex flex-col justify-between space-y-4 overflow-y-auto">
                {selectedNode ? (
                  <div className="space-y-3.5">
                    {/* Node Header */}
                    <div className="flex items-start gap-3 border-b border-slate-800 pb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 border-2 border-amber-400 flex items-center justify-center text-2xl shadow-lg shrink-0">
                        {selectedNode.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-700 px-2 py-0.5 rounded">
                            Tier {selectedNode.tier} • Req. Nivel {selectedNode.reqLevel}
                          </span>
                          <span className="text-[9px] font-mono font-bold bg-slate-900 text-sky-300 border border-slate-700 px-2 py-0.5 rounded">
                            Costo: {selectedNode.cost} PTS
                          </span>
                        </div>
                        <h3 className="font-cinzel font-bold text-base text-amber-100 mt-1 truncate">
                          {selectedNode.name}
                        </h3>
                      </div>
                    </div>

                    {/* Node Description */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                        DESCRIPCIÓN DEL TALENTO
                      </span>
                      <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 font-sans">
                        {selectedNode.description}
                      </p>
                    </div>

                    {/* Stat Bonuses */}
                    {selectedNode.statBonus && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono text-amber-400 uppercase font-bold block">
                          BONIFICACIÓN PERMANENTE DE ATRIBUTOS
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {selectedNode.statBonus.attack && (
                            <span className="text-xs font-mono font-bold bg-rose-950/80 text-rose-200 border border-rose-800 px-2.5 py-1 rounded-lg flex items-center gap-1">
                              <Sword className="w-3.5 h-3.5 text-rose-400" />
                              +{selectedNode.statBonus.attack} Ataque
                            </span>
                          )}
                          {selectedNode.statBonus.defense && (
                            <span className="text-xs font-mono font-bold bg-sky-950/80 text-sky-200 border border-sky-800 px-2.5 py-1 rounded-lg flex items-center gap-1">
                              <Shield className="w-3.5 h-3.5 text-sky-400" />
                              +{selectedNode.statBonus.defense} Defensa
                            </span>
                          )}
                          {selectedNode.statBonus.hp && (
                            <span className="text-xs font-mono font-bold bg-emerald-950/80 text-emerald-200 border border-emerald-800 px-2.5 py-1 rounded-lg flex items-center gap-1">
                              <Heart className="w-3.5 h-3.5 text-emerald-400" />
                              +{selectedNode.statBonus.hp} HP Max
                            </span>
                          )}
                          {selectedNode.statBonus.mp && (
                            <span className="text-xs font-mono font-bold bg-indigo-950/80 text-indigo-200 border border-indigo-800 px-2.5 py-1 rounded-lg flex items-center gap-1">
                              <Zap className="w-3.5 h-3.5 text-indigo-400" />
                              +{selectedNode.statBonus.mp} MP Max
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Skill Unlock Preview */}
                    {selectedNode.skillUnlock && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> TÉCNICA DE COMBATE DESBLOQUEABLE
                        </span>
                        <div className="bg-cyan-950/30 border border-cyan-500/40 p-3 rounded-xl space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-xs text-cyan-200">
                              {selectedNode.skillUnlock.name}
                            </span>
                            <span className="text-[10px] font-mono text-cyan-300 font-bold bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                              {selectedNode.skillUnlock.mpCost} MP • {selectedNode.skillUnlock.hitCount} Golpes
                            </span>
                          </div>
                          <p className="text-[11px] text-cyan-100/80 leading-snug font-sans">
                            {selectedNode.skillUnlock.description}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Prerequisites */}
                    {selectedNode.prerequisites && selectedNode.prerequisites.length > 0 && (
                      <div className="space-y-1 text-[11px] font-mono">
                        <span className="text-slate-400 block font-bold">REQUISITOS PREVIOS:</span>
                        {selectedNode.prerequisites.map((pId) => {
                          const reqNode = activeTalentTree.find((n) => n.id === pId);
                          const isMet = progressionManager.isTalentUnlocked(pId);
                          return (
                            <div
                              key={pId}
                              className={`flex items-center gap-1.5 ${
                                isMet ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'
                              }`}
                            >
                              {isMet ? <CheckCircle2 className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                              <span>{reqNode ? reqNode.name : pId}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-500 text-xs font-mono">
                    Selecciona un talento para ver sus detalles.
                  </div>
                )}

                {/* Unlock CTA Button */}
                {selectedNode && (
                  <div className="pt-3 border-t border-slate-800">
                    {progressionManager.isTalentUnlocked(selectedNode.id) ? (
                      <div className="w-full py-2.5 px-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 font-mono text-xs font-bold flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>TALENTO YA ADQUIRIDO</span>
                      </div>
                    ) : (
                      (() => {
                        const check = progressionManager.canUnlockTalent(selectedNode.id);
                        return (
                          <div className="space-y-2">
                            {!check.canUnlock && (
                              <p className="text-[10px] font-mono text-rose-400 text-center font-bold">
                                {check.reason}
                              </p>
                            )}
                            <button
                              onClick={() => handleUnlockTalent(selectedNode.id)}
                              disabled={!check.canUnlock}
                              className={`w-full py-3 px-4 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                                check.canUnlock
                                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 border border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                                  : 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed'
                              }`}
                            >
                              <Sparkles className="w-4 h-4 text-amber-950" />
                              <span>DESBLOQUEAR TALENTO ({selectedNode.cost} PTS)</span>
                            </button>
                          </div>
                        );
                      })()
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* PASSIVE TALENTS TAB */
            <div className="flex-1 min-h-0 flex flex-col gap-3.5 overflow-hidden">
              {/* Top Summary Banner */}
              <div className="bg-gradient-to-r from-emerald-950/60 via-slate-950 to-emerald-950/60 border border-emerald-500/40 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-cinzel font-bold text-xs sm:text-sm text-emerald-200 uppercase tracking-wide">
                      TALENTOS PASIVOS DE CLASE DE {currentArchetype.name.toUpperCase()}
                    </h4>
                    <p className="text-[10px] font-sans text-slate-300">
                      Asigna puntos para incrementar de forma acumulativa Vida Máxima, Regeneración de Maná y Resistencia Elemental.
                    </p>
                  </div>
                </div>

                {/* Passive Accumulated Stats Pills */}
                <div className="flex items-center gap-2 flex-wrap">
                  {totalPassiveStats.hp > 0 && (
                    <span className="text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <Heart className="w-3 h-3 text-emerald-400" />
                      +{totalPassiveStats.hp} HP
                    </span>
                  )}
                  {totalPassiveStats.manaRegen > 0 && (
                    <span className="text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/60 px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <Zap className="w-3 h-3 text-indigo-400" />
                      +{totalPassiveStats.manaRegen} MP/Turno
                    </span>
                  )}
                  {totalPassiveStats.elementalResist > 0 && (
                    <span className="text-[10px] font-mono font-bold bg-sky-950 text-sky-300 border border-sky-700/60 px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-sky-400" />
                      +{totalPassiveStats.elementalResist}% Res. Elemental
                    </span>
                  )}
                  {totalPassiveStats.attack > 0 && (
                    <span className="text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-700/60 px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <Sword className="w-3 h-3 text-rose-400" />
                      +{totalPassiveStats.attack} Ataque
                    </span>
                  )}
                </div>
              </div>

              {/* Passive Talents Grid */}
              <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3 pr-1">
                {classPassiveTalents.map((pnode) => {
                  const rank = progressionManager.getPassiveRank(pnode.id);
                  const canRankUp = progressionManager.canRankUpPassive(pnode.id).canRankUp;
                  const canRankDown = progressionManager.canRankDownPassive(pnode.id);

                  // Calculate stats for current rank
                  const currentHpBonus = (pnode.statPerRank.hp || 0) * rank;
                  const currentMpBonus = (pnode.statPerRank.mp || 0) * rank;
                  const currentAtkBonus = (pnode.statPerRank.attack || 0) * rank;
                  const currentDefBonus = (pnode.statPerRank.defense || 0) * rank;
                  const currentRegenBonus = (pnode.statPerRank.manaRegen || 0) * rank;
                  const currentResistBonus = (pnode.statPerRank.elementalResist || 0) * rank;

                  return (
                    <div
                      key={pnode.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                        rank > 0
                          ? 'bg-gradient-to-br from-slate-950 via-[#101728] to-slate-950 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                          : 'bg-slate-950/70 border-slate-800'
                      }`}
                    >
                      {/* Passive Header */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-amber-500/40 flex items-center justify-center text-xl shrink-0">
                              {pnode.icon}
                            </div>
                            <div>
                              <h4 className="font-cinzel font-bold text-sm text-amber-100">
                                {pnode.name}
                              </h4>
                              <span className="text-[10px] font-mono text-amber-300/80 font-bold">
                                Rango {rank} / {pnode.maxRanks}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleRankDownPassive(pnode.id)}
                              disabled={!canRankDown}
                              className={`p-1.5 rounded-lg border font-mono transition-all cursor-pointer ${
                                canRankDown
                                  ? 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border-rose-800/80 active:scale-95'
                                  : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
                              }`}
                              title="Reembolsar 1 Rango"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleRankUpPassive(pnode.id)}
                              disabled={!canRankUp}
                              className={`py-1.5 px-3 rounded-lg border font-mono text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                canRankUp
                                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 border-amber-300 shadow-md active:scale-95'
                                  : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
                              }`}
                              title="Aumentar 1 Rango (1 PTS)"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+1 RANGO</span>
                            </button>
                          </div>
                        </div>

                        {/* Rank Progress Bar */}
                        <div className="flex items-center gap-1.5 pt-1">
                          {Array.from({ length: pnode.maxRanks }).map((_, i) => (
                            <div
                              key={i}
                              className={`h-2 flex-1 rounded-full transition-all border ${
                                i < rank
                                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                                  : 'bg-slate-900 border-slate-800'
                              }`}
                            />
                          ))}
                        </div>

                        <p className="text-xs text-slate-300 font-sans leading-relaxed">
                          {pnode.description}
                        </p>
                      </div>

                      {/* Stat Benefits Card */}
                      <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800/80 space-y-1.5">
                        <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block">
                          BENEFICIOS POR RANGO (ACTUAL VS RANGO SIGUIENTE)
                        </span>

                        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                          {pnode.statPerRank.hp && (
                            <span className="text-emerald-300 font-bold flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                              <Heart className="w-3 h-3 text-emerald-400" />
                              +{pnode.statPerRank.hp} HP por Rango {rank > 0 ? `(Total: +${currentHpBonus} HP)` : ''}
                            </span>
                          )}
                          {pnode.statPerRank.manaRegen && (
                            <span className="text-indigo-300 font-bold flex items-center gap-1 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/60">
                              <Zap className="w-3 h-3 text-indigo-400" />
                              +{pnode.statPerRank.manaRegen} MP por Turno {rank > 0 ? `(Total: +${currentRegenBonus} MP/T)` : ''}
                            </span>
                          )}
                          {pnode.statPerRank.elementalResist && (
                            <span className="text-sky-300 font-bold flex items-center gap-1 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/60">
                              <ShieldAlert className="w-3 h-3 text-sky-400" />
                              +{pnode.statPerRank.elementalResist}% Res. Elemental {rank > 0 ? `(Total: +${currentResistBonus}%)` : ''}
                            </span>
                          )}
                          {pnode.statPerRank.attack && (
                            <span className="text-rose-300 font-bold flex items-center gap-1 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/60">
                              <Sword className="w-3 h-3 text-rose-400" />
                              +{pnode.statPerRank.attack} Ataque {rank > 0 ? `(Total: +${currentAtkBonus} Atq)` : ''}
                            </span>
                          )}
                          {pnode.statPerRank.defense && (
                            <span className="text-sky-300 font-bold flex items-center gap-1 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/60">
                              <Shield className="w-3 h-3 text-sky-400" />
                              +{pnode.statPerRank.defense} Defensa {rank > 0 ? `(Total: +${currentDefBonus} Def)` : ''}
                            </span>
                          )}
                          {pnode.statPerRank.mp && (
                            <span className="text-indigo-300 font-bold flex items-center gap-1 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/60">
                              <Zap className="w-3 h-3 text-indigo-400" />
                              +{pnode.statPerRank.mp} MP Max {rank > 0 ? `(Total: +${currentMpBonus} MP)` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
  );

  if (isInline) {
    return modalContent;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 select-none"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="max-w-4xl w-full max-h-[94vh] sm:max-h-[90vh] flex flex-col justify-center"
        >
          {modalContent}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
