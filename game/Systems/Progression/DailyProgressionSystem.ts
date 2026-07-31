import { ToastManager } from '../ToastManager';
import { FantasySFX } from '../FantasySFX';

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  completed: boolean;
  rewardExp: number;
  rewardGold: number;
  rewardText: string;
}

export interface RestBuff {
  name: string;
  battlesRemaining: number;
  expBonusPercent: number;
  damageBonusPercent: number;
}

export class DailyProgressionSystem {
  private static instance: DailyProgressionSystem;

  private streakDays: number = 1;
  private lastLoginDate: string = '';
  private quests: DailyQuest[] = [];
  private activeRestBuff: RestBuff | null = null;

  private constructor() {
    this.initDailyState();
  }

  public static getInstance(): DailyProgressionSystem {
    if (!DailyProgressionSystem.instance) {
      DailyProgressionSystem.instance = new DailyProgressionSystem();
    }
    return DailyProgressionSystem.instance;
  }

  private initDailyState(): void {
    const today = new Date().toISOString().split('T')[0];
    this.lastLoginDate = today;

    // Default daily quests calibrated for 10-20 min daily sessions
    this.quests = [
      {
        id: 'break_shields',
        title: '🛡️ Maestro del Escudo',
        description: 'Efectúa 2 Rupturas de Escudo en combate.',
        current: 0,
        target: 2,
        completed: false,
        rewardExp: 200,
        rewardGold: 150,
        rewardText: '200 EXP + 150 Oro',
      },
      {
        id: 'win_battles',
        title: '⚔️ Victorias de la Jornada',
        description: 'Gana 2 combates contra enemigos o jefes.',
        current: 0,
        target: 2,
        completed: false,
        rewardExp: 300,
        rewardGold: 200,
        rewardText: '300 EXP + 200 Oro',
      },
      {
        id: 'use_boost',
        title: '🔥 Impulso Máximo',
        description: 'Desata una habilidad o ataque con Impulso (BP > 0).',
        current: 0,
        target: 2,
        completed: false,
        rewardExp: 250,
        rewardGold: 180,
        rewardText: '250 EXP + 180 Oro',
      },
    ];
  }

  public getQuests(): DailyQuest[] {
    return this.quests;
  }

  public getStreakDays(): number {
    return this.streakDays;
  }

  public getStreakExpBonus(): number {
    // Each streak day grants +5% bonus EXP (cap 25%)
    return Math.min(25, this.streakDays * 5);
  }

  public getActiveRestBuff(): RestBuff | null {
    return this.activeRestBuff;
  }

  /**
   * Called when player rests at a Campfire / Rest Spot
   */
  public restAtCampfire(): void {
    this.activeRestBuff = {
      name: '🔥 Vigor de la Hoguera',
      battlesRemaining: 3,
      expBonusPercent: 20,
      damageBonusPercent: 15,
    };

    FantasySFX.getInstance().playHealChime();
    ToastManager.getInstance().show(
      '🔥 ¡Has descansado en la Hoguera! Vitalidad restaurada y +20% EXP por 3 batallas.'
    );
  }

  /**
   * Consume 1 charge of rest buff after a battle
   */
  public consumeRestBuffBattle(): void {
    if (this.activeRestBuff) {
      this.activeRestBuff.battlesRemaining -= 1;
      if (this.activeRestBuff.battlesRemaining <= 0) {
        this.activeRestBuff = null;
        ToastManager.getInstance().show('🛡️ El efecto de la Hoguera se ha disipado.');
      }
    }
  }

  /**
   * Progress tracker for daily actions
   */
  public trackProgress(questId: 'break_shields' | 'win_battles' | 'use_boost', amount: number = 1): void {
    const quest = this.quests.find((q) => q.id === questId);
    if (quest && !quest.completed) {
      quest.current = Math.min(quest.target, quest.current + amount);
      if (quest.current >= quest.target) {
        quest.completed = true;
        FantasySFX.getInstance().playHealChime();
        ToastManager.getInstance().show(
          `🏆 ¡MISIÓN DIARIA COMPLETADA! ${quest.title} (+${quest.rewardExp} EXP, +${quest.rewardGold} Oro)`
        );
      }
    }
  }
}
