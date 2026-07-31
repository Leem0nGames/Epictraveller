import { ItemInstance } from './ItemInstance';

export interface OnItemCreatedEvent {
  item: ItemInstance;
}

export interface OnItemDestroyedEvent {
  uuid: string;
}

export interface OnItemModifiedEvent {
  item: ItemInstance;
}
