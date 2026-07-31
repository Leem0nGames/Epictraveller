import { BaseGameState, GameStateData } from '../Core/GameState';
import { EventBus } from '../Core/EventBus';

export class GameOverState extends BaseGameState {
  public readonly name = 'GameOver';

  protected async onEnter(data?: GameStateData): Promise<void> {
    console.log('Entering GameOverState', data);
    EventBus.getInstance().emit('ui:game_over:opened', data);
  }

  protected onUpdate(deltaTime: number): void {
    // Game over screen updates
  }

  protected async onExit(): Promise<void> {
    console.log('Exiting GameOverState');
    EventBus.getInstance().emit('ui:game_over:closed');
  }
}
