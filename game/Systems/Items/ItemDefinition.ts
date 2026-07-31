import { ItemCategory } from './ItemCategory';

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: ItemCategory;
  equipmentSlot?: string; // Optional, based on EquipmentSystem
  stackable: boolean;
  maxStack: number;
  baseValue: number;
  sprite: string;
  rarityPool: string[]; // Probabilidades o configuración de rareza
}
