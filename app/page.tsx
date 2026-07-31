'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Game } from '@/game/Core/Game';
import { useHUD } from '@/hooks/useHUD';
import { EventBus } from '@/game/Core/EventBus';
import { OverworldScene } from '@/game/Scenes/OverworldScene';
import { TouchControls } from '@/game/Input/TouchControls';
import { ItemManager } from '@/game/Systems/Items/ItemManager';
import { InventoryWindow } from '@/game/UI/Inventory/InventoryWindow';
import { InventoryManager } from '@/game/Systems/Inventory/InventoryManager';
import { InventoryEvents, InventoryEvent } from '@/game/Systems/Inventory/InventoryEvents';
import { Rarity } from '@/game/Systems/Items/Rarity';
import { DatabaseManager } from '@/game/Database/DatabaseManager';
import { World } from '@/game/World/World';
import { LootManager } from '@/game/Systems/Loot/LootManager';
import { LootGenerator } from '@/game/Systems/Loot/LootGenerator';
import { BattleUI } from '@/app/components/BattleUI';
import { JRPGMainMenuModal, MainMenuTab } from '@/components/menu/JRPGMainMenuModal';
import { OctopathCombatEngine } from '@/game/Systems/OctopathCombatEngine';
import { ProgressionManager } from '@/game/Systems/Progression/ProgressionManager';
import { FloatingLootOverlay } from '@/app/components/FloatingLootOverlay';
import { LootSummaryPanel, LootSummaryData } from '@/app/components/LootSummaryPanel';
import { LevelUpOverlay } from '@/app/components/LevelUpOverlay';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ExpeditionHUD } from '@/app/components/ExpeditionHUD';
import { ExpeditionSummaryModal } from '@/app/components/ExpeditionSummaryModal';
import { ExpeditionPortalPromptModal } from '@/app/components/ExpeditionPortalPromptModal';
import { WorldEventModal } from '@/app/components/WorldEventModal';
import { WorldStoryJournalModal } from '@/app/components/WorldStoryJournalModal';
import { PauseMenuModal } from '@/app/components/PauseMenuModal';
import { MapOverlayModal } from '@/app/components/MapOverlayModal';
import { ExpeditionManager } from '@/game/Systems/Expedition/ExpeditionManager';
import { SafeZoneSystem } from '@/game/Systems/SafeZoneSystem';
import { 
  Compass, 
  Keyboard, 
  ShieldAlert, 
  Bug, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  MessageSquare,
  Eye,
  Sparkles,
  Layers,
  Activity,
  Smartphone,
  Monitor,
  Sliders,
  RotateCw,
  Heart,
  Zap,
  Crown,
  MapPin,
  Map,
  X,
  Home,
  Trees,
  Skull,
  ChevronRight,
  ChevronDown,
  Coins,
  Menu,
  Backpack,
  User,
  Shield,
  Sword,
  Settings
} from 'lucide-react';

/**
 * Main game execution portal.
 * Instantiates the Three.js engine and mounts it to a full-screen DOM canvas.
 * Implements a JRPG aesthetic splash screen during preloading.
 * Includes a real-time responsive Debug Overlay mapping key telemetry metrics.
 * Incorporates active dialogue panels and proximity action prompt overlays.
 */
