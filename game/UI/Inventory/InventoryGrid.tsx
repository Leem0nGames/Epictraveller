'use client';
import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'motion/react';
import { InventoryCell } from './InventoryCell';
import { InventoryManager } from '../../Systems/Inventory/InventoryManager';
import { InventoryEvent, InventoryEvents } from '../../Systems/Inventory/InventoryEvents';
import { InventorySlot } from '../../Systems/Inventory/InventorySlot';
import { DatabaseManager } from '../../Database/DatabaseManager';

interface InventoryGridProps {
  categoryFilter: string;
  selectedSlotIndex: number | null;
  onSelectSlot: (index: number | null) => void;
  onDoubleTapSlot: (index: number) => void;
}

export const InventoryGrid: React.FC<InventoryGridProps> = ({
  categoryFilter,
  selectedSlotIndex,
  onSelectSlot,
  onDoubleTapSlot,
}) => {
  const manager = InventoryManager.getInstance();
  const inventory = manager.getPlayerInventory();
  
  const [slots, setSlots] = useState<InventorySlot[]>([]);

  // Update list when inventory updates
  useEffect(() => {
    const updateSlots = () => {
      setSlots([...inventory.getSlots()]);
    };
    
    updateSlots();
    
    // Subscribe to custom inventory events
    InventoryEvents.subscribe(InventoryEvent.ON_INVENTORY_UPDATED, updateSlots);
    return () => {
      InventoryEvents.unsubscribe(InventoryEvent.ON_INVENTORY_UPDATED, updateSlots);
    };
  }, [inventory]);

  // Handle HTML5 Drag Start
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle HTML5 Drop
  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer.getData('text/plain');
    if (!sourceIndexStr) return;

    const sourceIndex = parseInt(sourceIndexStr, 10);
    if (isNaN(sourceIndex)) return;

    inventory.moveItem(sourceIndex, targetIndex);
    // If the selected slot was moved, update selection
    if (selectedSlotIndex === sourceIndex) {
      onSelectSlot(targetIndex);
    } else if (selectedSlotIndex === targetIndex) {
      onSelectSlot(sourceIndex);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.025,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0.7, y: 12 },
    show: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 350, damping: 22 },
    },
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-[8px] font-black tracking-widest text-slate-500 uppercase pb-1 border-b border-slate-800/60">
        <span>MOCHILA DE OBJETOS</span>
        <span className="text-amber-500 font-mono">
          {slots.filter((s) => s.instance !== null).length} / {inventory.getSize()} SLOTS
        </span>
      </div>

      <motion.div
        key={categoryFilter}
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 p-1 max-h-[36vh] overflow-y-auto pr-0.5"
      >
        {slots.map((slot, index) => {
          // Check if it passes category filter
          if (categoryFilter !== 'ALL' && slot.instance) {
            const def = DatabaseManager.getInstance().getItemDefinition(slot.instance.definitionId);
            if (!def || def.category !== categoryFilter) {
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border border-slate-900/40 bg-slate-950/20 flex items-center justify-center opacity-25 cursor-not-allowed"
                >
                  <span className="text-[10px] font-black font-mono text-slate-900">{index + 1}</span>
                </motion.div>
              );
            }
          }

          return (
            <motion.div key={index} variants={itemVariants}>
              <InventoryCell
                slot={slot}
                index={index}
                isSelected={selectedSlotIndex === index}
                onSelect={onSelectSlot}
                onDoubleTap={onDoubleTapSlot}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
              />
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};
