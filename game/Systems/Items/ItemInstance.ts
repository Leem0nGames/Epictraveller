import { ItemDefinition } from './ItemDefinition';
import { ItemModifier } from './ItemModifier';
import { Rarity } from './Rarity';

export interface ItemInstance {
  uuid: string;
  definitionId: string;
  rarity: Rarity;
  modifiers: ItemModifier[];
  durability: number;
  level: number;
  seed: number; // Para consistencia en generación aleatoria
  locked: boolean;
  favorite: boolean;
  customName?: string;
}
