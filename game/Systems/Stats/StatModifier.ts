export enum StatModifierType {
  FLAT = 'FLAT',
  PERCENT = 'PERCENT',
}

export interface StatModifier {
  id: string;
  type: StatModifierType;
  value: number;
  origin: string; // e.g., 'item_id', 'spell_id', 'buff_id'
  stat?: string; // target stat name, e.g. 'attack', 'defense', 'maxHp', 'maxMp'
  duration?: number; // optional, seconds
  priority?: number; // optional, for order of calculation
}
