import { Interactable } from './Interactable';
import { AssetLoader } from '../Systems/AssetLoader';
import { LootSystem } from '../Systems/LootSystem';
import { ToastManager } from '../Systems/ToastManager';

export class PickupItem extends Interactable {
  public itemId: string;
  public count: number;

  constructor(id: string, itemId: string, count: number, x: number, y: number, z: number, assetLoader: AssetLoader) {
    // Usamos 'PICKUP' como tipo para la interacción
    super(id, 'PICKUP', assetLoader, 'Recoger');
    this.itemId = itemId;
    this.count = count;
    this.position.set(x, y, z);
  }

  public override onInteract(): void {
    const success = LootSystem.pickUp(this);
    if (success) {
      ToastManager.getInstance().show(`Recogido: ${this.count}x ${this.itemId}`);
      this.destroy(); // Eliminar entidad del mundo
    }
  }
}
