'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, X, Backpack, User, Map, Settings, Sparkles, Calendar, Flame, Award, CheckCircle2, Heart, BookOpen } from 'lucide-react';
import { InventoryWindow } from '../../game/UI/Inventory/InventoryWindow';
import { HeroTab } from './HeroTab';
import { MapTab } from './MapTab';
import { SettingsTab } from './SettingsTab';
import { TalentTreeModal } from './TalentTreeModal';
import { BestiaryTab } from './BestiaryTab';
import { ProgressionManager } from '../../game/Systems/Progression/ProgressionManager';
import { DailyProgressionSystem, DailyQuest, RestBuff } from '../../game/Systems/Progression/DailyProgressionSystem';
import { FantasySFX } from '../../game/Systems/FantasySFX';

export type MainMenuTab = 'INVENTORY' | 'HERO' | 'TALENTS' | 'BESTIARY' | 'DAILY' | 'MAP' | 'SETTINGS';

interface JRPGMainMenuModalProps {
  isOpen: boolean;
  activeTab: MainMenuTab;
  onTabChange: (tab: MainMenuTab) => void;
  onClose: () => void;
  heroHp: number;
  heroMaxHp: number;
  heroMp: number;
  heroMaxMp: number;
  currentMapId: string;
  telemetryQuality: string;
  forceTouch: boolean;
  debugCollidersEnabled?: boolean;
  debugAutoOrbitEnabled?: boolean;
  onChangeQuality: (level: 'LOW' | 'MEDIUM' | 'HIGH') => void;
  onToggleTouch: () => void;
  onToggleColliders: () => void;
  onToggleAutoOrbit: () => void;
}

