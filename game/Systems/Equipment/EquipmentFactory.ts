import { DatabaseManager } from '../../Database/DatabaseManager';
import { EquipmentDefinition } from './EquipmentDefinition';

export class EquipmentFactory {
  public static createEquipment(id: string): EquipmentDefinition {
    const data = DatabaseManager.getInstance().getEquipment(id);
    if (!data) {
      throw new Error(`Equipment with id ${id} not found in database.`);
    }
    return data as EquipmentDefinition;
  }
}
