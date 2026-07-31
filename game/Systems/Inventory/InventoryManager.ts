import { InventoryComponent } from './InventoryComponent';
import { InventoryEvents, InventoryEvent } from './InventoryEvents';
import { ItemInstance } from '../Items/ItemInstance';
import { ItemFactory } from '../Items/ItemFactory';
import { ItemCategory } from '../Items/ItemCategory';
import { DatabaseManager } from '../../Database/DatabaseManager';
import { ToastManager } from '../ToastManager';
import { EquipmentSlot } from '../Equipment/EquipmentSlot';
import { EquipmentFactory } from '../Equipment/EquipmentFactory';
import { EquipmentManager as PrimaryEquipmentManager } from '../Equipment/EquipmentManager';
import { EquipmentComponent } from '../Equipment/EquipmentComponent';
import { StatsComponent } from '../Stats/StatsComponent';
import { ProgressionManager } from '../Progression/ProgressionManager';
import { EventBus } from '../../Core/EventBus';
import { LootManager } from '../Loot/LootManager';
import { ExpeditionManager } from '../Expedition/ExpeditionManager';

export class InventoryManager {
  private static instance: InventoryManager;
  
  private playerInventory: InventoryComponent;
  private playerEquipment: EquipmentComponent;
  private playerStats: StatsComponent;
  private primaryEquipmentManager: PrimaryEquipmentManager;
  private isInventoryOpen: boolean = false;

  private constructor() {
    this.playerInventory = new InventoryComponent(30); // 30 slots by default, configurable
    this.playerEquipment = new EquipmentComponent();
    this.playerStats = new StatsComponent();
    
    // Register default stats for the player
    this.playerStats.registerStat('attack', 15);
    this.playerStats.registerStat('defense', 10);
    this.playerStats.registerStat('magicAttack', 12);
    this.playerStats.registerStat('magicDefense', 8);
    this.playerStats.registerStat('maxHp', 100);
    this.playerStats.registerStat('maxMp', 50);
    this.playerStats.registerStat('speed', 10);
    this.playerStats.registerStat('critChance', 8); // 8% base critical rate
    this.playerStats.registerStat('critMultiplier', 1.5); // 1.5x base crit damage
    this.playerStats.registerStat('manaRegen', 2);
    this.playerStats.registerStat('elementalResist', 0);
    this.playerStats.registerStat('breakPower', 1);

    this.primaryEquipmentManager = new PrimaryEquipmentManager();
    this.registerEventHandlers();
  }

  public static getInstance(): InventoryManager {
    if (!InventoryManager.instance) {
      InventoryManager.instance = new InventoryManager();
    }
    return InventoryManager.instance;
  }

  /**
   * Retrieves the player's active EquipmentComponent.
   */
  public getPlayerEquipment(): EquipmentComponent {
    return this.playerEquipment;
  }

  /**
   * Retrieves the player's active StatsComponent.
   */
  public getPlayerStats(): StatsComponent {
    return this.playerStats;
  }

  /**
   * Retrieves the main player inventory component.
   */
  public getPlayerInventory(): InventoryComponent {
    return this.playerInventory;
  }

  /**
   * Helper to set a new/restored player inventory component.
   */
  public setPlayerInventory(inventory: InventoryComponent): void {
    this.playerInventory = inventory;
    InventoryEvents.emit(InventoryEvent.ON_INVENTORY_UPDATED);
  }

  /**
   * Returns whether the inventory UI is open.
   */
  public isOpen(): boolean {
    return this.isInventoryOpen;
  }

  /**
   * Opens the inventory.
   */
  public openInventory(): void {
    this.isInventoryOpen = true;
    InventoryEvents.emit(InventoryEvent.ON_INVENTORY_OPENED);
  }

  /**
   * Closes the inventory.
   */
  public closeInventory(): void {
    this.isInventoryOpen = false;
    InventoryEvents.emit(InventoryEvent.ON_INVENTORY_CLOSED);
  }

  /**
   * Toggles the inventory visibility.
   */
  public toggleInventory(): void {
    if (this.isInventoryOpen) {
      this.closeInventory();
    } else {
      this.openInventory();
    }
  }

