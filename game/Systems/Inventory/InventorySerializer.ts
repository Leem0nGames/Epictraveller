import { InventoryComponent } from './InventoryComponent';
import { InventorySlot } from './InventorySlot';
import { ItemInstance } from '../Items/ItemInstance';

export interface SerializedSlot {
  instance: ItemInstance | null;
  count: number;
}

export interface SerializedInventory {
  size: number;
  slots: SerializedSlot[];
}

export class InventorySerializer {
  /**
   * Serializes an InventoryComponent into a lightweight JSON structure.
   */
  public static serialize(inventory: InventoryComponent): SerializedInventory {
    const slots = inventory.getSlots().map(slot => ({
      instance: slot.instance ? { ...slot.instance } : null,
      count: slot.count,
    }));

    return {
      size: inventory.getSize(),
      slots,
    };
  }

  /**
   * Serializes an InventoryComponent directly to a JSON string.
   */
  public static serializeToString(inventory: InventoryComponent): string {
    return JSON.stringify(this.serialize(inventory));
  }

  /**
   * Deserializes a SerializedInventory data structure into an existing or new InventoryComponent.
   */
  public static deserialize(data: SerializedInventory, targetInventory?: InventoryComponent): InventoryComponent {
    const size = data.size || 20;
    const inventory = targetInventory || new InventoryComponent(size);

    // Ensure size is synced or cleared
    const slots = inventory.getSlots();
    slots.length = 0; // Empty active slots array

    for (let i = 0; i < size; i++) {
      const savedSlot = data.slots[i];
      if (savedSlot && savedSlot.instance) {
        slots.push({
          instance: { ...savedSlot.instance },
          count: savedSlot.count,
        });
      } else {
        slots.push({ instance: null, count: 0 });
      }
    }

    return inventory;
  }

  /**
   * Deserializes a JSON string into an InventoryComponent.
   */
  public static deserializeFromString(jsonStr: string, targetInventory?: InventoryComponent): InventoryComponent | null {
    try {
      const data = JSON.parse(jsonStr) as SerializedInventory;
      if (!data || !Array.isArray(data.slots)) return null;
      return this.deserialize(data, targetInventory);
    } catch (e) {
      console.error('InventorySerializer: Failed to deserialize inventory string:', e);
      return null;
    }
  }
}
