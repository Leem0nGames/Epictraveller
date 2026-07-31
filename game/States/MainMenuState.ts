import { BaseGameState, GameStateData } from '../Core/GameState';
import { EventBus } from '../Core/EventBus';

export class MainMenuState extends BaseGameState {
  public readonly name = 'MainMenu';

  protected async onEnter(data?: GameStateData): Promise<void> {
    console.log('Entering MainMenuState');
    EventBus.getInstance().emit('ui:main_menu:opened', data);
  }

  protected onUpdate(deltaTime: number): void {
    // Menu logic or background animations tick
  }

  protected async onExit(): Promise<void> {
    console.log('Exiting MainMenuState');
    EventBus.getInstance().emit('ui:main_menu:closed');
  }
}
