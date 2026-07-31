import { EventEmitter } from 'events';
import { InventoryManager } from '../Inventory/InventoryManager';
import { ToastManager } from '../ToastManager';
import { EventBus } from '../../Core/EventBus';
import { ARCHETYPES, ArchetypeDefinition, TalentNode, PassiveTalentDefinition } from './Archetypes';
import { StatModifierType } from '../Stats/StatModifier';

import { StatsSystem } from '../StatsSystem';
import { ExpeditionManager } from '../Expedition/ExpeditionManager';

export interface PlayerProgressionData {
  level: number;
  exp: number;
  maxExp: number;
  gold: number;
  gems: number;
  archetypeId: string | null;
  talentPoints: number;
  unlockedTalents: string[];
  passiveTalentRanks: Record<string, number>;
}

export class ProgressionManager {
  private static instance: ProgressionManager;
  private emitter: EventEmitter = new EventEmitter();

  private level: number = 1;
  private exp: number = 0;
  private maxExp: number = 100;
  private gold: number = 150;
  private gems: number = 5;
  private archetypeId: string | null = null;
  private unlockedTalents: string[] = [];
  private passiveTalentRanks: Record<string, number> = {};

  private constructor() {
    this.loadFromLocalStorage();
  }

  public static getInstance(): ProgressionManager {
    if (!ProgressionManager.instance) {
      ProgressionManager.instance = new ProgressionManager();
    }
    return ProgressionManager.instance;
  }

  public getLevel(): number { return this.level; }
  public getExp(): number { return this.exp; }
  public getMaxExp(): number { return this.maxExp; }
  public getGold(): number { return this.gold; }
  public getGems(): number { return this.gems; }
  public getArchetypeId(): string | null { return this.archetypeId; }

  public getTotalTalentPoints(): number {
    return this.level;
  }

  public getSpentTalentPoints(): number {
    let spent = 0;
    const allArchetypes = Object.values(ARCHETYPES);
    for (const arch of allArchetypes) {
      if (arch.talentTree) {
        for (const node of arch.talentTree) {
          if (this.unlockedTalents.includes(node.id)) {
            spent += node.cost;
          }
        }
      }
      if (arch.passiveTalents) {
        for (const pnode of arch.passiveTalents) {
          const rank = this.getPassiveRank(pnode.id);
          spent += rank * pnode.costPerRank;
        }
      }
    }
    return spent;
  }

  public getTalentPoints(): number {
    return Math.max(0, this.getTotalTalentPoints() - this.getSpentTalentPoints());
  }

  public getUnlockedTalents(): string[] {
    return [...this.unlockedTalents];
  }

  public isTalentUnlocked(talentId: string): boolean {
    return this.unlockedTalents.includes(talentId);
  }

  public canUnlockTalent(talentId: string): { canUnlock: boolean; reason?: string; node?: TalentNode } {
    if (this.isTalentUnlocked(talentId)) {
      return { canUnlock: false, reason: 'Ya has desbloqueado este talento.' };
    }

    if (!this.archetypeId) {
      return { canUnlock: false, reason: 'Debes seleccionar un Arquetipo primero.' };
    }

    const archetype = ARCHETYPES[this.archetypeId];
    if (!archetype || !archetype.talentTree) {
      return { canUnlock: false, reason: 'Arquetipo no válido.' };
    }

    const node = archetype.talentTree.find((n) => n.id === talentId);
    if (!node) {
      return { canUnlock: false, reason: 'El talento no pertenece a tu arquetipo activo.' };
    }

    if (this.level < node.reqLevel) {
      return { canUnlock: false, reason: `Requiere Nivel ${node.reqLevel} (Nivel actual: ${this.level}).`, node };
    }

    if (this.getTalentPoints() < node.cost) {
      return { canUnlock: false, reason: `Requiere ${node.cost} Punto(s) de Habilidad.`, node };
    }

    if (node.prerequisites && node.prerequisites.length > 0) {
      const missingPrereqs = node.prerequisites.filter((pId) => !this.isTalentUnlocked(pId));
      if (missingPrereqs.length > 0) {
        return { canUnlock: false, reason: 'Debes desbloquear los talentos previos en la rama.', node };
      }
    }

    return { canUnlock: true, node };
  }

