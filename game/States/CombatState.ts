import { BaseGameState, GameStateData } from '../Core/GameState';
import { Game } from '../Core/Game';
import { EventBus } from '../Core/EventBus';

export class CombatState extends BaseGameState {
  public readonly name = 'Combat';

  protected async onEnter(data?: GameStateData): Promise<void> {
    console.log('Entering CombatState', data);
    const game = Game.getInstance();
    if (game && game.scenes) {
      await game.scenes.switchTo('Battle', data);
    }
    EventBus.getInstance().emit('ui:combat:entered', data);
  }

  protected onUpdate(deltaTime: number): void {
    // Combat state tick logic
  }

  protected async onExit(): Promise<void> {
    console.log('Exiting CombatState');
    EventBus.getInstance().emit('ui:combat:exited');
  }

  protected onPause(): void {
    EventBus.getInstance().emit('ui:combat:paused');
  }

  protected onResume(): void {
    EventBus.getInstance().emit('ui:combat:resumed');
  }
}
