import { EventBus } from '../Core/EventBus';
import { InventoryManager } from './Inventory/InventoryManager';
import { ProgressionManager } from './Progression/ProgressionManager';
import { StatsSystem, CalculatedDamageResult } from './StatsSystem';
import { GameFeelSystem } from './GameFeelSystem';
import { DailyProgressionSystem } from './Progression/DailyProgressionSystem';
import { BestiarySystem } from './Progression/BestiarySystem';

export type WeaknessType = 'SWORD' | 'SPEAR' | 'BOW' | 'FIRE' | 'ICE' | 'ARCANA';

export interface WeaknessInfo {
  type: WeaknessType;
  label: string;
  icon: string;
  revealed: boolean;
}

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  mpCost: number;
  weaknessType?: WeaknessType;
  hitCount: number;
  basePower: number;
  category: 'PHYSICAL' | 'MAGICAL' | 'HEAL' | 'BUFF';
  requiredStance?: 'VANGUARDIA' | 'SOMBRA';
}

export interface Combatant {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  speed: number;
  bp: number;            // Boost Points (0 to 5)
  boostLevel: number;    // Selected BP boost for current turn (0, 1, 2, 3)
  stance: 'VANGUARDIA' | 'SOMBRA'; // Tactical Stance Innovation
  isDefending: boolean;
  canGainBp: boolean;    // Skip BP gain after using boost
}

export interface EnemyCombatant {
  id: string;
  name: string;
  classId: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  shieldMax: number;
  shieldCurrent: number;
  weaknesses: WeaknessInfo[];
  isBroken: boolean;
  breakTurnsRemaining: number;
  activeEcho?: WeaknessType; // Uncommon Innovation: Break Echo (Eco de Ruptura)
}

export class OctopathCombatEngine {
  private static instance: OctopathCombatEngine | null = null;
  private eventBus: EventBus;

  public player!: Combatant;
  public enemy!: EnemyCombatant;
  public turn: 'PLAYER' | 'ENEMY' | 'ENDED' = 'PLAYER';
  public turnNumber: number = 1;
  public combatLog: string[] = [];
  public resonanceChainActive: boolean = false; // Innovation trigger indicator

  public combatItems: Record<string, number> = {
    POTION: 5,
    MANA: 3,
    HERB: 2,
    BOMB: 2,
    ELIXIR_PLUS: 1,
  };

  public availableSkills: SkillDefinition[] = [
    {
      id: 'triple_slash',
      name: 'Tajo Triple',
      description: 'Asesta 3 cortes veloces. Eficaz contra escudos.',
      mpCost: 6,
      weaknessType: 'SWORD',
      hitCount: 3,
      basePower: 12,
      category: 'PHYSICAL',
      requiredStance: 'VANGUARDIA',
    },
    {
      id: 'flame_burst',
      name: 'Ráfaga Ígnea',
      description: 'Lanza una ráfaga de fuego abrasador.',
      mpCost: 8,
      weaknessType: 'FIRE',
      hitCount: 1,
      basePower: 28,
      category: 'MAGICAL',
      requiredStance: 'SOMBRA',
    },
    {
      id: 'astral_icicle',
      name: 'Carámbano Astral',
      description: 'Ataca con espinas de hielo helado.',
      mpCost: 8,
      weaknessType: 'ICE',
      hitCount: 1,
      basePower: 26,
      category: 'MAGICAL',
      requiredStance: 'SOMBRA',
    },
    {
      id: 'curative_light',
      name: 'Luz Curativa',
      description: 'Restaura HP y purifica el espíritu.',
      mpCost: 10,
      hitCount: 1,
      basePower: 40,
      category: 'HEAL',
    },
    {
      id: 'exceed_nova',
      name: 'Exceed: Resonancia Nova',
      description: 'Técnica Suprema elemental. Inflige 4 impactos arcanos masivos.',
      mpCost: 15,
      weaknessType: 'ARCANA',
      hitCount: 4,
      basePower: 35,
      category: 'MAGICAL',
      requiredStance: 'SOMBRA',
    },
  ];

  constructor() {
    this.eventBus = EventBus.getInstance();
  }