  public unlockTalent(talentId: string): boolean {
    const check = this.canUnlockTalent(talentId);
    if (!check.canUnlock || !check.node) {
      ToastManager.getInstance().show(`⚠️ ${check.reason || 'No puedes desbloquear este talento.'}`);
      return false;
    }

    const node = check.node;
    this.unlockedTalents.push(talentId);

    // Apply stat bonuses if present
    this.applyTalentStatBonus(node);

    ToastManager.getInstance().show(`✨ ¡TALENTO DESBLOQUEADO: ${node.name}!`);

    EventBus.getInstance().emit('progression:talent_unlocked', {
      talentId,
      node,
    });

    this.notifyUpdate();
    this.saveToLocalStorage();
    return true;
  }

  public getPassiveRank(passiveId: string): number {
    return this.passiveTalentRanks[passiveId] || 0;
  }

  public getPassiveTalentRanks(): Record<string, number> {
    return { ...this.passiveTalentRanks };
  }

  public canRankUpPassive(passiveId: string): { canRankUp: boolean; reason?: string; node?: PassiveTalentDefinition } {
    if (!this.archetypeId) {
      return { canRankUp: false, reason: 'Debes seleccionar un Arquetipo primero.' };
    }

    const archetype = ARCHETYPES[this.archetypeId];
    if (!archetype || !archetype.passiveTalents) {
      return { canRankUp: false, reason: 'Arquetipo no válido.' };
    }

    const node = archetype.passiveTalents.find((p) => p.id === passiveId);
    if (!node) {
      return { canRankUp: false, reason: 'El talento pasivo no pertenece a tu arquetipo activo.' };
    }

    const currentRank = this.getPassiveRank(passiveId);
    if (currentRank >= node.maxRanks) {
      return { canRankUp: false, reason: 'Rango máximo alcanzado para este talento pasivo.', node };
    }

    if (this.getTalentPoints() < node.costPerRank) {
      return { canRankUp: false, reason: `Requiere ${node.costPerRank} Punto de Habilidad.`, node };
    }

    return { canRankUp: true, node };
  }

  public rankUpPassive(passiveId: string): boolean {
    const check = this.canRankUpPassive(passiveId);
    if (!check.canRankUp || !check.node) {
      ToastManager.getInstance().show(`⚠️ ${check.reason || 'No puedes mejorar este talento pasivo.'}`);
      return false;
    }

    const node = check.node;
    const currentRank = this.getPassiveRank(passiveId);
    const newRank = currentRank + 1;
    this.passiveTalentRanks[passiveId] = newRank;

    this.applyPassiveStatBonus(node, newRank);

    ToastManager.getInstance().show(`✨ ¡TALENTO PASIVO: ${node.name} (Rango ${newRank}/${node.maxRanks})!`);

    EventBus.getInstance().emit('progression:passive_unlocked', {
      passiveId,
      node,
      rank: newRank,
    });

    this.notifyUpdate();
    this.saveToLocalStorage();
    return true;
  }

  public canRankDownPassive(passiveId: string): boolean {
    return this.getPassiveRank(passiveId) > 0;
  }

  public rankDownPassive(passiveId: string): boolean {
    if (!this.canRankDownPassive(passiveId)) return false;

    const archetype = this.archetypeId ? ARCHETYPES[this.archetypeId] : null;
    const node = archetype?.passiveTalents?.find((p) => p.id === passiveId);

    const currentRank = this.getPassiveRank(passiveId);
    const newRank = Math.max(0, currentRank - 1);

    if (newRank === 0) {
      delete this.passiveTalentRanks[passiveId];
    } else {
      this.passiveTalentRanks[passiveId] = newRank;
    }

    if (node) {
      this.applyPassiveStatBonus(node, newRank);
    }

    ToastManager.getInstance().show(`🔄 Puntos reembolsados de ${node?.name || 'Talento Pasivo'}.`);

    this.notifyUpdate();
    this.saveToLocalStorage();
    return true;
  }

  private applyPassiveStatBonus(node: PassiveTalentDefinition, rank: number): void {
    const stats = InventoryManager.getInstance().getPlayerStats();
    const modId = `mod_passive_${node.id}`;

    ['attack', 'defense', 'maxHp', 'maxMp', 'manaRegen', 'elementalResist'].forEach((stat) => {
      stats.removeModifier(stat, modId);
    });

    if (rank <= 0) return;

    if (node.statPerRank.hp) {
      stats.addModifier('maxHp', { id: modId, type: StatModifierType.FLAT, value: node.statPerRank.hp * rank, origin: 'passive_talent' });
    }
    if (node.statPerRank.mp) {
      stats.addModifier('maxMp', { id: modId, type: StatModifierType.FLAT, value: node.statPerRank.mp * rank, origin: 'passive_talent' });
    }
    if (node.statPerRank.attack) {
      stats.addModifier('attack', { id: modId, type: StatModifierType.FLAT, value: node.statPerRank.attack * rank, origin: 'passive_talent' });
    }
    if (node.statPerRank.defense) {
      stats.addModifier('defense', { id: modId, type: StatModifierType.FLAT, value: node.statPerRank.defense * rank, origin: 'passive_talent' });
    }
    if (node.statPerRank.manaRegen) {
      stats.addModifier('manaRegen', { id: modId, type: StatModifierType.FLAT, value: node.statPerRank.manaRegen * rank, origin: 'passive_talent' });
    }
    if (node.statPerRank.elementalResist) {
      stats.addModifier('elementalResist', { id: modId, type: StatModifierType.FLAT, value: node.statPerRank.elementalResist * rank, origin: 'passive_talent' });
    }
  }

