import { ToastManager } from '../ToastManager';
import { FantasySFX } from '../FantasySFX';
import { WeaknessType } from '../OctopathCombatEngine';

export interface BestiaryEntry {
  id: string;
  numberId: string; // e.g. "001"
  name: string;
  category: 'SLIME' | 'BEAST' | 'HUMANOID' | 'BOSS' | 'ELEMENTAL';
  spriteIcon: string; // Icon or emoji or sprite path
  location: string;
  level: number;
  hp: number;
  atk: number;
  def: number;
  speed: number;
  shieldMax: number;
  exp: number;
  gold: number;
  weaknesses: {
    type: WeaknessType;
    label: string;
    icon: string;
    description: string;
  }[];
  lore: string;
  drops: string[];
  
  // Dynamic Unlocked Progress
  defeatedCount: number;
  discoveredWeaknesses: WeaknessType[];
  isSeen: boolean;
}

export class BestiarySystem {
  private static instance: BestiarySystem;
  private entries: Map<string, BestiaryEntry> = new Map();

  private constructor() {
    this.initDefaultBestiary();
    this.loadFromLocalStorage();
  }

  public static getInstance(): BestiarySystem {
    if (!BestiarySystem.instance) {
      BestiarySystem.instance = new BestiarySystem();
    }
    return BestiarySystem.instance;
  }

  private initDefaultBestiary(): void {
    const defaultData: Omit<BestiaryEntry, 'defeatedCount' | 'discoveredWeaknesses' | 'isSeen'>[] = [
      {
        id: 'slime',
        numberId: '001',
        name: 'Limo de Vritra',
        category: 'SLIME',
        spriteIcon: '🟢',
        location: 'Bosque del Alba',
        level: 1,
        hp: 20,
        atk: 5,
        def: 0,
        speed: 1,
        shieldMax: 2,
        exp: 10,
        gold: 15,
        weaknesses: [
          { type: 'SWORD', label: 'Espada', icon: '⚔️', description: 'Cortes limpios dividen su núcleo' },
          { type: 'FIRE', label: 'Fuego', icon: '🔥', description: 'El calor deshidrata la masa gelatinosa' },
          { type: 'ICE', label: 'Hielo', icon: '❄️', description: 'El frío congela su estructura' },
        ],
        lore: 'Criatura elemental nacida de la condensación de maná en los bosques antiguos de Eldoria. Aunque débil de forma individual, responde agresivamente a las fluctuaciones mágicas.',
        drops: ['Gema de Limo', 'Núcleo Viscoso', 'Agua Pura'],
      },
      {
        id: 'fenrir_rakshasa',
        numberId: '002',
        name: 'Huargo Fenrir-Rakshasa',
        category: 'BEAST',
        spriteIcon: '🐺',
        location: 'Paso de la Neblina',
        level: 3,
        hp: 45,
        atk: 12,
        def: 3,
        speed: 3,
        shieldMax: 3,
        exp: 25,
        gold: 35,
        weaknesses: [
          { type: 'SPEAR', label: 'Lanza', icon: '🔱', description: 'Estocadas frenan sus arremetidas' },
          { type: 'BOW', label: 'Arco', icon: '🏹', description: 'Vulnerable a disparos a distancia' },
          { type: 'FIRE', label: 'Fuego', icon: '🔥', description: 'El fuego espanta a la bestia' },
        ],
        lore: 'Fiero depredador de las cumbres heladas imbuido con el espíritu guerrero Rakshasa. Sus garras de sombra pueden atravesar escudos de acero convencional.',
        drops: ['Piel de Huargo', 'Colmillo de Bestia', 'Garra Afilada'],
      },
      {
        id: 'asura_dvergr',
        numberId: '003',
        name: 'Guerrero Asura-Dvergr',
        category: 'HUMANOID',
        spriteIcon: '🧔‍♂️',
        location: 'Ruinas Subterráneas',
        level: 5,
        hp: 80,
        atk: 18,
        def: 8,
        speed: 2,
        shieldMax: 4,
        exp: 50,
        gold: 75,
        weaknesses: [
          { type: 'SPEAR', label: 'Lanza', icon: '🔱', description: 'Penetra las junturas de su armadura' },
          { type: 'ARCANA', label: 'Arcana', icon: '✨', description: 'Mágia directa ignora su defensa física' },
          { type: 'FIRE', label: 'Fuego', icon: '🔥', description: 'Calienta el metal de su peto' },
        ],
        lore: 'Veterano de las forjas profundas de Dvergr. Su pesada armadura rúnica repele la mayoría de cortes ordinarios, requiriendo precisión estratégica para romper su postura.',
        drops: ['Lingote de Mitril', 'Fragmento de Armadura', 'Piedra Rúnica'],
      },
      {
        id: 'knight',
        numberId: '004',
        name: 'Guardia Real de Eldoria',
        category: 'HUMANOID',
        spriteIcon: '🛡️',
        location: 'Aldea de Eldoria',
        level: 2,
        hp: 60,
        atk: 10,
        def: 6,
        speed: 2,
        shieldMax: 3,
        exp: 30,
        gold: 40,
        weaknesses: [
          { type: 'BOW', label: 'Arco', icon: '🏹', description: 'Explota aperturas en su guardia' },
          { type: 'ARCANA', label: 'Arcana', icon: '✨', description: 'Incapaz de bloquear energía astral' },
          { type: 'ICE', label: 'Hielo', icon: '❄️', description: 'Reduce la agilidad de sus movimientos' },
        ],
        lore: 'Caballero juramentado de la guardia fronteriza. Entrenado en el arte de la defensa férrea con broquel y espada corta para proteger los pasos principales.',
        drops: ['Emblema Real', 'Poción de Salud', 'Hierba Curativa'],
      },
      {
        id: 'vritra_avatar',
        numberId: '005',
        name: 'Avatar de Vritra-Nidhogg',
        category: 'BOSS',
        spriteIcon: '🐲',
        location: 'Cúspide del Abismo',
        level: 10,
        hp: 250,
        atk: 30,
        def: 15,
        speed: 4,
        shieldMax: 6,
        exp: 200,
        gold: 300,
        weaknesses: [
          { type: 'SWORD', label: 'Espada', icon: '⚔️', description: 'Tajo en sus escamas del cuello' },
          { type: 'ARCANA', label: 'Arcana', icon: '✨', description: 'Desestabiliza su aura de dragón' },
          { type: 'FIRE', label: 'Fuego', icon: '🔥', description: 'Provoca sobrecarga de calor' },
          { type: 'ICE', label: 'Hielo', icon: '❄️', description: 'Quiebra su armadura dracónica' },
        ],
        lore: 'La encarnación mítica del Dragón Oscuro Vritra. Su despertar amenaza con sumir las tierras de Eldoria en un cataclismo continuo. Solo quienes dominan la Ruptura y la Resonancia pueden enfrentarlo.',
        drops: ['Núcleo Primordial de Nidhogg', 'Escama de Vritra', 'Reliquia Ancestral'],
      },
    ];

    for (const d of defaultData) {
      this.entries.set(d.id, {
        ...d,
        defeatedCount: 0,
        discoveredWeaknesses: [],
        isSeen: false,
      });
    }

    // Default unlock the slime as SEEN so the player has something discovered at start
    const slime = this.entries.get('slime');
    if (slime) {
      slime.isSeen = true;
    }
  }

