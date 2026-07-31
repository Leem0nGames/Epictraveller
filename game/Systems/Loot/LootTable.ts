import { LootPool } from './LootPool';

export interface LootTable {
  /**
   * Unique identifier of this loot table.
   */
  id: string;

  /**
   * List of pools containing items that are rolled independently or conditionally.
   */
  pools: LootPool[];
}
