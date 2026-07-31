import * as THREE from 'three';
import { ProceduralGenerator, ScatterPoint, VillageScatterPoint, ChunkVisualVariation } from './ProceduralGenerator';
import { AssetLoader } from '../Systems/AssetLoader';
import { VillageGeometryFactory } from './VillageGeometryFactory';

interface InstancedMeshData {
  mesh: THREE.InstancedMesh;
  originalMatrices: THREE.Matrix4[];
  positions: THREE.Vector3[];
  boundingSpheres: THREE.Sphere[];
  visibleStates: boolean[];
}

export class ProceduralChunk {
  public readonly chunkX: number;
  public readonly chunkZ: number;
  public readonly chunkSize: number;
  public readonly meshGroup: THREE.Group;
  public boundingBox: THREE.Box3 = new THREE.Box3();

  private terrainMesh: THREE.Mesh | null = null;
  private instancedMeshes: THREE.InstancedMesh[] = [];
  private gltfModels: THREE.Object3D[] = [];
  private instancedData: InstancedMeshData[] = [];
  private lodStep: number;
  private isDisposed: boolean = false;

  constructor(
    chunkX: number,
    chunkZ: number,
    chunkSize: number,
    lodStep: number, // 1 = High Detail, 2 = Medium, 4 = Low
    generator: ProceduralGenerator,
    assetLoader: AssetLoader
  ) {
    this.chunkX = chunkX;
    this.chunkZ = chunkZ;
    this.chunkSize = chunkSize;
    this.lodStep = lodStep;
    this.meshGroup = new THREE.Group();

    this.buildChunkTerrain(generator, assetLoader);
    if (lodStep <= 2) {
      this.buildChunkScattering(generator, assetLoader);
      this.buildVillageScattering(generator, assetLoader);
    }
  }

  /**
   * Generates procedurally deformed terrain plane geometry with vertex colors
   */
  private buildChunkTerrain(generator: ProceduralGenerator, assetLoader: AssetLoader): void {
    const segments = Math.floor(this.chunkSize / this.lodStep);
    const geometry = new THREE.PlaneGeometry(this.chunkSize, this.chunkSize, segments, segments);
    geometry.rotateX(-Math.PI / 2); // Lay flat on XZ plane

    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    const vertexCount = posAttr.count;

    const colors = new Float32Array(vertexCount * 3);
    const minWorldX = this.chunkX * this.chunkSize;
    const minWorldZ = this.chunkZ * this.chunkSize;

    // Evaluate procedural visual variation profile for this chunk
    const chunkVar = generator.evaluateChunkVisualVariation(this.chunkX, this.chunkZ, this.chunkSize);

    let minH = Infinity;
    let maxH = -Infinity;

    const hsl = { h: 0, s: 0, l: 0 };

    for (let i = 0; i < vertexCount; i++) {
      // Local position inside chunk geometry
      const localX = posAttr.getX(i);
      const localZ = posAttr.getZ(i);

      // Global world coordinates
      const worldX = minWorldX + localX + this.chunkSize / 2;
      const worldZ = minWorldZ + localZ + this.chunkSize / 2;

      const sample = generator.sampleTerrain(worldX, worldZ);

      if (sample.height < minH) minH = sample.height;
      if (sample.height > maxH) maxH = sample.height;

      // Set elevation Y
      posAttr.setY(i, sample.height);

      // Apply chunk color filter, hue shift, saturation and brightness multiplier
      const finalColor = sample.color.clone().multiply(chunkVar.colorFilter);
      finalColor.getHSL(hsl);
      hsl.h = (hsl.h + chunkVar.hueShift + 1.0) % 1.0;
      hsl.s = Math.max(0, Math.min(1, hsl.s * chunkVar.saturationMultiplier));
      hsl.l = Math.max(0, Math.min(1, hsl.l * chunkVar.brightnessMultiplier));
      finalColor.setHSL(hsl.h, hsl.s, hsl.l);

      colors[i * 3 + 0] = finalColor.r;
      colors[i * 3 + 1] = finalColor.g;
      colors[i * 3 + 2] = finalColor.b;
    }

    if (minH === Infinity) {
      minH = -10;
      maxH = 50;
    }
    this.boundingBox.set(
      new THREE.Vector3(minWorldX, minH - 10, minWorldZ),
      new THREE.Vector3(minWorldX + this.chunkSize, maxH + 35, minWorldZ + this.chunkSize)
    );

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    // Clone Claudecraft texture & normal map per chunk to allow unique tiling repeat & rotation without mutating cached texture
    const baseTerrainTex = assetLoader.getTexture(chunkVar.textureKey) || assetLoader.getTexture('grass');
    let terrainTex: THREE.Texture | undefined = undefined;
    if (baseTerrainTex) {
      terrainTex = baseTerrainTex.clone();
      terrainTex.wrapS = THREE.RepeatWrapping;
      terrainTex.wrapT = THREE.RepeatWrapping;
      terrainTex.repeat.set(chunkVar.textureRepeat, chunkVar.textureRepeat);
      terrainTex.rotation = chunkVar.textureRotation;
      terrainTex.center.set(0.5, 0.5);
      terrainTex.needsUpdate = true;
    }

    const baseNormalTex = assetLoader.getTexture(chunkVar.normalKey);
    let normalTex: THREE.Texture | undefined = undefined;
    if (baseNormalTex) {
      normalTex = baseNormalTex.clone();
      normalTex.wrapS = THREE.RepeatWrapping;
      normalTex.wrapT = THREE.RepeatWrapping;
      normalTex.repeat.set(chunkVar.textureRepeat, chunkVar.textureRepeat);
      normalTex.rotation = chunkVar.textureRotation;
      normalTex.center.set(0.5, 0.5);
      normalTex.needsUpdate = true;
    }

    // Use smooth vertex colored terrain material combined with Claudecraft biome texture
    const material = new THREE.MeshStandardMaterial({
      map: terrainTex,
      normalMap: normalTex || undefined,
      vertexColors: true,
      roughness: chunkVar.roughness,
      metalness: chunkVar.metalness,
      flatShading: this.lodStep > 1, // Flat shading for low LOD, smooth for high LOD
    });

    this.terrainMesh = new THREE.Mesh(geometry, material);
    this.terrainMesh.position.set(
      minWorldX + this.chunkSize / 2,
      0,
      minWorldZ + this.chunkSize / 2
    );
    this.terrainMesh.receiveShadow = true;
    this.terrainMesh.castShadow = this.lodStep === 1;

    this.meshGroup.add(this.terrainMesh);
  }