  public resetTalents(): void {
    if (this.unlockedTalents.length === 0 && Object.keys(this.passiveTalentRanks).length === 0) {
      ToastManager.getInstance().show('ℹ️ No tienes talentos asignados para restablecer.');
      return;
    }

    const stats = InventoryManager.getInstance().getPlayerStats();
    this.unlockedTalents.forEach((id) => {
      ['attack', 'defense', 'maxHp', 'maxMp'].forEach((stat) => {
        stats.removeModifier(stat, `mod_talent_${id}`);
      });
    });

    Object.keys(this.passiveTalentRanks).forEach((id) => {
      ['attack', 'defense', 'maxHp', 'maxMp', 'manaRegen', 'elementalResist'].forEach((stat) => {
        stats.removeModifier(stat, `mod_passive_${id}`);
      });
    });

    this.unlockedTalents = [];
    this.passiveTalentRanks = {};
    ToastManager.getInstance().show('🔄 ¡Puntos de habilidad y talentos pasivos restablecidos!');

    this.notifyUpdate();
    this.saveToLocalStorage();
  }

  private applyTalentStatBonus(node: TalentNode): void {
    if (!node.statBonus) return;
    const stats = InventoryManager.getInstance().getPlayerStats();
    const modId = `mod_talent_${node.id}`;

    if (node.statBonus.attack) {
      stats.addModifier('attack', { id: modId, type: StatModifierType.FLAT, value: node.statBonus.attack, origin: 'talent' });
    }
    if (node.statBonus.defense) {
      stats.addModifier('defense', { id: modId, type: StatModifierType.FLAT, value: node.statBonus.defense, origin: 'talent' });
    }
    if (node.statBonus.hp) {
      stats.addModifier('maxHp', { id: modId, type: StatModifierType.FLAT, value: node.statBonus.hp, origin: 'talent' });
    }
    if (node.statBonus.mp) {
      stats.addModifier('maxMp', { id: modId, type: StatModifierType.FLAT, value: node.statBonus.mp, origin: 'talent' });
    }
  }

  public getUnlockedSkillsForActiveArchetype(): TalentNode[] {
    if (!this.archetypeId) return [];
    const archetype = ARCHETYPES[this.archetypeId];
    if (!archetype || !archetype.talentTree) return [];

    return archetype.talentTree.filter(
      (node) => node.skillUnlock && this.isTalentUnlocked(node.id)
    );
  }

  public getArchetype(): ArchetypeDefinition | null {
    if (!this.archetypeId) return null;
    return ARCHETYPES[this.archetypeId] || null;
  }

  public isArchetypeUnlocked(): boolean {
    return this.level >= 5;
  }

  public setArchetype(archetypeId: string): boolean {
    if (!this.isArchetypeUnlocked()) {
      ToastManager.getInstance().show('🔒 Debes alcanzar el Nivel 5 para desbloquear Arquetipos.');
      return false;
    }

    const archetype = ARCHETYPES[archetypeId];
    if (!archetype) return false;

    this.archetypeId = archetypeId;

    // Apply stat modifiers to PlayerStats
    const stats = InventoryManager.getInstance().getPlayerStats();

    // Remove any previous archetype modifiers
    ['attack', 'defense', 'maxHp', 'maxMp'].forEach((stat) => {
      stats.removeModifier(stat, 'mod_archetype_stat');
    });

    // Add new modifiers from archetype
    if (archetype.statBonuses.attack > 0) {
      stats.addModifier('attack', { id: 'mod_archetype_stat', type: StatModifierType.FLAT, value: archetype.statBonuses.attack, origin: 'archetype' });
    }
    if (archetype.statBonuses.defense > 0) {
      stats.addModifier('defense', { id: 'mod_archetype_stat', type: StatModifierType.FLAT, value: archetype.statBonuses.defense, origin: 'archetype' });
    }
    if (archetype.statBonuses.hp > 0) {
      stats.addModifier('maxHp', { id: 'mod_archetype_stat', type: StatModifierType.FLAT, value: archetype.statBonuses.hp, origin: 'archetype' });
    }
    if (archetype.statBonuses.mp > 0) {
      stats.addModifier('maxMp', { id: 'mod_archetype_stat', type: StatModifierType.FLAT, value: archetype.statBonuses.mp, origin: 'archetype' });
    }

    ToastManager.getInstance().show(`✨ ¡Elegiste el Arquetipo: ${archetype.name}! Atributos y técnicas unlocked.`);

    EventBus.getInstance().emit('progression:archetype_changed', {
      archetypeId,
      archetype,
    });

    this.notifyUpdate();
    this.saveToLocalStorage();
    return true;
  }