  public static getInstance(): OctopathCombatEngine {
    if (!OctopathCombatEngine.instance) {
      OctopathCombatEngine.instance = new OctopathCombatEngine();
    }
    return OctopathCombatEngine.instance;
  }

  /**
   * Initialize a new battle session with full Octopath mechanics
   */
  public startBattle(params: {
    enemyId: string;
    enemyName: string;
    enemyClassId: string;
    enemyStats?: any;
  }): void {
    const maxHp = params.enemyStats?.stats?.maxHp?.value || 60;
    const enemyAtk = params.enemyStats?.stats?.attack?.value || 8;

    // Define Enemy Weaknesses based on class
    let enemyWeaknesses: WeaknessInfo[] = [];
    if (params.enemyClassId.toLowerCase().includes('slime')) {
      enemyWeaknesses = [
        { type: 'SWORD', label: 'Espada', icon: '⚔️', revealed: false },
        { type: 'FIRE', label: 'Fuego', icon: '🔥', revealed: false },
        { type: 'ICE', label: 'Hielo', icon: '❄️', revealed: false },
      ];
    } else if (params.enemyClassId.toLowerCase().includes('knight')) {
      enemyWeaknesses = [
        { type: 'SPEAR', label: 'Lanza', icon: '🔱', revealed: false },
        { type: 'ARCANA', label: 'Arcana', icon: '✨', revealed: false },
        { type: 'FIRE', label: 'Fuego', icon: '🔥', revealed: false },
      ];
    } else {
      enemyWeaknesses = [
        { type: 'SWORD', label: 'Espada', icon: '⚔️', revealed: false },
        { type: 'BOW', label: 'Arco', icon: '🏹', revealed: false },
        { type: 'ARCANA', label: 'Arcana', icon: '✨', revealed: false },
      ];
    }

    const playerStatsComponent = InventoryManager.getInstance().getPlayerStats();
    const playerMaxHp = playerStatsComponent.getStatValue('maxHp') || 100;
    const playerMaxMp = playerStatsComponent.getStatValue('maxMp') || 50;
    const playerAtk = playerStatsComponent.getStatValue('attack') || 15;
    const playerDef = playerStatsComponent.getStatValue('defense') || 8;

    // Load archetype skills if unlocked
    const archetype = ProgressionManager.getInstance().getArchetype();
    const baseSkills: SkillDefinition[] = [
      {
        id: 'triple_slash',
        name: 'Tajo Triple',
        description: 'Asesta 3 cortes veloces. Eficaz contra escudos.',
        mpCost: 6,
        weaknessType: 'SWORD',
        hitCount: 3,
        basePower: 12,
        category: 'PHYSICAL',
        requiredStance: 'VANGUARDIA',
      },
      {
        id: 'flame_burst',
        name: 'Ráfaga Ígnea',
        description: 'Lanza una ráfaga de fuego abrasador.',
        mpCost: 8,
        weaknessType: 'FIRE',
        hitCount: 1,
        basePower: 28,
        category: 'MAGICAL',
        requiredStance: 'SOMBRA',
      },
      {
        id: 'astral_icicle',
        name: 'Carámbano Astral',
        description: 'Ataca con espinas de hielo helado.',
        mpCost: 8,
        weaknessType: 'ICE',
        hitCount: 1,
        basePower: 26,
        category: 'MAGICAL',
        requiredStance: 'SOMBRA',
      },
      {
        id: 'curative_light',
        name: 'Luz Curativa',
        description: 'Restaura HP y purifica el espíritu.',
        mpCost: 10,
        hitCount: 1,
        basePower: 40,
        category: 'HEAL',
      },
      {
        id: 'exceed_nova',
        name: 'Exceed: Resonancia Nova',
        description: 'Técnica Suprema elemental. Inflige 4 impactos arcanos masivos.',
        mpCost: 15,
        weaknessType: 'ARCANA',
        hitCount: 4,
        basePower: 35,
        category: 'MAGICAL',
        requiredStance: 'SOMBRA',
      },
    ];

    const unlockedTalentSkills = ProgressionManager.getInstance()
      .getUnlockedSkillsForActiveArchetype()
      .map((t) => t.skillUnlock)
      .filter((s): s is SkillDefinition => !!s);

    if (archetype && archetype.skills) {
      this.availableSkills = [...baseSkills, ...archetype.skills, ...unlockedTalentSkills];
    } else {
      this.availableSkills = [...baseSkills, ...unlockedTalentSkills];
    }

    this.player = {
      id: 'hero',
      name: 'Eldor',
      hp: playerMaxHp,
      maxHp: playerMaxHp,
      mp: playerMaxMp,
      maxMp: playerMaxMp,
      atk: playerAtk,
      def: playerDef,
      speed: 10,
      bp: 1, // Starts with 1 BP
      boostLevel: 0,
      stance: 'VANGUARDIA',
      isDefending: false,
      canGainBp: true,
    };

    this.enemy = {
      id: params.enemyId,
      name: params.enemyName,
      classId: params.enemyClassId,
      hp: maxHp,
      maxHp: maxHp,
      atk: enemyAtk,
      def: 3,
      shieldMax: 4,
      shieldCurrent: 4,
      weaknesses: enemyWeaknesses,
      isBroken: false,
      breakTurnsRemaining: 0,
    };

    this.combatItems = {
      POTION: 5,
      MANA: 3,
      HERB: 2,
      BOMB: 2,
      ELIXIR_PLUS: 1,
    };

    this.turn = 'PLAYER';
    this.turnNumber = 1;
    this.combatLog = [`¡Encuentro iniciado! ${this.enemy.name} tiene ${this.enemy.shieldCurrent} Puntos de Escudo.`];
    this.resonanceChainActive = false;

    // Record Bestiary Encounter
    BestiarySystem.getInstance().recordEncounter(params.enemyClassId || params.enemyId);

    this.notifyState();
  }