  /**
   * Uses a consumable item from the inventory slot.
   */
  public useItemFromInventory(slotIndex: number): boolean {
    const slot = this.playerInventory.getSlot(slotIndex);
    if (!slot || !slot.instance) return false;

    const def = DatabaseManager.getInstance().getItemDefinition(slot.instance.definitionId);
    if (!def) return false;

    const isConsumable =
      def.category === ItemCategory.CONSUMABLE ||
      def.id.includes('potion') ||
      def.id.includes('elixir');

    if (!isConsumable) {
      ToastManager.getInstance().show(`${def.name} no se puede consumir.`);
      return false;
    }

    let healAmount = 0;
    let manaAmount = 0;

    if (def.id === 'small_potion') healAmount = 50;
    else if (def.id === 'greater_potion') healAmount = 120;
    else if (def.id === 'mana_elixir') manaAmount = 40;
    else healAmount = 40;

    if (healAmount > 0) {
      EventBus.getInstance().emit('hero:heal', { amount: healAmount });
      ToastManager.getInstance().show(`🧪 Usado ${def.name}: +${healAmount} HP curados.`);
      EventBus.getInstance().emit('loot:floating', {
        type: 'EXP',
        title: `+${healAmount} HP`,
        subtitle: 'Salud Restaurada',
      });
    }

    if (manaAmount > 0) {
      EventBus.getInstance().emit('hero:restore_mp', { amount: manaAmount });
      ToastManager.getInstance().show(`💧 Usado ${def.name}: +${manaAmount} MP restaurados.`);
      EventBus.getInstance().emit('loot:floating', {
        type: 'GEM',
        title: `+${manaAmount} MP`,
        subtitle: 'Maná Restaurado',
      });
    }

    this.playerInventory.removeItemAt(slotIndex, 1);
    InventoryEvents.emit(InventoryEvent.ON_INVENTORY_UPDATED);
    return true;
  }

  /**
   * Sells an item from the inventory slot for gold.
   */
  public sellItemFromInventory(slotIndex: number, amount: number = 1): boolean {
    const slot = this.playerInventory.getSlot(slotIndex);
    if (!slot || !slot.instance) return false;

    if (slot.instance.locked) {
      ToastManager.getInstance().show('El objeto está bloqueado y no se puede vender.');
      return false;
    }

    const def = DatabaseManager.getInstance().getItemDefinition(slot.instance.definitionId);
    if (!def) return false;

    const sellPrice = Math.max(1, Math.floor((def.baseValue || 15) * 0.75)) * amount;
    this.playerInventory.removeItemAt(slotIndex, amount);
    ProgressionManager.getInstance().addGold(sellPrice);

    ToastManager.getInstance().show(`💰 Vendido ${def.name} x${amount} por +${sellPrice} ORO.`);
    InventoryEvents.emit(InventoryEvent.ON_INVENTORY_UPDATED);
    return true;
  }

  /**
   * Generates loot from a LootTable and automatically adds it to the player's inventory,
   * showing toast notifications for each item received and returning the reward list.
   */
  public rewardLoot(tableId: string, luck: number = 0, context?: any): Array<{
    instance: ItemInstance;
    count: number;
    added: boolean;
    name: string;
    rarity: string;
    definitionId: string;
    category?: string;
    description?: string;
    equipmentSlot?: string;
  }> {
    const rewards = LootManager.getInstance().rollLoot(tableId, luck, context);
    const resultList: Array<any> = [];

    if (rewards.length === 0) {
      ToastManager.getInstance().show('No se encontraron recompensas.');
      return resultList;
    }

    rewards.forEach((reward: any) => {
      const added = this.playerInventory.addItem(reward.instance, reward.count);
      const itemDef = DatabaseManager.getInstance().getItemDefinition(reward.instance.definitionId);
      const name = itemDef ? itemDef.name : reward.instance.definitionId;

      if (added) {
        ToastManager.getInstance().show(`¡Recogido! ${name} (${reward.instance.rarity}) x${reward.count}`);
        ExpeditionManager.getInstance().recordLoot(reward.instance, reward.count);
      } else {
        ToastManager.getInstance().show(`¡Inventario lleno! No se pudo guardar ${name} x${reward.count}`);
      }

      resultList.push({
        instance: reward.instance,
        count: reward.count,
        added,
        name,
        rarity: reward.instance.rarity,
        definitionId: reward.instance.definitionId,
        category: itemDef?.category,
        description: itemDef?.description,
        equipmentSlot: itemDef?.equipmentSlot,
      });
    });

    return resultList;
  }

