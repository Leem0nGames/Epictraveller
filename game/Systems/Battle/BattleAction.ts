import { BattleEntity } from './BattleEntity';

export type ActionType = 'ATTACK' | 'DEFEND' | 'ITEM' | 'SKILL' | 'ESCAPE';

export interface BattleAction {
  type: ActionType;
  actorId: string;
  targetId?: string;
  itemId?: string;
  skillId?: string;
}