  /**
   * Generates procedural Village Settlements & Roads using preloaded 3D GLTF assets and InstancedMesh
   */
  private buildVillageScattering(generator: ProceduralGenerator, assetLoader: AssetLoader): void {
    const villagePoints = generator.generateVillageScatterForChunk(
      this.chunkX,
      this.chunkZ,
      this.chunkSize
    );
    const roadPoints = generator.generateRoadScatterForChunk(
      this.chunkX,
      this.chunkZ,
      this.chunkSize
    );

    const points = [...villagePoints, ...roadPoints];
    if (points.length === 0) return;

    // Group fallback points (tiles, or GLTF unavailable) for InstancedMesh batching
    const instancedGroups = new Map<string, VillageScatterPoint[]>();

    points.forEach((pt) => {
      const gltfKey = this.getGltfKeyForVillageProp(pt.villagePropType);
      const gltfModel = gltfKey ? assetLoader.getModelInstance(gltfKey) : null;

      if (gltfModel) {
        // Render high-fidelity preloaded 3D GLTF asset from Claudecraft CDN
        gltfModel.position.set(pt.x, pt.y, pt.z);
        gltfModel.rotation.y = pt.rotationY;
        
        // Adjust scale slightly per model type for visually pleasing proportions
        let s = pt.scale;
        if (gltfKey === 'house_1') s *= 1.1;
        else if (gltfKey === 'house_2') s *= 1.1;
        else if (gltfKey === 'eastbrook_inn') s *= 1.0;
        else if (gltfKey === 'eastbrook_bank') s *= 1.0;
        else if (gltfKey === 'eastbrook_smithy') s *= 1.0;
        else if (gltfKey === 'well') s *= 1.2;
        else if (gltfKey === 'eastbrook_noticeboard') s *= 1.1;
        else if (gltfKey === 'golden_horse_statue') s *= 1.2;

        gltfModel.scale.set(s, s, s);
        this.gltfModels.push(gltfModel);
        this.meshGroup.add(gltfModel);
      } else {
        // Fallback or tile geometry via InstancedMesh
        if (!instancedGroups.has(pt.villagePropType)) {
          instancedGroups.set(pt.villagePropType, []);
        }
        instancedGroups.get(pt.villagePropType)!.push(pt);
      }
    });

    // Render remaining instanced geometries (cobblestone roads, etc.)
    const dummy = new THREE.Object3D();

    instancedGroups.forEach((pointsList, propTypeKey) => {
      const assetPkg = VillageGeometryFactory.getAsset(propTypeKey as any);
      if (!assetPkg) return;

      const instancedMesh = new THREE.InstancedMesh(
        assetPkg.geometry,
        assetPkg.material,
        pointsList.length
      );
      instancedMesh.castShadow = true;
      instancedMesh.receiveShadow = true;

      const originalMatrices: THREE.Matrix4[] = [];
      const positions: THREE.Vector3[] = [];
      const boundingSpheres: THREE.Sphere[] = [];
      const visibleStates: boolean[] = [];

      pointsList.forEach((pt, idx) => {
        dummy.position.set(pt.x, pt.y, pt.z);
        dummy.rotation.set(0, pt.rotationY, 0);
        dummy.scale.set(pt.scale, pt.scale, pt.scale);
        dummy.updateMatrix();

        instancedMesh.setMatrixAt(idx, dummy.matrix);

        originalMatrices.push(dummy.matrix.clone());
        positions.push(new THREE.Vector3(pt.x, pt.y, pt.z));
        boundingSpheres.push(new THREE.Sphere(new THREE.Vector3(pt.x, pt.y, pt.z), 2.5 * pt.scale));
        visibleStates.push(true);
      });

      instancedMesh.instanceMatrix.needsUpdate = true;
      this.instancedData.push({
        mesh: instancedMesh,
        originalMatrices,
        positions,
        boundingSpheres,
        visibleStates,
      });
      this.instancedMeshes.push(instancedMesh);
      this.meshGroup.add(instancedMesh);
    });
  }

