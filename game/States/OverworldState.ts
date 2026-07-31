import { BaseGameState, GameStateData } from '../Core/GameState';
import { Game } from '../Core/Game';
import { EventBus } from '../Core/EventBus';

export class OverworldState extends BaseGameState {
  public readonly name = 'Overworld';

  protected async onEnter(data?: GameStateData): Promise<void> {
    console.log('Entering OverworldState', data);
    const game = Game.getInstance();
    if (game && game.scenes) {
      if (game.scenes.current?.constructor.name !== 'OverworldScene') {
        await game.scenes.switchTo('Overworld', data);
      }
    }
    EventBus.getInstance().emit('ui:overworld:entered', data);
  }

  protected onUpdate(deltaTime: number): void {
    // Overworld specific state updates if required
  }

  protected async onExit(): Promise<void> {
    console.log('Exiting OverworldState');
    EventBus.getInstance().emit('ui:overworld:exited');
  }

  protected onPause(): void {
    console.log('OverworldState Paused');
    EventBus.getInstance().emit('ui:overworld:paused');
  }

  protected onResume(): void {
    console.log('OverworldState Resumed');
    EventBus.getInstance().emit('ui:overworld:resumed');
  }
}