  /**
   * Toggles selected Boost level (0 to 3) if player has enough BP
   */
  public setBoostLevel(level: number): void {
    if (level < 0 || level > 3) return;
    if (level > this.player.bp) return;

    this.player.boostLevel = level;
    this.notifyState();
  }

  /**
   * Toggles Tactical Stance between Vanguardia (Physical) and Sombra (Elemental)
   */
  public toggleStance(): void {
    if (this.player.stance === 'VANGUARDIA') {
      this.player.stance = 'SOMBRA';
      this.addLog(`🔄 Eldor cambia a Sintonía SOMBRA (Bonificación elemental y magia).`);
    } else {
      this.player.stance = 'VANGUARDIA';
      this.addLog(`🔄 Eldor cambia a Sintonía VANGUARDIA (Bonificación física y golpes críticos).`);
    }
    this.notifyState();
  }

  /**
   * Executes Player Basic Attack
   */
  public executeAttack(): void {
    if (this.turn !== 'PLAYER') return;

    const boostCount = this.player.boostLevel;
    const totalHits = 1 + boostCount; // Boost x1 = 1 hit, Boost x2 = 2 hits, Boost x4 = 4 hits!
    
    const attackType: WeaknessType = this.player.stance === 'VANGUARDIA' ? 'SWORD' : 'ARCANA';

    this.addLog(`⚔️ Eldor ataca [BOOST x${totalHits}] (${attackType === 'SWORD' ? 'Sable Physical' : 'Impacto Arcano'}).`);

    this.spendBp();

    let totalDamageDealt = 0;
    for (let i = 0; i < totalHits; i++) {
      if (this.enemy.hp <= 0) break;

      const isMagical = attackType === 'ARCANA';
      const calc = this.calculateDamage(this.player.atk * 0.9, this.enemy.def, attackType, isMagical);
      this.applyDamageToEnemy(calc.damage, attackType, calc.isCritical);
      totalDamageDealt += calc.damage;
    }

    this.eventBus.emit('battle:animation', { type: 'ATTACK', hits: totalHits, attackType });
    this.endPlayerTurn();
  }

