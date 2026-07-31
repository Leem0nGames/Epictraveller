import { DatabaseCache } from './DatabaseCache';
import { ClaudecraftAssets } from '../Assets/ClaudecraftAssets';

export class DatabaseLoader {
  private cache: DatabaseCache;

  constructor(cache: DatabaseCache) {
    this.cache = cache;
  }

  public async loadAll(): Promise<void> {
    try {
      // Load directories using manifests
      await this.loadDirectory('items', this.cache.items);
      await this.loadDirectory('characters', this.cache.characters);
      await this.loadDirectory('npcs', this.cache.npcs);
      await this.loadDirectory('enemies', this.cache.enemies);
      await this.loadDirectory('skills', this.cache.skills);
      await this.loadDirectory('quests', this.cache.quests);
      await this.loadDirectory('maps', this.cache.maps);
      await this.loadDirectory('audio', this.cache.audio);
      await this.loadDirectory('shops', this.cache.shops);
      await this.loadDirectory('dialogues', this.cache.dialogues);
      await this.loadDirectory('effects', this.cache.effects);
      await this.loadDirectory('loot', this.cache.loot);
      
      await this.loadLocalization();

      this.ensureDefaults();
      console.log('Database loaded successfully.');
    } catch (error) {
      console.warn('Error during database load, applying fallback defaults:', error);
      this.ensureDefaults();
    }
  }

  private async loadDirectory(dirName: string, targetMap: Map<string, any>): Promise<void> {
    try {
      // Expects a list.json in the directory that lists all files to load
      const response = await fetch(`/api/assets/data/${dirName}/list.json`);
      if (!response.ok) {
        console.warn(`Could not load manifest for ${dirName}, skipping.`);
        return;
      }
      const fileList: string[] = await response.json();
      
      for (const file of fileList) {
        try {
          const itemResponse = await fetch(`/api/assets/data/${dirName}/${file}`);
          if (!itemResponse.ok) {
            console.warn(`Failed to load ${dirName}/${file}`);
            continue;
          }
          const data = await itemResponse.json();
          
          if (Array.isArray(data)) {
            for (const item of data) {
              if (item && typeof item === 'object' && item.id) {
                targetMap.set(item.id, item);
              }
            }
          } else if (data && typeof data === 'object' && data.id) {
            targetMap.set(data.id, data);
          } else if (data && typeof data === 'object') {
            for (const [key, value] of Object.entries(data)) {
              if (value && typeof value === 'object') {
                const itemWithId = { id: key, ...(value as object) };
                targetMap.set(key, itemWithId);
              }
            }
          } else {
            console.warn(`Invalid data in ${dirName}/${file}:`, data);
          }
        } catch (itemError) {
          console.warn(`Error loading item file ${dirName}/${file}:`, itemError);
        }
      }
    } catch (dirError) {
      console.warn(`Could not load directory ${dirName}:`, dirError);
    }
  }

  private async loadLocalization(): Promise<void> {
    try {
      const response = await fetch('/api/assets/data/localization/es.json');
      if (!response.ok) {
        console.warn(`Failed to load localization/es.json: ${response.status} ${response.statusText}`);
        return;
      }
      const data = await response.json();
      
      for (const [key, value] of Object.entries(data)) {
        this.cache.localization.set(key, value as string);
      }
    } catch (err) {
      console.warn('Could not load localization es.json:', err);
    }
  }

