import { Interactable } from './Interactable';
import { EventBus } from '../Core/EventBus';
import { AssetLoader } from '../Systems/AssetLoader';

export class Chest extends Interactable {
  constructor(id: string, assetLoader: AssetLoader) {
    super(id, 'CHEST', assetLoader);
  }

  public onInteract(): void {
    if (!this.isTriggered) {
      this.isTriggered = true;
      
      // Rotate the lid
      const lid = this.container.children[1];
      if (lid) {
        lid.rotation.y = -Math.PI / 3;
      }

      EventBus.getInstance().emit('interaction:chest_opened', { id: this.id });
      
      EventBus.getInstance().emit('dialogue:trigger', {
        dialogueId: 'chest_opened',
        speaker: 'Cofre',
        npcId: this.id,
      });
    } else {
      EventBus.getInstance().emit('dialogue:trigger', {
        dialogueId: 'chest_empty',
        speaker: 'Cofre',
        npcId: this.id,
      });
    }
  }

  protected getPromptText(): string {
    return this.isTriggered ? 'Ver Cofre' : 'Abrir Cofre';
  }
}
