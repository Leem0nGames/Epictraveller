import { EventBus } from '../../Core/EventBus';
import { ItemInstance } from '../Items/ItemInstance';

export enum InventoryEvent {
  ON_ITEM_ADDED = 'ON_ITEM_ADDED',
  ON_ITEM_REMOVED = 'ON_ITEM_REMOVED',
  ON_ITEM_MOVED = 'ON_ITEM_MOVED',
  ON_INVENTORY_FULL = 'ON_INVENTORY_FULL',
  ON_INVENTORY_OPENED = 'ON_INVENTORY_OPENED',
  ON_INVENTORY_CLOSED = 'ON_INVENTORY_CLOSED',
  ON_INVENTORY_UPDATED = 'ON_INVENTORY_UPDATED',
}

export class InventoryEvents {
  public static emit(event: InventoryEvent, ...args: any[]): void {
    EventBus.getInstance().emit(event, ...args);
  }

  public static subscribe(event: InventoryEvent, callback: (...args: any[]) => void): void {
    EventBus.getInstance().on(event, callback);
  }

  public static unsubscribe(event: InventoryEvent, callback: (...args: any[]) => void): void {
    EventBus.getInstance().off(event, callback);
  }
}
