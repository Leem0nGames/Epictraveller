import { EquipmentSlot } from './EquipmentSlot';
import { EquipmentDefinition } from './EquipmentDefinition';

export class EquipmentComponent {
  private equippedItems: Map<EquipmentSlot, EquipmentDefinition | null> = new Map();

  constructor() {
    // Inicializar slots vacíos
    Object.values(EquipmentSlot).forEach(slot => this.equippedItems.set(slot, null));
  }

  public getEquippedItem(slot: EquipmentSlot): EquipmentDefinition | null {
    return this.equippedItems.get(slot) || null;
  }

  public setEquippedItem(slot: EquipmentSlot, item: EquipmentDefinition | null): void {
    this.equippedItems.set(slot, item);
  }
  
  public getAllEquippedItems(): Map<EquipmentSlot, EquipmentDefinition | null> {
    return this.equippedItems;
  }
}