  public getProgression(): PlayerProgressionData {
    return {
      level: this.level,
      exp: this.exp,
      maxExp: this.maxExp,
      gold: this.gold,
      gems: this.gems,
      archetypeId: this.archetypeId,
      talentPoints: this.getTalentPoints(),
      unlockedTalents: [...this.unlockedTalents],
      passiveTalentRanks: { ...this.passiveTalentRanks },
    };
  }

  /**
   * Adds Experience points and handles Level Up logic
   */
  public addExp(amount: number): { leveledUp: boolean; newLevel: number } {
    this.exp += amount;
    let leveledUp = false;

    EventBus.getInstance().emit('loot:floating', {
      type: 'EXP',
      title: `+${amount} EXP`,
      subtitle: 'Experiencia Ganada',
    });

    while (this.exp >= this.maxExp) {
      this.exp -= this.maxExp;
      this.level += 1;
      this.maxExp = StatsSystem.getInstance().getExpRequiredForLevel(this.level);
      leveledUp = true;

      // Increase Player Base Stats via StatsSystem
      const gains = StatsSystem.getInstance().getLevelUpStatGains(this.level, this.archetypeId);
      const stats = InventoryManager.getInstance().getPlayerStats();
      
      const atk = stats.getStat('attack');
      const def = stats.getStat('defense');
      const magicAtk = stats.getStat('magicAttack');
      const magicDef = stats.getStat('magicDefense');
      const hp = stats.getStat('maxHp');
      const mp = stats.getStat('maxMp');
      const spd = stats.getStat('speed');

      if (atk) atk.setBaseValue(atk.getBaseValue() + gains.atk);
      if (def) def.setBaseValue(def.getBaseValue() + gains.def);
      if (magicAtk) magicAtk.setBaseValue(magicAtk.getBaseValue() + gains.magicAtk);
      if (magicDef) magicDef.setBaseValue(magicDef.getBaseValue() + gains.magicDef);
      if (hp) hp.setBaseValue(hp.getBaseValue() + gains.hp);
      if (mp) mp.setBaseValue(mp.getBaseValue() + gains.mp);
      if (spd) spd.setBaseValue(spd.getBaseValue() + gains.speed);

      ToastManager.getInstance().show(
        `🎉 ¡NIVEL AUMENTADO! ¡Ahora eres Nivel ${this.level}! (+1 Punto, +${gains.atk} Atq, +${gains.def} Def, +${gains.magicAtk} M.Atq, +${gains.hp} HP)`
      );

      if (this.level === 5) {
        setTimeout(() => {
          ToastManager.getInstance().show(
            `👑 ¡DESBLOQUEO DE ARQUETIPOS Y TALENTOS! Abre el Árbol de Talentos en el Menú para potenciar a Eldor.`
          );
        }, 1500);
      }

      // Check if new tier nodes or skills are unlocked at this new level
      const archetype = this.archetypeId ? ARCHETYPES[this.archetypeId] : null;
      const newSkillsOrTalents: Array<{ name: string; icon: string; description: string; type: string }> = [];

      if (archetype && archetype.talentTree) {
        const newlyUnlockedNodes = archetype.talentTree.filter((node) => node.reqLevel === this.level);
        for (const node of newlyUnlockedNodes) {
          newSkillsOrTalents.push({
            name: node.name,
            icon: node.icon,
            description: node.skillUnlock ? `Técnica: ${node.skillUnlock.name}` : node.description,
            type: `Tier ${node.tier}`,
          });
        }
      }

      EventBus.getInstance().emit('progression:level_up', {
        level: this.level,
        previousLevel: this.level - 1,
        stats: { atk: 3, def: 2, hp: 15, mp: 8, talentPoints: 1 },
        newUnlocks: newSkillsOrTalents,
        archetypeUnlocked: this.level === 5,
        archetype: archetype ? archetype.name : null,
      });
    }

    this.notifyUpdate();
    this.saveToLocalStorage();
    return { leveledUp, newLevel: this.level };
  }