export const JRPGMainMenuModal: React.FC<JRPGMainMenuModalProps> = ({
  isOpen,
  activeTab,
  onTabChange,
  onClose,
  heroHp,
  heroMaxHp,
  heroMp,
  heroMaxMp,
  currentMapId,
  telemetryQuality,
  forceTouch,
  debugCollidersEnabled,
  debugAutoOrbitEnabled,
  onChangeQuality,
  onToggleTouch,
  onToggleColliders,
  onToggleAutoOrbit,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#0b0e17] border-2 border-amber-500/70 rounded-3xl p-3.5 sm:p-6 max-w-4xl w-full max-h-[92vh] sm:max-h-[90vh] shadow-[0_0_60px_rgba(217,119,6,0.25)] flex flex-col gap-3 sm:gap-4 text-slate-100 overflow-hidden"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-amber-900/50 shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
                <Crown className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h2 className="font-cinzel font-black text-base sm:text-xl text-amber-100 tracking-wider uppercase truncate">
                  MENÚ DE MIDGARD-LOKA
                </h2>
                <p className="text-[10px] sm:text-xs text-amber-400/90 font-sans truncate">
                  Eldor — Nivel {ProgressionManager.getInstance().getLevel()} Einherjar del Karma Rúnico
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-600 transition-colors cursor-pointer shrink-0"
              title="Cerrar Menú [Esc / M]"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Navigation Tab Bar (Mobile-first grid) */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 bg-slate-950/60 p-1 sm:p-1.5 rounded-2xl border border-amber-900/30 shrink-0">
            <button
              onClick={() => onTabChange('INVENTORY')}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl font-sans font-bold text-[9px] sm:text-xs tracking-wider transition-all cursor-pointer ${
                activeTab === 'INVENTORY'
                  ? 'bg-amber-600/30 text-amber-200 border border-amber-500/60 shadow-lg'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Backpack className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
              <span className="truncate">OBJETOS</span>
            </button>

            <button
              onClick={() => onTabChange('HERO')}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl font-sans font-bold text-[9px] sm:text-xs tracking-wider transition-all cursor-pointer ${
                activeTab === 'HERO'
                  ? 'bg-amber-600/30 text-amber-200 border border-amber-500/60 shadow-lg'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
              <span className="truncate">HÉROE</span>
            </button>

            <button
              onClick={() => onTabChange('TALENTS')}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl font-sans font-bold text-[9px] sm:text-xs tracking-wider transition-all cursor-pointer ${
                activeTab === 'TALENTS'
                  ? 'bg-amber-600/30 text-amber-200 border border-amber-500/60 shadow-lg'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 shrink-0" />
              <span className="truncate">TALENTOS</span>
            </button>

            <button
              onClick={() => onTabChange('BESTIARY')}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl font-sans font-bold text-[9px] sm:text-xs tracking-wider transition-all cursor-pointer ${
                activeTab === 'BESTIARY'
                  ? 'bg-amber-600/30 text-amber-200 border border-amber-500/60 shadow-lg'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
              <span className="truncate">BESTIARIO</span>
            </button>

            <button
              onClick={() => onTabChange('DAILY')}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl font-sans font-bold text-[9px] sm:text-xs tracking-wider transition-all cursor-pointer ${
                activeTab === 'DAILY'
                  ? 'bg-amber-600/30 text-amber-200 border border-amber-500/60 shadow-lg'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
              <span className="truncate">DIARIO</span>
            </button>

            <button
              onClick={() => onTabChange('MAP')}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl font-sans font-bold text-[9px] sm:text-xs tracking-wider transition-all cursor-pointer ${
                activeTab === 'MAP'
                  ? 'bg-amber-600/30 text-amber-200 border border-amber-500/60 shadow-lg'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Map className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 shrink-0" />
              <span className="truncate">MAPA</span>
            </button>

            <button
              onClick={() => onTabChange('SETTINGS')}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl font-sans font-bold text-[9px] sm:text-xs tracking-wider transition-all cursor-pointer ${
                activeTab === 'SETTINGS'
                  ? 'bg-amber-600/30 text-amber-200 border border-amber-500/60 shadow-lg'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400 shrink-0" />
              <span className="truncate">AJUSTES</span>
            </button>
          </div>

          {/* Active Tab Content Area */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 sm:pr-1">
            {activeTab === 'INVENTORY' && (
              <div className="relative h-full min-h-[400px]">
                <InventoryWindow onClose={onClose} />
              </div>
            )}

            {activeTab === 'HERO' && (
              <HeroTab
                heroHp={heroHp}
                heroMaxHp={heroMaxHp}
                heroMp={heroMp}
                heroMaxMp={heroMaxMp}
                onNavigateToTalents={() => onTabChange('TALENTS')}
              />
            )}

            {activeTab === 'TALENTS' && (
              <div className="relative h-full min-h-[420px]">
                <TalentTreeModal
                  isOpen={true}
                  isInline={true}
                  onClose={onClose}
                  onOpenArchetypeSelection={() => onTabChange('HERO')}
                />
              </div>
            )}

            {activeTab === 'BESTIARY' && (
              <BestiaryTab />
            )}

            {activeTab === 'DAILY' && (
              <div className="p-4 space-y-4 font-sans bg-slate-950/60 rounded-2xl border border-slate-800">
                {/* Banner */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/50 via-amber-900/30 to-slate-900 border border-amber-500/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
                      <Flame className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-amber-200">
                        Racha Diaria: {DailyProgressionSystem.getInstance().getStreakDays()} día(s)
                      </h3>
                      <p className="text-xs text-slate-300">
                        Bonificación activa: +{DailyProgressionSystem.getInstance().getStreakExpBonus()}% EXP
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      DailyProgressionSystem.getInstance().restAtCampfire();
                      FantasySFX.getInstance().playHealChime();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Heart className="w-3.5 h-3.5" /> Hoguera
                  </button>
                </div>

                {/* Quests List */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4" /> Misiones Diarias (Sesión 10-20 min)
                  </h4>

                  {DailyProgressionSystem.getInstance().getQuests().map((q) => (
                    <div
                      key={q.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        q.completed
                          ? 'bg-emerald-950/20 border-emerald-500/40'
                          : 'bg-slate-900/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                            {q.title}
                            {q.completed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                          </h5>
                          <p className="text-[11px] text-slate-400">{q.description}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 shrink-0">
                          {q.rewardText}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>Progreso</span>
                          <span>{q.current} / {q.target}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full ${q.completed ? 'bg-emerald-400' : 'bg-amber-400'}`}
                            style={{ width: `${Math.min(100, (q.current / q.target) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'MAP' && (
              <MapTab currentMapId={currentMapId} onCloseMenu={onClose} />
            )}

            {activeTab === 'SETTINGS' && (
              <SettingsTab
                telemetryQuality={telemetryQuality}
                forceTouch={forceTouch}
                debugCollidersEnabled={debugCollidersEnabled}
                debugAutoOrbitEnabled={debugAutoOrbitEnabled}
                onChangeQuality={onChangeQuality}
                onToggleTouch={onToggleTouch}
                onToggleColliders={onToggleColliders}
                onToggleAutoOrbit={onToggleAutoOrbit}
              />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
