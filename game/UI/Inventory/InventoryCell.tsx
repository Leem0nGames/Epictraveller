'use client';
import React, { useRef, useState } from 'react';
import { InventorySlot } from '../../Systems/Inventory/InventorySlot';
import { DatabaseManager } from '../../Database/DatabaseManager';
import { Rarity } from '../../Systems/Items/Rarity';
import { Sword, Shield, Lock, Star } from 'lucide-react';

interface InventoryCellProps {
  slot: InventorySlot;
  index: number;
  isSelected: boolean;
  onSelect: (index: number) => void;
  onDoubleTap: (index: number) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
}

export const InventoryCell: React.FC<InventoryCellProps> = ({
  slot,
  index,
  isSelected,
  onSelect,
  onDoubleTap,
  onDragStart,
  onDrop,
}) => {
  const { instance, count } = slot;
  const itemDef = instance ? DatabaseManager.getInstance().getItemDefinition(instance.definitionId) : null;
  
  const lastTap = useRef<number>(0);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Handle mobile double tap and long press
  const handleTouchStart = () => {
    pressTimer.current = setTimeout(() => {
      // Long press triggers selection/details
      onSelect(index);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      // Double tap!
      onDoubleTap(index);
    } else {
      // Single tap!
      onSelect(index);
    }
    lastTap.current = now;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleLocalDrop = (e: React.DragEvent) => {
    setIsDragOver(false);
    onDrop(e, index);
  };

  const getRarityBorders = (rarity?: Rarity) => {
    if (!rarity) return 'border-slate-800 bg-slate-950/40';
    switch (rarity) {
      case Rarity.COMMON:
        return 'border-slate-700 bg-slate-900/40 hover:border-slate-500';
      case Rarity.UNCOMMON:
        return 'border-emerald-800/80 bg-emerald-950/15 hover:border-emerald-500';
      case Rarity.RARE:
        return 'border-sky-800/80 bg-sky-950/15 hover:border-sky-500';
      case Rarity.EPIC:
        return 'border-purple-800/80 bg-purple-950/15 hover:border-purple-500';
      case Rarity.LEGENDARY:
        return 'border-amber-700/80 bg-amber-950/15 hover:border-amber-500 shadow-[inset_0_0_10px_rgba(245,158,11,0.05)]';
      case Rarity.MYTHIC:
        return 'border-rose-700/80 bg-rose-950/15 hover:border-rose-500 shadow-[inset_0_0_12px_rgba(244,63,94,0.1)]';
      default:
        return 'border-slate-800 hover:border-slate-600';
    }
  };

  const getRarityGlow = (rarity?: Rarity) => {
    if (!rarity) return '';
    switch (rarity) {
      case Rarity.LEGENDARY:
        return 'after:absolute after:inset-0 after:rounded-lg after:border after:border-amber-500/25 after:animate-pulse';
      case Rarity.MYTHIC:
        return 'after:absolute after:inset-0 after:rounded-lg after:border after:border-rose-500/35 after:animate-pulse';
      default:
        return '';
    }
  };

  const borderClass = getRarityBorders(instance?.rarity);
  const glowClass = getRarityGlow(instance?.rarity);

  return (
    <div
      draggable={instance !== null}
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleLocalDrop}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      className={`
        w-14 h-14 sm:w-16 sm:h-16 rounded-xl border flex items-center justify-center relative 
        cursor-pointer select-none transition-all duration-150 active:scale-95
        ${borderClass} ${glowClass}
        ${isSelected ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-slate-900 border-amber-400 scale-105 z-10' : ''}
        ${isDragOver ? 'bg-amber-500/10 border-amber-400 border-dashed scale-102' : ''}
      `}
    >
      {itemDef && instance ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-1 relative">
          {/* Icons depending on category or URL */}
          <div className="text-slate-300 flex items-center justify-center w-full h-full">
            {itemDef.icon && (itemDef.icon.startsWith('http') || itemDef.icon.startsWith('/') || itemDef.icon.endsWith('.webp') || itemDef.icon.endsWith('.png')) ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img 
                src={itemDef.icon} 
                alt={itemDef.name} 
                className="w-9 h-9 sm:w-10 sm:h-10 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] rounded-md pointer-events-none" 
                loading="lazy"
              />
            ) : itemDef.category === 'WEAPON' ? (
              <Sword className="w-5 h-5 opacity-90 text-amber-100/90" />
            ) : itemDef.category === 'ARMOR' ? (
              <Shield className="w-5 h-5 opacity-90 text-amber-100/90" />
            ) : (
              <div className="text-center font-sans font-black text-[10px] uppercase text-amber-200/90">
                {itemDef.name.substring(0, 3)}
              </div>
            )}
          </div>

          {/* Quick status overlays */}
          <div className="absolute top-1 left-1 flex gap-0.5">
            {instance.favorite && <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />}
            {instance.locked && <Lock className="w-2.5 h-2.5 text-red-400" />}
          </div>

          {/* Stack Amount Badge */}
          {count > 1 && (
            <span className="absolute bottom-1 right-1 bg-slate-950/90 border border-slate-800/80 text-slate-100 text-[8px] sm:text-[9.5px] font-black font-mono px-1 rounded-md min-w-[14px] text-center">
              {count}
            </span>
          )}
        </div>
      ) : (
        <span className="text-[10px] font-black font-mono text-slate-800">{index + 1}</span>
      )}
    </div>
  );
};
