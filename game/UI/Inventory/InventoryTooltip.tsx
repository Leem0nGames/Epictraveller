'use client';
import React from 'react';
import { ItemInstance } from '../../Systems/Items/ItemInstance';
import { DatabaseManager } from '../../Database/DatabaseManager';
import { Rarity } from '../../Systems/Items/Rarity';
import { InventoryManager } from '../../Systems/Inventory/InventoryManager';
import { EquipmentSlot } from '../../Systems/Equipment/EquipmentSlot';
import { EquipmentFactory } from '../../Systems/Equipment/EquipmentFactory';
import { ClaudecraftAssets } from '../../Assets/ClaudecraftAssets';
import { Shield, Sword, Heart, Coins, Lock, Star, Sparkles, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface InventoryTooltipProps {
  instance: ItemInstance | null;
  count: number;
  onClose?: () => void;
  onEquip?: () => void;
  onUse?: () => void;
  onSell?: () => void;
  onSplit?: () => void;
  onToggleLock?: () => void;
  onToggleFavorite?: () => void;
  onDiscard?: () => void;
}

export const InventoryTooltip: React.FC<InventoryTooltipProps> = ({
  instance,
  count,
  onClose,
  onEquip,
  onUse,
  onSell,
  onSplit,
  onToggleLock,
  onToggleFavorite,
  onDiscard,
}) => {
  if (!instance) return null;

  const definition = DatabaseManager.getInstance().getItemDefinition(instance.definitionId);
  if (!definition) return null;

  const getRarityColors = (rarity: Rarity) => {
    switch (rarity) {
      case Rarity.COMMON:
        return { text: 'text-slate-400', border: 'border-slate-700/65', bg: 'bg-slate-900/90', glow: 'shadow-slate-500/10' };
      case Rarity.UNCOMMON:
        return { text: 'text-emerald-400', border: 'border-emerald-700/65', bg: 'bg-emerald-950/20', glow: 'shadow-emerald-500/10' };
      case Rarity.RARE:
        return { text: 'text-sky-400', border: 'border-sky-700/65', bg: 'bg-sky-950/20', glow: 'shadow-sky-500/10' };
      case Rarity.EPIC:
        return { text: 'text-purple-400', border: 'border-purple-700/65', bg: 'bg-purple-950/20', glow: 'shadow-purple-500/10' };
      case Rarity.LEGENDARY:
        return { text: 'text-amber-400', border: 'border-amber-700/65', bg: 'bg-amber-950/20', glow: 'shadow-amber-500/15' };
      case Rarity.MYTHIC:
        return { text: 'text-rose-400', border: 'border-rose-700/65', bg: 'bg-rose-950/20', glow: 'shadow-rose-500/20' };
      default:
        return { text: 'text-slate-400', border: 'border-slate-700', bg: 'bg-slate-950', glow: 'shadow-none' };
    }
  };

  const colors = getRarityColors(instance.rarity);

  // Compute equipment stat comparison vs currently equipped item
  let equippedItem: any = null;
  let statComparison: { stat: string; newItemVal: number; equippedVal: number; delta: number }[] = [];

  if (definition.equipmentSlot) {
    const eqSlot = definition.equipmentSlot as EquipmentSlot;
    equippedItem = InventoryManager.getInstance().getPlayerEquipment().getEquippedItem(eqSlot);

    try {
      const newItemEqDef = EquipmentFactory.createEquipment(instance.definitionId);
      const newMods = newItemEqDef.modifiers || [];

      // Calculate totals for new item
      const statsMap: Record<string, number> = { attack: 0, defense: 0, maxHp: 0, maxMp: 0 };
      newMods.forEach((m: any) => {
        const s = m.stat || (definition.equipmentSlot === 'weapon' ? 'attack' : 'defense');
        statsMap[s] = (statsMap[s] || 0) + m.value;
      });

      // Calculate totals for currently equipped item
      const equippedStatsMap: Record<string, number> = { attack: 0, defense: 0, maxHp: 0, maxMp: 0 };
      if (equippedItem && equippedItem.modifiers) {
        equippedItem.modifiers.forEach((m: any) => {
          const s = m.stat || 'attack';
          equippedStatsMap[s] = (equippedStatsMap[s] || 0) + m.value;
        });
      }

      // Build comparative deltas
      Object.keys(statsMap).forEach((statName) => {
        const newVal = statsMap[statName];
        if (newVal > 0) {
          const oldVal = equippedStatsMap[statName] || 0;
          statComparison.push({
            stat: statName,
            newItemVal: newVal,
            equippedVal: oldVal,
            delta: newVal - oldVal,
          });
        }
      });
    } catch {
      // Ignore if not in equipment factory
    }
  }

  const isConsumable =
    definition.category === 'CONSUMABLE' ||
    definition.id.includes('potion') ||
    definition.id.includes('elixir');

  const sellValue = Math.max(1, Math.floor((definition.baseValue || 15) * 0.75)) * count;

  return (
    <div className={`p-4 bg-slate-950/95 backdrop-blur-md rounded-xl border ${colors.border} shadow-2xl ${colors.glow} flex flex-col gap-3 text-xs w-72 max-w-full select-none text-slate-200 pointer-events-auto`}>
      {/* Header Info */}
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className={`font-black font-sans text-sm tracking-wide leading-tight truncate ${colors.text}`}>
              {definition.name}
            </h3>
            {instance.favorite && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0 animate-pulse" />}
            {instance.locked && <Lock className="w-3 h-3 text-red-400 shrink-0" />}
          </div>
          <span className={`text-[9px] font-mono tracking-widest uppercase font-extrabold ${colors.text}`}>
            {instance.rarity} · NIVEL {instance.level}
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 font-mono text-xs p-1">✕</button>
        )}
      </div>

      {/* Description & Icon */}
      <div className="flex items-start gap-2.5 bg-slate-900/60 p-2 rounded-lg border border-slate-800/40">
        <div className={`w-12 h-12 rounded-md bg-slate-950 border ${colors.border} flex items-center justify-center p-1 shrink-0 overflow-hidden`}>
          {(() => {
            const iconSrc = (definition.icon && (definition.icon.startsWith('http') || definition.icon.startsWith('/') || definition.icon.endsWith('.webp') || definition.icon.endsWith('.png')))
              ? definition.icon
              : ClaudecraftAssets.getItemIcon(definition.id);
            return (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={iconSrc}
                alt={definition.name}
                className="w-full h-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
              />
            );
          })()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-slate-300 leading-relaxed italic">{definition.description}</p>
        </div>
      </div>

      {/* Stat Comparison Section if Equipment */}
      {definition.equipmentSlot && statComparison.length > 0 && (
        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-amber-500/30 space-y-1.5">
          <div className="flex justify-between items-center text-[9px] font-mono font-black text-amber-400 uppercase tracking-wider">
            <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> COMPARATIVA DE ATRIBUTOS</span>
            <span className="text-slate-400">{equippedItem ? `vs ${equippedItem.name}` : 'Sin equipo'}</span>
          </div>

          <div className="space-y-1 font-mono text-[10px]">
            {statComparison.map((comp, i) => {
              const isPositive = comp.delta > 0;
              const isNegative = comp.delta < 0;
              const label = comp.stat === 'attack' ? 'Ataque' : comp.stat === 'defense' ? 'Defensa' : comp.stat === 'maxHp' ? 'HP Max' : 'MP Max';

              return (
                <div key={i} className="flex justify-between items-center bg-slate-950/60 px-2 py-1 rounded border border-slate-800">
                  <span className="text-slate-300 font-bold">{label}</span>
                  <div className="flex items-center gap-1.5 font-black">
                    <span className="text-slate-200">+{comp.newItemVal}</span>
                    {comp.equippedVal > 0 && (
                      <span className={`flex items-center text-[9px] ${isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-slate-400'}`}>
                        ({isPositive ? '+' : ''}{comp.delta})
                        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : isNegative ? <ArrowDownRight className="w-3 h-3" /> : null}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Details list */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[9px] text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-800 pb-0.5">
          <span>Detalles</span>
          <span>Valores</span>
        </div>
        
        {/* Price */}
        <div className="flex justify-between items-center text-[10px] font-mono">
          <span className="text-slate-400 flex items-center gap-1"><Coins className="w-3 h-3 text-amber-500" /> Valor Venta</span>
          <span className="text-amber-300 font-bold">+{sellValue} ORO</span>
        </div>

        {/* Durability */}
        <div className="space-y-0.5">
          <div className="flex justify-between items-center text-[10px] font-mono">
            <span className="text-slate-400">Durabilidad</span>
            <span className="text-slate-300 font-bold">{instance.durability}/100</span>
          </div>
          <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
            <div 
              className={`h-full ${instance.durability > 50 ? 'bg-emerald-500' : instance.durability > 20 ? 'bg-amber-500' : 'bg-red-500'}`} 
              style={{ width: `${instance.durability}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Actions Section */}
      <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-800/80">
        {definition.equipmentSlot && onEquip && (
          <button
            onClick={onEquip}
            className="col-span-2 py-1.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold rounded-lg tracking-widest text-[10px] uppercase shadow-lg transition-all cursor-pointer text-center"
          >
            Equipar Objeto
          </button>
        )}

        {isConsumable && onUse && (
          <button
            onClick={onUse}
            className="col-span-2 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-lg tracking-widest text-[10px] uppercase shadow-lg transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
          >
            <Heart className="w-3.5 h-3.5 fill-white" /> Consumir Objeto
          </button>
        )}

        {onSell && (
          <button
            onClick={onSell}
            className="py-1 bg-amber-950/40 hover:bg-amber-900/60 active:scale-95 text-amber-300 border border-amber-600/40 rounded font-bold uppercase tracking-wider text-[9px] cursor-pointer flex justify-center items-center gap-1"
          >
            <Coins className="w-3 h-3 text-amber-400" /> Vender
          </button>
        )}

        {onToggleFavorite && (
          <button
            onClick={onToggleFavorite}
            className={`py-1 rounded border active:scale-95 text-[9px] font-bold uppercase transition-all cursor-pointer flex justify-center items-center gap-1 ${
              instance.favorite 
                ? 'bg-amber-500/25 border-amber-500 text-amber-300' 
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Star className="w-3 h-3" /> Fav
          </button>
        )}

        {onToggleLock && (
          <button
            onClick={onToggleLock}
            className={`py-1 rounded border active:scale-95 text-[9px] font-bold uppercase transition-all cursor-pointer flex justify-center items-center gap-1 ${
              instance.locked 
                ? 'bg-red-500/25 border-red-500 text-red-300' 
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3 h-3" /> Bloquear
          </button>
        )}

        {definition.stackable && count > 1 && onSplit && (
          <button
            onClick={onSplit}
            className="py-1 bg-slate-900 hover:bg-slate-800 active:scale-95 text-slate-300 border border-slate-800 rounded font-bold uppercase tracking-wider text-[9px] cursor-pointer"
          >
            Dividir
          </button>
        )}

        {onDiscard && (
          <button
            onClick={onDiscard}
            className={`py-1 bg-red-950/40 hover:bg-red-900/40 active:scale-95 text-red-400 border border-red-900/30 rounded font-bold uppercase tracking-wider text-[9px] cursor-pointer ${
              instance.locked ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={instance.locked}
          >
            Tirar
          </button>
        )}
      </div>
    </div>
  );
};
