import { EventEmitter } from 'events';
import { EventBus } from '../Core/EventBus';
import { ToastManager } from './ToastManager';
import { InventoryManager } from './Inventory/InventoryManager';
import { ProgressionManager } from './Progression/ProgressionManager';
import { ExpeditionManager } from './Expedition/ExpeditionManager';
import { SafeZoneSystem } from './SafeZoneSystem';
import { ItemFactory } from './Items/ItemFactory';
import { Rarity } from './Items/Rarity';

export type WorldEventType = 
  | 'ANCIENT_SHRINE'
  | 'NOMAD_MERCHANT'
  | 'CARAVAN_SIEGE'
  | 'FORBIDDEN_CRYPT'
  | 'WOUNDED_TRAVELER'
  | 'ELITE_CHAMPION_SPAWN'
  | 'PRANA_STORM';

export interface WorldEventChoice {
  id: string;
  label: string;
  sublabel: string;
  type: 'COMBAT' | 'RESOURCE' | 'STEALTH' | 'PURIFY' | 'IGNORE';
  icon: string;
  requiredItem?: string;
  requiredGold?: number;
}

export interface WorldEventData {
  id: string;
  type: WorldEventType;
  title: string;
  badge: string;
  description: string;
  locationName: string;
  choices: WorldEventChoice[];
  resolved?: boolean;
}

export interface StoryLogEntry {
  id: string;
  timestamp: string;
  title: string;
  outcomeText: string;
  type: 'EVENT' | 'ELITE_BOSS' | 'EXTRACTION' | 'DISCOVERY';
}

export class DynamicWorldEventsSystem {
  private static instance: DynamicWorldEventsSystem;
  private eventBus: EventBus;
  private emitter: EventEmitter = new EventEmitter();

  // Noise & Stealth Awareness State
  private playerNoiseLevel: number = 0; // 0 (Silent) to 100 (High Noise)
  private isStealthActive: boolean = false;
  private nearbyAlertedEnemies: number = 0;

