'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  Flame, 
  Skull, 
  Coins, 
  Package, 
  Home, 
  CheckCircle2, 
  FlaskConical,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Compass,
  Volume2,
  EyeOff
} from 'lucide-react';
import { ExpeditionManager, DangerZoneInfo, UnextractedItem } from '../../game/Systems/Expedition/ExpeditionManager';
import { InventoryManager } from '../../game/Systems/Inventory/InventoryManager';
import { ToastManager } from '../../game/Systems/ToastManager';
import { DynamicWorldEventsSystem } from '../../game/Systems/DynamicWorldEventsSystem';
import { ClaudecraftAssets } from '../../game/Assets/ClaudecraftAssets';

interface ExpeditionHUDProps {
  onExtractClick?: () => void;
  onOpenJournalClick?: () => void;
  onOpenMapClick?: () => void;
  className?: string;
}

export const ExpeditionHUD: React.FC<ExpeditionHUDProps> = ({
  onExtractClick,
  onOpenJournalClick,
  onOpenMapClick,
  className = '',
}) => {
  const [active, setActive] = useState(false);
  const [zone, setZone] = useState<DangerZoneInfo>(ExpeditionManager.getInstance().getZoneInfo());
  const [unextractedGold, setUnextractedGold] = useState(0);
  const [unextractedItems, setUnextractedItems] = useState<UnextractedItem[]>([]);
  const [showItemDetails, setShowItemDetails] = useState(false);

  // Dynamic noise level state
  const [noiseLevel, setNoiseLevel] = useState(0);
  const [isStealth, setIsStealth] = useState(false);

  useEffect(() => {
    const manager = ExpeditionManager.getInstance();
    const updateState = () => {
      setActive(manager.isExpeditionActive());
      setZone(manager.getZoneInfo());
      setUnextractedGold(manager.getUnextractedGold());
      setUnextractedItems(manager.getUnextractedItems());
    };

    updateState();
    const unsubExp = manager.subscribe(updateState);

    const worldSys = DynamicWorldEventsSystem.getInstance();
    const updateWorld = () => {
      setNoiseLevel(worldSys.getPlayerNoiseLevel());
      setIsStealth(worldSys.getIsStealthActive());
    };
    updateWorld();
    const unsubWorld = worldSys.subscribe(updateWorld);

    return () => {
      unsubExp();
      unsubWorld();
    };
  }, []);

  const handleUseQuickPotion = () => {
    const inv = InventoryManager.getInstance().getPlayerInventory();
    const slots = inv.getSlots();
    const potionIndex = slots.findIndex(
      (s) => s.instance && (s.instance.definitionId === 'small_potion' || s.instance.definitionId === 'greater_potion')
    );

    if (potionIndex >= 0) {
      InventoryManager.getInstance().useItemFromInventory(potionIndex);
    } else {
      ToastManager.getInstance().show('⚠️ No tienes Pociones de Salud en la Mochila.');
    }
  };

  if (!active && zone.level === 'SAFE') {
    return (
      <div className={`fixed top-3 left-1/2 -translate-x-1/2 z-40 pointer-events-auto ${className}`}>
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950/90 border border-emerald-500/60 shadow-xl backdrop-blur-md text-emerald-300 text-xs font-bold"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>🛡️ ZONA SEGURA — Sin Batallas en Ciudades / Villas</span>
        </motion.div>
      </div>
    );
  }

  const totalItemCount = unextractedItems.reduce((acc, i) => acc + i.count, 0);

  return (
    <div className={`fixed top-3 left-1/2 -translate-x-1/2 z-40 pointer-events-auto max-w-2xl w-[92vw] sm:w-auto ${className}`}>
      <motion.div 
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -30, opacity: 0 }}
        className={`relative flex flex-wrap items-center justify-between gap-2 px-3 sm:px-5 py-2 rounded-2xl bg-slate-950/90 border shadow-2xl backdrop-blur-md transition-all duration-300 ${zone.borderColor}`}
      >
        {/* LEFT: Danger Badge & Zone Info */}
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-xl bg-gradient-to-r ${zone.color} text-white shadow-lg animate-pulse`}>
            {zone.level === 'SAFE' && <CheckCircle2 className="w-4 h-4" />}
            {zone.level === 'MODERATE' && <ShieldAlert className="w-4 h-4" />}
            {zone.level === 'HIGH' && <Flame className="w-4 h-4" />}
            {zone.level === 'DEADLY' && <Skull className="w-4 h-4" />}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-black uppercase tracking-wider text-amber-300">
                {zone.badge}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30">
                x{zone.multiplier} Recompensas
              </span>
            </div>
            <span className="text-xs font-bold text-slate-100 truncate max-w-[150px] sm:max-w-[180px]">
              {zone.name}
            </span>
          </div>
        </div>

        {/* MIDDLE: Noise & Stealth Indicator */}
        <div className="flex items-center gap-2 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-slate-800" title="Nivel de Ruido y Sigilo">
          {isStealth ? (
            <div className="flex items-center gap-1 text-emerald-400 text-xs font-mono font-bold">
              <EyeOff className="w-3.5 h-3.5" />
              <span>Sigilo</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-amber-400 text-xs font-mono font-bold">
              <Volume2 className="w-3.5 h-3.5" />
              <span>Ruido {noiseLevel}%</span>
            </div>
          )}
        </div>

        {/* MIDDLE RIGHT: Unextracted Loot Trackers */}
        <div className="flex items-center gap-3 bg-slate-900/80 px-3 py-1 rounded-xl border border-slate-800">
          {/* Gold */}
          <div className="flex items-center gap-1 text-amber-300 font-mono text-xs font-bold" title="Oro sin asegurar en esta expedición">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ClaudecraftAssets.COIN} alt="Oro" className="w-4 h-4 object-contain drop-shadow" />
            <span>+{unextractedGold}</span>
          </div>

          <div className="w-px h-4 bg-slate-800" />

          {/* Items */}
          <button
            onClick={() => setShowItemDetails((prev) => !prev)}
            className="flex items-center gap-1.5 text-sky-300 font-mono text-xs font-bold hover:text-sky-200 transition-colors"
            title="Ver botín no asegurado"
          >
            <Package className="w-3.5 h-3.5 text-sky-400" />
            <span>{totalItemCount} Objeto(s)</span>
            {showItemDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* RIGHT: Buttons */}
        <div className="flex items-center gap-2">
          {/* Tactical Map */}
          {onOpenMapClick && (
            <button
              onClick={onOpenMapClick}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-300 transition-all active:scale-95 flex items-center gap-1 text-xs font-semibold px-2.5"
              title="Abrir Mapa Táctico de la Zona (Tecla M)"
            >
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Mapa</span>
            </button>
          )}

          {/* World Journal */}
          {onOpenJournalClick && (
            <button
              onClick={onOpenJournalClick}
              className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 transition-all active:scale-95"
              title="Abrir Bitácora de Historias del Mundo"
            >
              <BookOpen className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Quick Consumable */}
          <button
            onClick={handleUseQuickPotion}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/40 hover:bg-emerald-900 text-emerald-300 text-xs font-bold transition-all active:scale-95 shadow-md"
            title="Usar Poción de Salud"
          >
            <FlaskConical className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
            <span className="hidden sm:inline">Poción</span>
          </button>

          {/* Extract Button if active in danger zone */}
          {active && onExtractClick && (
            <button
              onClick={onExtractClick}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-all active:scale-95"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Extraer</span>
            </button>
          )}
        </div>

        {/* EXPANDABLE UNEXTRACTED LOOT POPOVER */}
        <AnimatePresence>
          {showItemDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="w-full mt-2 pt-2 border-t border-slate-800/80 overflow-hidden"
            >
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                <span>Botín en Mochila (Sin Asegurar)</span>
                <span className="text-amber-400">Pérdida en Muerte: 60%</span>
              </div>

              {unextractedItems.length === 0 ? (
                <div className="text-xs italic text-slate-500 text-center py-2">
                  No has recogido objetos en esta expedición aún.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {unextractedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-2 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px]"
                    >
                      <span className={`font-semibold truncate max-w-[100px] ${
                        item.rarity === 'LEGENDARY' ? 'text-amber-300 font-bold' :
                        item.rarity === 'EPIC' ? 'text-purple-300 font-bold' :
                        item.rarity === 'RARE' ? 'text-sky-300 font-bold' : 'text-slate-200'
                      }`}>
                        {item.name}
                      </span>
                      <span className="font-mono text-xs font-bold text-amber-200 ml-1">
                        x{item.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
