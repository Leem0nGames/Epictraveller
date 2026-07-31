import { EventEmitter } from 'events';
import { EventBus } from '../../Core/EventBus';
import { ToastManager } from '../ToastManager';
import { ProgressionManager } from '../Progression/ProgressionManager';
import { InventoryManager } from '../Inventory/InventoryManager';
import { ItemInstance } from '../Items/ItemInstance';
import { DatabaseManager } from '../../Database/DatabaseManager';
import { SafeZoneSystem } from '../SafeZoneSystem';

export type DangerLevel = 'SAFE' | 'MODERATE' | 'HIGH' | 'DEADLY';

export interface DangerZoneInfo {
  level: DangerLevel;
  name: string;
  badge: string;
  color: string;
  borderColor: string;
  multiplier: number;
  expBonusPercent: number;
  description: string;
}

export const DANGER_ZONES: Record<string, DangerZoneInfo> = {
  village: {
    level: 'SAFE',
    name: 'Santuario de Midgard-Loka',
    badge: 'ZONA SEGURA',
    color: 'from-emerald-500 to-teal-600',
    borderColor: 'border-emerald-400/60',
    multiplier: 1.0,
    expBonusPercent: 0,
    description: 'Zona de refugio bendecida por Yggdrasil. Tu botín está 100% seguro aquí.',
  },
  forest: {
    level: 'MODERATE',
    name: 'Bosque de Asgard-Samsara',
    badge: 'RIESGO MODERADO',
    color: 'from-amber-500 to-yellow-600',
    borderColor: 'border-amber-400/80',
    multiplier: 1.5,
    expBonusPercent: 25,
    description: 'Espíritus de Prana y siervos de Vritra rondan las sombras. Botín y EXP x1.5.',
  },
  dungeon: {
    level: 'HIGH',
    name: 'Abismo de Niflheim-Vritra',
    badge: 'RIESGO ALTO',
    color: 'from-rose-600 to-red-700',
    borderColor: 'border-rose-500/90',
    multiplier: 2.5,
    expBonusPercent: 60,
    description: 'Laberinto antiguo plagado de asuras y guardianes corruptos. Botín y EXP x2.5.',
  },
  boss_room: {
    level: 'DEADLY',
    name: 'Salón del Trono de Vritra-Nidhogg',
    badge: 'PELIGRO MORTAL',
    color: 'from-purple-700 via-rose-700 to-amber-600',
    borderColor: 'border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.6)]',
    multiplier: 4.0,
    expBonusPercent: 120,
    description: 'Salón ancestral del Avatar del Caos. Recompensas legendarias a cambio de tu vida.',
  },
};

export interface UnextractedItem {
  instance: ItemInstance;
  name: string;
  rarity: string;
  count: number;
  value: number;
}

export interface ExpeditionStats {
  mapId: string;
  zoneInfo: DangerZoneInfo;
  startTime: number;
  durationSeconds: number;
  monstersDefeated: number;
  chestsOpened: number;
  unextractedGold: number;
  unextractedItems: UnextractedItem[];
  highestDangerLevel: DangerLevel;
}

export class ExpeditionManager {
  private static instance: ExpeditionManager;
  private eventBus: EventBus;
  private emitter: EventEmitter = new EventEmitter();

  private activeExpedition: boolean = false;
  private currentMapId: string = 'village';
  private startTime: number = Date.now();
  private monstersDefeated: number = 0;
  private chestsOpened: number = 0;
  private unextractedGold: number = 0;
  private unextractedItems: UnextractedItem[] = [];
  private highestDangerLevel: DangerLevel = 'SAFE';