  /**
   * Transition function that implements:
   * Inventory -> EquipmentManager -> StatsComponent
   * 
   * Equips an item from the given inventory slot to the EquipmentComponent, applying stat changes.
   * If there is an item already equipped in that slot, it gets returned to the inventory.
   */
  public equipItemFromInventory(
    slotIndex: number,
    equipmentComponent: EquipmentComponent,
    statsComponent: StatsComponent
  ): boolean {
    const slot = this.playerInventory.getSlot(slotIndex);
    if (!slot || !slot.instance) return false;

    const instance = slot.instance;
    const def = DatabaseManager.getInstance().getItemDefinition(instance.definitionId);
    if (!def) return false;

    // Check if item is indeed an equippable category
    if (!def.equipmentSlot) {
      ToastManager.getInstance().show(`${def.name} no es equipable.`);
      return false;
    }

    const eqSlot = def.equipmentSlot as EquipmentSlot;

    try {
      // 1. Fetch equipment definition from database
      const eqDef = EquipmentFactory.createEquipment(instance.definitionId);
      
      // 2. Identify currently equipped item in that slot to swap back to inventory
      const existingEquippedDef = equipmentComponent.getEquippedItem(eqSlot);
      
      // 3. Perform the actual equipment and update stats via the primary EquipmentManager
      this.primaryEquipmentManager.equip(equipmentComponent, eqDef, statsComponent);

      // 4. Update player's inventory slot
      if (existingEquippedDef) {
        // Swap: replace the slot with the unequipped item as an ItemInstance
        const unequippedInstance = ItemFactory.createInstance(existingEquippedDef.id, existingEquippedDef.rarity as any);
        slot.instance = unequippedInstance;
        slot.count = 1;
        ToastManager.getInstance().show(`Equipado: ${def.name}. Desequipado: ${existingEquippedDef.name}`);
      } else {
        // No item was equipped: simply clear the inventory slot
        slot.instance = null;
        slot.count = 0;
        ToastManager.getInstance().show(`Equipado: ${def.name}`);
      }

      InventoryEvents.emit(InventoryEvent.ON_INVENTORY_UPDATED);
      return true;
    } catch (error) {
      console.error('InventoryManager: Failed to equip item:', error);
      ToastManager.getInstance().show(`No se pudo equipar ${def.name}.`);
      return false;
    }
  }

  /**
   * Unequips an item from an EquipmentSlot and returns it to the player's inventory.
   */
  public unequipItemToInventory(
    eqSlot: EquipmentSlot,
    equipmentComponent: EquipmentComponent,
    statsComponent: StatsComponent
  ): boolean {
    const equippedDef = equipmentComponent.getEquippedItem(eqSlot);
    if (!equippedDef) return false;

    // 1. Check if inventory has space for the returned item
    const unequippedInstance = ItemFactory.createInstance(equippedDef.id, equippedDef.rarity as any);
    
    // Simulate adding to check if we have space
    const hasSpace = this.playerInventory.getSlots().some(slot => !slot.instance);
    if (!hasSpace) {
      ToastManager.getInstance().show('¡Inventario lleno! No puedes desequipar este objeto.');
      return false;
    }

    // 2. Perform the unequip using primary EquipmentManager to remove stats modifiers
    this.primaryEquipmentManager.unequip(equipmentComponent, eqSlot, statsComponent);

    // 3. Add to player inventory
    this.playerInventory.addItem(unequippedInstance, 1);
    ToastManager.getInstance().show(`Desequipado: ${equippedDef.name}`);

    InventoryEvents.emit(InventoryEvent.ON_INVENTORY_UPDATED);
    return true;
  }

  /**
   * Registers automatic internal event handling.
   */
  private registerEventHandlers(): void {
    // Listen to inventory update to trigger global updates
    EventBus.getInstance().on('inventory:updated', () => {
      InventoryEvents.emit(InventoryEvent.ON_INVENTORY_UPDATED);
    });
  }
}
