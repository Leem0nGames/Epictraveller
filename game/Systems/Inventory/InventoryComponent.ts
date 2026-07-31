import { InventorySlot } from './InventorySlot';
import { ItemInstance } from '../Items/ItemInstance';
import { DatabaseManager } from '../../Database/DatabaseManager';
import { InventoryEvent, InventoryEvents } from './InventoryEvents';
import { Rarity } from '../Items/Rarity';

export class InventoryComponent {
  private slots: InventorySlot[];
  private size: number;

  constructor(size: number = 20) {
    this.size = size;
    this.slots = Array.from({ length: size }, () => ({ instance: null, count: 0 }));
  }

  public getSize(): number {
    return this.size;
  }

  public getSlots(): InventorySlot[] {
    return this.slots;
  }

  public getSlot(index: number): InventorySlot | null {
    if (index < 0 || index >= this.size) return null;
    return this.slots[index];
  }

  /**
   * Adds an item instance to the inventory, stacking where possible.
   * Emits InventoryEvent.ON_ITEM_ADDED and ON_INVENTORY_UPDATED.
   */
  public addItem(instance: ItemInstance, count: number): boolean {
    const definition = DatabaseManager.getInstance().getItemDefinition(instance.definitionId);
    if (!definition) return false;

    let remaining = count;

    // 1. Try to stack if the item is stackable
    if (definition.stackable) {
      for (let i = 0; i < this.size; i++) {
        const slot = this.slots[i];
        if (slot.instance && slot.instance.definitionId === instance.definitionId) {
          const maxStack = definition.maxStack || 99;
          if (slot.count < maxStack) {
            const addCount = Math.min(remaining, maxStack - slot.count);
            slot.count += addCount;
            remaining -= addCount;

            if (remaining <= 0) break;
          }
        }
      }
    }

    // 2. Add remaining count in empty slots
    if (remaining > 0) {
      for (let i = 0; i < this.size; i++) {
        const slot = this.slots[i];
        if (!slot.instance) {
          const maxStack = definition.stackable ? (definition.maxStack || 99) : 1;
          const addCount = Math.min(remaining, maxStack);
          
          // Clone instance for each stack so they have unique state if necessary (or reuse reference)
          slot.instance = { ...instance };
          slot.count = addCount;
          remaining -= addCount;

          if (remaining <= 0) break;
        }
      }
    }

    if (remaining < count) {
      InventoryEvents.emit(InventoryEvent.ON_ITEM_ADDED, { instance, count: count - remaining });
      InventoryEvents.emit(InventoryEvent.ON_INVENTORY_UPDATED);
    }

    if (remaining > 0) {
      InventoryEvents.emit(InventoryEvent.ON_INVENTORY_FULL, { instance, remaining });
      return false; // Could not add full amount
    }

    return true;
  }

  /**
   * Removes an item by index or slot completely/partially.
   */
  public removeItemAt(index: number, count: number): boolean {
    const slot = this.getSlot(index);
    if (!slot || !slot.instance || slot.count < count) return false;

    const removedInstance = { ...slot.instance };
    slot.count -= count;

    if (slot.count <= 0) {
      slot.instance = null;
      slot.count = 0;
    }

    InventoryEvents.emit(InventoryEvent.ON_ITEM_REMOVED, { instance: removedInstance, count });
    InventoryEvents.emit(InventoryEvent.ON_INVENTORY_UPDATED);
    return true;
  }

  /**
   * Removes item by its UUID.
   */
  public removeItemByUuid(uuid: string, count: number): boolean {
    for (let i = 0; i < this.size; i++) {
      const slot = this.slots[i];
      if (slot.instance && slot.instance.uuid === uuid) {
        return this.removeItemAt(i, count);
      }
    }
    return false;
  }

  /**
   * Swaps, splits, or merges slots from and to.
   */
  public moveItem(fromIndex: number, toIndex: number): boolean {
    if (fromIndex < 0 || fromIndex >= this.size || toIndex < 0 || toIndex >= this.size) return false;
    if (fromIndex === toIndex) return true;

    const fromSlot = this.slots[fromIndex];
    const toSlot = this.slots[toIndex];

    if (!fromSlot.instance) return false;

    // Case 1: Destination is empty -> Move entire stack
    if (!toSlot.instance) {
      this.slots[toIndex] = { ...fromSlot };
      this.slots[fromIndex] = { instance: null, count: 0 };
    } 
    // Case 2: Destination has same item and is stackable -> Merge
    else if (fromSlot.instance.definitionId === toSlot.instance.definitionId) {
      const definition = DatabaseManager.getInstance().getItemDefinition(fromSlot.instance.definitionId);
      if (definition && definition.stackable) {
        const maxStack = definition.maxStack || 99;
        const availableSpace = maxStack - toSlot.count;
        if (availableSpace > 0) {
          const moveAmount = Math.min(fromSlot.count, availableSpace);
          toSlot.count += moveAmount;
          fromSlot.count -= moveAmount;

          if (fromSlot.count <= 0) {
            fromSlot.instance = null;
            fromSlot.count = 0;
          }
        } else {
          // If destination stack is full, swap them
          const temp = { ...fromSlot };
          this.slots[fromIndex] = { ...toSlot };
          this.slots[toIndex] = temp;
        }
      } else {
        // If not stackable, swap them
        const temp = { ...fromSlot };
        this.slots[fromIndex] = { ...toSlot };
        this.slots[toIndex] = temp;
      }
    } 
    // Case 3: Different items -> Swap
    else {
      const temp = { ...fromSlot };
      this.slots[fromIndex] = { ...toSlot };
      this.slots[toIndex] = temp;
    }

    InventoryEvents.emit(InventoryEvent.ON_ITEM_MOVED, { fromIndex, toIndex });
    InventoryEvents.emit(InventoryEvent.ON_INVENTORY_UPDATED);
    return true;
  }