  private getGltfKeyForVillageProp(propType: VillageScatterPoint['villagePropType']): string | null {
    switch (propType) {
      case 'v_house_small': return 'house_1';
      case 'v_house_medium': return 'house_2';
      case 'v_inn': return 'eastbrook_inn';
      case 'v_bank': return 'eastbrook_bank';
      case 'v_smithy': return 'eastbrook_smithy';
      case 'v_watchtower': return 'column_broken';
      case 'v_well': return 'well';
      case 'v_noticeboard': return 'eastbrook_noticeboard';
      case 'v_fence_straight': return 'fence';
      case 'v_fence_corner': return 'city_fence_wood';
      case 'v_streetlamp': return 'yumi_brazier_stand';
      case 'v_bench': return 'garden_arch';
      case 'v_table': return 'crate_wooden';
      case 'v_barrel_stack': return 'barrel';
      case 'v_crate_stack': return 'crate_wooden';
      case 'v_bonfire': return 'bonfire';
      case 'v_cart': return 'camp_signpost';
      case 'v_city_arch': return 'city_arch';
      case 'v_chest': return 'banker_chest';
      case 'v_flower_bed': return 'flower_bed_round';
      case 'v_statue': return 'golden_horse_statue';
      case 'v_wall_gate': return 'city_arch';
      case 'v_wall_straight': return null;
      case 'v_wall_tower': return null;
      default: return null;
    }
  }

  /**
   * Generates trees, bushes, rocks, foliage, crystals, and ruins across the chunk
   */
  private buildChunkScattering(generator: ProceduralGenerator, assetLoader: AssetLoader): void {
    const chunkVar = generator.evaluateChunkVisualVariation(this.chunkX, this.chunkZ, this.chunkSize);

    const points = generator.generateScatterPointsForChunk(
      this.chunkX,
      this.chunkZ,
      this.chunkSize
    );

    if (points.length === 0) return;

    points.forEach((pt) => {
      const modelKey = this.getModelKeyForProp(pt.propType);
      const gltfModel = assetLoader.getModelInstance(modelKey);

      if (gltfModel) {
        // Render preloaded 3D GLTF asset
        gltfModel.position.set(pt.x, pt.y, pt.z);
        gltfModel.rotation.y = pt.rotationY;
        gltfModel.scale.set(pt.scale, pt.scale, pt.scale);
        this.gltfModels.push(gltfModel);
        this.meshGroup.add(gltfModel);
      } else {
        // Fallback: Render rich 3D procedural object with chunk foliage tint
        const propObject = this.createProceduralPropObject(pt, assetLoader, chunkVar);
        if (propObject) {
          this.gltfModels.push(propObject);
          this.meshGroup.add(propObject);
        }
      }
    });
  }