  public getEntries(): BestiaryEntry[] {
    return Array.from(this.entries.values());
  }

  public getEntry(id: string): BestiaryEntry | undefined {
    // Search exact ID or case-insensitive match / partial match
    if (this.entries.has(id)) return this.entries.get(id);
    for (const entry of this.entries.values()) {
      if (id.toLowerCase().includes(entry.id) || entry.id.includes(id.toLowerCase())) {
        return entry;
      }
    }
    return undefined;
  }

  public getUnlockedCount(): { discovered: number; total: number } {
    const list = this.getEntries();
    const discovered = list.filter((e) => e.isSeen || e.defeatedCount > 0).length;
    return { discovered, total: list.length };
  }

  /**
   * Called when seeing an enemy in battle
   */
  public recordEncounter(enemyId: string): void {
    const entry = this.getEntry(enemyId);
    if (entry) {
      if (!entry.isSeen) {
        entry.isSeen = true;
        this.saveToLocalStorage();
      }
    }
  }

  /**
   * Called when revealing a weakness in battle
   */
  public recordWeaknessDiscovered(enemyId: string, weakness: WeaknessType): void {
    const entry = this.getEntry(enemyId);
    if (entry) {
      if (!entry.discoveredWeaknesses.includes(weakness)) {
        entry.discoveredWeaknesses.push(weakness);
        entry.isSeen = true;
        this.saveToLocalStorage();
      }
    }
  }

  /**
   * Called when defeating an enemy in combat
   */
  public recordDefeat(enemyId: string, enemyName?: string, revealedWeaknesses?: WeaknessType[]): void {
    let entry = this.getEntry(enemyId);

    // If enemy name provided, attempt matching by name
    if (!entry && enemyName) {
      for (const e of this.entries.values()) {
        if (enemyName.toLowerCase().includes(e.name.toLowerCase()) || e.name.toLowerCase().includes(enemyName.toLowerCase())) {
          entry = e;
          break;
        }
      }
    }

    if (entry) {
      const isFirstKill = entry.defeatedCount === 0;
      entry.defeatedCount += 1;
      entry.isSeen = true;

      // Automatically register any weaknesses revealed during combat
      if (revealedWeaknesses) {
        for (const w of revealedWeaknesses) {
          if (!entry.discoveredWeaknesses.includes(w)) {
            entry.discoveredWeaknesses.push(w);
          }
        }
      }

      this.saveToLocalStorage();

      if (isFirstKill) {
        FantasySFX.getInstance().playHealChime();
        ToastManager.getInstance().show(
          `📖 ¡NUEVA ENTRADA REGISTRADA! Bestiario: ${entry.name} ha sido añadido a tu enciclopedia.`
        );
      }
    }
  }

  private saveToLocalStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const saveState: Record<string, { defeatedCount: number; discoveredWeaknesses: WeaknessType[]; isSeen: boolean }> = {};
      this.entries.forEach((value, key) => {
        saveState[key] = {
          defeatedCount: value.defeatedCount,
          discoveredWeaknesses: value.discoveredWeaknesses,
          isSeen: value.isSeen,
        };
      });
      localStorage.setItem('eldoria_bestiary_v1', JSON.stringify(saveState));
    } catch (e) {
      console.warn('Failed to save Bestiary to localStorage', e);
    }
  }

  private loadFromLocalStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('eldoria_bestiary_v1');
      if (raw) {
        const saved = JSON.parse(raw);
        Object.keys(saved).forEach((key) => {
          const entry = this.getEntry(key);
          if (entry) {
            entry.defeatedCount = saved[key].defeatedCount || 0;
            entry.discoveredWeaknesses = saved[key].discoveredWeaknesses || [];
            entry.isSeen = saved[key].isSeen || entry.defeatedCount > 0;
          }
        });
      }
    } catch (e) {
      console.warn('Failed to load Bestiary from localStorage', e);
    }
  }
}