export default function GamePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [activeSceneName, setActiveSceneName] = useState('Overworld');

  // Interactive haptic touch feedback trail
  interface TouchPulse {
    id: string;
    x: number;
    y: number;
    isDrag?: boolean;
  }
  const [pulses, setPulses] = useState<TouchPulse[]>([]);
  const lastDragPos = useRef<{ x: number; y: number } | null>(null);

  // Dialogue panel states with multi-line index metadata
  const { 
    notifications, 
    addNotification, 
    dialog, 
    setDialog,
    heroHp, 
    setHeroHp, 
    heroMaxHp, 
    setHeroMaxHp, 
    heroMp, 
    setHeroMp, 
    heroMaxMp, 
    setHeroMaxMp,
    heroPrana,
    heroMaxPrana,
    heroKarma
  } = useHUD();

  const addNotificationRef = useRef(addNotification);
  useEffect(() => {
    addNotificationRef.current = addNotification;
  }, [addNotification]);

  const [nearInteractable, setNearInteractable] = useState<{ id: string; type: string; text: string } | null>(null);

  // Debug overlay states
  const [showDebug, setShowDebug] = useState(false);
  const [debugData, setDebugData] = useState<{
    fps: number;
    playerX: number;
    playerY: number;
    playerZ: number;
    state: string;
    direction: string;
    animation: string;
    activeEntities?: number;
    collidersEnabled?: boolean;
    autoOrbitEnabled?: boolean;
  } | null>(null);

  // Interactive zoom level state
  const [zoomFactor, setZoomFactor] = useState(1.0);

  // Mobile telemetry states
  const [telemetry, setTelemetry] = useState<{
    fps: number;
    drawCalls: number;
    triangles: number;
    geometries: number;
    textures: number;
    quality: string;
    device: string;
    os: string;
    dpi: number;
    screenSize: string;
  } | null>(null);

  const [forceTouch, setForceTouch] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [showWorldMap, setShowWorldMap] = useState(false);
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);
  const [mainMenuTab, setMainMenuTab] = useState<MainMenuTab>('INVENTORY');
  const [victorySummary, setVictorySummary] = useState<LootSummaryData | null>(null);

  // Expedition & World Story System Modal States
  const [portalPromptData, setPortalPromptData] = useState<{ targetMapId: string; targetName: string; targetX?: number; targetZ?: number } | null>(null);
  const [showExpeditionSummary, setShowExpeditionSummary] = useState(false);
  const [showWorldJournalModal, setShowWorldJournalModal] = useState(false);
  const [showMapOverlayModal, setShowMapOverlayModal] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Keyboard shortcut listener for Tactical Map (M) or Main Menu (Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyM') {
        setShowMapOverlayModal(prev => !prev);
      } else if (e.code === 'Escape' && isMainMenuOpen) {
        setIsMainMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMainMenuOpen]);

  // Map Transition States
  const [currentMapInfo, setCurrentMapInfo] = useState<{ id: string; name: string; subtitle: string; type: string }>({
    id: 'village',
    name: 'Pueblo de Eldoria',
    subtitle: 'El pacífico valle central',
    type: 'village',
  });
  const [mapBanner, setMapBanner] = useState<{ name: string; subtitle: string } | null>(null);
  const [fadeOpacity, setFadeOpacity] = useState(0);

  // Turn-Based Octopath Combat System State
  const [isBattleActive, setIsBattleActive] = useState(false);
  const [currentLootTable, setCurrentLootTable] = useState<string>('slime_loot_table');

  // Item System Debugger States
  const [debugTab, setDebugTab] = useState<'TELEMETRY' | 'ITEMS' | 'LOOT'>('TELEMETRY');
  const [itemInstances, setItemInstances] = useState<any[]>([]);
  const [spawnRarity, setSpawnRarity] = useState<Rarity>(Rarity.COMMON);

  // Loot Simulation States
  const [simulationTable, setSimulationTable] = useState<string>('slime_loot_table');
  const [simulationLuck, setSimulationLuck] = useState<number>(0);
  const [simulationCount, setSimulationCount] = useState<number>(100);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);

  const runLootSimulation = (tableId: string = simulationTable, luck: number = simulationLuck, count: number = simulationCount) => {
    const lootManager = LootManager.getInstance();
    const table = lootManager.getTable(tableId);
    if (!table) return;

    const rarityCounts: Record<Rarity, number> = {
      [Rarity.COMMON]: 0,
      [Rarity.UNCOMMON]: 0,
      [Rarity.RARE]: 0,
      [Rarity.EPIC]: 0,
      [Rarity.LEGENDARY]: 0,
      [Rarity.MYTHIC]: 0,
    };

    const itemCounts: Record<string, { name: string; count: number; totalValue: number; rarity: Rarity }> = {};
    let totalItems = 0;

    for (let i = 0; i < count; i++) {
      const rolls = LootGenerator.generate(table, luck);
      for (const roll of rolls) {
        const instance = roll.instance;
        const rollCount = roll.count;
        
        rarityCounts[instance.rarity] += rollCount;
        totalItems += rollCount;

        const def = DatabaseManager.getInstance().getItemDefinition(instance.definitionId);
        const name = def?.name || instance.definitionId;
        const val = (def?.baseValue || 0) * rollCount;

        if (!itemCounts[instance.definitionId]) {
          itemCounts[instance.definitionId] = { name, count: 0, totalValue: 0, rarity: instance.rarity };
        }
        itemCounts[instance.definitionId].count += rollCount;
        itemCounts[instance.definitionId].totalValue += val;
      }
    }

    setSimulationResult({
      totalRuns: count,
      totalItems,
      rarityCounts,
      itemCounts: Object.entries(itemCounts).map(([id, data]) => ({
        id,
        ...data,
      })),
    });
  };

  useEffect(() => {
    const itemManager = ItemManager.getInstance();
    const updateInstancesList = () => {
      setItemInstances(itemManager.getAllInstances());
    };

    // Set initial list
    updateInstancesList();

    // Subscribe to item system changes
    itemManager.subscribe('onItemCreated', updateInstancesList);
    itemManager.subscribe('onItemDestroyed', updateInstancesList);
    itemManager.subscribe('onItemModified', updateInstancesList);

    // Pre-populate with beautiful demo items if empty
    if (itemManager.getAllInstances().length === 0) {
      try {
        itemManager.createItem('iron_sword', Rarity.COMMON);
        itemManager.createItem('small_potion', Rarity.RARE);
      } catch (err) {
        console.warn('Could not pre-populate demo items:', err);
      }
    }

    return () => {
      itemManager.unsubscribe('onItemCreated', updateInstancesList);
      itemManager.unsubscribe('onItemDestroyed', updateInstancesList);
      itemManager.unsubscribe('onItemModified', updateInstancesList);
    };
  }, []);

  // Octopath Battle System Listener & Reward Generation
  useEffect(() => {
    const eventBus = EventBus.getInstance();
    
    const onBattleStart = (params: any) => {
      if (!SafeZoneSystem.getInstance().canInitiateBattle()) {
        console.warn('[Battle] Blocked battle start inside Safe Zone.');
        return;
      }
      setCurrentLootTable(params.lootTableId || 'slime_loot_table');
      OctopathCombatEngine.getInstance().startBattle(params);
      setIsBattleActive(true);

      const game = Game.getInstance();
      if (game) {
        game.scenes.switchTo('Battle', { enemyClassId: params.enemyClassId });
      }
    };

    const onBattleEnded = (data: { result: string; enemyId?: string }) => {
      setIsBattleActive(false);
      const game = Game.getInstance();
      if (game) {
        game.scenes.switchTo('Overworld');
      }

      if (data.result === 'VICTORY') {
        // 1. Award Loot directly into Player's Inventory
        const rewards = InventoryManager.getInstance().rewardLoot(currentLootTable, 0);

        // 2. Award Experience and Gold based on encounter difficulty
        const isBoss = currentLootTable.includes('boss') || currentLootTable.includes('dragon');
        const expAward = isBoss ? 200 : currentLootTable.includes('goblin') ? 60 : 35;
        const goldAward = isBoss ? 150 : currentLootTable.includes('goblin') ? 40 : 20;

        ProgressionManager.getInstance().addExp(expAward);
        ProgressionManager.getInstance().addGold(goldAward);

        addNotificationRef.current(
          `🏆 ¡Victoria! +${expAward} EXP y +${goldAward} ORO conseguidos. Recompensas guardadas en la Mochila.`,
          'success',
          4500
        );

        setVictorySummary({
          expGained: expAward,
          goldGained: goldAward,
          items: rewards.map((r: any) => ({
            name: r.name,
            rarity: r.rarity,
            count: r.count,
            added: r.added,
            definitionId: r.definitionId,
            category: r.category,
            description: r.description,
            equipmentSlot: r.equipmentSlot,
          })),
          enemyName: data.enemyId || (isBoss ? 'Jefe Dracónico' : 'Enemigo del Reino'),
        });
      } else if (data.result === 'FLED') {
        addNotificationRef.current(`🏃 Has escapado del combate a salvo.`, 'warning', 3000);
      } else if (data.result === 'DEFEAT') {
        addNotificationRef.current(`☠️ Has sido derrotado. Te recuperas en el campamento.`, 'warning', 4000);
      }
    };

    eventBus.on('battle:start', onBattleStart);
    eventBus.on('battle:ended', onBattleEnded);

    return () => {
      eventBus.off('battle:start', onBattleStart);
      eventBus.off('battle:ended', onBattleEnded);
    };
  }, [currentLootTable]);

  const handleSpawnItem = (definitionId: string) => {
    try {
      const item = ItemManager.getInstance().createItem(definitionId, spawnRarity);
      addNotification(`¡Instancia creada! ${item.uuid.substring(0, 8)}... (${spawnRarity})`, 'success', 3000);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDeleteInstance = (uuid: string) => {
    ItemManager.getInstance().destroyItem(uuid);
    addNotification(`Instancia eliminada: ${uuid.substring(0, 8)}...`, 'warning', 3000);
  };

  // Sync zoom factor changes directly with the active CameraController
  useEffect(() => {
    if (isReady) {
      Game.getInstance()?.camController?.setZoomFactor(zoomFactor);
    }
  }, [zoomFactor, isReady]);

  const addPulse = (x: number, y: number, isDrag = false) => {
    const id = `${Date.now()}-${Math.random()}`;
    setPulses((prev) => [...prev, { id, x, y, isDrag }]);
    setTimeout(() => {
      setPulses((prev) => prev.filter((p) => p.id !== id));
    }, 600);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Prevent overlay interactions from triggering touch pulses
    if ((e.target as HTMLElement).closest('.hud-overlay')) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    addPulse(e.clientX, e.clientY, false);
    lastDragPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.hud-overlay')) return;
    if (!lastDragPos.current) return;
    const dx = e.clientX - lastDragPos.current.x;
    const dy = e.clientY - lastDragPos.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 45) {
      addPulse(e.clientX, e.clientY, true);
      lastDragPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUpOrCancel = () => {
    lastDragPos.current = null;
  };

  // For pinch-to-zoom on touch screens
  const touchStartDist = useRef<number | null>(null);
  const initialZoomFactor = useRef<number>(1.0);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDist.current = Math.sqrt(dx * dx + dy * dy);
      initialZoomFactor.current = zoomFactor;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchStartDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (touchStartDist.current > 0) {
        const ratio = dist / touchStartDist.current;
        // In our game, zoomFactor decreases to zoom in (closer) and increases to zoom out (further away)
        // If fingers spread (ratio > 1), we want to zoom in (smaller zoomFactor)
        // If fingers pinch (ratio < 1), we want to zoom out (larger zoomFactor)
        const newZoom = Math.max(0.5, Math.min(2.5, initialZoomFactor.current / ratio));
        setZoomFactor(newZoom);
      }
    }
  };

  const handleTouchEndOrCancel = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) {
      touchStartDist.current = null;
    }
  };

  // Toggle wireframes from UI button
  const handleToggleColliders = () => {
    const game = Game.getInstance();
    const activeScene = game?.scenes?.current;
    if (activeScene && typeof (activeScene as any).getWorld === 'function') {
      const world = (activeScene as any).getWorld();
      if (world) {
        const nextVal = !world.isDebugEnabled();
        world.setDebugEnabled(nextVal);
        setDebugData(prev => prev ? { ...prev, collidersEnabled: nextVal } : null);
      }
    }
  };

  const handleChangeQuality = (level: 'LOW' | 'MEDIUM' | 'HIGH') => {
    EventBus.getInstance().emit('quality:set', level);
    // Locally simulate immediately for fast feel
    if (telemetry) {
      setTelemetry(prev => prev ? { ...prev, quality: level } : null);
    }
  };

  const handleToggleTouch = () => {
    const nextVal = !forceTouch;
    setForceTouch(nextVal);
    EventBus.getInstance().emit('debug:touch:toggle', { force: nextVal });
  };

  const handleToggleAutoOrbit = () => {
    const game = Game.getInstance();
    if (game?.camController) {
      const nextVal = !game.camController.isAutoOrbitEnabled();
      game.camController.setAutoOrbit(nextVal);
      setDebugData(prev => prev ? { ...prev, autoOrbitEnabled: nextVal } : null);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const eventBus = EventBus.getInstance();

    // Callback listeners to capture loading milestones
    const onProgress = (progress: number) => {
      setLoadingProgress(progress);
    };

    const onReady = (sceneName: string) => {
      setActiveSceneName(sceneName);
      // Wait slightly for smooth presentation fadeout
      setTimeout(() => {
        setIsReady(true);
      }, 800);
    };

    const onDebug = (data: any) => {
      setDebugData(data);
    };

    const onDialog = (data: any) => {
      setDialog(data);
    };

    const onDialogStart = (data: any) => {
      setDialog({
        id: data.id,
        sender: data.speaker,
        text: data.text,
        lineIndex: data.lineIndex,
        totalLines: data.totalLines,
      });
    };

    const onDialogUpdate = (data: any) => {
      setDialog({
        id: data.id,
        sender: data.speaker,
        text: data.text,
        lineIndex: data.lineIndex,
        totalLines: data.totalLines,
      });
    };

    const onDialogEnd = () => {
      setDialog(null);
    };

    const onNotify = (data: any) => {
      addNotificationRef.current(data.message, data.type || 'info', 4000);
    };

    const onProximity = (data: any) => {
      if (data.near) {
        setNearInteractable({ id: data.id, type: data.type, text: data.text });
      } else {
        setNearInteractable(prev => prev && prev.id === data.id ? null : prev);
        // Clean active dialog immediately if player walks out of proximity zone
        setDialog(prev => prev && prev.id === data.id ? null : prev);
      }
    };

    const onTelemetry = (data: any) => {
      setTelemetry(data);
    };

    const onInventoryToggle = () => {
      InventoryManager.getInstance().toggleInventory();
    };

    const onInventoryOpened = () => {
      setIsInventoryOpen(true);
    };

    const onInventoryClosed = () => {
      setIsInventoryOpen(false);
    };

    const onMapChanged = (data: { id: string; name: string; subtitle: string; type: string }) => {
      setCurrentMapInfo(data);
      setMapBanner({ name: data.name, subtitle: data.subtitle });
      setTimeout(() => {
        setMapBanner(null);
      }, 3500);
    };

    const onFadeUpdate = (data: { opacity: number; phase: string; targetName?: string }) => {
      setFadeOpacity(data.opacity);
    };

    const onMapChangeRequestPrompt = (data: { targetMapId: string; targetName?: string; targetX?: number; targetZ?: number }) => {
      if (data.targetMapId !== 'village' && ExpeditionManager.getInstance().getZoneInfo().level === 'SAFE') {
        setPortalPromptData({
          targetMapId: data.targetMapId,
          targetName: data.targetName || 'Zona de Expedición',
          targetX: data.targetX,
          targetZ: data.targetZ,
        });
      } else {
        EventBus.getInstance().emit('map:change_request', data);
      }
    };

    const onExpeditionSummary = () => {
      setShowExpeditionSummary(true);
    };

    const onPauseOpened = () => setIsPaused(true);
    const onPauseClosed = () => setIsPaused(false);

    eventBus.on('ui:pause_overlay:opened', onPauseOpened);
    eventBus.on('ui:pause_overlay:closed', onPauseClosed);

    eventBus.on('map:change_request_prompt', onMapChangeRequestPrompt);
    eventBus.on('expedition:extracted', onExpeditionSummary);
    eventBus.on('expedition:defeated', onExpeditionSummary);

    eventBus.on('asset:progress', onProgress);
    eventBus.on('scene:ready', onReady);
    eventBus.on('game:debug', onDebug);
    eventBus.on('hud:dialog', onDialog);
    eventBus.on('dialog:start', onDialogStart);
    eventBus.on('dialog:update', onDialogUpdate);
    eventBus.on('dialog:end', onDialogEnd);
    eventBus.on('hud:notify', onNotify);
    eventBus.on('interaction:proximity', onProximity);
    eventBus.on('telemetry:tick', onTelemetry);
    eventBus.on('map:changed', onMapChanged);
    eventBus.on('map:fade_update', onFadeUpdate);
    
    eventBus.on('input:INVENTORY:down', onInventoryToggle);
    InventoryEvents.subscribe(InventoryEvent.ON_INVENTORY_OPENED, onInventoryOpened);
    InventoryEvents.subscribe(InventoryEvent.ON_INVENTORY_CLOSED, onInventoryClosed);

    // Boot Three.js engine onto the target viewport div
    const gameEngine = Game.init(containerRef.current);

    // Cleanup hook on unmount (prevents canvas accumulation during Next.js live edits)
    return () => {
      eventBus.off('ui:pause_overlay:opened', onPauseOpened);
      eventBus.off('ui:pause_overlay:closed', onPauseClosed);
      eventBus.off('map:change_request_prompt', onMapChangeRequestPrompt);
      eventBus.off('expedition:extracted', onExpeditionSummary);
      eventBus.off('expedition:defeated', onExpeditionSummary);
      eventBus.off('asset:progress', onProgress);
      eventBus.off('scene:ready', onReady);
      eventBus.off('game:debug', onDebug);
      eventBus.off('hud:dialog', onDialog);
      eventBus.off('dialog:start', onDialogStart);
      eventBus.off('dialog:update', onDialogUpdate);
      eventBus.off('dialog:end', onDialogEnd);
      eventBus.off('hud:notify', onNotify);
      eventBus.off('interaction:proximity', onProximity);
      eventBus.off('telemetry:tick', onTelemetry);
      eventBus.off('map:changed', onMapChanged);
      eventBus.off('map:fade_update', onFadeUpdate);
      
      eventBus.off('input:INVENTORY:down', onInventoryToggle);
      InventoryEvents.unsubscribe(InventoryEvent.ON_INVENTORY_OPENED, onInventoryOpened);
      InventoryEvents.unsubscribe(InventoryEvent.ON_INVENTORY_CLOSED, onInventoryClosed);
      gameEngine.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main 
      className="relative w-screen h-screen overflow-hidden bg-[#0a0c10] select-none text-slate-100 font-sans touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUpOrCancel}
      onPointerCancel={handlePointerUpOrCancel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEndOrCancel}
      onTouchCancel={handleTouchEndOrCancel}
    >
      {/* Three.js canvas mount point */}
      <div 
        id="game-viewport" 
        ref={containerRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Cinematic Vignette Overlay */}
      <div 
        id="viewport-vignette"
        className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(4,6,12,0.45)_85%,rgba(2,3,6,0.75)_100%)]"
      />

      {/* Top Header HUD Container (Compact Consolidated Hero Status + Zone & Menu Pill) */}
      <AnimatePresence>
        {isReady && !isBattleActive && !dialog && (
          <div className="hud-overlay absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 flex items-center justify-between gap-2 z-40 pointer-events-none">
            {/* Sleek Yggdrasil-Samsara Hero Status Capsule */}
            {(() => {
              const isHeroLowHealth = heroMaxHp > 0 && (heroHp / heroMaxHp) <= 0.3;
              return (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={
                    isHeroLowHealth
                      ? {
                          opacity: 1,
                          y: 0,
                          borderColor: [
                            'rgba(244, 63, 94, 0.4)',
                            'rgba(244, 63, 94, 1.0)',
                            'rgba(244, 63, 94, 0.4)',
                          ],
                          boxShadow: [
                            '0 0 10px rgba(244, 63, 94, 0.2)',
                            '0 0 20px rgba(244, 63, 94, 0.6)',
                            '0 0 10px rgba(244, 63, 94, 0.2)',
                          ],
                        }
                      : {
                          opacity: 1,
                          y: 0,
                          borderColor: 'rgba(217, 119, 6, 0.4)',
                          boxShadow: '0 8px 30px -5px rgba(0, 0, 0, 0.85)',
                        }
                  }
                  transition={
                    isHeroLowHealth
                      ? {
                          borderColor: { repeat: Infinity, duration: 2.0, ease: 'easeInOut' },
                          boxShadow: { repeat: Infinity, duration: 2.0, ease: 'easeInOut' },
                        }
                      : { delay: 0.2, duration: 0.5 }
                  }
                  className="hud-overlay flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-[#0c1017]/95 via-[#0e1713]/95 to-[#0f1422]/95 border border-amber-500/35 p-1.5 sm:p-2.5 rounded-2xl backdrop-blur-md pointer-events-auto border-l-4 border-l-emerald-500 shadow-2xl max-w-[78vw] sm:max-w-none"
                >
                  {/* Yggdrasil Emblem & Hero Title */}
                  <div className="flex items-center gap-1.5 bg-gradient-to-br from-emerald-950/80 to-amber-950/80 border border-emerald-500/40 px-2.5 py-1.5 rounded-xl shrink-0 shadow-inner">
                    <div className="relative flex items-center justify-center p-1 bg-emerald-500/20 rounded-lg border border-emerald-400/40 text-emerald-300">
                      <Trees className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <Sparkles className="w-2.5 h-2.5 text-amber-300 absolute -top-1 -right-1" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-cinzel font-black text-xs sm:text-sm text-amber-100 uppercase tracking-widest truncate">
                          ELDOR
                        </span>
                        <span className="font-mono text-[9px] font-bold text-amber-300 bg-amber-950/90 px-1.5 py-0.2 rounded border border-amber-600/40 shrink-0">
                          Nv.1
                        </span>
                      </div>
                      <span className="font-cinzel text-[9px] text-emerald-300/90 font-bold tracking-wider hidden sm:block truncate">
                        Einherjar • Yggdrasil
                      </span>
                    </div>
                  </div>

                  {/* Triple Gauges: HP, MP & Energía Pránica */}
                  <div className="flex flex-col gap-1 min-w-[90px] sm:min-w-[140px]">
                    {/* HP Micro Bar */}
                    <div className="flex items-center gap-1.5">
                      <span className="font-cinzel text-[9px] font-black text-emerald-400 w-4 shrink-0 flex items-center gap-0.5">
                        <Heart className="w-2.5 h-2.5 fill-emerald-500/30 inline sm:hidden" />
                        <span className="hidden sm:inline">HP</span>
                      </span>
                      <div className="h-1.5 flex-1 bg-slate-950/90 rounded-full overflow-hidden border border-slate-800/80 shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-green-300 rounded-full transition-all duration-300"
                          style={{ width: `${(heroHp / heroMaxHp) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-[9px] text-emerald-200 font-bold hidden sm:inline shrink-0">
                        {heroHp}/{heroMaxHp}
                      </span>
                    </div>

                    {/* MP Micro Bar */}
                    <div className="flex items-center gap-1.5">
                      <span className="font-cinzel text-[9px] font-black text-sky-400 w-4 shrink-0 flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5 fill-sky-500/30 inline sm:hidden" />
                        <span className="hidden sm:inline">MP</span>
                      </span>
                      <div className="h-1.5 flex-1 bg-slate-950/90 rounded-full overflow-hidden border border-slate-800/80 shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 via-blue-400 to-indigo-300 rounded-full transition-all duration-300"
                          style={{ width: `${(heroMp / heroMaxMp) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-[9px] text-sky-200 font-bold hidden sm:inline shrink-0">
                        {heroMp}/{heroMaxMp}
                      </span>
                    </div>

                    {/* PRANA (Energía Pránica) Micro Bar */}
                    <div className="flex items-center gap-1.5">
                      <span className="font-cinzel text-[9px] font-black text-teal-300 w-4 shrink-0 flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5 text-teal-300 inline sm:hidden" />
                        <span className="hidden sm:inline">PRANA</span>
                      </span>
                      <div className="h-1.5 flex-1 bg-slate-950/90 rounded-full overflow-hidden border border-teal-900/50 shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-300 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(45,212,191,0.5)]"
                          style={{ width: `${(heroPrana / heroMaxPrana) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-[9px] text-teal-200 font-bold hidden sm:inline shrink-0">
                        {heroPrana}/{heroMaxPrana}
                      </span>
                    </div>
                  </div>

                  {/* KARMA & Oro Rúnico Cluster */}
                  <div className="hidden md:flex flex-col gap-1 pl-2.5 border-l border-amber-500/30 font-cinzel text-[10px] shrink-0">
                    {/* Rueda del Karma Indicator */}
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold tracking-wider bg-amber-950/50 px-2 py-0.5 rounded-lg border border-amber-500/30">
                      <RotateCw className="w-3 h-3 text-amber-400 animate-spin" style={{ animationDuration: '12s' }} />
                      <span className="uppercase text-[9px]">KARMA:</span>
                      <span className="font-mono text-amber-200 font-black">+{heroKarma}</span>
                    </div>

                    {/* Monedas Karma */}
                    <div className="flex items-center gap-1 text-yellow-300 font-mono text-[10px] font-bold px-1">
                      <span>💰 150</span>
                      <span className="text-[9px] font-cinzel text-amber-400/80 font-semibold">KARMA</span>
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            {/* Right Cluster: Zone Quick Pill & JRPG Menu Trigger */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="hud-overlay flex items-center gap-1.5 sm:gap-2 pointer-events-auto shrink-0"
            >
              {/* Map Location Pill */}
              <button
                onClick={() => {
                  setMainMenuTab('MAP');
                  setIsMainMenuOpen(true);
                }}
                className="flex items-center gap-1.5 bg-[#0c1017]/85 hover:bg-[#151c2a] border border-amber-500/35 hover:border-amber-400 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-2xl shadow-xl backdrop-blur-md transition-all active:scale-95 cursor-pointer group"
                title="Ver Mapa del Reino (M)"
              >
                <MapPin className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                <span className="font-sans font-bold text-amber-200 text-[10px] sm:text-xs tracking-wide uppercase max-w-[90px] sm:max-w-none truncate">
                  {currentMapInfo.name}
                </span>
              </button>

              {/* Main Menu Button */}
              <button
                onClick={() => {
                  setMainMenuTab('INVENTORY');
                  setIsMainMenuOpen(true);
                }}
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-400 hover:to-yellow-400 text-amber-950 font-black px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl shadow-[0_0_15px_rgba(245,158,11,0.35)] backdrop-blur-md transition-all active:scale-95 cursor-pointer border border-amber-300 shrink-0"
                title="Abrir Menú Principal (M)"
              >
                <Menu className="w-4 h-4 text-amber-950 shrink-0" />
                <span className="font-sans font-black text-xs tracking-wider uppercase hidden sm:inline">MENÚ</span>
              </button>

              {/* Debug Toggle Button */}
              <button
                onClick={() => setShowDebug((prev) => !prev)}
                className="p-2 sm:p-2.5 rounded-2xl bg-[#0c1017]/85 hover:bg-[#151c2a] border border-slate-800 hover:border-slate-600 shadow-xl backdrop-blur-md transition-all active:scale-95 cursor-pointer shrink-0"
                title={showDebug ? "Ocultar Depuración" : "Mostrar Depuración"}
              >
                <Bug className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${showDebug ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fullscreen Map Transition Fade-to-Black Overlay */}
      <div
        className="fixed inset-0 bg-black z-50 transition-opacity duration-75 flex flex-col items-center justify-center"
        style={{
          opacity: fadeOpacity,
          pointerEvents: fadeOpacity > 0.05 ? 'auto' : 'none',
        }}
      >
        {fadeOpacity > 0.3 && (
          <div className="flex flex-col items-center gap-2 text-amber-200">
            <Compass className="w-8 h-8 animate-spin text-amber-400" style={{ animationDuration: '3s' }} />
            <span className="font-sans font-bold text-xs tracking-widest uppercase text-amber-100">
              Cargando zona...
            </span>
          </div>
        )}
      </div>

      {/* Map Transition Announcement Banner */}
      <AnimatePresence>
        {mapBanner && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="fixed top-12 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center justify-center bg-[#0d111a]/95 border-2 border-amber-500/60 px-8 py-4 rounded-2xl shadow-[0_0_50px_rgba(217,119,6,0.4)] backdrop-blur-md text-center min-w-[280px]"
          >
            <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} /> Entrada a nueva zona
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-amber-100 tracking-wide font-sans mt-1">
              {mapBanner.name}
            </h2>
            <p className="text-xs text-slate-300 font-sans italic mt-0.5">
              {mapBanner.subtitle}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* World Map Fast Travel Modal */}
      <AnimatePresence>
        {isReady && showWorldMap && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setShowWorldMap(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0d121c] border-2 border-amber-500/60 rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-[0_0_50px_rgba(217,119,6,0.25)] flex flex-col gap-5 text-slate-100"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-amber-900/40">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Map className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-cinzel font-black text-lg text-amber-100 tracking-wider uppercase">
                      MAPA DEL MUNDO
                    </h2>
                    <p className="text-xs text-slate-400 font-sans">
                      Selecciona un destino para viajar rápidamente
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWorldMap(false)}
                  className="p-1.5 rounded-full bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Region Cards */}
              <div className="flex flex-col gap-3">
                {/* Santuario de Midgard-Loka */}
                <button
                  onClick={() => {
                    EventBus.getInstance().emit('map:change_request', { targetMapId: 'village' });
                    setShowWorldMap(false);
                  }}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left cursor-pointer group ${
                    currentMapInfo.id === 'village'
                      ? 'bg-amber-950/40 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                      : 'bg-[#121824] border-slate-800 hover:border-amber-500/50 hover:bg-[#182030]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                      <Home className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-bold text-sm text-amber-100 uppercase">
                          SANTUARIO DE MIDGARD-LOKA
                        </span>
                        {currentMapInfo.id === 'village' && (
                          <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded-full">
                            ACTUAL
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Santuario Central Seguro • Guardia Kshatriya y Altar del Soma
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                </button>

                {/* Bosque de Asgard-Samsara */}
                <button
                  onClick={() => {
                    EventBus.getInstance().emit('map:change_request', { targetMapId: 'forest' });
                    setShowWorldMap(false);
                  }}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left cursor-pointer group ${
                    currentMapInfo.id === 'forest'
                      ? 'bg-emerald-950/40 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                      : 'bg-[#121824] border-slate-800 hover:border-emerald-500/50 hover:bg-[#182030]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      <Trees className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-bold text-sm text-emerald-100 uppercase">
                          BOSQUE DE ASGARD-SAMSARA
                        </span>
                        {currentMapInfo.id === 'forest' && (
                          <span className="text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded-full">
                            ACTUAL
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Bosque Sagrado • Siervos de Vritra Nv. 1-5
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </button>

                {/* Abismo de Niflheim-Vritra */}
                <button
                  onClick={() => {
                    EventBus.getInstance().emit('map:change_request', { targetMapId: 'dungeon' });
                    setShowWorldMap(false);
                  }}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left cursor-pointer group ${
                    currentMapInfo.id === 'dungeon'
                      ? 'bg-purple-950/40 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                      : 'bg-[#121824] border-slate-800 hover:border-purple-500/50 hover:bg-[#182030]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                      <Skull className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-bold text-sm text-purple-100 uppercase">
                          ABISMO DE NIFLHEIM-VRITRA
                        </span>
                        {currentMapInfo.id === 'dungeon' && (
                          <span className="text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1.5 py-0.5 rounded-full">
                            ACTUAL
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Catacumbas del Caos • Jefes Nv. 5+
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Retro Instructions HUD (Bottom-Left - Desktop Only) */}
      <AnimatePresence>
        {isReady && !isBattleActive && !dialog && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="hud-overlay absolute bottom-3 left-3 sm:bottom-6 sm:left-6 hidden sm:flex items-center gap-3 bg-[#0c1017]/85 border border-[#1b2230] p-3 rounded-lg sm:rounded-xl shadow-2xl backdrop-blur-md pointer-events-none max-w-xs md:max-w-md"
          >
            <div className="p-1.5 rounded-lg bg-slate-800/50 shrink-0">
              <Keyboard className="w-4 h-4 text-sky-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[8px] sm:text-[10px] tracking-widest text-slate-400 leading-none">CONTROLES</span>
              <span className="font-sans font-light text-slate-200 text-[10px] sm:text-xs tracking-wider leading-relaxed mt-0.5">
                Usa <kbd className="font-mono bg-slate-800 px-1 py-0.5 rounded border border-slate-700 text-sky-300">WASD</kbd> o las flechas para moverte. <kbd className="font-mono bg-slate-800 px-1 py-0.5 rounded border border-slate-700 text-amber-300">E</kbd> para interactuar.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Active Proximity Prompt Badge (Floating Bottom-Center) */}
      <AnimatePresence>
        {isReady && !isBattleActive && nearInteractable && !dialog && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: 20, scale: 0.95, x: '-50%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="hud-overlay absolute bottom-32 sm:bottom-40 left-1/2 flex items-center gap-2.5 bg-[#0a0d14]/95 border-2 border-amber-500/80 px-3.5 py-2 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.35)] backdrop-blur-md z-40 pointer-events-auto max-w-[90vw]"
          >
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="font-sans font-bold text-[11px] sm:text-xs text-amber-100 uppercase tracking-wider leading-none mt-0.5 whitespace-nowrap">
              {nearInteractable.text}
            </span>
            <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded-md shrink-0">
              <span className="font-mono text-[8px] text-amber-400 font-bold">ACCIONAR</span>
              <kbd className="font-mono bg-[#1b2230] px-1 py-0.2 rounded border border-amber-500/20 text-[10px] text-amber-200 font-black">E</kbd>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Classic Gold Fantasy Dialogue Window overlay (Bottom Centered) */}
      <AnimatePresence>
        {isReady && dialog && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="hud-overlay absolute bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:w-[620px] sm:-translate-x-1/2 bg-[#0c101a]/98 border-2 border-amber-500/80 p-4 sm:p-5 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(245,158,11,0.2)] backdrop-blur-xl z-45 pointer-events-auto flex flex-col cursor-pointer"
            onClick={() => {
              if (dialog.totalLines !== undefined) {
                EventBus.getInstance().emit('dialogue:next');
              } else {
                setDialog(null);
              }
            }}
          >
            {/* Header border detailing */}
            <div className="flex justify-between items-center pb-2 border-b border-amber-900/50 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-amber-500 font-serif">⚜️</span>
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span className="font-cinzel font-bold text-xs sm:text-sm text-amber-200 uppercase tracking-widest leading-none mt-0.5">
                  {dialog.sender}
                </span>
              </div>
              <span className="font-cinzel font-bold text-[9px] text-amber-500/60 uppercase tracking-widest">REINO DE ELDORIA</span>
            </div>

            {/* Main Text Content */}
            <div className="text-amber-100 font-serif font-normal text-xs sm:text-sm tracking-wide leading-relaxed py-2 min-h-[48px] sm:min-h-[56px] relative pr-6">
              {dialog.text}
              {/* Pulsing retro RPG arrow indicator */}
              <motion.div 
                animate={{ y: [0, 4, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute bottom-1 right-1 flex items-center justify-center text-amber-400"
              >
                <span className="text-[10px] sm:text-xs font-black">▼</span>
              </motion.div>
            </div>

            {/* Navigation Footer */}
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-amber-900/30">
              <span className="font-cinzel text-[9px] text-amber-400/60 font-semibold">
                {dialog.totalLines !== undefined 
                  ? `PÁGINA ${dialog.lineIndex! + 1} DE ${dialog.totalLines} — CLIC O ENTER PARA AVANZAR`
                  : 'PRESIONA E O HAZ CLIC PARA CERRAR'
                }
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (dialog.totalLines !== undefined) {
                    EventBus.getInstance().emit('dialogue:next');
                  } else {
                    setDialog(null);
                  }
                }}
                className="font-cinzel bg-amber-950/80 hover:bg-amber-900 text-amber-200 font-bold border border-amber-500/50 px-3 py-1 rounded-lg text-[10px] cursor-pointer transition-colors shadow-md"
              >
                {dialog.totalLines !== undefined
                  ? (dialog.lineIndex! < dialog.totalLines - 1 ? 'SIGUIENTE [E]' : 'CERRAR [E]')
                  : 'CERRAR [E]'
                }
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decoupled Inventory Window Modal */}
      <AnimatePresence>
        {isReady && isInventoryOpen && !isMainMenuOpen && (
          <InventoryWindow onClose={() => InventoryManager.getInstance().closeInventory()} />
        )}
      </AnimatePresence>

      {/* JRPG Unified Main Menu Overlay Modal */}
      <JRPGMainMenuModal
        isOpen={isReady && isMainMenuOpen}
        activeTab={mainMenuTab}
        onTabChange={(tab) => setMainMenuTab(tab)}
        onClose={() => setIsMainMenuOpen(false)}
        heroHp={heroHp}
        heroMaxHp={heroMaxHp}
        heroMp={heroMp}
        heroMaxMp={heroMaxMp}
        currentMapId={currentMapInfo.id}
        telemetryQuality={telemetry?.quality ?? 'MEDIUM'}
        forceTouch={forceTouch}
        debugCollidersEnabled={debugData?.collidersEnabled}
        debugAutoOrbitEnabled={debugData?.autoOrbitEnabled}
        onChangeQuality={handleChangeQuality}
        onToggleTouch={handleToggleTouch}
        onToggleColliders={handleToggleColliders}
        onToggleAutoOrbit={handleToggleAutoOrbit}
      />

      {/* State-of-the-art Unified Mobile Touch Controls Overlay */}
      {isReady && !isBattleActive && !dialog && <TouchControls />}

      {/* Modular Real-time JRPG Telemetry Debug Overlay Panel (Top-Left - Below Player HP HUD) */}
      <AnimatePresence>
        {isReady && showDebug && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="hud-overlay absolute top-[112px] left-3 sm:top-[152px] sm:left-6 w-[calc(100vw-24px)] sm:w-72 bg-[#0c1017]/95 sm:bg-[#0c1017]/90 border border-[#1b2230] p-2.5 sm:p-5 rounded-lg sm:rounded-xl shadow-2xl backdrop-blur-md pointer-events-auto select-text space-y-2.5 sm:space-y-4 max-h-[42vh] sm:max-h-[70vh] overflow-y-auto z-40"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-1 sm:pb-2 border-b border-[#1b2230]">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Bug className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" />
                <h2 className="font-mono text-[9px] sm:text-xs font-semibold tracking-wider text-slate-300 uppercase">CONSOLE DEBUG</h2>
              </div>
              <div className="flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500"></span>
                </span>
                <span className="font-mono text-[8px] sm:text-[9px] text-emerald-400 uppercase tracking-widest font-bold">LIVE</span>
              </div>
            </div>

            {/* Tab Selector */}
            <div className="grid grid-cols-3 gap-1 bg-slate-950/50 p-1 rounded-lg border border-[#1b2230]">
              <button
                onClick={() => setDebugTab('TELEMETRY')}
                className={`py-1 text-[8px] sm:text-[10px] font-mono font-bold tracking-wider rounded transition-all cursor-pointer ${
                  debugTab === 'TELEMETRY'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/35'
                    : 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/10'
                }`}
              >
                TELEMETRÍA
              </button>
              <button
                onClick={() => setDebugTab('ITEMS')}
                className={`py-1 text-[8px] sm:text-[10px] font-mono font-bold tracking-wider rounded transition-all cursor-pointer ${
                  debugTab === 'ITEMS'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/35'
                    : 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/10'
                }`}
              >
                OBJETOS (M5)
              </button>
              <button
                onClick={() => {
                  setDebugTab('LOOT');
                  runLootSimulation('slime_loot_table', 0, 100);
                }}
                className={`py-1 text-[8px] sm:text-[10px] font-mono font-bold tracking-wider rounded transition-all cursor-pointer ${
                  debugTab === 'LOOT'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/35'
                    : 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/10'
                }`}
              >
                LOOT (M6)
              </button>
            </div>

            {/* Metrics List */}
            {debugData ? (
              debugTab === 'TELEMETRY' ? (
                <div className="space-y-2 sm:space-y-3 font-mono text-[10px] sm:text-xs text-slate-300">
                  {/* Responsive 2-column list on mobile, 1-column list on desktop */}
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-1 sm:gap-0 sm:space-y-2">
                    {/* FPS */}
                    <div className="flex justify-between items-center bg-slate-800/10 p-1 sm:p-1.5 rounded-md border border-slate-800/30">
                      <span className="text-slate-400 flex items-center gap-1"><Sparkles className="w-2.5 h-2.5 text-emerald-400" /> FPS:</span>
                      <span className={`font-semibold ${(telemetry?.fps ?? debugData.fps) > 55 ? 'text-emerald-400' : (telemetry?.fps ?? debugData.fps) > 30 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {telemetry?.fps ?? debugData.fps}
                      </span>
                    </div>

                    {/* Coordinates */}
                    <div className="flex justify-between items-center bg-slate-800/10 p-1 sm:p-1.5 rounded-md border border-slate-800/30">
                      <span className="text-slate-400">Pos (X, Z):</span>
                      <span className="text-sky-300 font-semibold truncate max-w-[60px] sm:max-w-none">
                        [{debugData.playerX.toFixed(1)}, {debugData.playerZ.toFixed(1)}]
                      </span>
                    </div>

                    {/* State */}
                    <div className="flex justify-between items-center bg-slate-800/10 p-1 sm:p-1.5 rounded-md border border-slate-800/30">
                      <span className="text-slate-400">Estado:</span>
                      <span className={`font-semibold truncate ${debugData.state === 'WALK' ? 'text-amber-300' : 'text-slate-400'}`}>
                        {debugData.state}
                      </span>
                    </div>

                    {/* Direction */}
                    <div className="flex justify-between items-center bg-slate-800/10 p-1 sm:p-1.5 rounded-md border border-slate-800/30">
                      <span className="text-slate-400">Mira a:</span>
                      <span className="text-yellow-400 font-semibold">{debugData.direction}</span>
                    </div>

                    {/* Draw Calls */}
                    <div className="flex justify-between items-center bg-slate-800/10 p-1 sm:p-1.5 rounded-md border border-slate-800/30">
                      <span className="text-slate-400 flex items-center gap-1"><Activity className="w-2.5 h-2.5 text-red-400" /> Draw:</span>
                      <span className="text-red-300 font-bold">{telemetry?.drawCalls ?? '---'}</span>
                    </div>

                    {/* Triangles */}
                    <div className="flex justify-between items-center bg-slate-800/10 p-1 sm:p-1.5 rounded-md border border-slate-800/30">
                      <span className="text-slate-400">Trián:</span>
                      <span className="text-pink-300 font-bold text-[9px] sm:text-xs">{(telemetry?.triangles ?? 0).toLocaleString()}</span>
                    </div>

                    {/* Device and OS */}
                    <div className="flex justify-between items-center bg-slate-800/10 p-1 sm:p-1.5 rounded-md border border-slate-800/30 col-span-2 sm:col-span-1">
                      <span className="text-slate-400 flex items-center gap-1">
                        {telemetry?.device === 'Mobile' ? <Smartphone className="w-2.5 h-2.5 text-orange-400" /> : <Monitor className="w-2.5 h-2.5 text-blue-400" />}
                        Device:
                      </span>
                      <span className="text-slate-200 font-semibold truncate max-w-[120px] sm:max-w-none">{telemetry?.os ?? 'Desktop'} ({telemetry?.device ?? 'PC'})</span>
                    </div>
                  </div>

                  {/* Quality Config Selector (Bajo / Medio / Alto) */}
                  <div className="pt-2 border-t border-[#1b2230] flex flex-col gap-1.5">
                    <span className="text-[9px] tracking-widest text-slate-500 uppercase font-bold flex items-center gap-1"><Sliders className="w-3 h-3 text-amber-500" /> CALIDAD GRÁFICA</span>
                    <div className="grid grid-cols-3 gap-1 bg-slate-950/40 p-0.5 rounded-lg border border-slate-800">
                      {(['LOW', 'MEDIUM', 'HIGH'] as const).map((lvl) => {
                        const isActive = (telemetry?.quality ?? 'MEDIUM') === lvl;
                        const label = lvl === 'LOW' ? 'BAJO' : lvl === 'MEDIUM' ? 'MEDIO' : 'ALTO';
                        return (
                          <button
                            key={lvl}
                            onClick={() => handleChangeQuality(lvl)}
                            className={`py-1 text-[8px] sm:text-[9px] font-black tracking-wider rounded-md transition-all cursor-pointer ${
                              isActive
                                ? 'bg-amber-600 text-amber-50 shadow-inner'
                                : 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Toggle Touch Override & Colliders (Responsive Grid row on mobile, stack on desktop) */}
                  <div className="pt-2 border-t border-[#1b2230] flex flex-col gap-1.5">
                    <span className="text-[9px] tracking-widest text-slate-500 uppercase font-bold">HERRAMIENTAS DEBUG</span>
                    
                    <div className="grid grid-cols-3 sm:grid-cols-1 gap-1">
                      {/* Force Touch screen Controls on desktop */}
                      <button
                        onClick={handleToggleTouch}
                        className={`flex flex-col sm:flex-row justify-center sm:justify-between items-center gap-1 p-1 sm:p-1.5 rounded-lg border text-center sm:text-left transition-all cursor-pointer ${
                          forceTouch 
                            ? 'bg-amber-500/15 border-amber-500/50 text-amber-300' 
                            : 'bg-slate-850 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-[7px] sm:text-xs font-semibold flex items-center gap-0.5 sm:gap-1.5 leading-none sm:leading-normal">
                          <Smartphone className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">Forzar</span> Táctil
                        </span>
                        <span className="text-[7px] sm:text-[9px] uppercase tracking-widest font-black leading-none mt-0.5 sm:mt-0 text-amber-300">
                          {forceTouch ? 'SÍ' : 'NO'}
                        </span>
                      </button>

                      {/* Physics Wireframes */}
                      <button
                        onClick={handleToggleColliders}
                        className={`flex flex-col sm:flex-row justify-center sm:justify-between items-center gap-1 p-1 sm:p-1.5 rounded-lg border text-center sm:text-left transition-all cursor-pointer ${
                          debugData.collidersEnabled 
                            ? 'bg-sky-500/15 border-sky-500/50 text-sky-300' 
                            : 'bg-slate-850 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-[7px] sm:text-xs font-semibold flex items-center gap-0.5 sm:gap-1.5 leading-none sm:leading-normal">
                          <Eye className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" /> Colls
                        </span>
                        <span className="text-[7px] sm:text-[9px] uppercase tracking-widest font-black leading-none mt-0.5 sm:mt-0 text-sky-300">
                          {debugData.collidersEnabled ? 'ON' : 'OFF'}
                        </span>
                      </button>

                      {/* Auto-Orbit Camera */}
                      <button
                        onClick={handleToggleAutoOrbit}
                        className={`flex flex-col sm:flex-row justify-center sm:justify-between items-center gap-1 p-1 sm:p-1.5 rounded-lg border text-center sm:text-left transition-all cursor-pointer ${
                          debugData.autoOrbitEnabled 
                            ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-300' 
                            : 'bg-slate-850 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-[7px] sm:text-xs font-semibold flex items-center gap-0.5 sm:gap-1.5 leading-none sm:leading-normal">
                          <RotateCw className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 ${debugData.autoOrbitEnabled ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} /> Órbita
                        </span>
                        <span className="text-[7px] sm:text-[9px] uppercase tracking-widest font-black leading-none mt-0.5 sm:mt-0 text-indigo-300">
                          {debugData.autoOrbitEnabled ? 'ON' : 'OFF'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : debugTab === 'ITEMS' ? (
                <div className="space-y-3 font-mono text-[10px] sm:text-xs text-slate-300">
                  {/* Global Spawn Rarity Config */}
                  <div className="space-y-1">
                    <span className="text-[8px] tracking-widest text-slate-500 uppercase font-black">RAREZA DE GENERACIÓN</span>
                    <div className="grid grid-cols-5 gap-0.5 bg-slate-950/40 p-0.5 rounded-lg border border-slate-800">
                      {(['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'] as const).map((r) => {
                        const isActive = spawnRarity === r;
                        const colorClass = 
                          r === 'COMMON' ? 'text-slate-400' :
                          r === 'UNCOMMON' ? 'text-emerald-400' :
                          r === 'RARE' ? 'text-sky-400' :
                          r === 'EPIC' ? 'text-purple-400' :
                          'text-amber-400';
                        return (
                          <button
                            key={r}
                            onClick={() => setSpawnRarity(r as any)}
                            className={`py-1 text-[7px] sm:text-[8px] font-black rounded transition-all cursor-pointer ${
                              isActive
                                ? 'bg-amber-600/35 border border-amber-500/50 text-white'
                                : `bg-transparent ${colorClass} hover:bg-slate-800/20`
                            }`}
                          >
                            {r.substring(0, 4)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Definitions (Static Templates loaded from Database) */}
                  <div className="space-y-1.5 pt-1.5 border-t border-[#1b2230]">
                    <span className="text-[8px] tracking-widest text-slate-500 uppercase font-black">DEFINICIONES DE BASE (DB)</span>
                    <div className="space-y-1">
                      {['iron_sword', 'small_potion']
                        .map((id) => DatabaseManager.getInstance().getItemDefinition(id))
                        .filter((def): def is Exclude<typeof def, undefined> => !!def)
                        .map((def) => (
                          <div key={def.id} className="flex justify-between items-center bg-slate-800/10 p-1.5 rounded-md border border-slate-800/35">
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-slate-200 truncate">{def.name}</span>
                              <span className="text-[7px] text-slate-400 uppercase tracking-wider">{def.category} | ${def.baseValue}</span>
                            </div>
                            <button
                              onClick={() => handleSpawnItem(def.id)}
                              className="bg-amber-600/25 hover:bg-amber-600 border border-amber-500/40 text-amber-300 hover:text-white font-bold px-2 py-0.5 rounded text-[8px] sm:text-[9px] transition-all cursor-pointer shrink-0"
                            >
                              SPAWN
                            </button>
                          </div>
                        ))
                      }
                    </div>
                  </div>

                  {/* Instances (Dynamic items with distinct attributes & UUID) */}
                  <div className="space-y-1.5 pt-1.5 border-t border-[#1b2230]">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] tracking-widest text-slate-500 uppercase font-black">INSTANCIAS ACTIVAS (RUN)</span>
                      <span className="text-[8px] font-bold text-slate-400 bg-slate-950/40 px-1.5 py-0.5 rounded-md">{itemInstances.length}</span>
                    </div>
                    
                    <div className="space-y-1 max-h-[22vh] overflow-y-auto pr-0.5">
                      {itemInstances.length === 0 ? (
                        <div className="text-center py-4 text-slate-500 text-[8px] italic bg-slate-950/25 rounded border border-dashed border-slate-850">
                          No hay instancias activas.
                        </div>
                      ) : (
                        itemInstances.map((inst: any) => {
                          const def = DatabaseManager.getInstance().getItemDefinition(inst.definitionId);
                          const rarityColor = 
                            inst.rarity === 'COMMON' ? 'text-slate-400 bg-slate-500/10 border-slate-500/20' :
                            inst.rarity === 'UNCOMMON' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                            inst.rarity === 'RARE' ? 'text-sky-400 bg-sky-500/10 border-sky-500/20' :
                            inst.rarity === 'EPIC' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' :
                            'text-amber-400 bg-amber-500/10 border-amber-500/20';

                          return (
                            <div key={inst.uuid} className="bg-slate-950/40 p-1.5 rounded-lg border border-slate-850 flex justify-between items-start gap-1">
                              <div className="space-y-0.5 flex-1 min-w-0">
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="font-semibold text-slate-200 text-[9px] truncate">
                                    {def?.name || inst.definitionId}
                                  </span>
                                  <span className={`text-[6px] font-black uppercase tracking-widest px-0.5 rounded border shrink-0 ${rarityColor}`}>
                                    {inst.rarity}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-2 text-[7px] text-slate-450">
                                  <div className="truncate">UUID: <span className="text-sky-400 font-mono">{inst.uuid.substring(0, 8)}</span></div>
                                  <div>Semilla: <span className="text-slate-300 font-mono">{inst.seed}</span></div>
                                  <div>Durab: <span className="text-slate-300 font-mono">{inst.durability}%</span></div>
                                  <div>Nivel: <span className="text-slate-300 font-mono">Lvl {inst.level}</span></div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteInstance(inst.uuid)}
                                className="text-slate-500 hover:text-rose-400 p-0.5 rounded hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                                title="Eliminar Instancia"
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 font-mono text-[10px] sm:text-xs text-slate-300 overflow-y-auto max-h-[48vh] sm:max-h-[55vh] pr-0.5">
                  {/* Loot Simulator Controls */}
                  <div className="space-y-2">
                    <span className="text-[8px] tracking-widest text-slate-500 uppercase font-black">SIMULADOR DE LOOT (M6)</span>
                    
                    {/* Table Select */}
                    <div className="space-y-1">
                      <label className="text-[7px] text-slate-400 uppercase tracking-widest block font-bold">Tabla de Loot</label>
                      <select
                        value={simulationTable}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSimulationTable(val);
                          runLootSimulation(val, simulationLuck, simulationCount);
                        }}
                        className="w-full bg-slate-950/80 text-slate-200 border border-[#1b2230] p-1.5 rounded text-[9px] font-mono focus:border-emerald-500 outline-none"
                      >
                        <option value="slime_loot_table">Slime (Fácil/Común)</option>
                        <option value="goblin_loot_table">Goblin (Medio)</option>
                        <option value="chest_loot_table">Cofre de Madera (Tesoro)</option>
                        <option value="boss_dragon_loot_table">Dragón Boss (Garantizado/Leyenda)</option>
                      </select>
                    </div>

                    {/* Luck Stat Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[7px] text-slate-400 font-bold">
                        <span className="uppercase tracking-widest">Estadística de Suerte (Luck)</span>
                        <span className="text-emerald-400">{simulationLuck} Pts</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={simulationLuck}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setSimulationLuck(val);
                          runLootSimulation(simulationTable, val, simulationCount);
                        }}
                        className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>

                    {/* Simulation Count Select */}
                    <div className="space-y-1">
                      <label className="text-[7px] text-slate-400 uppercase tracking-widest block font-bold">Número de Rolls a Generar</label>
                      <div className="grid grid-cols-3 gap-1">
                        {([100, 1000, 10000] as const).map((count) => (
                          <button
                            key={count}
                            onClick={() => {
                              setSimulationCount(count);
                              runLootSimulation(simulationTable, simulationLuck, count);
                            }}
                            className={`py-1 text-[8px] font-bold rounded cursor-pointer border transition-all ${
                              simulationCount === count
                                ? 'bg-emerald-600/25 border-emerald-500 text-emerald-300'
                                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {count} rolls
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Roll Trigger Button */}
                    <button
                      onClick={() => runLootSimulation()}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-3 rounded text-[9px] uppercase tracking-widest shadow-lg transition-all cursor-pointer flex justify-center items-center gap-1.5"
                    >
                      <span>EJECUTAR ROLLS</span>
                    </button>
                  </div>

                  {/* Simulation Statistics Output */}
                  {simulationResult && (
                    <div className="space-y-2 pt-2 border-t border-[#1b2230]">
                      <div className="flex justify-between items-center text-[8px] font-black tracking-widest text-slate-400">
                        <span>ESTADÍSTICAS DEL ROLL</span>
                        <span className="bg-slate-950/60 px-1.5 py-0.5 rounded text-emerald-400">Total: {simulationResult.totalItems} items</span>
                      </div>

                      {/* Rarity Percentages */}
                      <div className="space-y-1 bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/40">
                        <span className="text-[7px] tracking-wider text-slate-500 uppercase font-black block">DISTRIBUCIÓN DE RAREZAS</span>
                        <div className="space-y-1 text-[8px]">
                          {(Object.keys(simulationResult.rarityCounts) as Rarity[]).map((rarity) => {
                            const count = simulationResult.rarityCounts[rarity];
                            const percent = simulationResult.totalItems > 0 
                              ? ((count / simulationResult.totalItems) * 100).toFixed(2)
                              : '0.00';
                            
                            const colorClass = 
                              rarity === 'COMMON' ? 'text-slate-400' :
                              rarity === 'UNCOMMON' ? 'text-emerald-400' :
                              rarity === 'RARE' ? 'text-sky-400' :
                              rarity === 'EPIC' ? 'text-purple-400' :
                              rarity === 'LEGENDARY' ? 'text-amber-400' :
                              'text-rose-450';

                            const barColor = 
                              rarity === 'COMMON' ? 'bg-slate-600' :
                              rarity === 'UNCOMMON' ? 'bg-emerald-500' :
                              rarity === 'RARE' ? 'bg-sky-500' :
                              rarity === 'EPIC' ? 'bg-purple-500' :
                              rarity === 'LEGENDARY' ? 'bg-amber-500' :
                              'bg-rose-500';

                            return (
                              <div key={rarity} className="space-y-0.5">
                                <div className="flex justify-between items-center font-bold">
                                  <span className={colorClass}>{rarity}</span>
                                  <span className="text-slate-300 font-mono text-[7.5px]">{percent}% <span className="text-[7px] text-slate-500">({count})</span></span>
                                </div>
                                <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                                  <div className={`h-full ${barColor}`} style={{ width: `${percent}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Generated Items Breakdown */}
                      <div className="space-y-1">
                        <span className="text-[7px] tracking-wider text-slate-500 uppercase font-black block">OBJETOS OBTENIDOS</span>
                        <div className="space-y-1 max-h-[16vh] overflow-y-auto pr-0.5">
                          {simulationResult.itemCounts.length === 0 ? (
                            <div className="text-slate-500 text-[8px] italic py-2 text-center bg-slate-950/20 rounded">
                              No se obtuvo ningún objeto.
                            </div>
                          ) : (
                            simulationResult.itemCounts.map((item: any) => {
                              const colorClass = 
                                item.rarity === 'COMMON' ? 'text-slate-400 bg-slate-500/5' :
                                item.rarity === 'UNCOMMON' ? 'text-emerald-400 bg-emerald-500/5' :
                                item.rarity === 'RARE' ? 'text-sky-400 bg-sky-500/5' :
                                item.rarity === 'EPIC' ? 'text-purple-400 bg-purple-500/5' :
                                item.rarity === 'LEGENDARY' ? 'text-amber-400 bg-amber-500/5' :
                                'text-rose-450 bg-rose-500/5';

                              return (
                                <div key={item.id} className={`flex justify-between items-center p-1 rounded border border-slate-800/30 ${colorClass}`}>
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-semibold text-slate-200 truncate text-[9px]">{item.name}</span>
                                    <span className="text-[6.5px] text-slate-400 uppercase tracking-widest">
                                      Valor total: ${item.totalValue}
                                    </span>
                                  </div>
                                  <div className="text-right font-mono font-bold text-slate-300 shrink-0 text-[9px]">
                                    {item.count} <span className="text-[7px] text-slate-500">uds</span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="py-4 text-center text-slate-500 font-mono text-[10px] sm:text-xs animate-pulse">
                Esperando datos...
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Atmospheric Cinematic Retro Game Splash Loader Screen */}
      <AnimatePresence>
        {!isReady && (
          <LoadingScreen progress={loadingProgress} isReady={isReady} />
        )}
      </AnimatePresence>

      {/* Turn-Based Octopath Combat Overlay */}
      {isBattleActive && (
        <BattleUI onBattleEnd={() => setIsBattleActive(false)} />
      )}

      {/* Toast Notification Toaster */}
      <div className="hud-overlay absolute top-20 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 30, scale: 0.9 }}
              className={`p-3.5 rounded-lg border shadow-xl flex items-center gap-3 backdrop-blur-md pointer-events-auto ${
                notif.type === 'success' 
                  ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200' 
                  : notif.type === 'warning'
                  ? 'bg-amber-950/90 border-amber-500/50 text-amber-200'
                  : 'bg-[#0c1017]/95 border-sky-500/40 text-slate-100'
              }`}
            >
              <div className="flex-1 text-xs font-sans font-medium">
                {notif.message}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Dynamic pointer ripples */}
      <AnimatePresence>
        {pulses.map((pulse) => (
          <motion.div
            key={pulse.id}
            initial={{
              position: 'absolute',
              left: pulse.x,
              top: pulse.y,
              translateX: '-50%',
              translateY: '-50%',
              width: pulse.isDrag ? 16 : 24,
              height: pulse.isDrag ? 16 : 24,
              opacity: 0.8,
              scale: 0.6,
              borderRadius: '50%',
              pointerEvents: 'none',
              zIndex: 100,
              boxShadow: pulse.isDrag
                ? '0 0 10px rgba(56, 189, 248, 0.5)'
                : '0 0 16px rgba(245, 158, 11, 0.5)',
              border: pulse.isDrag 
                ? '1.5px solid rgba(56, 189, 248, 0.9)' 
                : '2px solid rgba(245, 158, 11, 0.9)',
              backgroundColor: pulse.isDrag
                ? 'rgba(56, 189, 248, 0.15)'
                : 'rgba(245, 158, 11, 0.15)',
            }}
            animate={{
              scale: pulse.isDrag ? 2.5 : 3.5,
              opacity: 0,
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: pulse.isDrag ? 0.4 : 0.6,
              ease: 'easeOut',
            }}
          />
        ))}
      </AnimatePresence>

      {/* Expedition System HUD & Modals */}
      <ExpeditionHUD
        onExtractClick={() => {
          ExpeditionManager.getInstance().extractToSanctuary();
        }}
        onOpenJournalClick={() => {
          setShowWorldJournalModal(true);
        }}
        onOpenMapClick={() => {
          setShowMapOverlayModal(true);
        }}
      />

      {showExpeditionSummary && (
        <ExpeditionSummaryModal
          onClose={() => setShowExpeditionSummary(false)}
        />
      )}

      {portalPromptData && (
        <ExpeditionPortalPromptModal
          targetMapId={portalPromptData.targetMapId}
          targetName={portalPromptData.targetName}
          onConfirmAdvance={() => {
            EventBus.getInstance().emit('map:change_request', {
              targetMapId: portalPromptData.targetMapId,
              targetX: portalPromptData.targetX,
              targetZ: portalPromptData.targetZ,
            });
            setPortalPromptData(null);
          }}
          onExtractSanctuary={() => {
            ExpeditionManager.getInstance().extractToSanctuary();
            setPortalPromptData(null);
          }}
          onClose={() => setPortalPromptData(null)}
        />
      )}

      {/* Dynamic World Events Emergent Modal */}
      <WorldEventModal />

      {/* World Story Journal Modal */}
      {showWorldJournalModal && (
        <WorldStoryJournalModal
          onClose={() => setShowWorldJournalModal(false)}
        />
      )}

      {/* Floating 3D Loot Feedback Overlay */}
      <FloatingLootOverlay />

      {/* Victory Loot Summary Panel */}
      <LootSummaryPanel
        data={victorySummary}
        onClose={() => setVictorySummary(null)}
        onOpenInventory={() => {
          setVictorySummary(null);
          setMainMenuTab('INVENTORY');
          setIsMainMenuOpen(true);
        }}
      />

      {/* Hero Level-Up Animated Overlay */}
      <LevelUpOverlay
        onOpenTalents={() => {
          setMainMenuTab('TALENTS');
          setIsMainMenuOpen(true);
        }}
      />

      {/* Global Game State Pause Modal */}
      <PauseMenuModal
        isOpen={isPaused}
        onResume={() => EventBus.getInstance().emit('gamestate:request_pop')}
      />

      {/* Interactive Tactical Map Modal */}
      <MapOverlayModal
        isOpen={showMapOverlayModal}
        onClose={() => setShowMapOverlayModal(false)}
        currentMapId={currentMapInfo.id}
      />
    </main>
  );
}