  /**
   * Adds Gold currency
   */
  public addGold(amount: number): void {
    if (amount <= 0) return;
    this.gold += amount;
    ExpeditionManager.getInstance().recordLoot(null as any, 0, true, amount);
    ToastManager.getInstance().show(`💰 +${amount} ORO recibido`);
    EventBus.getInstance().emit('loot:floating', {
      type: 'GOLD',
      title: `+${amount} ORO`,
      subtitle: 'Oro del Reino',
    });
    this.notifyUpdate();
    this.saveToLocalStorage();
  }

  /**
   * Spends Gold if available
   */
  public spendGold(amount: number): boolean {
    if (this.gold < amount) {
      ToastManager.getInstance().show('⚠️ ORO insuficiente.');
      return false;
    }
    this.gold -= amount;
    this.notifyUpdate();
    this.saveToLocalStorage();
    return true;
  }

  /**
   * Adds Gems
   */
  public addGems(amount: number): void {
    if (amount <= 0) return;
    this.gems += amount;
    ToastManager.getInstance().show(`💎 +${amount} GEMAS recibidas`);
    this.notifyUpdate();
    this.saveToLocalStorage();
  }

  public subscribe(callback: (data: PlayerProgressionData) => void): () => void {
    this.emitter.on('updated', callback);
    return () => {
      this.emitter.off('updated', callback);
    };
  }

  private notifyUpdate(): void {
    this.emitter.emit('updated', this.getProgression());
    EventBus.getInstance().emit('progression:updated', this.getProgression());
  }

  private saveToLocalStorage(): void {
    try {
      const data = {
        level: this.level,
        exp: this.exp,
        maxExp: this.maxExp,
        gold: this.gold,
        gems: this.gems,
        archetypeId: this.archetypeId,
        unlockedTalents: this.unlockedTalents,
        passiveTalentRanks: this.passiveTalentRanks,
      };
      localStorage.setItem('jrpg_player_progression', JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save progression to localStorage:', e);
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const raw = localStorage.getItem('jrpg_player_progression');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.level) this.level = parsed.level;
        if (parsed.exp !== undefined) this.exp = parsed.exp;
        if (parsed.maxExp) this.maxExp = parsed.maxExp;
        if (parsed.gold !== undefined) this.gold = parsed.gold;
        if (parsed.gems !== undefined) this.gems = parsed.gems;
        if (Array.isArray(parsed.unlockedTalents)) {
          this.unlockedTalents = parsed.unlockedTalents;
        }
        if (parsed.passiveTalentRanks && typeof parsed.passiveTalentRanks === 'object') {
          this.passiveTalentRanks = parsed.passiveTalentRanks;
        }

        if (parsed.archetypeId) {
          this.archetypeId = parsed.archetypeId;
          // Re-apply stat modifiers after load
          const archetype = ARCHETYPES[parsed.archetypeId];
          if (archetype) {
            const stats = InventoryManager.getInstance().getPlayerStats();
            if (archetype.statBonuses.attack > 0) {
              stats.addModifier('attack', { id: 'mod_archetype_stat', type: StatModifierType.FLAT, value: archetype.statBonuses.attack, origin: 'archetype' });
            }
            if (archetype.statBonuses.defense > 0) {
              stats.addModifier('defense', { id: 'mod_archetype_stat', type: StatModifierType.FLAT, value: archetype.statBonuses.defense, origin: 'archetype' });
            }
            if (archetype.statBonuses.hp > 0) {
              stats.addModifier('maxHp', { id: 'mod_archetype_stat', type: StatModifierType.FLAT, value: archetype.statBonuses.hp, origin: 'archetype' });
            }
            if (archetype.statBonuses.mp > 0) {
              stats.addModifier('maxMp', { id: 'mod_archetype_stat', type: StatModifierType.FLAT, value: archetype.statBonuses.mp, origin: 'archetype' });
            }

            // Re-apply talent bonuses
            if (archetype.talentTree) {
              for (const node of archetype.talentTree) {
                if (this.unlockedTalents.includes(node.id)) {
                  this.applyTalentStatBonus(node);
                }
              }
            }

            // Re-apply passive talent bonuses
            if (archetype.passiveTalents) {
              for (const pnode of archetype.passiveTalents) {
                const rank = this.getPassiveRank(pnode.id);
                if (rank > 0) {
                  this.applyPassiveStatBonus(pnode, rank);
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load progression from localStorage:', e);
    }
  }
}

