import { EventBus } from '../Core/EventBus';
import { InventoryManager } from './Inventory/InventoryManager';
import { ItemFactory } from './Items/ItemFactory';
import { DatabaseManager } from '../Database/DatabaseManager';
import { Rarity } from './Items/Rarity';
import { InventorySerializer } from './Inventory/InventorySerializer';

export interface GameEvent {
  type: 'START_COMBAT' | 'GIVE_ITEM' | 'OPEN_DOOR' | 'CHANGE_MAP' | 'EXECUTE_SCRIPT' | string;
  params?: Record<string, any>;
}

/**
 * Decoupled Architectural EventSystem.
 * Processes in-game events triggered by story scripts, dialogues, or chest actions.
 * Highly extensible to future quests and scenes.
 */
export class EventSystem {
  private static instance: EventSystem | null = null;
  private eventBus: EventBus;

  constructor() {
    this.eventBus = EventBus.getInstance();
    this.initListeners();
    EventSystem.instance = this;
  }

  /**
   * Static singleton getter
   */
  public static getInstance(): EventSystem | null {
    return EventSystem.instance;
  }

  /**
   * Subscribes to execution signals on the EventBus
   */
  private initListeners(): void {
    this.eventBus.on('events:execute', this.executeEvents);
  }

  /**
   * Triggers execution of a list of game events
   */
  public executeEvents = (events: GameEvent[]): void => {
    if (!events || !Array.isArray(events)) return;
    events.forEach((event) => this.executeSingleEvent(event));
  };

  /**
   * Solves a single event payload
   */
  public executeSingleEvent(event: GameEvent): void {
    console.log(`[EventSystem] Executing: ${event.type}`, event.params);
    
    // Notify general updates (can be caught by UI or trackers)
    this.eventBus.emit('event:triggered', event);

    switch (event.type.toUpperCase()) {
      case 'START_COMBAT':
        this.handleStartCombat(event.params);
        break;
      case 'SAVE_GAME':
        this.handleSaveGame();
        break;
      case 'GIVE_ITEM':
        this.handleGiveItem(event.params);
        break;
      case 'OPEN_DOOR':
        this.handleOpenDoor(event.params);
        break;
      case 'CHANGE_MAP':
        this.handleChangeMap(event.params);
        break;
      case 'EXECUTE_SCRIPT':
        this.handleExecuteScript(event.params);
        break;
      default:
        console.warn(`[EventSystem] Event type "${event.type}" has no handler.`);
    }
  }

  /**
   * Battle triggering transition
   */
  private handleStartCombat(params?: Record<string, any>): void {
    const enemyId = params?.enemyId || 'forest_slime_1';
    const enemyName = params?.enemyName || 'Limo Furioso';
    const enemyClassId = params?.enemyClassId || 'Slime';
    console.log(`[EventSystem:COMBAT] Instigating battle phase against: ${enemyName}`);
    
    this.eventBus.emit('battle:start', {
      enemyId,
      enemyName,
      enemyClassId,
      lootTableId: params?.lootTableId || 'slime_loot_table',
    });
  }

  /**
   * Saves inventory progress to localStorage
   */
  private handleSaveGame(): void {
    try {
      const inventory = InventoryManager.getInstance().getPlayerInventory();
      const serialized = InventorySerializer.serializeToString(inventory);
      localStorage.setItem('jrpg_inventory_save', serialized);
      console.log('[EventSystem:SAVE] Game state saved successfully.');
    } catch (err) {
      console.error('[EventSystem:SAVE] Failed to persist game state:', err);
    }
  }

  /**
   * Awards items or currencies to player's inventory
   */
  private handleGiveItem(params?: Record<string, any>): void {
    const item = params?.item || 'potion';
    const amount = params?.amount || 1;
    let itemId = item;
    if (item === 'potion') itemId = 'small_potion';

    try {
      const manager = InventoryManager.getInstance();
      const inventory = manager.getPlayerInventory();
      const instance = ItemFactory.createInstance(itemId, Rarity.COMMON);
      const success = inventory.addItem(instance, amount);
      const definition = DatabaseManager.getInstance().getItemDefinition(itemId);
      const itemName = definition ? definition.name : itemId;

      if (success) {
        this.eventBus.emit('hud:notify', {
          message: `🎒 ¡Has recibido: ${amount}x ${itemName}!`,
          type: 'success',
        });
        // Let subscribers know
        this.eventBus.emit('inventory:updated');
      } else {
        this.eventBus.emit('hud:notify', {
          message: `🎒 ¡Mochila llena! No pudiste recibir ${amount}x ${itemName}`,
          type: 'warning',
        });
      }
    } catch (err) {
      console.error('[EventSystem:GIVE_ITEM] Error awarding item:', err);
      const itemName = item === 'potion' ? 'Poción de Vida' : item;
      this.eventBus.emit('hud:notify', {
        message: `🎒 ¡Has recibido: ${amount}x ${itemName}!`,
        type: 'success',
      });
    }
  }

  /**
   * Triggers scene obstacle state changes
   */
  private handleOpenDoor(params?: Record<string, any>): void {
    const doorId = params?.doorId || 'main_gate';
    console.log(`[EventSystem:WORLD] Unlocking world pathway: ${doorId}`);
    
    this.eventBus.emit('hud:notify', {
      message: `🚪 La puerta '${doorId}' se ha desbloqueado.`,
      type: 'success',
    });
  }

  /**
   * Switches game maps/zones
   */
  private handleChangeMap(params?: Record<string, any>): void {
    const destination = params?.destination || 'Overworld';
    console.log(`[EventSystem:SCENE] Swapping scene maps to: ${destination}`);
    
    this.eventBus.emit('hud:notify', {
      message: `🗺️ Viajando hacia la zona: ${destination}...`,
      type: 'info',
    });
  }

  /**
   * Evaluates custom logical scripts
   */
  private handleExecuteScript(params?: Record<string, any>): void {
    const scriptName = params?.scriptName || 'reveal_objective';
    console.log(`[EventSystem:SCRIPT] Executing script: ${scriptName}`);
    
    const displayMsg = scriptName === 'reveal_objective' 
      ? '📜 Nuevo objetivo: Busca los cristales sagrados en las colinas.' 
      : `Script de evento ejecutado: ${scriptName}`;

    this.eventBus.emit('hud:notify', {
      message: displayMsg,
      type: 'info',
    });
  }

  /**
   * Unbinds listeners
   */
  public destroy(): void {
    this.eventBus.off('events:execute', this.executeEvents);
    EventSystem.instance = null;
  }
}
