export interface LootEntry {
  /**
   * The template/definition ID of the item from the Database.
   */
  itemId: string;

  /**
   * Relative weight/probability of this entry being rolled among other entries in the pool.
   */
  weight: number;

  /**
   * Minimum quantity generated if this entry is chosen. Defaults to 1.
   */
  minimum: number;

  /**
   * Maximum quantity generated if this entry is chosen. Defaults to 1.
   */
  maximum: number;

  /**
   * Multiplier to skew the rarity of the generated item. Defaults to 1.0.
   */
  rarityMultiplier: number;

  /**
   * If true, this item can only be selected once per overall loot roll.
   */
  unique: boolean;

  /**
   * Optional dynamic condition check (e.g. check player level, quest status, current zone, etc.).
   */
  conditions?: (context?: any) => boolean;
}