  private getModelKeyForProp(propType: ScatterPoint['propType']): string {
    switch (propType) {
      case 'pine': return 'pine_1';
      case 'oak': return 'oak_1';
      case 'bush': return 'bush';
      case 'rock': return 'rock_1';
      case 'flower': return 'flower_bed_round';
      case 'mushroom': return 'mushroom';
      case 'barrel': return 'barrel';
      case 'crystal': return 'crystal_amethyst';
      case 'ruin': return 'column_broken';
      default: return 'oak_1';
    }
  }

  /**
   * Generates procedural 3D prop geometry fallbacks when GLTF models are absent
   */
  private createProceduralPropObject(
    pt: ScatterPoint,
    assetLoader: AssetLoader,
    chunkVar?: ChunkVisualVariation
  ): THREE.Group {
    const group = new THREE.Group();
    group.position.set(pt.x, pt.y, pt.z);
    group.rotation.y = pt.rotationY;
    group.scale.set(pt.scale, pt.scale, pt.scale);

    const foliageColor = chunkVar ? chunkVar.foliageColorTint : new THREE.Color(0x15803d);

    if (pt.propType === 'pine') {
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.9 });
      const leafMat = new THREE.MeshStandardMaterial({ color: foliageColor, roughness: 0.85 });

      const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 1.5, 6);
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 0.75;
      trunk.castShadow = true;
      group.add(trunk);

      [
        { r: 1.5, h: 1.8, y: 2.1 },
        { r: 1.1, h: 1.4, y: 3.1 },
        { r: 0.7, h: 1.0, y: 3.9 },
      ].forEach((layer) => {
        const leafGeo = new THREE.ConeGeometry(layer.r, layer.h, 5);
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.y = layer.y;
        leaf.castShadow = true;
        group.add(leaf);
      });
    } else if (pt.propType === 'oak') {
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6e4726, roughness: 0.9 });
      const leafMat = new THREE.MeshStandardMaterial({ color: foliageColor, roughness: 0.8 });

      const trunkGeo = new THREE.CylinderGeometry(0.3, 0.45, 1.8, 6);
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 0.9;
      trunk.castShadow = true;
      group.add(trunk);

      const canopyGeo = new THREE.DodecahedronGeometry(1.4, 1);
      const canopy = new THREE.Mesh(canopyGeo, leafMat);
      canopy.position.y = 2.8;
      canopy.castShadow = true;
      group.add(canopy);
    } else if (pt.propType === 'rock') {
      const stoneMat = assetLoader.getMaterial('stone');
      const rockGeo = new THREE.DodecahedronGeometry(0.8, 1);
      const rock = new THREE.Mesh(rockGeo, stoneMat);
      rock.scale.set(1.1, 0.7, 1.1);
      rock.position.y = 0.4;
      rock.castShadow = true;
      group.add(rock);
    } else if (pt.propType === 'bush') {
      const bushMat = new THREE.MeshStandardMaterial({ color: foliageColor, roughness: 0.9 });
      const bushGeo = new THREE.DodecahedronGeometry(0.65, 1);
      const bush = new THREE.Mesh(bushGeo, bushMat);
      bush.scale.set(1.2, 0.8, 1.2);
      bush.position.y = 0.4;
      bush.castShadow = true;
      group.add(bush);
    } else if (pt.propType === 'flower') {
      const petalMat = new THREE.MeshStandardMaterial({ color: foliageColor, roughness: 0.4 });
      const flowerGeo = new THREE.DodecahedronGeometry(0.2, 0);
      const flower = new THREE.Mesh(flowerGeo, petalMat);
      flower.position.y = 0.25;
      group.add(flower);
    } else if (pt.propType === 'mushroom') {
      const stemMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc });
      const capMat = new THREE.MeshStandardMaterial({
        color: foliageColor,
        emissive: foliageColor.clone().multiplyScalar(0.5),
        emissiveIntensity: 0.8,
      });

      const stemGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.4, 6);
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = 0.2;
      group.add(stem);

      const capGeo = new THREE.ConeGeometry(0.25, 0.25, 8);
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.y = 0.45;
      group.add(cap);
    } else if (pt.propType === 'barrel') {
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
      const barrelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.8, 8);
      const barrel = new THREE.Mesh(barrelGeo, woodMat);
      barrel.position.y = 0.4;
      barrel.castShadow = true;
      group.add(barrel);
    } else if (pt.propType === 'crystal') {
      const crystalMat = new THREE.MeshStandardMaterial({
        color: foliageColor,
        emissive: foliageColor.clone().multiplyScalar(0.7),
        emissiveIntensity: 0.9,
      });
      const crystalGeo = new THREE.OctahedronGeometry(0.5, 0);
      const crystal = new THREE.Mesh(crystalGeo, crystalMat);
      crystal.scale.set(0.6, 1.4, 0.6);
      crystal.position.y = 0.7;
      crystal.castShadow = true;
      group.add(crystal);
    } else if (pt.propType === 'ruin') {
      const stoneMat = assetLoader.getMaterial('stone');
      const ruinGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.6, 8);
      ruinGeo.rotateZ(Math.PI / 2);
      const ruin = new THREE.Mesh(ruinGeo, stoneMat);
      ruin.position.y = 0.4;
      ruin.castShadow = true;
      group.add(ruin);
    }

    return group;
  }

  /**
   * High-performance Frustum Culling & Distance Culling for chunk elements (GLTF models & InstancedMesh instances)
   */
  public updateCulling(frustum: THREE.Frustum, cameraPos: THREE.Vector3, maxViewDistance: number = 85.0): void {
    if (this.isDisposed) return;

    // 1. Chunk Level Frustum Culling
    if (!frustum.intersectsBox(this.boundingBox)) {
      this.meshGroup.visible = false;
      return;
    }
    this.meshGroup.visible = true;

    const maxDistSq = maxViewDistance * maxViewDistance;
    const tempSphere = new THREE.Sphere();

    // 2. Individual GLTF Models Culling (houses, trees, structures)
    for (let i = 0; i < this.gltfModels.length; i++) {
      const model = this.gltfModels[i];
      const distSq = model.position.distanceToSquared(cameraPos);
      if (distSq > maxDistSq) {
        model.visible = false;
        continue;
      }
      tempSphere.center.copy(model.position);
      tempSphere.radius = 5.0; // conservative bounding sphere radius
      model.visible = frustum.intersectsSphere(tempSphere);
    }

    // 3. InstancedMesh Per-Instance Culling (roads, trees, rocks, props)
    const zeroMatrix = new THREE.Matrix4().makeScale(0, 0, 0);

    for (let j = 0; j < this.instancedData.length; j++) {
      const item = this.instancedData[j];
      let needsUpdate = false;
      const count = item.positions.length;

      for (let i = 0; i < count; i++) {
        const pos = item.positions[i];
        const distSq = pos.distanceToSquared(cameraPos);
        const isVisible = distSq <= maxDistSq && frustum.intersectsSphere(item.boundingSpheres[i]);

        if (isVisible !== item.visibleStates[i]) {
          item.visibleStates[i] = isVisible;
          if (isVisible) {
            item.mesh.setMatrixAt(i, item.originalMatrices[i]);
          } else {
            item.mesh.setMatrixAt(i, zeroMatrix);
          }
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        item.mesh.instanceMatrix.needsUpdate = true;
      }
    }
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;

    if (this.terrainMesh) {
      this.terrainMesh.geometry.dispose();
      if (Array.isArray(this.terrainMesh.material)) {
        this.terrainMesh.material.forEach((m) => m.dispose());
      } else {
        this.terrainMesh.material.dispose();
      }
    }

    this.meshGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });

    this.instancedMeshes = [];
    this.gltfModels = [];
    this.instancedData = [];
    while (this.meshGroup.children.length > 0) {
      this.meshGroup.remove(this.meshGroup.children[0]);
    }
  }
}
