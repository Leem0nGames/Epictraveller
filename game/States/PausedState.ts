import { BaseGameState, GameStateData } from '../Core/GameState';
import { EventBus } from '../Core/EventBus';

export class PausedState extends BaseGameState {
  public readonly name = 'Paused';

  protected async onEnter(data?: GameStateData): Promise<void> {
    console.log('Entering PausedState');
    EventBus.getInstance().emit('ui:pause_overlay:opened', data);
  }

  protected onUpdate(deltaTime: number): void {
    // Paused UI/camera update tick
  }

  protected async onExit(): Promise<void> {
    console.log('Exiting PausedState');
    EventBus.getInstance().emit('ui:pause_overlay:closed');
  }
}
