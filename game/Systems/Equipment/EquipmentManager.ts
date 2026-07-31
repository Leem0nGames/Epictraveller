import { EquipmentComponent } from './EquipmentComponent';
import { EquipmentDefinition } from './EquipmentDefinition';
import { EquipmentSlot } from './EquipmentSlot';
import { StatsComponent } from '../Stats/StatsComponent';
import { EventEmitter } from 'events';
import { OnEquipEvent, OnUnequipEvent, OnEquipmentChangedEvent } from './EquipmentEvents';

export class EquipmentManager {
  private events = new EventEmitter();

  public equip(component: EquipmentComponent, item: EquipmentDefinition, stats: StatsComponent): void {
    const existing = component.getEquippedItem(item.slot);
    if (existing) {
      this.unequip(component, item.slot, stats);
    }

    item.modifiers.forEach(mod => {
      const targetStat = mod.stat || 'attack';
      stats.addModifier(targetStat, { ...mod, id: `${item.id}_${mod.id}` });
    });

    component.setEquippedItem(item.slot, item);

    this.events.emit('onEquip', { slot: item.slot, item } as OnEquipEvent);
    this.events.emit('onEquipmentChanged', { slot: item.slot, newItem: item, oldItem: existing } as OnEquipmentChangedEvent);
  }

  public unequip(component: EquipmentComponent, slot: EquipmentSlot, stats: StatsComponent): void {
    const item = component.getEquippedItem(slot);
    if (!item) return;

    item.modifiers.forEach(mod => {
      const targetStat = mod.stat || 'attack';
      stats.removeModifier(targetStat, `${item.id}_${mod.id}`);
    });

    component.setEquippedItem(slot, null);

    this.events.emit('onUnequip', { slot, item } as OnUnequipEvent);
    this.events.emit('onEquipmentChanged', { slot, newItem: null, oldItem: item } as OnEquipmentChangedEvent);
  }

  public subscribe(event: 'onEquip' | 'onUnequip' | 'onEquipmentChanged', callback: (data: any) => void): void {
    this.events.on(event, callback);
  }
}
