import { PickupItem } from '../Entities/PickupItem';
import { InventoryManager } from './Inventory/InventoryManager';
import { ItemFactory } from './Items/ItemFactory';

export class LootSystem {
  public static pickUp(item: PickupItem): boolean {
    try {
      const instance = ItemFactory.createInstance(item.itemId);
      const success = InventoryManager.getInstance().getPlayerInventory().addItem(instance, item.count);
      if (success) {
        console.log(`Picked up ${item.count}x ${item.itemId}`);
        return true;
      }
    } catch (e) {
      console.error('LootSystem: failed to pick up item:', e);
    }
    return false;
  }
}
