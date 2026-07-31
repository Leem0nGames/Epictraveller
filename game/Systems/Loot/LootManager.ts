import { LootTable } from './LootTable';
import { LootGenerator, GeneratedLoot } from './LootGenerator';
import { Rarity } from '../Items/Rarity';

export class LootManager {
  private static instance: LootManager;
  private tables: Map<string, LootTable> = new Map();

  private constructor() {
    this.registerDefaultTables();
  }

  public static getInstance(): LootManager {
    if (!LootManager.instance) {
      LootManager.instance = new LootManager();
    }
    return LootManager.instance;
  }

  /**
   * Registers a new LootTable into the registry.
   */
  public registerTable(table: LootTable): void {
    if (this.tables.has(table.id)) {
      console.warn(`LootManager: Table with ID "${table.id}" is already registered. Overwriting.`);
    }
    this.tables.set(table.id, table);
  }

  /**
   * Retrieves a LootTable by ID.
   */
  public getTable(id: string): LootTable | undefined {
    return this.tables.get(id);
  }

  /**
   * Checks if a LootTable is registered.
   */
  public hasTable(id: string): boolean {
    return this.tables.has(id);
  }

  /**
   * Returns all registered LootTable IDs.
   */
  public getAllTableIds(): string[] {
    return Array.from(this.tables.keys());
  }

  /**
   * Rolls loot from a registered table.
   * @param tableId The ID of the table to roll from
   * @param luck The player's Luck value (influences rarity)
   * @param context Dynamic evaluation context
   */
  public rollLoot(tableId: string, luck: number = 0, context?: any): GeneratedLoot[] {
    let table = this.getTable(tableId);
    if (!table) {
      console.warn(`LootManager: LootTable with ID "${tableId}" not found. Falling back to slime_loot_table.`);
      table = this.getTable('slime_loot_table');
    }
    if (!table) {
      return [];
    }
    return LootGenerator.generate(table, luck, context);
  }

  /**
   * Pre-configures standard game Loot Tables.
   */
  private registerDefaultTables(): void {
    // 1. SLIME LOOT TABLE (Common low-level enemy)
    const slimeTable: LootTable = {
      id: 'slime_loot_table',
      pools: [
        {
          id: 'gold_pool',
          chance: 0.9,
          rolls: 1,
          entries: [
            { itemId: 'gold_coins', weight: 100, minimum: 2, maximum: 8, rarityMultiplier: 1.0, unique: false }
          ]
        },
        {
          id: 'consumables_pool',
          chance: 0.4,
          rolls: 1,
          entries: [
            { itemId: 'small_potion', weight: 80, minimum: 1, maximum: 1, rarityMultiplier: 1.0, unique: false },
            { itemId: 'iron_sword', weight: 20, minimum: 1, maximum: 1, rarityMultiplier: 0.8, unique: true }
          ]
        }
      ]
    };

    // 2. GOBLIN LOOT TABLE (Mid-level common scout enemy)
    const goblinTable: LootTable = {
      id: 'goblin_loot_table',
      pools: [
        {
          id: 'coins_pool',
          chance: 1.0,
          rolls: 1,
          entries: [
            { itemId: 'gold_coins', weight: 100, minimum: 15, maximum: 40, rarityMultiplier: 1.0, unique: false }
          ]
        },
        {
          id: 'gear_pool',
          chance: 0.5,
          rolls: 1,
          entries: [
            { itemId: 'iron_sword', weight: 70, minimum: 1, maximum: 1, rarityMultiplier: 1.0, unique: false },
            { itemId: 'crystal_shield', weight: 30, minimum: 1, maximum: 1, rarityMultiplier: 1.2, unique: false }
          ]
        },
        {
          id: 'potions_pool',
          chance: 0.35,
          rolls: 1,
          entries: [
            { itemId: 'small_potion', weight: 100, minimum: 1, maximum: 2, rarityMultiplier: 1.0, unique: false }
          ]
        }
      ]
    };

    // 3. WOOD CHEST LOOT TABLE (Treasure chest)
    const chestTable: LootTable = {
      id: 'chest_loot_table',
      pools: [
        {
          id: 'coins_pool',
          chance: 1.0,
          rolls: 1,
          entries: [
            { itemId: 'gold_coins', weight: 100, minimum: 50, maximum: 150, rarityMultiplier: 1.0, unique: false }
          ]
        },
        {
          id: 'loot_pool',
          chance: 0.85,
          rolls: 2,
          entries: [
            { itemId: 'small_potion', weight: 40, minimum: 1, maximum: 3, rarityMultiplier: 1.0, unique: false },
            { itemId: 'iron_sword', weight: 25, minimum: 1, maximum: 1, rarityMultiplier: 1.1, unique: false },
            { itemId: 'crystal_shield', weight: 20, minimum: 1, maximum: 1, rarityMultiplier: 1.3, unique: false },
            { itemId: 'ruby_ring', weight: 15, minimum: 1, maximum: 1, rarityMultiplier: 1.5, unique: true }
          ]
        }
      ]
    };

    // 4. BOSS DRAGON LOOT TABLE (Epic high-level boss)
    const bossDragonTable: LootTable = {
      id: 'boss_dragon_loot_table',
      pools: [
        {
          id: 'guaranteed_legendary_weapon',
          chance: 1.0,
          rolls: 1,
          fixedRarity: Rarity.LEGENDARY,
          entries: [
            { itemId: 'legendary_staff', weight: 100, minimum: 1, maximum: 1, rarityMultiplier: 1.0, unique: false }
          ]
        },
        {
          id: 'epic_materials_pool',
          chance: 1.0,
          rolls: 1,
          entries: [
            { itemId: 'dragon_scale', weight: 80, minimum: 2, maximum: 6, rarityMultiplier: 1.5, unique: false },
            { itemId: 'ruby_ring', weight: 20, minimum: 1, maximum: 1, rarityMultiplier: 1.8, unique: true }
          ]
        },
        {
          id: 'dragon_hoard_pool',
          chance: 1.0,
          rolls: 3,
          entries: [
            { itemId: 'gold_coins', weight: 100, minimum: 250, maximum: 600, rarityMultiplier: 1.0, unique: false }
          ]
        }
      ]
    };

    // 5. GENERAL BOSS LOOT TABLE
    const bossTable: LootTable = {
      ...bossDragonTable,
      id: 'boss_loot_table'
    };

    this.registerTable(slimeTable);
    this.registerTable(goblinTable);
    this.registerTable(chestTable);
    this.registerTable(bossDragonTable);
    this.registerTable(bossTable);
  }
}
