import { EquipmentDefinition } from './EquipmentDefinition';
import { EquipmentSlot } from './EquipmentSlot';

export interface OnEquipEvent {
  slot: EquipmentSlot;
  item: EquipmentDefinition;
}

export interface OnUnequipEvent {
  slot: EquipmentSlot;
  item: EquipmentDefinition;
}

export interface OnEquipmentChangedEvent {
  slot: EquipmentSlot;
  newItem: EquipmentDefinition | null;
  oldItem: EquipmentDefinition | null;
}
