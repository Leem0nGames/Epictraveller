import { StatModifier } from '../Stats/StatModifier';
import { EquipmentSlot } from './EquipmentSlot';

export interface EquipmentDefinition {
  id: string;
  name: string;
  slot: EquipmentSlot;
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  modifiers: StatModifier[];
  visualModelId: string;
  price: number;
  description: string;
  levelRequirement: number;
}
