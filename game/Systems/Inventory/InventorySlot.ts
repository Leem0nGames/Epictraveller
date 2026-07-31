import { ItemInstance } from '../Items/ItemInstance';

export interface InventorySlot {
  instance: ItemInstance | null;
  count: number;
}
