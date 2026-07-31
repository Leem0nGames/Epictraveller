import { EventEmitter } from 'events';
import { ItemInstance } from './ItemInstance';
import { OnItemCreatedEvent, OnItemDestroyedEvent, OnItemModifiedEvent } from './ItemEvents';
import { ItemFactory } from './ItemFactory';

export class ItemManager {
  private static instance: ItemManager | null = null;
  private instances = new Map<string, ItemInstance>();
  private events = new EventEmitter();

  private constructor() {}

  public static getInstance(): ItemManager {
    if (!ItemManager.instance) {
      ItemManager.instance = new ItemManager();
    }
    return ItemManager.instance;
  }

  public createItem(definitionId: string, rarity: any): ItemInstance {
    const item = ItemFactory.createInstance(definitionId, rarity);
    
    this.instances.set(item.uuid, item);
    this.events.emit('onItemCreated', { item } as OnItemCreatedEvent);
    return item;
  }

  public getItem(uuid: string): ItemInstance | undefined {
    return this.instances.get(uuid);
  }

  public getAllInstances(): ItemInstance[] {
    return Array.from(this.instances.values());
  }

  public destroyItem(uuid: string): void {
    if (this.instances.has(uuid)) {
      this.instances.delete(uuid);
      this.events.emit('onItemDestroyed', { uuid } as OnItemDestroyedEvent);
    }
  }

  public updateItem(item: ItemInstance): void {
    if (this.instances.has(item.uuid)) {
      this.instances.set(item.uuid, item);
      this.events.emit('onItemModified', { item } as OnItemModifiedEvent);
    }
  }

  public subscribe(event: 'onItemCreated' | 'onItemDestroyed' | 'onItemModified', callback: (data: any) => void): void {
    this.events.on(event, callback);
  }

  public unsubscribe(event: 'onItemCreated' | 'onItemDestroyed' | 'onItemModified', callback: (data: any) => void): void {
    this.events.off(event, callback);
  }
}
