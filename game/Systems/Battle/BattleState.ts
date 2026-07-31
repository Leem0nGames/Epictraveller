import { BattleEntity } from './BattleEntity';
import { BattleStatus } from './BattleEntity';

export interface BattleState {
  entities: BattleEntity[];
  turnOrder: string[]; // IDs
  currentTurnIndex: number;
  combatLog: string[];
  isFinished: boolean;
  winner?: 'PLAYER' | 'ENEMY';
}
