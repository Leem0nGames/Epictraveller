import { LootTable } from './LootTable';
import { LootPool } from './LootPool';
import { LootEntry } from './LootEntry';
import { LootEvent, LootEvents } from './LootEvents';
import { Rarity } from '../Items/Rarity';
import { ItemInstance } from '../Items/ItemInstance';
import { ItemFactory } from '../Items/ItemFactory';

export interface GeneratedLoot {
  instance: ItemInstance;
  count: number;
}

export class LootGenerator {
  // Base statistical weights for each rarity
  private static readonly BASE_RARITY_WEIGHTS: Record<Rarity, number> = {
    [Rarity.COMMON]: 7000,     // ~70.0%
    [Rarity.UNCOMMON]: 2000,   // ~20.0%
    [Rarity.RARE]: 800,        // ~8.0%
    [Rarity.EPIC]: 180,        // ~1.8%
    [Rarity.LEGENDARY]: 19,    // ~0.19%
    [Rarity.MYTHIC]: 1,        // ~0.01%
  };

  // Luck scaling factor per point of Luck stat for high-tier rarities
  private static readonly LUCK_SCALING_FACTORS: Record<Rarity, number> = {
    [Rarity.COMMON]: 0,         // Decreases relatively as others increase
    [Rarity.UNCOMMON]: 0.02,    // +2% weight per Luck point
    [Rarity.RARE]: 0.05,        // +5% weight per Luck point
    [Rarity.EPIC]: 0.10,        // +10% weight per Luck point
    [Rarity.LEGENDARY]: 0.20,   // +20% weight per Luck point
    [Rarity.MYTHIC]: 0.35,      // +35% weight per Luck point
  };

  /**
   * Generates loot from a given LootTable.
   * @param table The LootTable to roll against
   * @param luck The player's Luck stat (0 by default)
   * @param context Dynamic context passed to conditions
   */
  public static generate(table: LootTable, luck: number = 0, context?: any): GeneratedLoot[] {
    const results: GeneratedLoot[] = [];
    const uniqueRolledItemIds = new Set<string>();

    LootEvents.emit(LootEvent.ON_LOOT_ROLL_START, { tableId: table.id, luck });

    // 1. Process each LootPool independently
    for (const pool of table.pools) {
      // Roll pool activation chance
      const randActive = Math.random();
      if (randActive > pool.chance) {
        continue;
      }

      LootEvents.emit(LootEvent.ON_LOOT_POOL_ROLL, { tableId: table.id, poolId: pool.id });

      // 2. Perform roll iterations from this pool
      for (let rollIndex = 0; rollIndex < pool.rolls; rollIndex++) {
        // Filter candidate entries
        const candidateEntries = pool.entries.filter((entry) => {
          // Skip if unique and already rolled
          if (entry.unique && uniqueRolledItemIds.has(entry.itemId)) {
            return false;
          }
          // Evaluate dynamic conditions
          if (entry.conditions && !entry.conditions(context)) {
            return false;
          }
          return true;
        });

        if (candidateEntries.length === 0) {
          continue; // No candidates available
        }

        // Weighted random selection
        const selectedEntry = this.weightedSelect(candidateEntries);
        if (!selectedEntry) {
          continue;
        }

        // Generate quantity
        const quantity = this.rollQuantity(selectedEntry.minimum, selectedEntry.maximum);

        // Determine item rarity
        const finalRarity = pool.fixedRarity 
          ? pool.fixedRarity 
          : this.rollRarity(selectedEntry.rarityMultiplier, luck);

        // Create ItemInstance securely via ItemFactory
        try {
          const itemInstance = ItemFactory.createInstance(selectedEntry.itemId, finalRarity);
          
          results.push({
            instance: itemInstance,
            count: quantity,
          });

          // Mark unique items as rolled
          if (selectedEntry.unique) {
            uniqueRolledItemIds.add(selectedEntry.itemId);
          }

          LootEvents.emit(LootEvent.ON_LOOT_ENTRY_SELECTED, {
            tableId: table.id,
            poolId: pool.id,
            entry: selectedEntry,
            rarity: finalRarity,
            count: quantity,
            instance: itemInstance,
          });
        } catch (error) {
          console.error(`LootGenerator: Failed to create ItemInstance for ID "${selectedEntry.itemId}":`, error);
        }
      }
    }

    LootEvents.emit(LootEvent.ON_LOOT_ROLL_COMPLETE, { tableId: table.id, results });
    return results;
  }

  /**
   * Helper to perform standard weighted random selection among entries.
   */
  private static weightedSelect(entries: LootEntry[]): LootEntry | null {
    const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
    if (totalWeight <= 0) return null;

    let roll = Math.random() * totalWeight;
    for (const entry of entries) {
      roll -= entry.weight;
      if (roll <= 0) {
        return entry;
      }
    }
    return entries[entries.length - 1];
  }

  /**
   * Rolls a random integer between min and max (inclusive).
   */
  private static rollQuantity(min: number, max: number): number {
    const floorMin = Math.ceil(min);
    const floorMax = Math.floor(max);
    return Math.floor(Math.random() * (floorMax - floorMin + 1)) + floorMin;
  }

  /**
   * Rolls a dynamic Rarity based on base weights, Luck stat, and item rarity multiplier.
   */
  private static rollRarity(rarityMultiplier: number, luck: number): Rarity {
    const rarities = Object.keys(this.BASE_RARITY_WEIGHTS) as Rarity[];
    const modifiedWeights: Record<Rarity, number> = {} as any;

    // Calculate modified weights incorporating Luck and item specific multipliers
    for (const rarity of rarities) {
      const baseWeight = this.BASE_RARITY_WEIGHTS[rarity];
      const scalingFactor = this.LUCK_SCALING_FACTORS[rarity];
      
      // Calculate luck boost (positive boost for rarer items)
      const luckBoost = Math.max(0, luck * scalingFactor);
      
      // Modify weight based on luck boost and the entry-specific rarity multiplier
      let weight = baseWeight * (1 + luckBoost);
      
      if (rarity !== Rarity.COMMON) {
        weight *= rarityMultiplier;
      }

      modifiedWeights[rarity] = weight;
    }

    const totalWeight = Object.values(modifiedWeights).reduce((sum, w) => sum + w, 0);
    let roll = Math.random() * totalWeight;

    for (const rarity of rarities) {
      roll -= modifiedWeights[rarity];
      if (roll <= 0) {
        return rarity;
      }
    }

    return Rarity.COMMON;
  }
}