  /**
   * Executes a Skill action
   */
  public executeSkill(skillId: string): void {
    if (this.turn !== 'PLAYER') return;

    const skill = this.availableSkills.find((s) => s.id === skillId);
    if (!skill) return;

    if (this.player.mp < skill.mpCost) {
      this.addLog(`⚠️ MP Insuficiente para lanzar ${skill.name}.`);
      this.notifyState();
      return;
    }

    this.player.mp -= skill.mpCost;
    const boostCount = this.player.boostLevel;
    const boostMultiplier = 1 + boostCount * 0.5;

    this.spendBp();

    if (skill.category === 'HEAL') {
      const healAmount = Math.round(skill.basePower * boostMultiplier);
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmount);
      this.addLog(`✨ Eldor usa ${skill.name} y restaura +${healAmount} HP.`);
      this.eventBus.emit('battle:animation', { type: 'HEAL' });
      this.eventBus.emit('battle:damage', {
        target: 'PLAYER',
        value: healAmount,
        isHeal: true,
      });
    } else {
      const totalHits = skill.hitCount;
      const attackType = skill.weaknessType || (this.player.stance === 'VANGUARDIA' ? 'SWORD' : 'ARCANA');
      
      this.addLog(`🔥 Eldor usa ${skill.name} [BOOST x${1 + boostCount}]!`);

      for (let i = 0; i < totalHits; i++) {
        if (this.enemy.hp <= 0) break;

        const isMagical = skill.category === 'MAGICAL';
        const calc = this.calculateDamage(skill.basePower * boostMultiplier, this.enemy.def, attackType, isMagical);
        this.applyDamageToEnemy(calc.damage, attackType, calc.isCritical);
      }

      this.eventBus.emit('battle:animation', { type: 'SKILL', skillId, attackType });
    }

