import * as THREE from 'three';
import { Collider, BoundingBox, Entity } from '../Entities/Entity';

/**
 * 3D Box/AABB Physical Collider
 */
export class BoxCollider implements Collider {
  public type: 'box' = 'box';
  public offset: THREE.Vector3;
  public size: THREE.Vector3; // Full dimension values (width, height, depth)
  public halfExtents: THREE.Vector3;

  constructor(size: THREE.Vector3, offset: THREE.Vector3 = new THREE.Vector3()) {
    this.size = size;
    this.halfExtents = size.clone().multiplyScalar(0.5);
    this.offset = offset;
  }

  /**
   * Compute absolute boundary coordinates in the world scene
   */
  public getBounds(position: THREE.Vector3): BoundingBox {
    const center = position.clone().add(this.offset);
    return {
      minX: center.x - this.halfExtents.x,
      maxX: center.x + this.halfExtents.x,
      minY: center.y - this.halfExtents.y,
      maxY: center.y + this.halfExtents.y,
      minZ: center.z - this.halfExtents.z,
      maxZ: center.z + this.halfExtents.z,
    };
  }
}

/**
 * 3D Spherical/Radial Physical Collider
 */
export class SphereCollider implements Collider {
  public type: 'sphere' = 'sphere';
  public offset: THREE.Vector3;
  public radius: number;

  constructor(radius: number, offset: THREE.Vector3 = new THREE.Vector3()) {
    this.radius = radius;
    this.offset = offset;
  }

  /**
   * Compute absolute boundary coordinates in the world scene
   */
  public getBounds(position: THREE.Vector3): BoundingBox {
    const center = position.clone().add(this.offset);
    return {
      minX: center.x - this.radius,
      maxX: center.x + this.radius,
      minY: center.y - this.radius,
      maxY: center.y + this.radius,
      minZ: center.z - this.radius,
      maxZ: center.z + this.radius,
    };
  }
}

/**
 * Helper: Math solver for intersection between an AABB Box and a Sphere
 */
function intersectBoxSphere(
  box: BoxCollider, boxPos: THREE.Vector3,
  sphere: SphereCollider, spherePos: THREE.Vector3
): boolean {
  const boxMin = new THREE.Vector3(
    boxPos.x + box.offset.x - box.halfExtents.x,
    boxPos.y + box.offset.y - box.halfExtents.y,
    boxPos.z + box.offset.z - box.halfExtents.z
  );
  const boxMax = new THREE.Vector3(
    boxPos.x + box.offset.x + box.halfExtents.x,
    boxPos.y + box.offset.y + box.halfExtents.y,
    boxPos.z + box.offset.z + box.halfExtents.z
  );
  
  const sphereCenter = spherePos.clone().add(sphere.offset);

  // Find the closest point on the bounding box to the sphere center
  const closestPoint = new THREE.Vector3(
    Math.max(boxMin.x, Math.min(sphereCenter.x, boxMax.x)),
    Math.max(boxMin.y, Math.min(sphereCenter.y, boxMax.y)),
    Math.max(boxMin.z, Math.min(sphereCenter.z, boxMax.z))
  );

  const distanceSquared = closestPoint.distanceToSquared(sphereCenter);
  return distanceSquared <= (sphere.radius * sphere.radius);
}

/**
 * High-performance narrow-phase collision intersection dispatcher
 */
export function intersects(
  colA: Collider, posA: THREE.Vector3,
  colB: Collider, posB: THREE.Vector3
): boolean {
  if (colA.type === 'box' && colB.type === 'box') {
    const a = (colA as BoxCollider).getBounds(posA);
    const b = (colB as BoxCollider).getBounds(posB);
    return (
      a.minX <= b.maxX && a.maxX >= b.minX &&
      a.minY <= b.maxY && a.maxY >= b.minY &&
      a.minZ <= b.maxZ && a.maxZ >= b.minZ
    );
  }

  if (colA.type === 'sphere' && colB.type === 'sphere') {
    const sA = colA as SphereCollider;
    const sB = colB as SphereCollider;
    const centerA = posA.clone().add(sA.offset);
    const centerB = posB.clone().add(sB.offset);
    const distSq = centerA.distanceToSquared(centerB);
    const radiusSum = sA.radius + sB.radius;
    return distSq <= radiusSum * radiusSum;
  }

  if (colA.type === 'box' && colB.type === 'sphere') {
    return intersectBoxSphere(colA as BoxCollider, posA, colB as SphereCollider, posB);
  }

  if (colA.type === 'sphere' && colB.type === 'box') {
    return intersectBoxSphere(colB as BoxCollider, posB, colA as SphereCollider, posA);
  }

  return false;
}

