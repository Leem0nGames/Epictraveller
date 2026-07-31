'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { InventoryManager } from '../../Systems/Inventory/InventoryManager';
import { InventoryEvent, InventoryEvents } from '../../Systems/Inventory/InventoryEvents';
import { EquipmentSlot } from '../../Systems/Equipment/EquipmentSlot';
import { ClaudecraftAssets } from '../../Assets/ClaudecraftAssets';
import { Sword, Shield, Crown, HelpCircle, Footprints, Flame } from 'lucide-react';

export const EquipmentGrid: React.FC = () => {
  const manager = InventoryManager.getInstance();
  const equipment = manager.getPlayerEquipment();
  const stats = manager.getPlayerStats();

  // Helper to read initial equipped items
  const getInitialEquipped = () => {
    const newEquipped: Record<string, any> = {};
    Object.values(EquipmentSlot).forEach((slot) => {
      const item = equipment.getEquippedItem(slot);
      if (item) {
        newEquipped[slot] = item;
      }
    });
    return newEquipped;
  };

  // Helper to read initial statistics values
  const getInitialStats = () => {
    return {
      attack: stats.getStatValue('attack'),
      defense: stats.getStatValue('defense'),
      maxHp: stats.getStatValue('maxHp'),
      maxMp: stats.getStatValue('maxMp'),
    };
  };

  const [equippedItems, setEquippedItems] = useState<Record<string, any>>(getInitialEquipped);
  const [playerStats, setPlayerStats] = useState<Record<string, number>>(getInitialStats);

  const updateEquipmentAndStats = useCallback(() => {
    setEquippedItems(getInitialEquipped());
    setPlayerStats(getInitialStats());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Subscribe to inventory update events which are also fired upon equipping/unequipping
    InventoryEvents.subscribe(InventoryEvent.ON_INVENTORY_UPDATED, updateEquipmentAndStats);
    return () => {
      InventoryEvents.unsubscribe(InventoryEvent.ON_INVENTORY_UPDATED, updateEquipmentAndStats);
    };
  }, [updateEquipmentAndStats]);

  const handleUnequip = (slot: EquipmentSlot) => {
    manager.unequipItemToInventory(slot, equipment, stats);
  };

  const getSlotIcon = (slot: EquipmentSlot) => {
    switch (slot) {
      case EquipmentSlot.WEAPON:
        return <Sword className="w-4 h-4 text-amber-500/80" />;
      case EquipmentSlot.SHIELD:
        return <Shield className="w-4 h-4 text-sky-500/80" />;
      case EquipmentSlot.HELMET:
        return <Crown className="w-4 h-4 text-purple-500/80" />;
      case EquipmentSlot.ARMOR:
        return <Shield className="w-4 h-4 text-emerald-500/80" />;
      case EquipmentSlot.BOOTS:
        return <Footprints className="w-4 h-4 text-stone-400/80" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-600/80" />;
    }
  };

  const getRarityTextClass = (rarity?: string) => {
    switch (rarity) {
      case 'COMMON': return 'text-slate-400';
      case 'UNCOMMON': return 'text-emerald-400';
      case 'RARE': return 'text-sky-400';
      case 'EPIC': return 'text-purple-400';
      case 'LEGENDARY': return 'text-amber-400';
      default: return 'text-slate-400';
    }
  };

  const getRarityBorderClass = (rarity?: string) => {
    switch (rarity) {
      case 'COMMON': return 'border-slate-800';
      case 'UNCOMMON': return 'border-emerald-900/60 bg-emerald-950/5';
      case 'RARE': return 'border-sky-900/60 bg-sky-950/5';
      case 'EPIC': return 'border-purple-900/60 bg-purple-950/5';
      case 'LEGENDARY': return 'border-amber-900/80 bg-amber-950/5';
      default: return 'border-slate-900 bg-slate-950/45';
    }
  };

  const equipmentSlotsList = [
    { label: 'Arma', type: EquipmentSlot.WEAPON },
    { label: 'Escudo', type: EquipmentSlot.SHIELD },
    { label: 'Casco', type: EquipmentSlot.HELMET },
    { label: 'Armadura', type: EquipmentSlot.ARMOR },
    { label: 'Botas', type: EquipmentSlot.BOOTS },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
      {/* Equipment Slots List */}
      <div className="md:col-span-7 space-y-2.5">
        <span className="text-[8px] font-black tracking-widest text-slate-500 uppercase block border-b border-slate-800/60 pb-1">
          EQUIPAMIENTO ACTIVO
        </span>

        <div className="space-y-1.5">
          {equipmentSlotsList.map((slotInfo) => {
            const item = equippedItems[slotInfo.type];
            return (
              <div
                key={slotInfo.type}
                onClick={() => item && handleUnequip(slotInfo.type)}
                className={`
                  flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer select-none transition-all duration-150 active:scale-99
                  ${item ? `${getRarityBorderClass(item.rarity)} hover:bg-slate-900/40` : 'border-slate-900/80 bg-slate-950/40 hover:border-slate-800'}
                `}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-md bg-slate-950 border border-slate-800/80 flex items-center justify-center p-0.5 shrink-0 overflow-hidden">
                    {item ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={(item.icon && (item.icon.startsWith('http') || item.icon.startsWith('/'))) ? item.icon : ClaudecraftAssets.getItemIcon(item.id || item.definitionId)}
                        alt={item.name}
                        className="w-full h-full object-contain drop-shadow"
                      />
                    ) : (
                      getSlotIcon(slotInfo.type)
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black tracking-wider text-slate-500 uppercase leading-none mb-0.5">
                      {slotInfo.label}
                    </p>
                    <p className={`font-bold truncate leading-tight ${item ? getRarityTextClass(item.rarity) : 'text-slate-600'}`}>
                      {item ? item.name : 'Vacio'}
                    </p>
                  </div>
                </div>

                {item && (
                  <span className="text-[8px] font-black tracking-wider text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded uppercase hover:bg-red-950/40 hover:text-red-400 hover:border-red-900/50 transition-all">
                    Quitar
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Display panel */}
      <div className="md:col-span-5 bg-slate-950/50 rounded-xl border border-slate-900 p-3.5 flex flex-col justify-between">
        <div className="space-y-3">
          <span className="text-[8px] font-black tracking-widest text-slate-500 uppercase block border-b border-slate-800/60 pb-1">
            ESTADÍSTICAS HÉROE
          </span>

          <div className="space-y-2 font-mono">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-red-500" /> Ataque</span>
              <span className="font-bold text-slate-100">{playerStats.attack}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-sky-500" /> Defensa</span>
              <span className="font-bold text-slate-100">{playerStats.defense}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Vida Max</span>
              <span className="font-bold text-emerald-400">{playerStats.maxHp}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Mana Max</span>
              <span className="font-bold text-indigo-400">{playerStats.maxMp}</span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-900/60 mt-3">
          <p className="text-[9px] text-slate-500 leading-normal font-medium">
            * Al equipar objetos, las estadísticas se modifican automáticamente usando el <strong className="text-amber-500">StatsSystem</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