  private ensureDefaults(): void {
    if (this.cache.items.size === 0) {
      this.cache.items.set('iron_sword', {
        id: 'iron_sword',
        nombre: 'Espada de Hierro',
        descripcion: 'Una espada básica pero resistente.',
        icono: ClaudecraftAssets.ITEMS.iron_sword,
        categoria: 'EQUIPMENT',
        equipmentSlot: 'weapon',
        precio: 100
      });
      this.cache.items.set('crystal_shield', {
        id: 'crystal_shield',
        nombre: 'Escudo Cristalino',
        descripcion: 'Refleja la luz y otorga gran defensa física.',
        icono: ClaudecraftAssets.ITEMS.crystal_shield,
        categoria: 'EQUIPMENT',
        equipmentSlot: 'shield',
        precio: 180
      });
      this.cache.items.set('ruby_ring', {
        id: 'ruby_ring',
        nombre: 'Anillo de Rubí',
        descripcion: 'Forjado con fuego de dragón, otorga vitalidad.',
        icono: ClaudecraftAssets.ITEMS.ruby_ring,
        categoria: 'EQUIPMENT',
        equipmentSlot: 'helmet',
        precio: 250
      });
      this.cache.items.set('legendary_staff', {
        id: 'legendary_staff',
        nombre: 'Báculo de las Estrellas',
        descripcion: 'Báculo místico rebosante de poder arcano.',
        icono: ClaudecraftAssets.ITEMS.legendary_staff,
        categoria: 'EQUIPMENT',
        equipmentSlot: 'weapon',
        precio: 800
      });
      this.cache.items.set('small_potion', {
        id: 'small_potion',
        nombre: 'Poción Pequeña',
        descripcion: 'Restaura 50 puntos de salud (HP).',
        icono: ClaudecraftAssets.ITEMS.small_potion,
        categoria: 'CONSUMABLE',
        precio: 25
      });
      this.cache.items.set('greater_potion', {
        id: 'greater_potion',
        nombre: 'Poción Mayor de Vida',
        descripcion: 'Elixir revitalizante que restaura 120 puntos de salud (HP).',
        icono: ClaudecraftAssets.ITEMS.greater_potion,
        categoria: 'CONSUMABLE',
        precio: 75
      });
      this.cache.items.set('mana_elixir', {
        id: 'mana_elixir',
        nombre: 'Elixir de Maná',
        descripcion: 'Concentrado arcano que recupera 40 puntos de energía mágica (MP).',
        icono: ClaudecraftAssets.ITEMS.mana_elixir,
        categoria: 'CONSUMABLE',
        precio: 50
      });
    }

    if (this.cache.equipment.size === 0) {
      this.cache.equipment.set('iron_sword', {
        id: 'iron_sword',
        name: 'Espada de Hierro',
        slot: 'weapon',
        rarity: 'COMMON',
        modifiers: [{ id: 'm1', type: 'FLAT', value: 8, origin: 'iron_sword', stat: 'attack' }],
        visualModelId: 'sword_iron',
        price: 100,
        description: 'Una espada básica pero resistente (+8 Atq).',
        levelRequirement: 1
      });
      this.cache.equipment.set('crystal_shield', {
        id: 'crystal_shield',
        name: 'Escudo Cristalino',
        slot: 'shield',
        rarity: 'RARE',
        modifiers: [{ id: 'm2', type: 'FLAT', value: 6, origin: 'crystal_shield', stat: 'defense' }],
        visualModelId: 'shield_crystal',
        price: 180,
        description: 'Refleja la luz y otorga gran defensa física (+6 Def).',
        levelRequirement: 1
      });
      this.cache.equipment.set('ruby_ring', {
        id: 'ruby_ring',
        name: 'Anillo de Rubí',
        slot: 'helmet',
        rarity: 'EPIC',
        modifiers: [{ id: 'm3', type: 'FLAT', value: 25, origin: 'ruby_ring', stat: 'maxHp' }],
        visualModelId: 'ring_ruby',
        price: 250,
        description: 'Forjado con fuego de dragón, otorga vitalidad (+25 HP).',
        levelRequirement: 1
      });
      this.cache.equipment.set('legendary_staff', {
        id: 'legendary_staff',
        name: 'Báculo de las Estrellas',
        slot: 'weapon',
        rarity: 'LEGENDARY',
        modifiers: [
          { id: 'm4', type: 'FLAT', value: 25, origin: 'legendary_staff', stat: 'attack' },
          { id: 'm5', type: 'FLAT', value: 30, origin: 'legendary_staff', stat: 'maxMp' }
        ],
        visualModelId: 'staff_legendary',
        price: 800,
        description: 'Báculo místico rebosante de poder arcano (+25 Atq, +30 MP).',
        levelRequirement: 1
      });
    }

    if (this.cache.enemies.size === 0) {
      this.cache.enemies.set('slime_1', {
        id: 'slime_1',
        name: 'Limus de las Sombras',
        maxHp: 120,
        hp: 120,
        shieldMax: 3,
        shieldCurrent: 3,
        weaknesses: ['physical_sword', 'magic_fire'],
        stats: { atk: 18, def: 8, spd: 10 },
        xpReward: 45,
        goldReward: 25
      });
    }

    if (this.cache.skills.size === 0) {
      this.cache.skills.set('fireball', {
        id: 'fireball',
        name: 'Bola de Fuego',
        mpCost: 8,
        power: 45,
        type: 'magic_fire',
        icon: ClaudecraftAssets.SKILLS.fireball,
        description: 'Lanza una ráfaga ardiente ancestral.'
      });
      this.cache.skills.set('frostbolt', {
        id: 'frostbolt',
        name: 'Rayo de Hielo',
        mpCost: 6,
        power: 35,
        type: 'magic_ice',
        icon: ClaudecraftAssets.SKILLS.frostbolt,
        description: 'Dispara una saeta gélida que ralentiza al objetivo.'
      });
      this.cache.skills.set('barkskin', {
        id: 'barkskin',
        name: 'Piel de Roble',
        mpCost: 10,
        power: 0,
        type: 'buff',
        icon: ClaudecraftAssets.SKILLS.barkskin,
        description: 'Endurece la piel aumentando drásticamente la defensa.'
      });
      this.cache.skills.set('aimed_shot', {
        id: 'aimed_shot',
        name: 'Tiro Certero',
        mpCost: 12,
        power: 55,
        type: 'physical_ranged',
        icon: ClaudecraftAssets.SKILLS.aimed_shot,
        description: 'Un disparo de alta precisión con alta probabilidad de golpe crítico.'
      });
    }
  }
}
