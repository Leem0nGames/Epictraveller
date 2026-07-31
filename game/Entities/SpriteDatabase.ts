import { AssetManifest, SpriteManifestEntry } from '../Assets/AssetManifest';

export interface CharacterClassPreset {
  id: string;
  name: string;
  spriteId: string;
  description: string;
  stats: {
    hp: number;
    mp: number;
    speed: number;
    attack: number;
  };
}

/**
 * SpriteDatabase registers JRPG template classes (Hero, Villager, Knight, Slime) 
 * and ties them to appropriate Sprite Manifest IDs and starting configurations.
 */
export class SpriteDatabase {
  private static instance: SpriteDatabase;
  private classes: Map<string, CharacterClassPreset> = new Map();

  private constructor() {
    this.seedDatabase();
  }

  /**
   * Get Singleton Instance
   */
  public static getInstance(): SpriteDatabase {
    if (!SpriteDatabase.instance) {
      SpriteDatabase.instance = new SpriteDatabase();
    }
    return SpriteDatabase.instance;
  }

  /**
   * Seed database with default JRPG class presets
   */
  private seedDatabase(): void {
    const presets: CharacterClassPreset[] = [
      {
        id: 'Hero',
        name: 'Classic Valen',
        spriteId: 'hero_body',
        description: 'A wandering swordsman seeking to restore balance to the overworld.',
        stats: { hp: 120, mp: 40, speed: 5.5, attack: 18 },
      },
      {
        id: 'Knight',
        name: 'Knight of Eldoria',
        spriteId: 'knight_armor',
        description: 'An elite sentinel adorned in full plated chestplate.',
        stats: { hp: 200, mp: 15, speed: 4.2, attack: 22 },
      },
      {
        id: 'Slime',
        name: 'Forest Slime',
        spriteId: 'slime_enemy',
        description: 'A bouncy turquoise fluid block. Watch out for its splash tackles!',
        stats: { hp: 45, mp: 0, speed: 3.5, attack: 8 },
      },
    ];

    presets.forEach((p) => this.classes.set(p.id, p));
  }

  /**
   * Get a character class preset by its template ID, sprite ID, or name alias
   */
  public getClassPreset(classId: string): CharacterClassPreset | undefined {
    if (!classId) return this.classes.get('Hero');
    const lower = classId.toLowerCase();

    for (const [key, preset] of this.classes.entries()) {
      if (
        key.toLowerCase() === lower ||
        preset.id.toLowerCase() === lower ||
        preset.spriteId.toLowerCase() === lower
      ) {
        return preset;
      }
    }

    if (lower.includes('knight') || lower.includes('guard') || lower.includes('armor')) {
      return this.classes.get('Knight');
    }
    if (lower.includes('hero') || lower.includes('adventurer') || lower.includes('novice')) {
      return this.classes.get('Hero');
    }
    if (lower.includes('slime') || lower.includes('enemy')) {
      return this.classes.get('Slime');
    }

    return this.classes.get('Hero');
  }

  /**
   * Find the associated Sprite Manifest Entry for a given template class or sprite ID
   */
  public getManifestForClass(classId: string): SpriteManifestEntry | undefined {
    const preset = this.getClassPreset(classId);
    if (preset) {
      const match = AssetManifest.sprites.find((entry) => entry.id === preset.spriteId);
      if (match) return match;
    }

    // Direct search in AssetManifest by ID or lowercased ID
    const lower = classId ? classId.toLowerCase() : '';
    const directMatch = AssetManifest.sprites.find((entry) => entry.id.toLowerCase() === lower);
    if (directMatch) return directMatch;

    // Fallback default entry so SpriteEntity never fails
    return AssetManifest.sprites[0];
  }

  /**
   * List all registered template profiles
   */
  public listAllPresets(): CharacterClassPreset[] {
    return Array.from(this.classes.values());
  }
}
