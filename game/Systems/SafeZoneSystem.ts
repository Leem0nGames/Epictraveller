import { MAP_DEFINITIONS } from '../World/MapDefinitions';
import { ProceduralGenerator } from '../World/ProceduralGenerator';
import { ToastManager } from './ToastManager';
import { EventBus } from '../Core/EventBus';

export interface SafeZoneStatus {
  isSafe: boolean;
  name: string;
  badge: string;
  description: string;
}

export class SafeZoneSystem {
  private static instance: SafeZoneSystem;
  private currentMapId: string = 'village';
  private playerX: number = 0;
  private playerZ: number = 0;

  private constructor() {
    const eventBus = EventBus.getInstance();
    eventBus.on('map:changed', (data: { id: string }) => {
      this.currentMapId = data.id;
    });
  }

  public static getInstance(): SafeZoneSystem {
    if (!SafeZoneSystem.instance) {
      SafeZoneSystem.instance = new SafeZoneSystem();
    }
    return SafeZoneSystem.instance;
  }

  public updatePlayerPosition(x: number, z: number): void {
    this.playerX = x;
    this.playerZ = z;
  }

  public setMapId(mapId: string): void {
    this.currentMapId = mapId;
  }

  public getCurrentMapId(): string {
    return this.currentMapId;
  }

  public getPlayerPosition(): { x: number; z: number } {
    return { x: this.playerX, z: this.playerZ };
  }

  /**
   * Evaluates whether a given map/coordinate falls inside a Safe Zone (city, village, hamlet, outpost, sanctuary)
   */
  public isSafeZone(mapId: string = this.currentMapId, x: number = this.playerX, z: number = this.playerZ): boolean {
    const mapDef = MAP_DEFINITIONS[mapId];
    if (mapDef && mapDef.type === 'village') {
      return true;
    }

    if (mapId === 'procedural' || mapDef?.type === 'procedural') {
      return ProceduralGenerator.getInstance().isInsideVillageZone(x, z);
    }

    return false;
  }

  /**
   * Returns comprehensive Safe Zone status details for HUD and UI overlays
   */
  public getStatus(mapId: string = this.currentMapId, x: number = this.playerX, z: number = this.playerZ): SafeZoneStatus {
    const isSafe = this.isSafeZone(mapId, x, z);

    if (isSafe) {
      return {
        isSafe: true,
        name: mapId === 'village' ? 'Santuario de Midgard-Loka' : 'Ciudad / Villa Segura',
        badge: '🛡️ ZONA SEGURA',
        description: 'Las batallas acontecen únicamente fuera de las ciudades o villas. Tu personaje está 100% protegido.',
      };
    }

    return {
      isSafe: false,
      name: MAP_DEFINITIONS[mapId]?.name || 'Tierras Salvajes',
      badge: '⚔️ ZONA DE BORDES / COMBATE',
      description: 'Zona salvaje fuera de poblados. Las batallas y peligros acontecen aquí.',
    };
  }

  /**
   * Validates if combat/battle initiation is permitted.
   * Blocks execution and alerts the player if they are inside a Safe Zone.
   */
  public canInitiateBattle(mapId: string = this.currentMapId, x: number = this.playerX, z: number = this.playerZ): boolean {
    if (this.isSafeZone(mapId, x, z)) {
      ToastManager.getInstance().show(
        '🛡️ ZONA SEGURA: No hay batallas dentro de ciudades o villas. Las batallas acontecen únicamente fuera.'
      );
      return false;
    }
    return true;
  }
}
