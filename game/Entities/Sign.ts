import { Interactable } from './Interactable';
import { EventBus } from '../Core/EventBus';
import { AssetLoader } from '../Systems/AssetLoader';

export class Sign extends Interactable {
  private dialogueId: string;

  constructor(id: string, assetLoader: AssetLoader, dialogueId: string) {
    super(id, 'SIGN', assetLoader);
    this.dialogueId = dialogueId;
  }

  public onInteract(): void {
    EventBus.getInstance().emit('dialogue:trigger', {
      dialogueId: this.dialogueId,
      speaker: 'Cartel',
      npcId: this.id,
    });
  }

  protected getPromptText(): string {
    return 'Leer Cartel';
  }
}
