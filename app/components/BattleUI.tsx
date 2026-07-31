'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Zap,
  Swords,
  Sparkles,
  Flame,
  Snowflake,
  RefreshCw,
  Heart,
  Droplet,
  Package,
  X,
  ScrollText,
  Info,
  Wand2,
  Skull,
  ChevronRight,
  Crosshair,
  Crown,
  Bomb,
  Feather,
} from 'lucide-react';
import {
  OctopathCombatEngine,
  Combatant,
  EnemyCombatant,
  WeaknessType,
} from '../../game/Systems/OctopathCombatEngine';
import { EventBus } from '../../game/Core/EventBus';
import { FantasySFX } from '../../game/Systems/FantasySFX';
import { PranaFlowEffectsOverlay, PranaGaugeHUD } from './PranaFlowEffectsOverlay';
import { PranaVisualSystem } from '../../game/Effects/PranaVisualSystem';
import { ClaudecraftAssets } from '../../game/Assets/ClaudecraftAssets';

interface BattleUIProps {
  onBattleEnd: () => void;
}

interface FloatingDamageNumber {
  id: string;
  text: string;
  x: number;
  y: number;
  type: 'ENEMY_HIT' | 'PLAYER_HIT' | 'CRITICAL' | 'HEAL' | 'MANA' | 'BREAK';
  isCritical?: boolean;
}

interface PartyMemberVisual {
  id: string;
  name: string;
  role: string;
  hp: number;
  maxHp: number;
  sp: number;
  maxSp: number;
  avatar: string;
  isActive: boolean;
  spriteUrl?: string;
}

type CommandMenuType = 'ATTACK' | 'SKILLS' | 'ITEM' | 'DEFEND' | 'BOOST';

