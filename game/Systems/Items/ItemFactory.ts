import { ItemDefinition } from './ItemDefinition';
import { ItemInstance } from './ItemInstance';
import { Rarity } from './Rarity';
import { ItemCategory } from './ItemCategory';
import { DatabaseManager } from '../../Database/DatabaseManager';

export class ItemFactory {
  public static createInstance(definitionId: string, rarity: Rarity = Rarity.COMMON): ItemInstance {
    let definition = DatabaseManager.getInstance().getItemDefinition(definitionId);
    if (!definition) {
      console.warn(`ItemDefinition "${definitionId}" not found in DatabaseManager. Using fallback definition.`);
      definition = {
        id: definitionId,
        name: definitionId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: 'Objeto de aventura.',
        icon: 'item.png',
        category: ItemCategory.CONSUMABLE,
        stackable: true,
        maxStack: 99,
        baseValue: 10,
        sprite: '',
        rarityPool: ['common'],
      };
    }

    const instance: ItemInstance = {
      uuid: (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : 'item-' + Math.random().toString(36).substring(2, 15) + '-' + Math.random().toString(36).substring(2, 15),
      definitionId: definition.id,
      rarity: rarity,
      modifiers: [], // Lógica de generación de afijos basada en rareza iría aquí
      durability: 100, // Debería venir de la definición
      level: 1,
      seed: Math.floor(Math.random() * 1000000),
      locked: false,
      favorite: false,
    };

    return instance;
  }
}
