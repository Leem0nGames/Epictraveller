import { LootEntry } from './LootEntry';
import { Rarity } from '../Items/Rarity';

export interface LootPool {
  /**
   * Unique identifier of this loot pool within its table.
   */
  id: string;

  /**
   * Base percentage chance (between 0.0 and 1.0) that this pool will activate for a loot roll.
   */
  chance: number;

  /**
   * Number of items to select from this pool if it is activated.
   */
  rolls: number;

  /**
   * The collection of potential loot items in this pool.
   */
  entries: LootEntry[];

  /**
   * Optional fixed rarity override for all items rolled from this specific pool.
   */
  fixedRarity?: Rarity;
}