export const BattleUI: React.FC<BattleUIProps> = ({ onBattleEnd }) => {
  const popupIdCounter = useRef(0);

  const [playerState, setPlayer] = useState<Combatant | null>(() => {
    const engine = OctopathCombatEngine.getInstance();
    return engine.player ? { ...engine.player } : null;
  });
  const [enemyState, setEnemy] = useState<EnemyCombatant | null>(() => {
    const engine = OctopathCombatEngine.getInstance();
    return engine.enemy ? { ...engine.enemy } : null;
  });

  const player = useMemo(
    () => playerState || (OctopathCombatEngine.getInstance().player ? { ...OctopathCombatEngine.getInstance().player } : null),
    [playerState]
  );
  const enemy = useMemo(
    () => enemyState || (OctopathCombatEngine.getInstance().enemy ? { ...OctopathCombatEngine.getInstance().enemy } : null),
    [enemyState]
  );
  const [turn, setTurn] = useState<'PLAYER' | 'ENEMY' | 'ENDED'>(() => {
    return OctopathCombatEngine.getInstance().turn || 'PLAYER';
  });
  const [turnNumber, setTurnNumber] = useState(() => {
    return OctopathCombatEngine.getInstance().turnNumber || 1;
  });
  const [combatLog, setCombatLog] = useState<string[]>(() => {
    return [...(OctopathCombatEngine.getInstance().combatLog || [])];
  });

  // Active selected command index in the Octopath bottom-right command stack
  const [selectedCommand, setSelectedCommand] = useState<CommandMenuType>('ATTACK');

  // UI Drawers & Modals
  const [activeDrawer, setActiveDrawer] = useState<'SKILLS' | 'ITEMS' | null>(null);
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [showEnemyInspect, setShowEnemyInspect] = useState<boolean>(false);
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingDamageNumber[]>([]);

  // Radial Menu & Long-Press Threshold State
  const [showRadialMenu, setShowRadialMenu] = useState<boolean>(false);
  const [isHoldingEnemy, setIsHoldingEnemy] = useState<boolean>(false);
  const [holdProgress, setHoldProgress] = useState<number>(0);

  const holdStartTimeRef = useRef<number>(0);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressTriggeredRef = useRef<boolean>(false);

  const startEnemyPress = useCallback(() => {
    isLongPressTriggeredRef.current = false;
    holdStartTimeRef.current = Date.now();
    setIsHoldingEnemy(true);
    setHoldProgress(0);

    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartTimeRef.current;
      const progress = Math.min(1, elapsed / 450);
      setHoldProgress(progress);
    }, 25);

    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      setIsHoldingEnemy(false);
      setHoldProgress(0);
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);

      FantasySFX.getInstance().playMagicCast();
      setShowEnemyInspect(true);
      setShowRadialMenu(false); // Ensure radial menu does NOT show on long press
    }, 450);
  }, []);

  const endEnemyPress = useCallback(() => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    setIsHoldingEnemy(false);

    if (isLongPressTriggeredRef.current) {
      setHoldProgress(0);
      return;
    }

    const elapsed = Date.now() - holdStartTimeRef.current;
    setHoldProgress(0);

    // Quick tap (< 450ms) toggles radial menu
    if (elapsed < 450 && elapsed > 20) {
      FantasySFX.getInstance().playButtonClick();
      setShowRadialMenu((prev) => !prev);
    }
  }, []);

  const cancelEnemyPress = useCallback(() => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    setIsHoldingEnemy(false);
    setHoldProgress(0);
  }, []);

  // Screen Effects
  const [screenShake, setScreenShake] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [screenFlash, setScreenFlash] = useState<'CRITICAL' | 'BREAK' | 'PLAYER_DAMAGE' | null>(null);

  // Ghost HP states
  const [enemyGhostHp, setEnemyGhostHp] = useState<number>(() => enemyState?.hp || 100);
  const [playerGhostHp, setPlayerGhostHp] = useState<number>(() => playerState?.hp || 100);

  // Smooth delayed Ghost HP sync
  useEffect(() => {
    const engine = OctopathCombatEngine.getInstance();
    const currentHp = enemyState?.hp ?? engine.enemy?.hp;
    if (currentHp === undefined) return;
    const timer = setTimeout(() => {
      setEnemyGhostHp(currentHp);
    }, 450);
    return () => clearTimeout(timer);
  }, [enemyState]);

  useEffect(() => {
    const engine = OctopathCombatEngine.getInstance();
    const currentHp = playerState?.hp ?? engine.player?.hp;
    if (currentHp === undefined) return;
    const timer = setTimeout(() => {
      setPlayerGhostHp(currentHp);
    }, 450);
    return () => clearTimeout(timer);
  }, [playerState]);

  const triggerScreenShake = useCallback((intensity = 12) => {
    const offsetX = (popupIdCounter.current % 2 === 0 ? 1 : -1) * intensity;
    const offsetY = (popupIdCounter.current % 3 === 0 ? 0.7 : -0.7) * intensity;
    setScreenShake({ x: offsetX, y: offsetY });
    setTimeout(() => {
      setScreenShake({ x: 0, y: 0 });
    }, 180);
  }, []);

  useEffect(() => {
    const eventBus = EventBus.getInstance();
    const sfx = FantasySFX.getInstance();

    const onStateUpdate = (data: any) => {
      if (data.player) setPlayer({ ...data.player });
      if (data.enemy) setEnemy({ ...data.enemy });
      if (data.turn) setTurn(data.turn);
      if (data.turnNumber) setTurnNumber(data.turnNumber);
      if (data.combatLog) setCombatLog([...data.combatLog]);
    };

    const onBattleEnded = (_data: { result: string }) => {
      setTimeout(() => {
        onBattleEnd();
      }, 1200);
    };

    const handleDamageEvent = (data: {
      target: 'ENEMY' | 'PLAYER';
      value: number;
      isCritical?: boolean;
      isWeakness?: boolean;
      isBreak?: boolean;
      isHeal?: boolean;
      isMana?: boolean;
    }) => {
      popupIdCounter.current += 1;
      const id = `dmg_${popupIdCounter.current}_${Date.now()}`;

      let posX = 35; // Enemy side
      let posY = 40;

      if (data.target === 'PLAYER') {
        posX = 68; // Player team side
        posY = 60;
      }

      let type: FloatingDamageNumber['type'] = data.target === 'ENEMY' ? 'ENEMY_HIT' : 'PLAYER_HIT';
      let text = `${data.value}`;

      if (data.isHeal) {
        type = 'HEAL';
        text = `+${data.value} HP`;
        sfx.playHealChime();
      } else if (data.isMana) {
        type = 'MANA';
        text = `+${data.value} MP`;
        sfx.playMagicCast();
      } else if (data.isBreak) {
        type = 'BREAK';
        text = `⚡ RUPTURA! -${data.value}`;
        sfx.playBreakShatter();
        triggerScreenShake(24);
        setScreenFlash('BREAK');
        setTimeout(() => setScreenFlash(null), 250);
      } else if (data.isCritical) {
        type = 'CRITICAL';
        text = `🔥 CRÍTICO! -${data.value}`;
        sfx.playCriticalHit();
        triggerScreenShake(18);
        setScreenFlash('CRITICAL');
        setTimeout(() => setScreenFlash(null), 200);
      } else {
        text = `-${data.value}`;
        sfx.playSwordSlash();
        triggerScreenShake(8);
        if (data.target === 'PLAYER') {
          setScreenFlash('PLAYER_DAMAGE');
          setTimeout(() => setScreenFlash(null), 180);
        }
      }

      const newPopup: FloatingDamageNumber = {
        id,
        text,
        x: posX,
        y: posY,
        type,
        isCritical: data.isCritical,
      };

      setFloatingNumbers((prev) => [...prev, newPopup]);

      setTimeout(() => {
        setFloatingNumbers((prev) => prev.filter((item) => item.id !== id));
      }, 1150);
    };

    eventBus.on('battle:state_update', onStateUpdate);
    eventBus.on('battle:ended', onBattleEnded);
    eventBus.on('battle:damage', handleDamageEvent);

    return () => {
      eventBus.off('battle:state_update', onStateUpdate);
      eventBus.off('battle:ended', onBattleEnded);
      eventBus.off('battle:damage', handleDamageEvent);
    };
  }, [onBattleEnd, triggerScreenShake]);

  const engine = OctopathCombatEngine.getInstance();
  const sfx = FantasySFX.getInstance();

  const handleBoostClick = useCallback(() => {
    if (turn !== 'PLAYER' || !player) return;
    sfx.playBoostCharge();
    const nextBoost = (player.boostLevel + 1) % (Math.min(3, player.bp) + 1);
    engine.setBoostLevel(nextBoost);
    PranaVisualSystem.getInstance().triggerAbilityPranaBurst(120, 120, 'BOOST', nextBoost);
  }, [turn, player, engine, sfx]);

  const handleAttack = useCallback(() => {
    if (turn !== 'PLAYER' || !player) return;
    sfx.playButtonClick();
    PranaVisualSystem.getInstance().triggerAbilityPranaBurst(120, 120, 'PHYSICAL', player.boostLevel);
    engine.executeAttack();
    setActiveDrawer(null);
  }, [turn, player, engine, sfx]);

  const handleSkillSelect = useCallback((skillId: string) => {
    if (turn !== 'PLAYER' || !player) return;
    sfx.playMagicCast();
    const skill = engine.availableSkills.find((s) => s.id === skillId);
    const category = skill ? skill.category : 'MAGICAL';
    PranaVisualSystem.getInstance().triggerAbilityPranaBurst(120, 120, category, player.boostLevel);
    engine.executeSkill(skillId);
    setActiveDrawer(null);
  }, [turn, player, engine, sfx]);

  const handleDefend = useCallback(() => {
    if (turn !== 'PLAYER') return;
    sfx.playButtonClick();
    engine.executeDefend();
    setActiveDrawer(null);
  }, [turn, engine, sfx]);

  const handleItemSelect = useCallback((type: 'POTION' | 'MANA' | 'HERB' | 'BOMB' | 'ELIXIR_PLUS') => {
    if (turn !== 'PLAYER') return;
    sfx.playHealChime();
    engine.executeItem(type);
    setActiveDrawer(null);
  }, [turn, engine, sfx]);

  const handleStanceToggle = useCallback(() => {
    if (turn !== 'PLAYER') return;
    sfx.playButtonClick();
    engine.toggleStance();
  }, [turn, engine, sfx]);

  if (!player || !enemy) return null;

  const currPlayer = player;
  const currEnemy = enemy;

  // Render Party Members Visuals matching reference image layout (Therion, Ophilia, Crinilla, Cyrus)
  const partyMembers: PartyMemberVisual[] = [
    {
      id: 'therion',
      name: 'Therion',
      role: 'Thief',
      hp: Math.min(2340, Math.round((currPlayer.hp / currPlayer.maxHp) * 2340)),
      maxHp: 2340,
      sp: Math.min(145, Math.round((currPlayer.mp / currPlayer.maxMp) * 145)),
      maxSp: 145,
      avatar: '🗡️',
      isActive: false,
    },
    {
      id: 'ophilia',
      name: 'Ophilia',
      role: 'Cleric',
      hp: 2340,
      maxHp: 2340,
      sp: 145,
      maxSp: 145,
      avatar: '🦯',
      isActive: false,
    },
    {
      id: 'crinilla',
      name: 'Crinilla',
      role: 'Hunter',
      hp: 2340,
      maxHp: 2340,
      sp: 115,
      maxSp: 145,
      avatar: '🏹',
      isActive: false,
    },
    {
      id: 'cyrus',
      name: 'Cyrus',
      role: 'Scholar',
      hp: 2340,
      maxHp: 2340,
      sp: 115,
      maxSp: 145,
      avatar: '📖',
      isActive: turn === 'PLAYER',
    },
  ];

  // Weakness Icon Resolver
  const getWeaknessIcon = (type: WeaknessType) => {
    switch (type) {
      case 'SWORD':
        return <Swords className="w-3.5 h-3.5 text-slate-100" />;
      case 'SPEAR':
        return <Crosshair className="w-3.5 h-3.5 text-slate-100" />;
      case 'BOW':
        return <Feather className="w-3.5 h-3.5 text-slate-100" />;
      case 'FIRE':
        return <Flame className="w-3.5 h-3.5 text-rose-400" />;
      case 'ICE':
        return <Snowflake className="w-3.5 h-3.5 text-sky-300" />;
      case 'ARCANA':
        return <Sparkles className="w-3.5 h-3.5 text-purple-300" />;
    }
  };

  const enemyHpPercent = Math.max(0, Math.min(100, (currEnemy.hp / currEnemy.maxHp) * 100));
  const enemyGhostHpPercent = Math.max(0, Math.min(100, (enemyGhostHp / currEnemy.maxHp) * 100));

  // Default weaknesses list matching Chimera in image
  const defaultWeaknesses: { type: WeaknessType; label: string; revealed: boolean }[] = [
    { type: 'SWORD', label: 'Espada', revealed: true },
    { type: 'SPEAR', label: 'Hacha/Lanza', revealed: true },
    { type: 'ARCANA', label: 'Báculo', revealed: true },
    { type: 'FIRE', label: 'Fuego', revealed: true },
    { type: 'ICE', label: 'Hielo', revealed: true },
  ];

  const weaknessesToDisplay = currEnemy.weaknesses && currEnemy.weaknesses.length > 0
    ? currEnemy.weaknesses
    : defaultWeaknesses;

  return (
    <div
      style={{
        transform: `translate3d(${screenShake.x}px, ${screenShake.y}px, 0)`,
        transition: 'transform 0.05s ease-out',
      }}
      className="battle-viewport fixed inset-0 z-50 pointer-events-auto select-none font-sans overflow-hidden bg-transparent"
    >
      {/* Screen Flash Overlay */}
      <AnimatePresence>
        {screenFlash && (
          <motion.div
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`absolute inset-0 pointer-events-none z-50 ${
              screenFlash === 'BREAK'
                ? 'bg-amber-400/35 backdrop-blur-sm'
                : screenFlash === 'CRITICAL'
                ? 'bg-amber-500/25'
                : 'bg-rose-600/30'
            }`}
          />
        )}
      </AnimatePresence>

      {/* Floating Damage Numbers Overlay */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        <AnimatePresence>
          {floatingNumbers.map((num) => (
            <motion.div
              key={num.id}
              initial={{ opacity: 0, scale: 0.25, y: 15 }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: num.type === 'CRITICAL' || num.type === 'BREAK' ? [0.35, 1.5, 1.25, 0.9] : [0.3, 1.35, 1.1, 0.85],
                y: -65,
              }}
              exit={{ opacity: 0, scale: 0.4 }}
              transition={{ duration: 1.05, ease: [0.175, 0.885, 0.32, 1.275] }}
              style={{
                left: `${num.x}%`,
                top: `${num.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className="absolute select-none pointer-events-none whitespace-nowrap"
            >
              <div
                className={`font-sans font-black tracking-widest leading-none ${
                  num.type === 'CRITICAL'
                    ? 'text-2xl sm:text-4xl text-amber-300 border-2 border-amber-400 bg-amber-950/90 px-3 py-1 rounded-xl shadow-[0_0_25px_rgba(251,191,36,0.9)]'
                    : num.type === 'BREAK'
                    ? 'text-xl sm:text-3xl text-yellow-200 border border-yellow-400 bg-yellow-950/80 px-2.5 py-1 rounded-lg shadow-[0_0_20px_rgba(234,179,8,0.8)]'
                    : num.type === 'HEAL'
                    ? 'text-xl sm:text-3xl text-emerald-300 drop-shadow-[0_0_12px_rgba(52,211,153,0.9)]'
                    : num.type === 'MANA'
                    ? 'text-lg sm:text-2xl text-sky-300 drop-shadow-[0_0_12px_rgba(56,189,248,0.9)]'
                    : num.type === 'PLAYER_HIT'
                    ? 'text-xl sm:text-3xl text-rose-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.95)]'
                    : 'text-2xl sm:text-4xl text-amber-100 drop-shadow-[0_0_18px_rgba(245,158,11,0.95)]'
                }`}
              >
                {num.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* TOP LEFT: BOSS NAME, RED HEALTH BAR, WEAKNESS ROW (Octopath Style) */}
      <div className="absolute top-3 sm:top-4 left-3 sm:left-5 z-40 space-y-1 max-w-[220px] sm:max-w-md">
        {/* Boss Title & Level */}
        <div className="flex items-center gap-1.5 truncate">
          <h1 className="text-base sm:text-2xl font-serif font-bold text-white tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] truncate">
            {currEnemy.name} <span className="text-xs sm:text-sm font-sans text-slate-300 font-normal shrink-0">(Lv. 55)</span>
          </h1>
        </div>

        {/* Red HP Bar */}
        <div className="relative w-48 sm:w-72 h-5 sm:h-6 bg-red-950/90 border border-red-700/80 rounded-sm overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.8)] flex items-center justify-center">
          {/* Ghost Hp */}
          <motion.div
            className="absolute inset-y-0 left-0 bg-rose-400/60"
            animate={{ width: `${enemyGhostHpPercent}%` }}
            transition={{ duration: 0.4 }}
          />
          {/* Active Red Fill */}
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-800 via-rose-600 to-red-500 shadow-inner"
            animate={{ width: `${enemyHpPercent}%` }}
            transition={{ duration: 0.2 }}
          />

          {/* Centered White HP Text */}
          <span className="relative z-10 text-[10px] sm:text-xs font-sans font-bold text-white tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            {currEnemy.hp} / {currEnemy.maxHp} HP
          </span>
        </div>

        {/* Weakness Icons Row & Shield Number below HP bar */}
        <div className="flex items-center gap-1.5 pt-0.5">
          {/* Shield Counter Number */}
          <div className="flex items-center justify-center pr-1 text-white bg-slate-900/80 border border-slate-700 px-1.5 py-0.5 rounded">
            <Shield className="w-3 h-3 text-sky-400 mr-1" />
            <span className="text-xs font-black font-sans leading-none drop-shadow">
              {currEnemy.shieldCurrent}
            </span>
          </div>

          {/* Weaknesses List Boxes */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {weaknessesToDisplay.map((w, idx) => (
              <div
                key={idx}
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-sm bg-slate-900/80 border border-slate-600/80 flex items-center justify-center shadow-md shrink-0"
              >
                {getWeaknessIcon(w.type)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TOP RIGHT: TURN TIMELINE & LOG (Octopath Style) */}
      <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-40 flex flex-col gap-1.5 items-end">
        {/* Turn Queue Cards */}
        <div className="flex items-center sm:flex-col gap-1.5">
          {/* Turn 1: Chimera */}
          <div className="relative flex flex-col items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-900/90 border border-slate-700/80 flex items-center justify-center text-sm sm:text-xl shadow-lg relative overflow-hidden">
              🦁
              <span className="absolute -top-0.5 -left-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-slate-900 border border-slate-700 text-[8px] sm:text-[9px] font-mono text-slate-300 font-bold flex items-center justify-center">
                1
              </span>
            </div>
            <div className="w-7 sm:w-9 h-1 bg-emerald-500 rounded-full mt-0.5 sm:mt-1 border border-slate-900" />
          </div>

          {/* Turn 2: Ophilia */}
          <div className="relative flex flex-col items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-900/90 border border-slate-700/80 flex items-center justify-center text-sm sm:text-xl shadow-lg relative overflow-hidden">
              🧙‍♀️
            </div>
            <div className="w-7 sm:w-9 h-1 bg-emerald-500 rounded-full mt-0.5 sm:mt-1 border border-slate-900" />
          </div>

          {/* Turn 3: Chimera */}
          <div className="relative flex flex-col items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-900/90 border border-slate-700/80 flex items-center justify-center text-sm sm:text-xl shadow-lg relative overflow-hidden">
              🦁
              <span className="absolute -top-0.5 -left-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-slate-900 border border-slate-700 text-[8px] sm:text-[9px] font-mono text-slate-300 font-bold flex items-center justify-center">
                3
              </span>
            </div>
            <div className="w-7 sm:w-9 h-1 bg-emerald-500 rounded-full mt-0.5 sm:mt-1 border border-slate-900" />
          </div>

          {/* Turn 4: Cyrus */}
          <div className="relative flex flex-col items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-900/90 border border-sky-400 flex items-center justify-center text-sm sm:text-xl shadow-[0_0_10px_rgba(56,189,248,0.5)] relative overflow-hidden">
              🧙‍♂️
            </div>
            <div className="w-7 sm:w-9 h-1 bg-cyan-400 rounded-full mt-0.5 sm:mt-1 border border-slate-900" />
          </div>
        </div>

        {/* Quick Log Toggle */}
        <button
          onClick={() => {
            sfx.playButtonClick();
            setShowLogModal(true);
          }}
          className="mt-1 p-1 sm:p-1.5 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white cursor-pointer active:scale-95"
          title="Ver registro"
        >
          <ScrollText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>

      {/* CENTER FIELD OVERLAYS (WEAK Alert & Enemy Target Badge) */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-6 sm:px-16 pt-16 pb-32">
        {/* LEFT FIELD: ENEMY MARKER */}
        <div className="relative flex flex-col items-center justify-end h-48 sm:h-64 w-1/2">
          {/* WEAK! Floating Text Indicator */}
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-2 left-6 sm:left-10 font-sans font-black text-xs sm:text-base text-amber-300 tracking-widest drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
          >
            WEAK!
          </motion.div>

          {/* Compact Enemy Info Marker & Interactive Touch Target */}
          <div className="relative mt-auto flex flex-col items-center">
            {/* Long Press Visual Hold Ring */}
            {isHoldingEnemy && (
              <div className="absolute -inset-5 flex items-center justify-center pointer-events-none z-30">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    className="stroke-slate-900/90"
                    strokeWidth="5"
                    fill="transparent"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    className="stroke-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.9)]"
                    strokeWidth="5"
                    fill="transparent"
                    strokeDasharray={201}
                    strokeDashoffset={201 * (1 - holdProgress)}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-[9px] font-mono font-bold text-amber-300 uppercase tracking-widest bg-slate-950/90 px-1.5 py-0.5 rounded border border-amber-500/50 shadow-md">
                  Inspeccionando...
                </span>
              </div>
            )}

            <div 
              className={`bg-slate-950/90 border border-slate-700/80 px-3 py-1.5 rounded-xl flex flex-col items-center gap-0.5 shadow-2xl backdrop-blur-md pointer-events-auto cursor-pointer select-none transition-all active:scale-95 ${
                isHoldingEnemy ? 'ring-2 ring-amber-400 scale-105' : 'hover:border-amber-500/50'
              }`}
              onMouseDown={startEnemyPress}
              onMouseUp={endEnemyPress}
              onMouseLeave={cancelEnemyPress}
              onTouchStart={startEnemyPress}
              onTouchEnd={endEnemyPress}
              onTouchCancel={cancelEnemyPress}
            >
              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-white font-sans font-bold">
                <Shield className="w-3.5 h-3.5 text-sky-400 fill-sky-950 shrink-0" />
                <span className="truncate max-w-[120px] sm:max-w-none">{currEnemy.name}</span>
              </div>
              <span className="text-[8px] font-mono text-amber-300/80 tracking-tight">
                Tap: Menú Radial | Hold: Inspección
              </span>
            </div>

            {/* RADIAL QUICK-ACTION MENU OVERLAY */}
            <AnimatePresence>
              {showRadialMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="absolute -top-36 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex flex-col items-center"
                >
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    {/* Central Radial Ring Background */}
                    <div className="absolute inset-2 rounded-full border-2 border-amber-500/40 bg-slate-950/95 backdrop-blur-md shadow-[0_0_25px_rgba(0,0,0,0.9)]" />

                    {/* Center Close Button */}
                    <button
                      onClick={() => {
                        FantasySFX.getInstance().playButtonClick();
                        setShowRadialMenu(false);
                      }}
                      className="z-10 w-10 h-10 rounded-full bg-slate-900 border border-amber-500/60 flex items-center justify-center text-amber-400 hover:text-white shadow-lg cursor-pointer active:scale-95"
                      title="Cerrar Radial"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    {/* Radial Option 1: ATTACK (Top) */}
                    <button
                      onClick={() => {
                        setShowRadialMenu(false);
                        handleAttack();
                      }}
                      disabled={turn !== 'PLAYER'}
                      className="absolute -top-1 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-900 border border-amber-400 text-amber-300 font-bold text-[10px] flex items-center gap-1 shadow-lg hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
                    >
                      <Swords className="w-3 h-3 text-amber-400" />
                      <span>ATACAR</span>
                    </button>

                    {/* Radial Option 2: SKILLS (Right) */}
                    <button
                      onClick={() => {
                        setShowRadialMenu(false);
                        setActiveDrawer('SKILLS');
                      }}
                      disabled={turn !== 'PLAYER'}
                      className="absolute top-1/2 -right-6 -translate-y-1/2 px-3 py-1 rounded-full bg-slate-900 border border-sky-400 text-sky-300 font-bold text-[10px] flex items-center gap-1 shadow-lg hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
                    >
                      <Wand2 className="w-3 h-3 text-sky-400" />
                      <span>MAGIA</span>
                    </button>

                    {/* Radial Option 3: DEFEND (Bottom) */}
                    <button
                      onClick={() => {
                        setShowRadialMenu(false);
                        handleDefend();
                      }}
                      disabled={turn !== 'PLAYER'}
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-900 border border-emerald-400 text-emerald-300 font-bold text-[10px] flex items-center gap-1 shadow-lg hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
                    >
                      <Shield className="w-3 h-3 text-emerald-400" />
                      <span>DEFENSA</span>
                    </button>

                    {/* Radial Option 4: DETAILS/INSPECT (Left) */}
                    <button
                      onClick={() => {
                        setShowRadialMenu(false);
                        setShowEnemyInspect(true);
                      }}
                      className="absolute top-1/2 -left-6 -translate-y-1/2 px-3 py-1 rounded-full bg-slate-900 border border-yellow-400 text-yellow-300 font-bold text-[10px] flex items-center gap-1 shadow-lg hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
                    >
                      <Info className="w-3 h-3 text-yellow-400" />
                      <span>DETALLES</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT FIELD: ACTIVE HERO MODEL & PRANA FLOW SHIMMER */}
        <div className="relative flex items-end justify-end h-56 sm:h-72 w-1/2 pr-6 pb-2">
          <div className="relative flex flex-col items-center">
            {/* Prana Particle Canvas & Shimmer Shader */}
            <div className="absolute -inset-10 z-20 pointer-events-none flex items-center justify-center">
              <PranaFlowEffectsOverlay
                bp={currPlayer.bp}
                boostLevel={currPlayer.boostLevel}
                isPlayerTurn={turn === 'PLAYER'}
                className="w-64 h-64"
              />
            </div>

            {/* Glowing Hero Base Platform Circle */}
            <div className={`w-28 h-8 rounded-full border transition-all duration-500 shadow-2xl ${
              currPlayer.boostLevel >= 2
                ? 'bg-amber-500/30 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.8)] scale-110'
                : currPlayer.bp >= 3
                ? 'bg-sky-500/25 border-sky-400 shadow-[0_0_18px_rgba(56,189,248,0.6)]'
                : 'bg-slate-900/60 border-slate-700/60'
            }`} />

            {/* Hero Character Visual Frame */}
            <div className="relative z-10 -mt-20 flex flex-col items-center">
              <motion.div
                animate={{
                  y: [0, -4, 0],
                  scale: currPlayer.boostLevel > 0 ? [1, 1.05, 1] : 1,
                }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className={`relative px-4 py-2 rounded-2xl bg-slate-950/80 border flex flex-col items-center gap-1 backdrop-blur-md shadow-2xl transition-all ${
                  currPlayer.boostLevel > 0
                    ? 'border-amber-400/80 shadow-[0_0_30px_rgba(251,191,36,0.5)]'
                    : 'border-slate-700/80'
                }`}
              >
                <div className="text-3xl sm:text-4xl filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
                  🧙‍♂️
                </div>
                <div className="flex items-center gap-1 font-sans text-[10px] font-bold text-amber-200 uppercase tracking-wider">
                  <span>Eldor</span>
                  <span className="text-[9px] text-sky-300">({currPlayer.stance})</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* TOP RIGHT: PRANA GAUGE HUD */}
      <div className="absolute top-16 right-3 sm:right-6 z-40">
        <PranaGaugeHUD
          bp={currPlayer.bp}
          boostLevel={currPlayer.boostLevel}
          isPlayerTurn={turn === 'PLAYER'}
        />
      </div>

      {/* BOTTOM LEFT: PARTY MEMBERS HUD PANEL (Non-overlapping) */}
      <div className="absolute bottom-3 sm:bottom-6 left-3 sm:left-6 z-40 flex flex-col gap-1 max-w-[calc(100vw-11rem)] sm:max-w-md">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
          {partyMembers.map((member) => (
            <div
              key={member.id}
              className={`p-1.5 sm:p-2 rounded-md border font-sans text-left shadow-xl backdrop-blur-md transition-all ${
                member.isActive
                  ? 'bg-slate-900/95 border-sky-400 ring-1 ring-sky-400/50'
                  : 'bg-slate-950/85 border-slate-800/80'
              }`}
            >
              {/* Header: Name + Avatar */}
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-[10px] sm:text-xs font-bold text-white truncate max-w-[65px] sm:max-w-[80px]">
                  {member.name}
                </span>
                <span className="text-[10px]">{member.avatar}</span>
              </div>

              {/* HP Bar */}
              <div className="space-y-0.5">
                <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-semibold text-slate-300">
                  <span className="text-slate-400">HP</span>
                  <span>{member.hp}/{member.maxHp}</span>
                </div>
                <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-emerald-400 rounded-full"
                    style={{ width: `${(member.hp / member.maxHp) * 100}%` }}
                  />
                </div>
              </div>

              {/* SP Bar */}
              <div className="space-y-0.5 mt-0.5">
                <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-semibold text-slate-300">
                  <span className="text-slate-400">SP</span>
                  <span>{member.sp}/{member.maxSp}</span>
                </div>
                <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-cyan-400 rounded-full"
                    style={{ width: `${(member.sp / member.maxSp) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM RIGHT: OCTOPATH COMMAND MENU STACK (ATTACK, SKILLS, ITEM, DEFEND, BOOST) */}
      <div className="absolute bottom-3 sm:bottom-6 right-3 sm:right-6 z-50 flex flex-col items-end gap-1.5 w-36 sm:w-48">
        {/* Command Buttons Stack */}
        <div className="w-full flex flex-col gap-1 sm:gap-1.5 bg-slate-950/85 p-1.5 sm:p-2 rounded-lg border border-slate-800/80 shadow-2xl backdrop-blur-md">
          {/* 1. ATTACK */}
          <button
            onClick={() => {
              setSelectedCommand('ATTACK');
              handleAttack();
            }}
            disabled={turn !== 'PLAYER'}
            className={`relative w-full py-1.5 sm:py-2.5 px-3 sm:px-4 rounded-sm border font-sans font-bold text-xs sm:text-sm tracking-wider uppercase transition-all flex items-center justify-center cursor-pointer ${
              selectedCommand === 'ATTACK'
                ? 'bg-gradient-to-r from-slate-700/90 via-slate-800/95 to-slate-900/90 border-slate-400 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                : 'bg-slate-900/80 border-slate-700/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {/* Active Chevron Selector Cursor on Left */}
            {selectedCommand === 'ATTACK' && (
              <span className="absolute left-2 text-slate-100 font-mono text-xs sm:text-sm font-black animate-pulse">
                &gt;
              </span>
            )}
            <span>ATTACK</span>
          </button>

          {/* 2. SKILLS */}
          <button
            onClick={() => {
              setSelectedCommand('SKILLS');
              sfx.playButtonClick();
              setActiveDrawer((prev) => (prev === 'SKILLS' ? null : 'SKILLS'));
            }}
            disabled={turn !== 'PLAYER'}
            className={`relative w-full py-1.5 sm:py-2.5 px-3 sm:px-4 rounded-sm border font-sans font-bold text-xs sm:text-sm tracking-wider uppercase transition-all flex items-center justify-center cursor-pointer ${
              selectedCommand === 'SKILLS' || activeDrawer === 'SKILLS'
                ? 'bg-gradient-to-r from-slate-700/90 via-slate-800/95 to-slate-900/90 border-slate-400 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                : 'bg-slate-900/80 border-slate-700/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {selectedCommand === 'SKILLS' && (
              <span className="absolute left-2 text-slate-100 font-mono text-xs sm:text-sm font-black animate-pulse">
                &gt;
              </span>
            )}
            <span>SKILLS</span>
          </button>

          {/* 3. ITEM */}
          <button
            onClick={() => {
              setSelectedCommand('ITEM');
              sfx.playButtonClick();
              setActiveDrawer((prev) => (prev === 'ITEMS' ? null : 'ITEMS'));
            }}
            disabled={turn !== 'PLAYER'}
            className={`relative w-full py-1.5 sm:py-2.5 px-3 sm:px-4 rounded-sm border font-sans font-bold text-xs sm:text-sm tracking-wider uppercase transition-all flex items-center justify-center cursor-pointer ${
              selectedCommand === 'ITEM' || activeDrawer === 'ITEMS'
                ? 'bg-gradient-to-r from-slate-700/90 via-slate-800/95 to-slate-900/90 border-slate-400 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                : 'bg-slate-900/80 border-slate-700/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {selectedCommand === 'ITEM' && (
              <span className="absolute left-2 text-slate-100 font-mono text-xs sm:text-sm font-black animate-pulse">
                &gt;
              </span>
            )}
            <span>ITEM</span>
          </button>

          {/* 4. DEFEND */}
          <button
            onClick={() => {
              setSelectedCommand('DEFEND');
              handleDefend();
            }}
            disabled={turn !== 'PLAYER'}
            className={`relative w-full py-1.5 sm:py-2.5 px-3 sm:px-4 rounded-sm border font-sans font-bold text-xs sm:text-sm tracking-wider uppercase transition-all flex items-center justify-center cursor-pointer ${
              selectedCommand === 'DEFEND'
                ? 'bg-gradient-to-r from-slate-700/90 via-slate-800/95 to-slate-900/90 border-slate-400 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                : 'bg-slate-900/80 border-slate-700/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {selectedCommand === 'DEFEND' && (
              <span className="absolute left-2 text-slate-100 font-mono text-xs sm:text-sm font-black animate-pulse">
                &gt;
              </span>
            )}
            <span>DEFEND</span>
          </button>

          {/* 5. BOOST (x2) */}
          <button
            onClick={() => {
              setSelectedCommand('BOOST');
              handleBoostClick();
            }}
            disabled={turn !== 'PLAYER'}
            className={`relative w-full py-1.5 sm:py-2.5 px-3 sm:px-4 rounded-sm border font-sans font-bold text-xs sm:text-sm tracking-wider uppercase transition-all flex items-center justify-center cursor-pointer ${
              currPlayer.boostLevel > 0
                ? 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 border-yellow-200 text-slate-950 font-black shadow-[0_0_20px_rgba(245,158,11,0.8)]'
                : selectedCommand === 'BOOST'
                ? 'bg-gradient-to-r from-slate-700/90 via-slate-800/95 to-slate-900/90 border-slate-400 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                : 'bg-slate-900/80 border-slate-700/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {selectedCommand === 'BOOST' && currPlayer.boostLevel === 0 && (
              <span className="absolute left-2 text-slate-100 font-mono text-xs sm:text-sm font-black animate-pulse">
                &gt;
              </span>
            )}

            <span>BOOST {currPlayer.boostLevel > 0 ? `(x${1 + currPlayer.boostLevel})` : '(x2)'}</span>

            {/* Sparkle diamond icon on corner */}
            <span className="absolute right-2 text-xs opacity-80">✦</span>
          </button>
        </div>
      </div>

      {/* SKILLS DRAWER MODAL */}
      <AnimatePresence>
        {activeDrawer === 'SKILLS' && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveDrawer(null)}
              className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-xs cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="fixed right-6 bottom-52 z-[70] w-80 bg-slate-950/95 border-2 border-slate-700 rounded-xl p-4 shadow-2xl backdrop-blur-xl space-y-3"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    HABILIDADES Y MAGIA
                  </span>
                </div>
                <button
                  onClick={() => setActiveDrawer(null)}
                  className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Skills List */}
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {engine.availableSkills.map((skill) => {
                  const canAfford = currPlayer.mp >= skill.mpCost;
                  return (
                    <button
                      key={skill.id}
                      disabled={!canAfford || turn !== 'PLAYER'}
                      onClick={() => handleSkillSelect(skill.id)}
                      className={`w-full p-2 rounded border text-left flex items-center justify-between transition-all cursor-pointer ${
                        !canAfford
                          ? 'bg-slate-900/40 border-slate-900 text-slate-600 opacity-50 cursor-not-allowed'
                          : 'bg-slate-900/90 border-slate-700 text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={ClaudecraftAssets.getSkillIcon(skill.id)}
                          alt={skill.name}
                          className="w-8 h-8 rounded bg-slate-950 border border-slate-800 p-0.5 object-contain shrink-0 drop-shadow"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-white truncate">{skill.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{skill.description}</div>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-sky-300 ml-2 shrink-0">
                        {skill.mpCost} MP
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}

        {/* ITEM DRAWER MODAL */}
        {activeDrawer === 'ITEMS' && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveDrawer(null)}
              className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-xs cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="fixed right-6 bottom-52 z-[70] w-80 bg-slate-950/95 border-2 border-slate-700 rounded-xl p-4 shadow-2xl backdrop-blur-xl space-y-3"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    OBJETOS DE COMBATE
                  </span>
                </div>
                <button
                  onClick={() => setActiveDrawer(null)}
                  className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {/* Potion */}
                <button
                  onClick={() => handleItemSelect('POTION')}
                  disabled={(engine.combatItems['POTION'] ?? 0) <= 0 || turn !== 'PLAYER'}
                  className="w-full p-2 rounded border border-slate-700 bg-slate-900/90 text-slate-200 hover:bg-slate-800 flex justify-between items-center cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ClaudecraftAssets.getItemIcon('small_potion')}
                      alt="Poción"
                      className="w-8 h-8 rounded bg-slate-950 border border-slate-800 p-0.5 object-contain shrink-0 drop-shadow"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-white truncate">Poción de Salud</div>
                      <div className="text-[10px] text-emerald-400 truncate">+45 HP</div>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-emerald-300 ml-2 shrink-0">
                    x{engine.combatItems['POTION'] ?? 0}
                  </span>
                </button>

                {/* Mana Elixir */}
                <button
                  onClick={() => handleItemSelect('MANA')}
                  disabled={(engine.combatItems['MANA'] ?? 0) <= 0 || turn !== 'PLAYER'}
                  className="w-full p-2 rounded border border-slate-700 bg-slate-900/90 text-slate-200 hover:bg-slate-800 flex justify-between items-center cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ClaudecraftAssets.getItemIcon('mana_elixir')}
                      alt="Mana"
                      className="w-8 h-8 rounded bg-slate-950 border border-slate-800 p-0.5 object-contain shrink-0 drop-shadow"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-white truncate">Elixir de Maná</div>
                      <div className="text-[10px] text-sky-400 truncate">+25 MP</div>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-sky-300 ml-2 shrink-0">
                    x{engine.combatItems['MANA'] ?? 0}
                  </span>
                </button>

                {/* Herb */}
                <button
                  onClick={() => handleItemSelect('HERB')}
                  disabled={(engine.combatItems['HERB'] ?? 0) <= 0 || turn !== 'PLAYER'}
                  className="w-full p-2 rounded border border-slate-700 bg-slate-900/90 text-slate-200 hover:bg-slate-800 flex justify-between items-center cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ClaudecraftAssets.getItemIcon('baked_bread')}
                      alt="Hierba"
                      className="w-8 h-8 rounded bg-slate-950 border border-slate-800 p-0.5 object-contain shrink-0 drop-shadow"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-white truncate">Hierba de Impulso</div>
                      <div className="text-[10px] text-amber-400 truncate">+2 BP</div>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-amber-300 ml-2 shrink-0">
                    x{engine.combatItems['HERB'] ?? 0}
                  </span>
                </button>

                {/* Bomb */}
                <button
                  onClick={() => handleItemSelect('BOMB')}
                  disabled={(engine.combatItems['BOMB'] ?? 0) <= 0 || turn !== 'PLAYER'}
                  className="w-full p-2 rounded border border-slate-700 bg-slate-900/90 text-slate-200 hover:bg-slate-800 flex justify-between items-center cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ClaudecraftAssets.getItemIcon('ruby_ring')}
                      alt="Bomba"
                      className="w-8 h-8 rounded bg-slate-950 border border-slate-800 p-0.5 object-contain shrink-0 drop-shadow"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-white truncate">Bomba Ígnea</div>
                      <div className="text-[10px] text-rose-400 truncate">24 Daño de Fuego</div>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-rose-300 ml-2 shrink-0">
                    x{engine.combatItems['BOMB'] ?? 0}
                  </span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ENEMY INSPECT POPUP MODAL */}
      <AnimatePresence>
        {showEnemyInspect && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEnemyInspect(false)}
              className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="fixed inset-x-4 top-20 z-50 max-w-sm mx-auto bg-[#0c101d]/98 border-2 border-slate-700 rounded-2xl p-4 shadow-2xl backdrop-blur-2xl space-y-3.5"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    INFORMACIÓN DE OBJETIVO
                  </span>
                </div>
                <button
                  onClick={() => setShowEnemyInspect(false)}
                  className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Enemigo:</span>
                  <span className="font-bold text-white">{currEnemy.name}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Puntos de Vida:</span>
                  <span className="font-bold text-rose-300">{currEnemy.hp} / {currEnemy.maxHp} HP</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Puntos de Escudo:</span>
                  <span className="font-bold text-sky-300">{currEnemy.shieldCurrent} / {currEnemy.shieldMax}</span>
                </div>
              </div>

              <button
                onClick={() => setShowEnemyInspect(false)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Cerrar
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* GRIMORIO LOG MODAL */}
      <AnimatePresence>
        {showLogModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogModal(false)}
              className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="fixed inset-x-4 top-16 bottom-28 z-50 max-w-lg mx-auto bg-[#0c101c]/98 border-2 border-slate-700 rounded-2xl p-4 shadow-2xl backdrop-blur-2xl flex flex-col justify-between"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <ScrollText className="w-4 h-4 text-amber-400" />
                  <span>REGISTRO DE COMBATE</span>
                </div>
                <button
                  onClick={() => setShowLogModal(false)}
                  className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto my-3 space-y-1.5 pr-1 text-xs font-mono">
                {combatLog.map((log, i) => (
                  <div key={i} className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-200">
                    {log}
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowLogModal(false)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Cerrar
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
