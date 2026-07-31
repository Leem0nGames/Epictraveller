import { Interactable } from './Interactable';
import { EventBus } from '../Core/EventBus';
import { AssetLoader } from '../Systems/AssetLoader';

export class Door extends Interactable {
  private destination: string;

  constructor(id: string, assetLoader: AssetLoader, destination: string) {
    super(id, 'DOOR', assetLoader);
    this.destination = destination;
  }

  public onInteract(): void {
    EventBus.getInstance().emit('hud:dialog', {
      sender: 'Puerta',
      text: `¿Quieres ir a ${this.destination}?`,
      id: this.id,
    });
  }

  protected getPromptText(): string {
    return 'Abrir Puerta';
  }
}