  // Active Map & Event State
  private currentMapId: string = 'village';
  private activeEvent: WorldEventData | null = null;
  private storyLog: StoryLogEntry[] = [];
  private lastEventTime: number = 0;

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.registerEventListeners();
  }

  public static getInstance(): DynamicWorldEventsSystem {
    if (!DynamicWorldEventsSystem.instance) {
      DynamicWorldEventsSystem.instance = new DynamicWorldEventsSystem();
    }
    return DynamicWorldEventsSystem.instance;
  }

  public getPlayerNoiseLevel(): number {
    return this.playerNoiseLevel;
  }

  public getIsStealthActive(): boolean {
    return this.isStealthActive;
  }

  public getActiveEvent(): WorldEventData | null {
    return this.activeEvent;
  }

  public getStoryLog(): StoryLogEntry[] {
    return [...this.storyLog];
  }

  public setPlayerNoise(speed: number, isMoving: boolean, isSprinting: boolean = false): void {
    if (!isMoving) {
      this.playerNoiseLevel = Math.max(0, this.playerNoiseLevel - 15);
      this.isStealthActive = true;
    } else if (isSprinting) {
      this.playerNoiseLevel = Math.min(100, this.playerNoiseLevel + 25);
      this.isStealthActive = false;
    } else {
      this.playerNoiseLevel = 40;
      this.isStealthActive = false;
    }
    this.notifyUpdate();
  }

  /**
   * Called when player enters a map to evaluate dynamic story events
   */
  public onMapEntered(mapId: string): void {
    this.currentMapId = mapId;

    if (mapId === 'village' || SafeZoneSystem.getInstance().isSafeZone(mapId)) return;

    // 60% chance to trigger an emergent dynamic event in non-safe zones
    const now = Date.now();
    if (now - this.lastEventTime > 8000) { // Cooldown between major event popups
      this.lastEventTime = now;
      this.triggerRandomWorldEvent(mapId);
    }
  }

  /**
   * Triggers a random dynamic world event suited for the current danger level
   */
  public triggerRandomWorldEvent(mapId: string): void {
    if (SafeZoneSystem.getInstance().isSafeZone(mapId)) return;
    const events: WorldEventData[] = [
      {
        id: `event_${Date.now()}_shrine`,
        type: 'ANCIENT_SHRINE',
        title: '✦ Santuario de Prana Ancestral ✦',
        badge: 'BENDICIÓN EFÍMERA',
        description: 'Un antiguo monolito de Yggdrasil resplandece en mitad del sendero. Emana energía pura que puede revitalizar tus fuerzas o bendecir tu fortuna.',
        locationName: mapId === 'forest' ? 'Bosque de Samsara' : 'Abismo de Niflheim',
        choices: [
          {
            id: 'shrine_meditate',
            label: 'Canalizar Prana y Meditar',
            sublabel: 'Restaura +30% Salud y otorga +2 BP para el próximo combate',
            type: 'PURIFY',
            icon: 'Sparkles',
          },
          {
            id: 'shrine_offering',
            label: 'Ofrendar 40 Monedas de Oro',
            sublabel: 'Invoca la gracia de la fortuna (+40% Calidad de Botín)',
            type: 'RESOURCE',
            icon: 'Coins',
            requiredGold: 40,
          },
          {
            id: 'shrine_ignore',
            label: 'Continuar con Precaución',
            sublabel: 'No arriesgarse a perturbar el monolito',
            type: 'IGNORE',
            icon: 'ArrowRight',
          },
        ],
      },
      {
        id: `event_${Date.now()}_merchant`,
        type: 'NOMAD_MERCHANT',
        title: '🛒 Mercader Nómada de Samsara 🛒',
        badge: 'ENCUENTRO INESPERADO',
        description: 'Un misterioso mercader itinerante ha montado su tienda protegida por runas en medio del territorio hostil.',
        locationName: mapId === 'forest' ? 'Senderos del Bosque' : 'Laberintos del Abismo',
        choices: [
          {
            id: 'merchant_buy_elixir',
            label: 'Comprar Elixir Vital (60 Oro)',
            sublabel: 'Adquiere una Gran Poción de Salud de alta pureza',
            type: 'RESOURCE',
            icon: 'FlaskConical',
            requiredGold: 60,
          },
          {
            id: 'merchant_stealth_pass',
            label: 'Avanzar en Sigilo',
            sublabel: 'Evitar llamar la atención y guardar recursos',
            type: 'STEALTH',
            icon: 'EyeOff',
          },
        ],
      },
      {
        id: `event_${Date.now()}_caravan`,
        type: 'CARAVAN_SIEGE',
        title: '⚔️ Caravana Kshatriya Asediada ⚔️',
        badge: 'EVENTO DE COMBATE ÉPICO',
        description: 'Una expedición de mercaderes está rodeada por sombras corruptas. Sus guardias apenas resisten.',
        locationName: mapId === 'forest' ? 'Claro del Bosque' : 'Cámara de las Sombras',
        choices: [
          {
            id: 'caravan_defend',
            label: 'Lanzarse al Combate y Defender',
            sublabel: 'Inicia batalla contra campeones asuras. Botín legendario si triunfas.',
            type: 'COMBAT',
            icon: 'Swords',
          },
          {
            id: 'caravan_bribe',
            label: 'Sobornar a los Atacantes (75 Oro)',
            sublabel: 'Pagar rescate para salvar la caravana sin combatir.',
            type: 'RESOURCE',
            icon: 'Coins',
            requiredGold: 75,
          },
          {
            id: 'caravan_stealth',
            label: 'Retirarse en Silencio',
            sublabel: 'Continuar camino sin involucrarse en la refriega.',
            type: 'STEALTH',
            icon: 'Shield',
          },
        ],
      },
      {
        id: `event_${Date.now()}_crypt`,
        type: 'FORBIDDEN_CRYPT',
        title: '🗝️ Cripta de Reliquias Prohibidas 🗝️',
        badge: 'RIESGO vs RECOMPENSA',
        description: 'Descubres un cofre grabado con inscripciones antiguas. Sientes vibrar una inmensa cantidad de Prana en su interior.',
        locationName: mapId === 'dungeon' ? 'Profundidades de Niflheim' : 'Ruinas del Bosque',
        choices: [
          {
            id: 'crypt_open',
            label: 'Desactivar Runas y Abrir',
            sublabel: 'Probabilidad de Equipo Épico o Emboscada de Guardias Ancestrales.',
            type: 'COMBAT',
            icon: 'Lock',
          },
          {
            id: 'crypt_purify',
            label: 'Purificar con Prana',
            sublabel: 'Garantiza botín sin activar las trampas ancestrales.',
            type: 'PURIFY',
            icon: 'Sparkles',
          },
          {
            id: 'crypt_leave',
            label: 'Dejar Cripta Intacta',
            sublabel: 'Preservar la salud de la expedición.',
            type: 'IGNORE',
            icon: 'X',
          },
        ],
      },
      {
        id: `event_${Date.now()}_traveler`,
        type: 'WOUNDED_TRAVELER',
        title: '🩹 Viajero Herido de Midgard 🩹',
        badge: 'DECISIÓN MORAL',
        description: 'Un explorador gravemente herido yace junto al camino. Te pide ayuda desesperadamente a cambio de sus hallazgos.',
        locationName: mapId === 'forest' ? 'Senderos del Bosque' : 'Entrada del Abismo',
        choices: [
          {
            id: 'traveler_heal',
            label: 'Donar Poción de Salud',
            sublabel: 'Cura sus heridas. Te recompensa con una Reliquia Legendaria.',
            type: 'RESOURCE',
            icon: 'Heart',
            requiredItem: 'small_potion',
          },
          {
            id: 'traveler_info',
            label: 'Compartir Raciones y Consejos',
            sublabel: 'Revela la ubicación del Campeón Élite cercano (+XP).',
            type: 'STEALTH',
            icon: 'MapPin',
          },
          {
            id: 'traveler_ignore',
            label: 'Desearle Suerte y Continuar',
            sublabel: 'No puedes gastar tus valiosos consumibles.',
            type: 'IGNORE',
            icon: 'ArrowRight',
          },
        ],
      },
      {
        id: `event_${Date.now()}_elite`,
        type: 'ELITE_CHAMPION_SPAWN',
        title: '☠️ ¡JEFE ÉLITE ERRANTE APARECIDO! ☠️',
        badge: 'AMENAZA SUPREMA',
        description: 'Un Asura Devorador de Prana Élite con aura de fuego ancestral patrulla la zona. Sus golpes son devastadores pero resguarda tesoros únicos.',
        locationName: mapId === 'boss_room' ? 'Salón de Vritra' : 'Campos de Batalla',
        choices: [
          {
            id: 'elite_challenge',
            label: 'Desafiar al Asura Élite',
            sublabel: 'Inicia combate contra el Campeón Élite (Recompensas x4).',
            type: 'COMBAT',
            icon: 'Skull',
          },
          {
            id: 'elite_evade',
            label: 'Evadir mediante Sigilo',
            sublabel: 'Rodea al monstruo usando la sombra del terreno.',
            type: 'STEALTH',
            icon: 'EyeOff',
          },
        ],
      },
    ];

    const selected = events[Math.floor(Math.random() * events.length)];
    this.activeEvent = selected;
    this.notifyUpdate();

    ToastManager.getInstance().show(`📜 HISTORIA DEL MUNDO: ${selected.title}`);
  }

  /**
   * Resolve player decision on an active world event
   */
  public resolveEventChoice(choiceId: string): void {
    if (!this.activeEvent) return;

    const event = this.activeEvent;
    const choice = event.choices.find((c) => c.id === choiceId);
    if (!choice) return;

    const progression = ProgressionManager.getInstance();
    const inventory = InventoryManager.getInstance().getPlayerInventory();
    let outcomeText = '';

    // Check resource requirements
    if (choice.requiredGold && progression.getGold() < choice.requiredGold) {
      ToastManager.getInstance().show(`❌ Necesitas ${choice.requiredGold} Oro para realizar esta acción.`);
      return;
    }

    if (choice.requiredItem) {
      const slotIndex = inventory.getSlots().findIndex(
        (s) => s.instance && s.instance.definitionId === choice.requiredItem
      );
      if (slotIndex < 0) {
        ToastManager.getInstance().show(`❌ No posees el objeto requerido en tu mochila.`);
        return;
      }
      inventory.removeItemAt(slotIndex, 1);
    }

    if (choice.requiredGold) {
      progression.addGold(-choice.requiredGold);
    }

    // Execute choice outcomes
    switch (choice.id) {
      case 'shrine_meditate':
        outcomeText = 'Meditaste en el Santuario Ancestral. Tu Prana resplandece (+30% Salud y +2 BP en batalla).';
        ToastManager.getInstance().show(`✨ ${outcomeText}`);
        progression.addExp(50);
        break;

      case 'shrine_offering':
        outcomeText = 'Entregaste 40 de Oro como tributo a Yggdrasil. Una luz dorada bendijo tus hallazgos.';
        ToastManager.getInstance().show(`💰 ${outcomeText}`);
        progression.addGold(120);
        break;

      case 'merchant_buy_elixir':
        outcomeText = 'Adquiriste un Elixir Vital de alta pureza del Mercader Nómada.';
        ToastManager.getInstance().show(`🧪 ${outcomeText}`);
        // Add potion item instance
        const itemInst = ItemFactory.createInstance('greater_potion', Rarity.EPIC);
        inventory.addItem(itemInst, 1);
        ExpeditionManager.getInstance().recordLoot(itemInst, 1);
        break;

      case 'caravan_defend':
      case 'crypt_open':
      case 'elite_challenge':
        if (!SafeZoneSystem.getInstance().canInitiateBattle()) {
          this.activeEvent = null;
          this.notifyUpdate();
          return;
        }
        outcomeText = `Afrontaste el peligro en combate directo en ${event.locationName}.`;
        ToastManager.getInstance().show(`⚔️ ¡Batalla Iniciada contra el Azote del Mundo!`);
        this.eventBus.emit('battle:start', {
          enemyId: `elite_${Date.now()}`,
          enemyName: 'Asura Devorador de Prana Élite',
          enemyClassId: 'boss_slime',
          lootTableId: 'boss_loot_table',
        });
        break;

      case 'caravan_bribe':
        outcomeText = 'Pagaste el rescate a los asuras. La caravana rescatada te recompensó con gemas y 150 Oro.';
        progression.addGold(150);
        ToastManager.getInstance().show(`💰 ${outcomeText}`);
        break;

      case 'crypt_purify':
        outcomeText = 'Purificaste el cofre ancestral con Prana y obtuviste reliquias sagradas sin sufrir daños.';
        progression.addExp(100);
        progression.addGold(80);
        ToastManager.getInstance().show(`✨ ${outcomeText}`);
        break;

      case 'traveler_heal':
        outcomeText = 'Sanaste al viajero malherido. En agradecimiento te entregó un Amuleto de Prana Legendario.';
        const legendItem = ItemFactory.createInstance('amulet_prana', Rarity.LEGENDARY);
        inventory.addItem(legendItem, 1);
        ExpeditionManager.getInstance().recordLoot(legendItem, 1);
        ToastManager.getInstance().show(`📜 ${outcomeText}`);
        break;

      case 'traveler_info':
      case 'shrine_ignore':
      case 'merchant_stealth_pass':
      case 'caravan_stealth':
      case 'crypt_leave':
      case 'traveler_ignore':
      case 'elite_evade':
        outcomeText = `Empleaste sigilo y destreza táctica para avanzar sin contratiempos por ${event.locationName}.`;
        ToastManager.getInstance().show(`👤 Sigilo con éxito. Evitaste el riesgo.`);
        break;
    }

    // Add entry to Expedition Story Log
    this.addStoryLogEntry(event.title, outcomeText, choice.type === 'COMBAT' ? 'ELITE_BOSS' : 'EVENT');

    // Close event modal
    this.activeEvent = null;
    this.notifyUpdate();
  }

  public addStoryLogEntry(title: string, outcomeText: string, type: 'EVENT' | 'ELITE_BOSS' | 'EXTRACTION' | 'DISCOVERY'): void {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.storyLog.unshift({
      id: `log_${Date.now()}_${Math.random()}`,
      timestamp: timeStr,
      title,
      outcomeText,
      type,
    });
    this.notifyUpdate();
  }

  public dismissActiveEvent(): void {
    this.activeEvent = null;
    this.notifyUpdate();
  }

  private registerEventListeners(): void {
    this.eventBus.on('battle:ended', (data: { result: string }) => {
      if (data.result === 'VICTORY') {
        this.addStoryLogEntry(
          'Victoria en Combate Épico',
          'Derrotaste a las criaturas hostiles que amenazaban la expedición.',
          'ELITE_BOSS'
        );
      }
    });

    this.eventBus.on('expedition:extracted', (summary: any) => {
      this.addStoryLogEntry(
        'Regreso Triunfal al Santuario',
        `Retorno seguro con ${summary.goldBanked} Oro y ${summary.itemsBanked.length} objetos valiosos asegurados.`,
        'EXTRACTION'
      );
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
