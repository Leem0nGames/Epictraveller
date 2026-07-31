'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { InventoryGrid } from './InventoryGrid';
import { EquipmentGrid } from './EquipmentGrid';
import { InventoryTooltip } from './InventoryTooltip';
import { InventoryManager } from '../../Systems/Inventory/InventoryManager';
import { InventoryEvent, InventoryEvents } from '../../Systems/Inventory/InventoryEvents';
import { InventorySerializer } from '../../Systems/Inventory/InventorySerializer';
import { DatabaseManager } from '../../Database/DatabaseManager';
import { ProgressionManager } from '../../Systems/Progression/ProgressionManager';
import { ClaudecraftAssets } from '../../Assets/ClaudecraftAssets';
import { ToastManager } from '../../Systems/ToastManager';
import { SlidersHorizontal, ArrowUpDown, Shield, Sword, Sparkles, X, Save, RefreshCw } from 'lucide-react';

interface InventoryWindowProps {
  onClose: () => void;
}

export const InventoryWindow: React.FC<InventoryWindowProps> = ({ onClose }) => {
  const manager = InventoryManager.getInstance();
  const inventory = manager.getPlayerInventory();
  
  const [activeTab, setActiveTab] = useState<'ITEMS' | 'EQUIPMENT'>('ITEMS');
  const [filter, setFilter] = useState<string>('ALL');
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

  // Re-render trigger
  const [, setUpdateTrigger] = useState(0);

  useEffect(() => {
    const handleUpdate = () => {
      setUpdateTrigger((prev) => prev + 1);
    };

    InventoryEvents.subscribe(InventoryEvent.ON_INVENTORY_UPDATED, handleUpdate);
    return () => {
      InventoryEvents.unsubscribe(InventoryEvent.ON_INVENTORY_UPDATED, handleUpdate);
    };
  }, []);

  // Quick category items list
  const filters = [
    { label: 'Todo', id: 'ALL', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { label: 'Armas', id: 'WEAPON', icon: <Sword className="w-3.5 h-3.5" /> },
    { label: 'Armaduras', id: 'ARMOR', icon: <Shield className="w-3.5 h-3.5" /> },
  ];

  // Selected Slot details
  const selectedSlot = selectedSlotIndex !== null ? inventory.getSlot(selectedSlotIndex) : null;

  // Perform sort
  const handleSort = (criteria: 'rarity' | 'value' | 'name' | 'level') => {
    inventory.sort(criteria);
    setSelectedSlotIndex(null);
    ToastManager.getInstance().show(`Inventario ordenado por ${criteria.toUpperCase()}`);
  };

  // Double tap to quick equip / use
  const handleDoubleTapSlot = (index: number) => {
    const slot = inventory.getSlot(index);
    if (!slot || !slot.instance) return;

    // Check if consumable
    const def = DatabaseManager.getInstance().getItemDefinition(slot.instance.definitionId);
    if (def && (def.category === 'CONSUMABLE' || slot.instance.definitionId.includes('potion') || slot.instance.definitionId.includes('elixir'))) {
      const used = manager.useItemFromInventory(index);
      if (used) {
        setSelectedSlotIndex(null);
        return;
      }
    }

    const success = manager.equipItemFromInventory(
      index,
      manager.getPlayerEquipment(),
      manager.getPlayerStats()
    );

    if (success) {
      setSelectedSlotIndex(null);
    }
  };

  // Actions for Selected Item
  const handleUseItem = () => {
    if (selectedSlotIndex !== null) {
      const success = manager.useItemFromInventory(selectedSlotIndex);
      if (success) {
        setSelectedSlotIndex(null);
      }
    }
  };

  const handleSellItem = () => {
    if (selectedSlotIndex !== null && selectedSlot) {
      const success = manager.sellItemFromInventory(selectedSlotIndex, selectedSlot.count);
      if (success) {
        setSelectedSlotIndex(null);
      }
    }
  };

  const handleToggleLock = () => {
    if (selectedSlotIndex !== null) {
      inventory.toggleLock(selectedSlotIndex);
    }
  };

  const handleToggleFavorite = () => {
    if (selectedSlotIndex !== null) {
      inventory.toggleFavorite(selectedSlotIndex);
    }
  };

  const handleSplit = () => {
    if (selectedSlotIndex !== null) {
      const slots = inventory.getSlots();
      const emptySlotIndex = slots.findIndex(s => !s.instance);
      if (emptySlotIndex !== -1) {
        const success = inventory.splitStack(selectedSlotIndex, emptySlotIndex, 1);
        if (success) {
          ToastManager.getInstance().show('Pila dividida: movido 1 objeto a ranura vacía.');
        } else {
          ToastManager.getInstance().show('No se pudo dividir la pila.');
        }
      } else {
        ToastManager.getInstance().show('No hay ranuras libres para dividir la pila.');
      }
    }
  };

  const handleDiscard = () => {
    if (selectedSlotIndex !== null && selectedSlot?.instance) {
      const inst = selectedSlot.instance;
      inventory.removeItemAt(selectedSlotIndex, selectedSlot.count);
      setSelectedSlotIndex(null);
      ToastManager.getInstance().show(`Tirado objeto.`);
    }
  };

  // State Persistence Save / Load
  const handleSaveInventory = () => {
    const serialized = InventorySerializer.serializeToString(inventory);
    localStorage.setItem('jrpg_inventory_save', serialized);
    ToastManager.getInstance().show('¡Progreso Guardado! Inventario guardado con éxito.');
  };

  const handleLoadInventory = () => {
    const saved = localStorage.getItem('jrpg_inventory_save');
    if (saved) {
      InventorySerializer.deserializeFromString(saved, inventory);
      setSelectedSlotIndex(null);
      ToastManager.getInstance().show('¡Progreso Cargado! Inventario restaurado con éxito.');
    } else {
      ToastManager.getInstance().show('No se encontró ninguna partida guardada.');
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 select-none">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-[#0b0f19]/95 border border-slate-800/80 rounded-2xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.85)] flex flex-col max-h-[88vh]"
      >
        {/* Header Title */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-slate-900/80 bg-slate-950/40">
          <div>
            <h2 className="text-sm font-black font-sans text-slate-100 tracking-widest uppercase">
              Mochila de Aventura
            </h2>
            <p className="text-[9px] font-mono font-bold text-amber-500 uppercase tracking-wider">
              Sistema de Recompensas e Inventario
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Gold Badge with RPG Coin Icon */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-950/60 border border-amber-500/40 rounded-xl shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ClaudecraftAssets.COIN}
                alt="Oro"
                className="w-4 h-4 object-contain drop-shadow"
              />
              <span className="font-mono font-black text-amber-300 text-xs">
                {ProgressionManager.getInstance().getGold()} ORO
              </span>
            </div>

            <button 
              onClick={onClose} 
              className="w-7 h-7 rounded-full bg-slate-900/80 hover:bg-red-950/40 hover:text-red-400 border border-slate-800 flex items-center justify-center text-slate-400 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 border-b border-slate-900/80 bg-slate-950/20 text-xs">
          <button
            onClick={() => { setActiveTab('ITEMS'); setSelectedSlotIndex(null); }}
            className={`py-2.5 font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'ITEMS' 
                ? 'text-amber-500 bg-slate-900/50 border-b-2 border-amber-500' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Objetos
          </button>
          <button
            onClick={() => { setActiveTab('EQUIPMENT'); setSelectedSlotIndex(null); }}
            className={`py-2.5 font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'EQUIPMENT' 
                ? 'text-amber-500 bg-slate-900/50 border-b-2 border-amber-500' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Equipo y Stats
          </button>
        </div>

        {/* Filters and Sorters (Only shown on Backpack tab) */}
        {activeTab === 'ITEMS' && (
          <div className="px-4 py-2 border-b border-slate-900/60 bg-slate-950/10 flex flex-wrap justify-between items-center gap-2">
            {/* Category selection */}
            <div className="flex gap-1.5 overflow-x-auto">
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => { setFilter(f.id); setSelectedSlotIndex(null); }}
                  className={`
                    px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1
                    ${filter === f.id 
                      ? 'bg-amber-600/10 border-amber-500 text-amber-400 font-extrabold' 
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-slate-200'}
                  `}
                >
                  {f.icon}
                  <span>{f.label}</span>
                </button>
              ))}
            </div>

            {/* Quick Sorter */}
            <div className="flex items-center gap-1">
              <span className="text-[8px] font-black font-mono text-slate-500 mr-1 uppercase">Ordenar por:</span>
              <button 
                onClick={() => handleSort('rarity')}
                className="w-6 h-6 rounded bg-slate-950/85 hover:bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                title="Ordenar por Rareza"
              >
                <SlidersHorizontal className="w-3 h-3 text-amber-500/80" />
              </button>
              <button 
                onClick={() => handleSort('value')}
                className="w-6 h-6 rounded bg-slate-950/85 hover:bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                title="Ordenar por Valor"
              >
                <ArrowUpDown className="w-3 h-3 text-emerald-500/80" />
              </button>
            </div>
          </div>
        )}

        {/* Core Layout Panels */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="relative">
            {activeTab === 'ITEMS' ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Backpack list */}
                <div className="md:col-span-12">
                  <InventoryGrid
                    categoryFilter={filter}
                    selectedSlotIndex={selectedSlotIndex}
                    onSelectSlot={setSelectedSlotIndex}
                    onDoubleTapSlot={handleDoubleTapSlot}
                  />
                </div>
              </div>
            ) : (
              <EquipmentGrid />
            )}
          </div>
        </div>

        {/* Selection Details Floating Tooltip drawer */}
        <AnimatePresence>
          {selectedSlotIndex !== null && selectedSlot && selectedSlot.instance && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="absolute bottom-14 left-4 right-4 z-50 flex justify-center"
            >
              <InventoryTooltip
                instance={selectedSlot.instance}
                count={selectedSlot.count}
                onClose={() => setSelectedSlotIndex(null)}
                onEquip={() => handleDoubleTapSlot(selectedSlotIndex)}
                onUse={handleUseItem}
                onSell={handleSellItem}
                onSplit={handleSplit}
                onToggleLock={handleToggleLock}
                onToggleFavorite={handleToggleFavorite}
                onDiscard={handleDiscard}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Persistence Actions */}
        <div className="px-4 py-3 border-t border-slate-900 bg-slate-950/40 flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={handleSaveInventory}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-800 flex items-center gap-1 text-[10px] font-bold uppercase transition-all cursor-pointer"
              title="Guardar estado del inventario en localStorage"
            >
              <Save className="w-3 h-3 text-emerald-400" /> Guardar
            </button>
            <button
              onClick={handleLoadInventory}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-800 flex items-center gap-1 text-[10px] font-bold uppercase transition-all cursor-pointer"
              title="Cargar estado guardado desde localStorage"
            >
              <RefreshCw className="w-3 h-3 text-sky-400" /> Cargar
            </button>
          </div>

          <div className="text-right text-[8px] font-black font-mono text-slate-600 uppercase tracking-wider">
            SISTEMA DE INVENTARIO DESACOPLADO
          </div>
        </div>
      </motion.div>
    </div>
  );
};
