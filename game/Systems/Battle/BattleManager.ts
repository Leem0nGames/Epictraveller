import { BattleEntity } from './BattleEntity';
import { BattleState } from './BattleState';
import { BattleAction } from './BattleAction';
import { BattleCalculator } from './BattleCalculator';
import { EventBus } from '../../Core/EventBus';

export class BattleManager {
  private state: BattleState;
  private eventBus: EventBus;

  constructor(playerEntity: any, enemyEntity: any) {
    this.eventBus = EventBus.getInstance();
    
    const player = new BattleEntity(playerEntity);
    const enemy = new BattleEntity(enemyEntity);
    
    this.state = {
      entities: [player, enemy],
      turnOrder: [player.id, enemy.id], // Need real speed-based calc
      currentTurnIndex: 0,
      combatLog: ['¡Combate iniciado!'],
      isFinished: false,
    };
  }

  public processAction(action: BattleAction): void {
    if (this.state.isFinished) return;
    
    const actor = this.state.entities.find(e => e.id === action.actorId);
    if (!actor) return;

    if (action.type === 'ATTACK') {
      const target = this.state.entities.find(e => e.id === action.targetId);
      if (target) {
        const damage = BattleCalculator.calculateDamage(actor, target);
        target.currentHp -= damage;
        this.state.combatLog.push(`${actor.name} ataca a ${target.name} y causa ${damage} de daño.`);
        
        if (target.currentHp <= 0) {
          target.currentHp = 0;
          this.state.isFinished = true;
          this.state.winner = actor.id === this.state.entities[0].id ? 'PLAYER' : 'ENEMY';
          this.state.combatLog.push(`${target.name} ha sido derrotado.`);
        }
      }
    }
    
    this.nextTurn();
  }

  private nextTurn(): void {
    if (this.state.isFinished) {
      this.eventBus.emit('battle:finished', { winner: this.state.winner });
      return;
    }
    
    this.state.currentTurnIndex = (this.state.currentTurnIndex + 1) % this.state.turnOrder.length;
    this.eventBus.emit('battle:stateUpdated', this.state);
  }

  public getState(): BattleState {
    return this.state;
  }
}