  /**
   * Splits a stack into an empty slot.
   */
  public splitStack(fromIndex: number, toIndex: number, amount: number): boolean {
    if (fromIndex < 0 || fromIndex >= this.size || toIndex < 0 || toIndex >= this.size) return false;
    
    const fromSlot = this.slots[fromIndex];
    const toSlot = this.slots[toIndex];

    if (!fromSlot.instance || toSlot.instance || amount <= 0 || fromSlot.count <= amount) {
      return false;
    }

    toSlot.instance = { ...fromSlot.instance, uuid: 'item-' + Math.random().toString(36).substring(2, 15) };
    toSlot.count = amount;
    fromSlot.count -= amount;

    InventoryEvents.emit(InventoryEvent.ON_INVENTORY_UPDATED);
    return true;
  }

  /**
   * Combines two slots with same definition ID.
   */
  public combineStacks(fromIndex: number, toIndex: number): boolean {
    if (fromIndex < 0 || fromIndex >= this.size || toIndex < 0 || toIndex >= this.size) return false;
    
    const fromSlot = this.slots[fromIndex];
    const toSlot = this.slots[toIndex];

    if (!fromSlot.instance || !toSlot.instance || fromSlot.instance.definitionId !== toSlot.instance.definitionId) {
      return false;
    }

    const definition = DatabaseManager.getInstance().getItemDefinition(fromSlot.instance.definitionId);
    if (!definition || !definition.stackable) return false;

    const maxStack = definition.maxStack || 99;
    const canMove = Math.min(fromSlot.count, maxStack - toSlot.count);

    if (canMove > 0) {
      toSlot.count += canMove;
      fromSlot.count -= canMove;
      if (fromSlot.count <= 0) {
        fromSlot.instance = null;
        fromSlot.count = 0;
      }
      InventoryEvents.emit(InventoryEvent.ON_INVENTORY_UPDATED);
      return true;
    }

    return false;
  }

  /**
   * Counts how many of a specific item is in the inventory.
   */
  public getItemCount(definitionId: string): number {
    return this.slots
      .filter((slot) => slot.instance && slot.instance.definitionId === definitionId)
      .reduce((sum, slot) => sum + slot.count, 0);
  }

  /**
   * Check if contains specific item.
   */
  public hasItem(definitionId: string, amount: number = 1): boolean {
    return this.getItemCount(definitionId) >= amount;
  }

  /**
   * Sorts slots based on criteria and consolidates empty slots.
   */
  public sort(criteria: 'name' | 'rarity' | 'level' | 'value' | 'count'): void {
    // 1. Separate items from empty slots
    const activeSlots = this.slots.filter(s => s.instance !== null) as { instance: ItemInstance; count: number }[];
    const emptyCount = this.size - activeSlots.length;

    // Rarity rank helper
    const getRarityRank = (rarity: Rarity): number => {
      const ranks: Record<Rarity, number> = {
        [Rarity.COMMON]: 0,
        [Rarity.UNCOMMON]: 1,
        [Rarity.RARE]: 2,
        [Rarity.EPIC]: 3,
        [Rarity.LEGENDARY]: 4,
        [Rarity.MYTHIC]: 5,
      };
      return ranks[rarity] || 0;
    };

    // Sort items
    activeSlots.sort((a, b) => {
      const defA = DatabaseManager.getInstance().getItemDefinition(a.instance.definitionId);
      const defB = DatabaseManager.getInstance().getItemDefinition(b.instance.definitionId);
      if (!defA || !defB) return 0;

      switch (criteria) {
        case 'name':
          return defA.name.localeCompare(defB.name);
        case 'rarity':
          return getRarityRank(b.instance.rarity) - getRarityRank(a.instance.rarity);
        case 'level':
          return b.instance.level - a.instance.level;
        case 'value':
          return defB.baseValue - defA.baseValue;
        case 'count':
          return b.count - a.count;
        default:
          return 0;
      }
    });

    // Rebuild slots
    this.slots = [
      ...activeSlots,
      ...Array.from({ length: emptyCount }, () => ({ instance: null, count: 0 }))
    ];

    InventoryEvents.emit(InventoryEvent.ON_INVENTORY_UPDATED);
  }

  /**
   * Filters slot indexes by category.
   */
  public filterByCategory(category: string): number[] {
    const indexes: number[] = [];
    for (let i = 0; i < this.size; i++) {
      const slot = this.slots[i];
      if (slot.instance) {
        const def = DatabaseManager.getInstance().getItemDefinition(slot.instance.definitionId);
        if (def && (category === 'ALL' || def.category === category)) {
          indexes.push(i);
        }
      }
    }
    return indexes;
  }

  /**
   * Toggles the locked status of an item at a specific index.
   */
  public toggleLock(index: number): boolean {
    const slot = this.getSlot(index);
    if (!slot || !slot.instance) return false;
    slot.instance.locked = !slot.instance.locked;
    InventoryEvents.emit(InventoryEvent.ON_INVENTORY_UPDATED);
    return true;
  }

  /**
   * Toggles the favorite status of an item at a specific index.
   */
  public toggleFavorite(index: number): boolean {
    const slot = this.getSlot(index);
    if (!slot || !slot.instance) return false;
    slot.instance.favorite = !slot.instance.favorite;
    InventoryEvents.emit(InventoryEvent.ON_INVENTORY_UPDATED);
    return true;
  }
}