/**
 * Decoupled Collision System.
 * Operates independent of character class definitions.
 */
export class CollisionSystem {
  private static debugMeshes: Map<string, THREE.Mesh> = new Map();

  /**
   * Evaluates if placing an entity at `testPosition` intersects other solid physical bodies.
   */
  public static checkCollision(
    entity: Entity,
    testPosition: THREE.Vector3,
    otherEntities: Entity[]
  ): boolean {
    if (!entity.collider) return false;

    for (const other of otherEntities) {
      if (other === entity || !other.collider || !other.isActive) continue;

      if (intersects(entity.collider, testPosition, other.collider, other.position)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Slides the entity along collidable obstacles axis-by-axis (X and Z individually)
   * to guarantee smooth movement and avoid sudden visual clipping locks.
   */
  public static resolveMovement(
    entity: Entity,
    currentPos: THREE.Vector3,
    movementVector: THREE.Vector3,
    colliders: Entity[]
  ): THREE.Vector3 {
    if (!entity.collider) {
      return currentPos.clone().add(movementVector);
    }

    // Unstuck safety: If entity is already overlapping a collider, allow movement so they can step out
    if (this.checkCollision(entity, currentPos, colliders)) {
      return currentPos.clone().add(movementVector);
    }

    const nextPos = currentPos.clone();

    // 1. Try X-axis movement
    if (movementVector.x !== 0) {
      const testX = nextPos.clone();
      testX.x += movementVector.x;
      if (!this.checkCollision(entity, testX, colliders)) {
        nextPos.x = testX.x;
      }
    }

    // 2. Try Z-axis movement
    if (movementVector.z !== 0) {
      const testZ = nextPos.clone();
      testZ.z += movementVector.z;
      if (!this.checkCollision(entity, testZ, colliders)) {
        nextPos.z = testZ.z;
      }
    }

    return nextPos;
  }

  /**
   * Refreshes or creates standard wireframe debug objects to highlight boundaries.
   */
  public static updateDebugVisuals(scene: THREE.Scene, entities: Entity[], enabled: boolean): void {
    if (!enabled) {
      this.clearDebugVisuals(scene);
      return;
    }

    entities.forEach((entity) => {
      if (!entity.collider || !entity.isActive) {
        const existing = this.debugMeshes.get(entity.id);
        if (existing) {
          scene.remove(existing);
          existing.geometry.dispose();
          if (Array.isArray(existing.material)) {
            existing.material.forEach((m) => m.dispose());
          } else {
            existing.material.dispose();
          }
          this.debugMeshes.delete(entity.id);
        }
        return;
      }

      let debugMesh = this.debugMeshes.get(entity.id);

      if (!debugMesh) {
        const col = entity.collider;
        let geo: THREE.BufferGeometry;

        if (col.type === 'box') {
          const b = col as BoxCollider;
          geo = new THREE.BoxGeometry(b.size.x, b.size.y, b.size.z);
        } else {
          const s = col as SphereCollider;
          geo = new THREE.SphereGeometry(s.radius, 12, 12);
        }

        const isPlayer = entity.id === 'player_hero' || entity.id.startsWith('player');
        const mat = new THREE.MeshBasicMaterial({
          color: isPlayer ? 0x00ff00 : 0xff3333,
          wireframe: true,
          transparent: true,
          opacity: 0.7,
          depthWrite: false,
        });

        debugMesh = new THREE.Mesh(geo, mat);
        scene.add(debugMesh);
        this.debugMeshes.set(entity.id, debugMesh);
      }

      // Offset position correctly
      const center = entity.position.clone().add(entity.collider.offset);
      debugMesh.position.copy(center);
    });

    // Clean up old ones
    const entityIds = new Set(entities.map((e) => e.id));
    this.debugMeshes.forEach((mesh, id) => {
      if (!entityIds.has(id)) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
        this.debugMeshes.delete(id);
      }
    });
  }

  /**
   * Fully dispose visual debug segments
   */
  public static clearDebugVisuals(scene: THREE.Scene): void {
    this.debugMeshes.forEach((mesh) => {
      scene.remove(mesh);
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material.dispose();
      }
    });
    this.debugMeshes.clear();
  }
}