    this.endPlayerTurn();
  }

  /**
   * Defend Action: Reduces incoming damage & grants bonus turn speed next round
   */
  public executeDefend(): void {
    if (this.turn !== 'PLAYER') return;

    this.player.isDefending = true;
    this.addLog(`🛡️ Eldor adopta postura defensiva. Reducción de daño +50% y prioridad en el próximo turno.`);
    
    // Defending restores +1 MP
    this.player.mp = Math.min(this.player.maxMp, this.player.mp + 4);
    
    this.spendBp();
    this.endPlayerTurn();
  }

  /**
   * Use Item Action in combat
   */
  public executeItem(itemType: 'POTION' | 'MANA' | 'HERB' | 'BOMB' | 'ELIXIR_PLUS'): void {
    if (this.turn !== 'PLAYER') return;

    const count = this.combatItems[itemType] || 0;
    if (count <= 0) {
      this.addLog(`⚠️ ¡Sin existencias de este objeto!`);
      this.notifyState();
      return;
    }

    this.combatItems[itemType] = count - 1;

    if (itemType === 'POTION') {
      const heal = 45;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
      this.addLog(`🧪 Eldor bebe Poción de Salud (+${heal} HP) [Quedan ${this.combatItems[itemType]}].`);
      this.eventBus.emit('battle:animation', { type: 'HEAL' });
      this.eventBus.emit('battle:damage', { target: 'PLAYER', value: heal, isHeal: true });
    } else if (itemType === 'MANA') {
      const mpGain = 25;
      this.player.mp = Math.min(this.player.maxMp, this.player.mp + mpGain);
      this.addLog(`💧 Eldor toma Elixir de Maná (+${mpGain} MP) [Quedan ${this.combatItems[itemType]}].`);
      this.eventBus.emit('battle:animation', { type: 'HEAL' });
    } else if (itemType === 'HERB') {
      this.player.bp = Math.min(5, this.player.bp + 2);
      this.addLog(`🌾 Eldor consume Hierba de Impulso (+2 BP) [Quedan ${this.combatItems[itemType]}].`);
      this.eventBus.emit('battle:animation', { type: 'HEAL' });
    } else if (itemType === 'BOMB') {
      const calc = this.calculateDamage(24, this.enemy.def, 'FIRE', true);
      this.addLog(`💣 Eldor arroja una Bomba de Fuego [Quedan ${this.combatItems[itemType]}]!`);
      this.applyDamageToEnemy(calc.damage, 'FIRE', calc.isCritical);
      this.eventBus.emit('battle:animation', { type: 'SKILL', attackType: 'FIRE' });
    } else if (itemType === 'ELIXIR_PLUS') {
      const heal = 60;
      const mpGain = 30;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
      this.player.mp = Math.min(this.player.maxMp, this.player.mp + mpGain);
      this.addLog(`✨ Eldor usa Elixir Supremo (+${heal} HP, +${mpGain} MP) [Quedan ${this.combatItems[itemType]}].`);
      this.eventBus.emit('battle:animation', { type: 'HEAL' });
      this.eventBus.emit('battle:damage', { target: 'PLAYER', value: heal, isHeal: true });
    }

    this.spendBp();
    this.endPlayerTurn();
  }

  /**
   * Attempts to flee combat
   */
  public executeFlee(): void {
    if (this.turn !== 'PLAYER') return;

    const fleeSuccess = Math.random() < 0.75;
    if (fleeSuccess) {
      this.addLog(`🏃 ¡Escape exitoso! Eldor huye del combate.`);
      this.turn = 'ENDED';
      this.notifyState();
      
      setTimeout(() => {
        this.eventBus.emit('battle:ended', { result: 'FLED' });
      }, 1000);
    } else {
      this.addLog(`❌ ¡Falló el intento de huida!`);
      this.endPlayerTurn();
    }
  }

  /**
   * Consumes Boost Points used on turn
   */
  private spendBp(): void {
    const spent = this.player.boostLevel;
    if (spent > 0) {
      this.player.bp -= spent;
      this.player.canGainBp = false; // No BP gained on next turn start
      GameFeelSystem.getInstance().onBoostActive();
      DailyProgressionSystem.getInstance().trackProgress('use_boost', 1);
    } else {
      this.player.canGainBp = true;
    }
    this.player.boostLevel = 0;
  }

  /**
   * Damage calculation incorporating StatsSystem formulas, Octopath Break multiplier & Defense
   */
  private calculateDamage(
    power: number,
    targetDef: number,
    type?: WeaknessType,
    isMagical: boolean = false
  ): { damage: number; isCritical: boolean } {
    const statsComp = InventoryManager.getInstance().getPlayerStats();
    const attackerCritChance = statsComp.getStatValue('critChance') || 8;
    const attackerCritMultiplier = statsComp.getStatValue('critMultiplier') || 1.5;
    const magicAtk = statsComp.getStatValue('magicAttack') || this.player.atk;
    const magicDef = statsComp.getStatValue('magicDefense') || targetDef;
    const playerLevel = ProgressionManager.getInstance().getLevel();

    const isResonanceActive = !!(this.enemy.isBroken && this.enemy.activeEcho && type === this.enemy.activeEcho);
    if (isResonanceActive) {
      this.resonanceChainActive = true;
    }

    const calcResult: CalculatedDamageResult = StatsSystem.getInstance().calculateDamage({
      attackerAtk: this.player.atk,
      attackerMagicAtk: magicAtk,
      defenderDef: targetDef,
      defenderMagicDef: magicDef,
      skillBasePower: power,
      isMagical,
      attackerCritChance,
      attackerCritMultiplier,
      isTargetBroken: this.enemy.isBroken,
      isResonanceActive,
      boostLevel: this.player.boostLevel,
      attackerLevel: playerLevel,
    });

    return {
      damage: calcResult.finalDamage,
      isCritical: calcResult.isCritical,
    };
  }

  /**
   * Applies damage to enemy, handles Shield Reduction, Weakness Discovery, and Ruptura (Break)
   */
  private applyDamageToEnemy(damage: number, attackType: WeaknessType, isCriticalHit: boolean = false): void {
    this.enemy.hp = Math.max(0, this.enemy.hp - damage);

    // Check if attack hits a weakness
    const weaknessMatch = this.enemy.weaknesses.find((w) => w.type === attackType);

    if (weaknessMatch) {
      if (!weaknessMatch.revealed) {
        weaknessMatch.revealed = true;
        this.addLog(`🔍 ¡DEBILIDAD DESCUBIERTA! ${this.enemy.name} es vulnerable a [${weaknessMatch.label}].`);
        BestiarySystem.getInstance().recordWeaknessDiscovered(this.enemy.classId || this.enemy.id, attackType);
      }

      if (!this.enemy.isBroken) {
        this.enemy.shieldCurrent -= 1;
        this.addLog(`⚡ ¡GOLPE DE ESCUDO! Escudo restante: ${this.enemy.shieldCurrent}`);

        // Check for BREAK (RUPTURA)
        if (this.enemy.shieldCurrent <= 0) {
          this.triggerBreak(attackType);
        }
      }
    }

    // Check for Innovation: Resonant Chain
    if (this.enemy.isBroken && this.enemy.activeEcho && attackType === this.enemy.activeEcho) {
      this.addLog(`✨ ¡CADENA DE RESONANCIA ASTRAL! +2 BP recuperados para Eldor y daño crítico masivo.`);
      this.player.bp = Math.min(5, this.player.bp + 2);
      this.eventBus.emit('battle:animation', { type: 'RESONANCE_CHAIN' });
    }

    if (isCriticalHit) {
      GameFeelSystem.getInstance().onCriticalHit();
      this.addLog(`💥⚡ ¡¡GOLPE CRÍTICO MASIVO!! ${this.enemy.name} recibe ${damage} de daño. (HP: ${this.enemy.hp}/${this.enemy.maxHp})`);
    } else {
      this.addLog(`💥 ${this.enemy.name} recibe ${damage} de daño. (HP: ${this.enemy.hp}/${this.enemy.maxHp})`);
    }

    this.eventBus.emit('battle:damage', {
      target: 'ENEMY',
      value: damage,
      isCritical: isCriticalHit || damage > 25 || this.enemy.isBroken,
      isWeakness: !!weaknessMatch,
      isBreak: this.enemy.isBroken,
      attackType,
    });

    if (this.enemy.hp <= 0) {
      this.addLog(`🏆 ¡VICTORIA! ${this.enemy.name} ha sido derrotado.`);
      this.turn = 'ENDED';
      
      // Track Daily Progression & Rest Buff
      DailyProgressionSystem.getInstance().trackProgress('win_battles', 1);
      DailyProgressionSystem.getInstance().consumeRestBuffBattle();

      // Record Bestiary Defeat
      BestiarySystem.getInstance().recordDefeat(
        this.enemy.classId || this.enemy.id,
        this.enemy.name,
        this.enemy.weaknesses.filter((w) => w.revealed).map((w) => w.type)
      );

      this.notifyState();

      setTimeout(() => {
        this.eventBus.emit('battle:ended', { result: 'VICTORY', enemyId: this.enemy.id });
      }, 1500);
    }
  }

  /**
   * Triggers RUPTURA (Break) on enemy + creates Break Echo (Innovation)
   */
  private triggerBreak(triggerType: WeaknessType): void {
    this.enemy.isBroken = true;
    this.enemy.shieldCurrent = 0;
    this.enemy.breakTurnsRemaining = 2; // Skips current & next round
    this.enemy.activeEcho = triggerType; // Uncommon Innovation: Break Echo!

    GameFeelSystem.getInstance().onShieldBreak();
    DailyProgressionSystem.getInstance().trackProgress('break_shields', 1);

    const echoName = triggerType === 'SWORD' ? 'Espada' : triggerType === 'FIRE' ? 'Fuego' : triggerType === 'ICE' ? 'Hielo' : 'Arcano';

    this.addLog(`💥 ¡¡RUPTURA (BREAK)!! ${this.enemy.name} ha perdido la defensa y pierde sus turnos.`);
    this.addLog(`🌟 ¡ECO DE RUPTURA GENERADO! Resonancia activa: [${echoName}]. Usa ataques de ${echoName} para activar la Cadena Astral.`);

    this.eventBus.emit('battle:animation', { type: 'BREAK', triggerType });
  }

  /**
   * Ends Player turn and starts Enemy Turn
   */
  private endPlayerTurn(): void {
    if (this.enemy.hp <= 0 || this.turn === 'ENDED') return;

    this.turn = 'ENEMY';
    this.notifyState();

    setTimeout(() => {
      this.executeEnemyTurn();
    }, 1200);
  }

  /**
   * Executes Enemy Turn logic
   */
  private executeEnemyTurn(): void {
    if (this.enemy.hp <= 0 || this.turn === 'ENDED') return;

    // Check if Enemy is Broken
    if (this.enemy.isBroken) {
      this.enemy.breakTurnsRemaining -= 1;
      this.addLog(`💫 ${this.enemy.name} está aturdido en RUPTURA y no puede actuar.`);

      if (this.enemy.breakTurnsRemaining <= 0) {
        // Recover from Break
        this.enemy.isBroken = false;
        this.enemy.shieldCurrent = this.enemy.shieldMax;
        this.enemy.activeEcho = undefined;
        this.addLog(`🛡️ ${this.enemy.name} se ha recuperado de la Ruptura y sus escudos (${this.enemy.shieldMax}) se han restaurado.`);
      }

      this.startNextRound();
      return;
    }

    // Enemy Attack Logic
    let enemyDamage = Math.max(1, this.enemy.atk - this.player.def * 0.4);
    
    // Apply Elemental Resistance Reduction if active
    const elementalResist = InventoryManager.getInstance().getPlayerStats().getStatValue('elementalResist');
    if (elementalResist > 0) {
      const resistPercent = Math.min(0.5, elementalResist / 100);
      enemyDamage = Math.max(1, Math.round(enemyDamage * (1 - resistPercent)));
    }

    if (this.player.isDefending) {
      enemyDamage = Math.round(enemyDamage * 0.5);
      this.player.isDefending = false;
    }

    this.player.hp = Math.max(0, this.player.hp - enemyDamage);
    this.addLog(`👺 ${this.enemy.name} ataca a Eldor y le causa ${enemyDamage} de daño.`);

    this.eventBus.emit('battle:damage', {
      target: 'PLAYER',
      value: enemyDamage,
      isCritical: enemyDamage > 12,
    });

    this.eventBus.emit('battle:animation', { type: 'ENEMY_ATTACK' });

    if (this.player.hp <= 0) {
      this.addLog(`☠️ Eldor ha sido derrotado...`);
      this.turn = 'ENDED';
      this.notifyState();

      setTimeout(() => {
        this.eventBus.emit('battle:ended', { result: 'DEFEAT' });
      }, 1500);
      return;
    }

    this.startNextRound();
  }

  /**
   * Prepares start of next round (BP generation, player turn reset)
   */
  private startNextRound(): void {
    this.turnNumber += 1;
    this.turn = 'PLAYER';

    // Boost Point Gain (+1 BP per round unless boost was spent last round)
    if (this.player.canGainBp) {
      if (this.player.bp < 5) {
        this.player.bp += 1;
        this.addLog(`⭐ Turno ${this.turnNumber}: Eldor gana +1 BP (Total: ${this.player.bp}/5).`);
      }
    } else {
      this.player.canGainBp = true; // Reset flag for subsequent rounds
      this.addLog(`⭐ Turno ${this.turnNumber}: No se genera BP tras usar Impulso en el turno anterior.`);
    }

    // Passive Mana Regeneration
    const manaRegen = InventoryManager.getInstance().getPlayerStats().getStatValue('manaRegen');
    if (manaRegen > 0) {
      const oldMp = this.player.mp;
      this.player.mp = Math.min(this.player.maxMp, this.player.mp + manaRegen);
      const gained = this.player.mp - oldMp;
      if (gained > 0) {
        this.addLog(`✨ [Sintonía Pasiva] Eldor regenera +${gained} MP al inicio del turno.`);
      }
    }

    this.notifyState();
  }

  private addLog(text: string): void {
    this.combatLog.push(text);
    if (this.combatLog.length > 20) {
      this.combatLog.shift();
    }
  }

  private notifyState(): void {
    this.eventBus.emit('battle:state_update', {
      player: { ...this.player },
      enemy: { ...this.enemy },
      turn: this.turn,
      turnNumber: this.turnNumber,
      combatLog: [...this.combatLog],
      resonanceChainActive: this.resonanceChainActive,
    });
  }
}