  // Last completed summary for UI modal presentation
  private lastSummary: {
    type: 'EXTRACTION_VICTORY' | 'EXPEDITION_DEFEAT';
    stats: ExpeditionStats;
    goldBanked: number;
    itemsBanked: UnextractedItem[];
    goldLost: number;
    itemsLost: UnextractedItem[];
    expBonusGained: number;
  } | null = null;

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.registerEventListeners();
  }

  public static getInstance(): ExpeditionManager {
    if (!ExpeditionManager.instance) {
      ExpeditionManager.instance = new ExpeditionManager();
    }
    return ExpeditionManager.instance;
  }

  public isExpeditionActive(): boolean {
    return this.activeExpedition;
  }

  public getCurrentMapId(): string {
    return this.currentMapId;
  }

  public getZoneInfo(x?: number, z?: number): DangerZoneInfo {
    if (SafeZoneSystem.getInstance().isSafeZone(this.currentMapId, x, z)) {
      return DANGER_ZONES.village;
    }
    return DANGER_ZONES[this.currentMapId] || DANGER_ZONES.village;
  }

  public getUnextractedGold(): number {
    return this.unextractedGold;
  }

  public getUnextractedItems(): UnextractedItem[] {
    return [...this.unextractedItems];
  }

  public getLastSummary() {
    return this.lastSummary;
  }

  public clearLastSummary(): void {
    this.lastSummary = null;
    this.notifyUpdate();
  }

  /**
   * Called when entering a new map location
   */
  public onMapEntered(mapId: string): void {
    const prevMap = this.currentMapId;
    this.currentMapId = mapId;
    const zoneInfo = this.getZoneInfo();

    if (zoneInfo.level !== 'SAFE') {
      if (!this.activeExpedition) {
        // Start a brand new expedition from sanctuary
        this.activeExpedition = true;
        this.startTime = Date.now();
        this.monstersDefeated = 0;
        this.chestsOpened = 0;
        this.unextractedGold = 0;
        this.unextractedItems = [];
        this.highestDangerLevel = zoneInfo.level;

        ToastManager.getInstance().show(
          `⚔️ ¡EXPEDICIÓN EN CURSO! Entrando a ${zoneInfo.name} (${zoneInfo.badge})`
        );

        this.eventBus.emit('expedition:started', {
          mapId,
          zoneInfo,
          multiplier: zoneInfo.multiplier,
        });
      } else {
        // Transitioning into deeper danger zones
        if (this.dangerPriority(zoneInfo.level) > this.dangerPriority(this.highestDangerLevel)) {
          this.highestDangerLevel = zoneInfo.level;
        }

        ToastManager.getInstance().show(
          `⚠️ CAMBIO DE ZONA DE RIESGO: ${zoneInfo.name} (${zoneInfo.badge} x${zoneInfo.multiplier})`
        );

        this.eventBus.emit('expedition:zone_changed', {
          mapId,
          zoneInfo,
          multiplier: zoneInfo.multiplier,
        });
      }
    } else if (prevMap !== 'village' && zoneInfo.level === 'SAFE' && this.activeExpedition) {
      // Returned safely to the Sanctuary -> Trigger Successful Extraction!
      this.extractToSanctuary();
    }

    this.notifyUpdate();
  }

  /**
   * Track unextracted loot collected in active expedition
   */
  public recordLoot(instance: ItemInstance, count: number, isGold: boolean = false, goldAmount: number = 0): void {
    if (!this.activeExpedition) return;

    if (isGold) {
      this.unextractedGold += goldAmount;
      ToastManager.getInstance().show(`💰 +${goldAmount} Oro de Expedición (Sin asegurar)`);
    } else {
      const def = DatabaseManager.getInstance().getItemDefinition(instance.definitionId);
      const name = def?.name || instance.definitionId;
      const val = (def?.baseValue || 20) * count;

      const existingIndex = this.unextractedItems.findIndex((i) => i.instance.definitionId === instance.definitionId);
      if (existingIndex >= 0) {
        this.unextractedItems[existingIndex].count += count;
        this.unextractedItems[existingIndex].value += val;
      } else {
        this.unextractedItems.push({
          instance,
          name,
          rarity: instance.rarity,
          count,
          value: val,
        });
      }

      if (['RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'].includes(instance.rarity)) {
        ToastManager.getInstance().show(`✨ ¡BOTÍN EXTRAORDINARIO HALLADO! ${name} (${instance.rarity})`);
      }
    }

    this.eventBus.emit('expedition:loot_added', {
      unextractedGold: this.unextractedGold,
      itemCount: this.unextractedItems.length,
    });

    this.notifyUpdate();
  }

  public recordMonsterDefeated(): void {
    if (this.activeExpedition) {
      this.monstersDefeated += 1;
      this.notifyUpdate();
    }
  }

  public recordChestOpened(): void {
    if (this.activeExpedition) {
      this.chestsOpened += 1;
      this.notifyUpdate();
    }
  }

  /**
   * Successful Extraction: Return alive to Santuario de Midgard-Loka
   */
  public extractToSanctuary(): void {
    if (!this.activeExpedition) return;

    const durationSeconds = Math.round((Date.now() - this.startTime) / 1000);
    const zoneInfo = this.getZoneInfo();

    // Calculate Extraction Bonus EXP based on danger level & items extracted
    const baseExpBonus = this.monstersDefeated * 25 + this.chestsOpened * 50;
    const expBonusGained = Math.round(baseExpBonus * (1 + zoneInfo.expBonusPercent / 100));

    if (expBonusGained > 0) {
      ProgressionManager.getInstance().addExp(expBonusGained);
    }

    const stats: ExpeditionStats = {
      mapId: this.currentMapId,
      zoneInfo,
      startTime: this.startTime,
      durationSeconds,
      monstersDefeated: this.monstersDefeated,
      chestsOpened: this.chestsOpened,
      unextractedGold: this.unextractedGold,
      unextractedItems: [...this.unextractedItems],
      highestDangerLevel: this.highestDangerLevel,
    };

    const goldBanked = this.unextractedGold;
    const itemsBanked = [...this.unextractedItems];

    this.lastSummary = {
      type: 'EXTRACTION_VICTORY',
      stats,
      goldBanked,
      itemsBanked,
      goldLost: 0,
      itemsLost: [],
      expBonusGained,
    };

    // Reset expedition status
    this.activeExpedition = false;
    this.unextractedGold = 0;
    this.unextractedItems = [];

    ToastManager.getInstance().show(`🏛️ ¡REGRESO VICTORIOSO AL SANTUARIO! Botín asegurado.`);

    this.eventBus.emit('expedition:extracted', this.lastSummary);
    this.notifyUpdate();
  }

  /**
   * Player Defeat in Expedition: Penalty & Emergency Extraction to Sanctuary
   */
  public handlePlayerDefeat(): void {
    if (!this.activeExpedition) return;

    const durationSeconds = Math.round((Date.now() - this.startTime) / 1000);
    const zoneInfo = this.getZoneInfo();

    const stats: ExpeditionStats = {
      mapId: this.currentMapId,
      zoneInfo,
      startTime: this.startTime,
      durationSeconds,
      monstersDefeated: this.monstersDefeated,
      chestsOpened: this.chestsOpened,
      unextractedGold: this.unextractedGold,
      unextractedItems: [...this.unextractedItems],
      highestDangerLevel: this.highestDangerLevel,
    };

    // Penalties: Lose 60% of unextracted gold, keep 40% salvaged
    const goldLost = Math.floor(this.unextractedGold * 0.6);
    const goldBanked = this.unextractedGold - goldLost;

    // Items penalty: Lose half of unextracted items
    const itemsLost: UnextractedItem[] = [];
    const itemsBanked: UnextractedItem[] = [];

    this.unextractedItems.forEach((item, index) => {
      if (index % 2 === 0) {
        itemsBanked.push(item);
      } else {
        itemsLost.push(item);
      }
    });

    // Remove lost items from actual inventory if present
    const inventory = InventoryManager.getInstance().getPlayerInventory();
    itemsLost.forEach((lost) => {
      const slotIndex = inventory.getSlots().findIndex(
        (s) => s.instance && s.instance.definitionId === lost.instance.definitionId
      );
      if (slotIndex >= 0) {
        inventory.removeItemAt(slotIndex, lost.count);
      }
    });

    this.lastSummary = {
      type: 'EXPEDITION_DEFEAT',
      stats,
      goldBanked,
      itemsBanked,
      goldLost,
      itemsLost,
      expBonusGained: 0,
    };

    // Reset expedition state & teleport player back to sanctuary
    this.activeExpedition = false;
    this.currentMapId = 'village';
    this.unextractedGold = 0;
    this.unextractedItems = [];

    ToastManager.getInstance().show(`☠️ Rescatado en estado crítico. Botín no asegurado perdido parcialmente.`);

    this.eventBus.emit('expedition:defeated', this.lastSummary);
    this.eventBus.emit('map:change_request', {
      targetMapId: 'village',
      targetX: 0,
      targetZ: 0,
      targetName: 'Santuario de Midgard-Loka',
    });

    this.notifyUpdate();
  }

  private dangerPriority(level: DangerLevel): number {
    switch (level) {
      case 'SAFE': return 0;
      case 'MODERATE': return 1;
      case 'HIGH': return 2;
      case 'DEADLY': return 3;
    }
  }

  private registerEventListeners(): void {
    this.eventBus.on('battle:ended', (data: { result: string }) => {
      if (data.result === 'VICTORY') {
        this.recordMonsterDefeated();
      } else if (data.result === 'DEFEAT' && this.activeExpedition) {
        this.handlePlayerDefeat();
      }
    });
  }

  public subscribe(callback: () => void): () => void {
    this.emitter.on('updated', callback);
    return () => {
      this.emitter.off('updated', callback);
    };
  }

  private notifyUpdate(): void {
    this.emitter.emit('updated');
  }
}
