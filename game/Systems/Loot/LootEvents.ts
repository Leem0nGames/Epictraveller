import { EventBus } from '../../Core/EventBus';

export enum LootEvent {
  ON_LOOT_ROLL_START = 'ON_LOOT_ROLL_START',
  ON_LOOT_ROLL_COMPLETE = 'ON_LOOT_ROLL_COMPLETE',
  ON_LOOT_POOL_ROLL = 'ON_LOOT_POOL_ROLL',
  ON_LOOT_ENTRY_SELECTED = 'ON_LOOT_ENTRY_SELECTED',
}

export class LootEvents {
  public static emit(event: LootEvent, ...args: any[]): void {
    EventBus.getInstance().emit(event, ...args);
  }

  public static subscribe(event: LootEvent, callback: (...args: any[]) => void): void {
    EventBus.getInstance().on(event, callback);
  }

  public static unsubscribe(event: LootEvent, callback: (...args: any[]) => void): void {
    EventBus.getInstance().off(event, callback);
  }
}
