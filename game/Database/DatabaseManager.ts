import { DatabaseCache } from './DatabaseCache';
import { DatabaseLoader } from './DatabaseLoader';
import { ItemDefinition } from '../Systems/Items/ItemDefinition';
import { ItemCategory } from '../Systems/Items/ItemCategory';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private cache: DatabaseCache;
  private loader: DatabaseLoader;

  private constructor() {
    this.cache = new DatabaseCache();
    this.loader = new DatabaseLoader(this.cache);
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async initialize(): Promise<void> {
    await this.loader.loadAll();
  }

  public getItem(id: string): any { return this.cache.items.get(id); }
  public getAllItemDefinitions(): ItemDefinition[] {
    const definitions: ItemDefinition[] = [];
    for (const key of this.cache.items.keys()) {
      const def = this.getItemDefinition(key);
      if (def) {
        definitions.push(def);
      }
    }
    return definitions;
  }

  private parseCategory(categoryStr?: string): ItemCategory {
    if (!categoryStr) return ItemCategory.CONSUMABLE;
    const upper = categoryStr.toUpperCase();
    if (upper in ItemCategory) {
      return ItemCategory[upper as keyof typeof ItemCategory];
    }
    if (upper === 'SHIELD') return ItemCategory.ARMOR;
    return ItemCategory.MISC;
  }

  public getItemDefinition(id: string): ItemDefinition | undefined {
    const raw = this.cache.items.get(id);
    if (!raw) return undefined;
    
    return {
      id: raw.id,
      name: raw.nombre || raw.name || '',
      description: raw.descripcion || raw.description || '',
      icon: raw.icono || raw.icon || '',
      category: this.parseCategory(raw.categoria || raw.category),
      equipmentSlot: raw.equipmentSlot,
      stackable: raw.stackable !== undefined ? raw.stackable : true,
      maxStack: raw.maxStack || 99,
      baseValue: raw.precio || raw.baseValue || 0,
      sprite: raw.sprite || '',
      rarityPool: raw.rarityPool || ['common'],
    };
  }
  public getEquipment(id: string): any { return this.cache.equipment.get(id); }
  public getCharacter(id: string): any { return this.cache.characters.get(id); }
  public getNPC(id: string): any { return this.cache.npcs.get(id); }
  public getEnemy(id: string): any { return this.cache.enemies.get(id); }
  public getSkill(id: string): any { return this.cache.skills.get(id); }
  public getQuest(id: string): any { return this.cache.quests.get(id); }
  public getMap(id: string): any { return this.cache.maps.get(id); }
  public getAudio(id: string): any { return this.cache.audio.get(id); }
  public getShop(id: string): any { return this.cache.shops.get(id); }
  public getDialogue(id: string): any { return this.cache.dialogues.get(id); }
  public getEffect(id: string): any { return this.cache.effects.get(id); }
  public getLoot(id: string): any { return this.cache.loot.get(id); }
  public getLoc(key: string): string { return this.cache.localization.get(key) || key; }
}
