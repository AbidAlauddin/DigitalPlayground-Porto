import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';

/**
 * Modern, Balanced-Proportion, Smooth Soft-Matte 3D Mascot Generator
 * for "The Skill Builder" (Skills Section 03/06).
 *
 * Strictly adheres to the NEW art direction:
 * - Normal, trim, balanced character proportions (NO fat/chubby belly, NO round blob silhouette).
 * - 100% smooth, clean surface (NO fur texture, NO fur shells, NO mushroom cap).
 * - High-contrast, expressive designer face with a flush cream-mint face plate,
 *   2 clear symmetrical eyes, animated 3D eyebrows, friendly mouth with tongue,
 *   sleek swept-up fantasy ear-crests, and a playful amber builder antenna-orb.
 * - Trim builder tunic with a slate-and-amber utility belt, amber wrist cuffs,
 *   articulated arms/hands, and sleek two-tone builder boots.
 */

function finalizeGeometry(geo) {
  geo.computeVertexNormals();
  const pos = geo.attributes.position;
  const uvs = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uvs[i * 2] = 0.5;
    uvs[i * 2 + 1] = 0.5;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  return geo;
}

function partitionGeometryByTriangles(geo, classifyTriangle) {
  geo.computeVertexNormals();
  const pos = geo.attributes.position;
  const norm = geo.attributes.normal;
  const index = geo.index;

  const uvs = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uvs[i * 2] = 0.5;
    uvs[i * 2 + 1] = 0.5;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

  const buckets = new Map();
  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();
  const nA = new THREE.Vector3();

  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i);
    const b = index.getX(i + 1);
    const c = index.getX(i + 2);

    vA.fromBufferAttribute(pos, a);
    vB.fromBufferAttribute(pos, b);
    vC.fromBufferAttribute(pos, c);
    nA.fromBufferAttribute(norm, a);

    const cx = (vA.x + vB.x + vC.x) / 3;
    const cy = (vA.y + vB.y + vC.y) / 3;
    const cz = (vA.z + vB.z + vC.z) / 3;

    const matIdx = classifyTriangle(cx, cy, cz, nA.x, nA.y, nA.z);
    if (!buckets.has(matIdx)) buckets.set(matIdx, []);
    buckets.get(matIdx).push(a, b, c);
  }

  const primitives = [];
  for (const [matIdx, triIndices] of buckets.entries()) {
    const subGeo = geo.clone();
    subGeo.setIndex(triIndices);
    primitives.push({ geometry: subGeo, material: matIdx });
  }
  return primitives;
}

/**
 * 1. Sleek Modern Designer Head (rounded-squircle contour with flush high-contrast Face Plate)
 */
function createModernHeadPrimitives() {
  const geo = new THREE.SphereGeometry(0.32, 76, 60);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const nx = v.x / 0.32;
    const ny = v.y / 0.32;
    const nz = v.z / 0.32;

    // Subtle squircle shaping (modern vinyl designer toy head, NOT a plain sphere)
    const squircle = 1.0 + 0.06 * (1 - Math.abs(ny)) * Math.abs(nx);
    const jawTaper = ny < 0 ? 1.0 - Math.pow(-ny, 1.8) * 0.08 : 1.0 - Math.pow(ny, 2.2) * 0.06;

    let x = v.x * 1.12 * squircle * jawTaper;
    let y = v.y * 0.94;
    let z = v.z * 0.94;

    // Smooth flat-fronted visor/face plane for crisp facial readability
    if (nz > 0.32) {
      z -= (nz - 0.32) * 0.045;
    }

    pos.setXYZ(i, x, y, z);
  }

  // Partition into Builder_Main (0: sleek teal head cowl) and Builder_Secondary (1: crisp cream-mint face plate)
  return partitionGeometryByTriangles(geo, (cx, cy, cz) => {
    if (cz > 0.13) {
      const rx = Math.abs(cx) / 0.255;
      const ry = Math.abs(cy + 0.01) / 0.195;
      if (Math.pow(rx, 2.8) + Math.pow(ry, 2.8) <= 1.0) {
        return 1; // Builder_Secondary (#E2F6F2 crisp cream-mint face plate)
      }
    }
    return 0; // Builder_Main (#248B82 sleek teal head cowl)
  });
}

/**
 * 2. Trim, Balanced Athletic-Stylized Torso (NOT fat, NOT a round blob!)
 * Features a sleek tapered chest, cream-mint front bib/emblem, and a neat slate-teal utility belt waist.
 */
function createTrimTorsoPrimitives() {
  const geo = new THREE.CapsuleGeometry(0.22, 0.24, 36, 64);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const ny = THREE.MathUtils.clamp(v.y / 0.34, -1, 1); // -1 bottom hips .. +1 top shoulders

    // Trim, balanced silhouette: defined shoulders at top, neat tapered waist
    const widthProfile = 1.04 + ny * 0.08 - Math.pow(ny, 2) * 0.06;
    const depthProfile = 0.84 - Math.abs(ny) * 0.04;

    pos.setXYZ(i, v.x * widthProfile, v.y, v.z * depthProfile);
  }

  // Partition into:
  // 0: Builder_Main (sleek sage-teal tunic)
  // 1: Builder_Secondary (crisp cream-mint chest emblem panel)
  // 7: Builder_Belt (deep slate-teal utility belt around the lower waist)
  return partitionGeometryByTriangles(geo, (cx, cy, cz) => {
    // Neat horizontal builder utility belt at waist
    if (cy >= -0.17 && cy <= -0.085) {
      return 7; // Builder_Belt (#184E4A deep slate-teal belt)
    }
    // Crisp modern chest panel on upper front torso
    if (cz > 0.11 && cy > -0.05 && cy < 0.17 && Math.abs(cx) < 0.135) {
      return 1; // Builder_Secondary (#E2F6F2)
    }
    return 0; // Builder_Main (#248B82)
  });
}

/**
 * 3. Sleek Swept-Up Fantasy Sprite Ear-Crest (smoothly curved upward & backward, NOT horns/mushroom!)
 */
function createSweptEarCrestGeometry(side) {
  const geo = new THREE.ConeGeometry(0.082, 0.25, 24, 18);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const t = THREE.MathUtils.clamp((v.y + 0.125) / 0.25, 0, 1); // 0 base .. 1 tip
    // Round out tip so it's soft & designer-friendly, never sharp
    const tipSoft = Math.sin(t * Math.PI * 0.5);
    const x = v.x * 0.72 + side * Math.pow(t, 1.6) * 0.055;
    const y = v.y;
    const z = v.z * 1.05 - Math.pow(t, 1.5) * 0.045 + tipSoft * 0.01;
    pos.setXYZ(i, x, y, z);
  }
  return finalizeGeometry(geo);
}

/**
 * 4. Smooth Tapered Limb (Slender, well-proportioned arms & legs)
 */
function createLimbGeometry(radiusTop, radiusBottom, length) {
  const geo = new THREE.CapsuleGeometry((radiusTop + radiusBottom) * 0.5, length, 16, 28);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  const halfH = length * 0.5 + (radiusTop + radiusBottom) * 0.5;

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const t = THREE.MathUtils.clamp((v.y + halfH) / (2 * halfH), 0, 1);
    const scaleR =
      THREE.MathUtils.lerp(radiusBottom, radiusTop, t) / ((radiusTop + radiusBottom) * 0.5);
    pos.setXYZ(i, v.x * scaleR, v.y, v.z * scaleR);
  }
  return finalizeGeometry(geo);
}

/**
 * 5. Sleek Two-Tone Builder Boot
 */
function createBootGeometry() {
  const geo = new THREE.SphereGeometry(0.105, 28, 20);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    let y = v.y * 0.72;
    if (y < -0.045) y = -0.045; // Crisp flat boot sole
    pos.setXYZ(i, v.x * 0.88, y, v.z * 1.32);
  }

  // Partition sole trim (1: light cream-mint) vs boot upper (7: deep slate-teal)
  return partitionGeometryByTriangles(geo, (cx, cy) => {
    if (cy < -0.024) return 1;
    return 7;
  });
}

/**
 * Binary glTF 2.0 (.glb) serializer
 */
function exportHierarchyToGLB(rootDef, materialsDef) {
  const nodes = [];
  const meshes = [];
  const accessors = [];
  const bufferViews = [];
  const binChunks = [];
  let byteOffset = 0;

  function appendBuffer(typedArray, target) {
    const buf = Buffer.from(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
    const pad = (4 - (buf.length % 4)) % 4;
    const padded = pad > 0 ? Buffer.concat([buf, Buffer.alloc(pad)]) : buf;

    const viewIdx = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset,
      byteLength: buf.length,
      ...(target ? { target } : {}),
    });
    binChunks.push(padded);
    byteOffset += padded.length;
    return viewIdx;
  }

  function addGeometryPrimitive(geo, materialIndex) {
    const posAttr = geo.attributes.position;
    const normAttr = geo.attributes.normal;
    const uvAttr = geo.attributes.uv;
    const indexAttr = geo.index;

    const posArray = new Float32Array(posAttr.count * 3);
    const normArray = new Float32Array(normAttr.count * 3);
    const uvArray = new Float32Array(posAttr.count * 2);

    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];

    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);
      posArray[i * 3] = x;
      posArray[i * 3 + 1] = y;
      posArray[i * 3 + 2] = z;
      if (x < min[0]) min[0] = x;
      if (y < min[1]) min[1] = y;
      if (z < min[2]) min[2] = z;
      if (x > max[0]) max[0] = x;
      if (y > max[1]) max[1] = y;
      if (z > max[2]) max[2] = z;

      normArray[i * 3] = normAttr.getX(i);
      normArray[i * 3 + 1] = normAttr.getY(i);
      normArray[i * 3 + 2] = normAttr.getZ(i);

      uvArray[i * 2] = uvAttr ? uvAttr.getX(i) : 0.5;
      uvArray[i * 2 + 1] = uvAttr ? uvAttr.getY(i) : 0.5;
    }

    const posView = appendBuffer(posArray, 34962);
    const posAcc = accessors.length;
    accessors.push({
      bufferView: posView,
      componentType: 5126,
      count: posAttr.count,
      type: 'VEC3',
      min,
      max,
    });

    const normView = appendBuffer(normArray, 34962);
    const normAcc = accessors.length;
    accessors.push({
      bufferView: normView,
      componentType: 5126,
      count: normAttr.count,
      type: 'VEC3',
    });

    const uvView = appendBuffer(uvArray, 34962);
    const uvAcc = accessors.length;
    accessors.push({
      bufferView: uvView,
      componentType: 5126,
      count: posAttr.count,
      type: 'VEC2',
    });

    let indicesAcc;
    if (indexAttr) {
      const idxArray = new Uint16Array(indexAttr.count);
      for (let i = 0; i < indexAttr.count; i++) idxArray[i] = indexAttr.getX(i);
      const idxView = appendBuffer(idxArray, 34963);
      indicesAcc = accessors.length;
      accessors.push({
        bufferView: idxView,
        componentType: 5123,
        count: indexAttr.count,
        type: 'SCALAR',
      });
    }

    return {
      attributes: {
        POSITION: posAcc,
        NORMAL: normAcc,
        TEXCOORD_0: uvAcc,
      },
      ...(indicesAcc !== undefined ? { indices: indicesAcc } : {}),
      material: materialIndex,
    };
  }

  function buildNode(def) {
    const nodeIdx = nodes.length;
    const nodeObj = { name: def.name };
    if (def.translation) nodeObj.translation = def.translation;
    if (def.rotation) {
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...def.rotation));
      nodeObj.rotation = [q.x, q.y, q.z, q.w];
    }
    if (def.scale) nodeObj.scale = def.scale;

    if (def.primitives && def.primitives.length > 0) {
      const meshIdx = meshes.length;
      meshes.push({
        name: `${def.name}_Mesh`,
        primitives: def.primitives.map((p) => addGeometryPrimitive(p.geometry, p.material)),
      });
      nodeObj.mesh = meshIdx;
    }

    nodes.push(nodeObj);

    if (def.children && def.children.length > 0) {
      nodeObj.children = def.children.map((child) => buildNode(child));
    }
    return nodeIdx;
  }

  const rootIdx = buildNode(rootDef);
  const binBuffer = Buffer.concat(binChunks);

  const gltfJson = {
    asset: { version: '2.0', generator: 'DigitalPlayground-ModernSkillBuilderV3' },
    scene: 0,
    scenes: [{ name: 'Scene', nodes: [rootIdx] }],
    nodes,
    meshes,
    materials: materialsDef,
    accessors,
    bufferViews,
    buffers: [{ byteLength: binBuffer.length }],
  };

  const jsonStr = JSON.stringify(gltfJson);
  const jsonPad = (4 - (Buffer.byteLength(jsonStr) % 4)) % 4;
  const jsonBuf = Buffer.from(jsonStr + ' '.repeat(jsonPad), 'utf8');

  const totalLength = 12 + 8 + jsonBuf.length + 8 + binBuffer.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonBuf.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binBuffer.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);

  return Buffer.concat([header, jsonHeader, jsonBuf, binHeader, binBuffer]);
}

const MATERIALS = [
  {
    name: 'Builder_Main', // 0: Smooth Soft-Matte Designer Teal (#269288)
    pbrMetallicRoughness: {
      baseColorFactor: [0.149, 0.573, 0.533, 1.0],
      roughnessFactor: 0.48,
      metallicFactor: 0.02,
    },
  },
  {
    name: 'Builder_Secondary', // 1: Crisp Soft-Matte Cream-Mint Face Plate, Hands & Boot Trim (#E0F5F1)
    pbrMetallicRoughness: {
      baseColorFactor: [0.878, 0.961, 0.945, 1.0],
      roughnessFactor: 0.46,
      metallicFactor: 0.0,
    },
  },
  {
    name: 'Builder_Accent', // 2: Warm Amber-Gold Antenna Orb, Belt Buckle & Wrist Cuffs (#F59E0B)
    pbrMetallicRoughness: {
      baseColorFactor: [0.961, 0.62, 0.043, 1.0],
      roughnessFactor: 0.34,
      metallicFactor: 0.2,
    },
  },
  {
    name: 'Builder_Mouth', // 3: Expressive Smile Interior (#6E3542)
    pbrMetallicRoughness: {
      baseColorFactor: [0.431, 0.208, 0.259, 1.0],
      roughnessFactor: 0.55,
      metallicFactor: 0.0,
    },
  },
  {
    name: 'Builder_Tongue', // 4: Cute Coral-Pink Tongue (#F08E9C)
    pbrMetallicRoughness: {
      baseColorFactor: [0.941, 0.557, 0.612, 1.0],
      roughnessFactor: 0.45,
      metallicFactor: 0.0,
    },
  },
  {
    name: 'Builder_Teeth', // 5: Crisp White Tooth (#FFFDF7)
    pbrMetallicRoughness: {
      baseColorFactor: [1.0, 0.992, 0.969, 1.0],
      roughnessFactor: 0.3,
      metallicFactor: 0.0,
    },
  },
  {
    name: 'Builder_Blush', // 6: Warm Coral Cheek Accent (#F4978E)
    pbrMetallicRoughness: {
      baseColorFactor: [0.957, 0.592, 0.557, 1.0],
      roughnessFactor: 0.85,
      metallicFactor: 0.0,
    },
  },
  {
    name: 'Builder_Belt', // 7: Deep Slate-Teal Utility Belt, Eyebrows & Boot Upper (#164E4A)
    pbrMetallicRoughness: {
      baseColorFactor: [0.086, 0.306, 0.29, 1.0],
      roughnessFactor: 0.52,
      metallicFactor: 0.04,
    },
  },
];

// Build Geometries
const torsoPrimitives = createTrimTorsoPrimitives();
const headPrimitives = createModernHeadPrimitives();
const earCrestLGeo = createSweptEarCrestGeometry(-1);
const earCrestRGeo = createSweptEarCrestGeometry(1);
const antennaStemGeo = createLimbGeometry(0.018, 0.024, 0.11);
const antennaOrbGeo = finalizeGeometry(new THREE.SphereGeometry(0.052, 22, 16));
const browGeo = finalizeGeometry(new THREE.CapsuleGeometry(0.016, 0.072, 10, 16));
const noseGeo = finalizeGeometry(new THREE.SphereGeometry(0.036, 18, 14));
const mouthGeo = finalizeGeometry(new THREE.SphereGeometry(0.068, 22, 16));
const tongueGeo = finalizeGeometry(new THREE.SphereGeometry(0.046, 18, 14));
const toothGeo = finalizeGeometry(new THREE.SphereGeometry(0.02, 14, 10));
const blushGeo = finalizeGeometry(new THREE.SphereGeometry(0.042, 16, 12));
const buckleGeo = finalizeGeometry(new THREE.BoxGeometry(0.11, 0.075, 0.04));
const neckGeo = createLimbGeometry(0.088, 0.098, 0.08);

const upperArmGeo = createLimbGeometry(0.072, 0.064, 0.19);
const lowerArmGeo = createLimbGeometry(0.064, 0.058, 0.17);
const cuffGeo = finalizeGeometry(new THREE.CylinderGeometry(0.066, 0.066, 0.036, 20));
const handGeo = finalizeGeometry(new THREE.SphereGeometry(0.078, 22, 16));
const thumbGeo = finalizeGeometry(new THREE.SphereGeometry(0.034, 14, 10));

const upperLegGeo = createLimbGeometry(0.086, 0.076, 0.19);
const lowerLegGeo = createLimbGeometry(0.076, 0.068, 0.17);
const bootPrimitives = createBootGeometry();

const hierarchy = {
  name: 'RootNode',
  children: [
    {
      name: 'Hips',
      translation: [0, 0.68, 0],
      children: [
        {
          name: 'Abdomen',
          translation: [0, 0.04, 0],
          children: [
            {
              name: 'Torso',
              translation: [0, 0.08, 0],
              primitives: torsoPrimitives,
              children: [
                // Warm Amber Builder Belt Buckle
                {
                  name: 'BeltBuckle',
                  translation: [0, -0.128, 0.19],
                  primitives: [{ geometry: buckleGeo, material: 2 }],
                },
                {
                  name: 'Neck',
                  translation: [0, 0.31, 0.0],
                  primitives: [{ geometry: neckGeo, material: 0 }],
                  children: [
                    {
                      name: 'Head',
                      translation: [0, 0.25, 0.01],
                      primitives: headPrimitives,
                      children: [
                        // Sleek Swept-Up Fantasy Sprite Ear-Crests (distinct modern silhouette!)
                        {
                          name: 'EarCrestL',
                          translation: [-0.31, 0.16, -0.02],
                          rotation: [-0.18, 0, 0.58],
                          primitives: [{ geometry: earCrestLGeo, material: 0 }],
                        },
                        {
                          name: 'EarCrestR',
                          translation: [0.31, 0.16, -0.02],
                          rotation: [-0.18, 0, -0.58],
                          primitives: [{ geometry: earCrestRGeo, material: 0 }],
                        },
                        // Playful Builder Antenna Stem + Amber Beacon Orb on top of head
                        {
                          name: 'Antenna',
                          translation: [0, 0.32, 0.02],
                          rotation: [0.15, 0, 0],
                          children: [
                            {
                              name: 'AntennaStem',
                              translation: [0, 0.05, 0],
                              primitives: [{ geometry: antennaStemGeo, material: 7 }],
                            },
                            {
                              name: 'AntennaOrb',
                              translation: [0, 0.13, 0.01],
                              primitives: [{ geometry: antennaOrbGeo, material: 2 }],
                            },
                          ],
                        },
                        // Expressive 3D Floating Eyebrows (animated live with mood!)
                        {
                          name: 'BrowL',
                          translation: [-0.125, 0.155, 0.285],
                          rotation: [0, -0.18, 1.48],
                          primitives: [{ geometry: browGeo, material: 7 }],
                        },
                        {
                          name: 'BrowR',
                          translation: [0.125, 0.155, 0.285],
                          rotation: [0, 0.18, -1.48],
                          primitives: [{ geometry: browGeo, material: 7 }],
                        },
                        // Small Sculpted Nose Button on the Cream-Mint Face Plate
                        {
                          name: 'NoseBump',
                          translation: [0, -0.005, 0.295],
                          scale: [1.15, 0.85, 0.72],
                          primitives: [{ geometry: noseGeo, material: 0 }],
                        },
                        // Friendly Expressive Smile + Coral Tongue + Tiny White Tooth
                        {
                          name: 'MouthSmile',
                          translation: [0, -0.095, 0.282],
                          scale: [1.22, 0.68, 0.36],
                          primitives: [{ geometry: mouthGeo, material: 3 }],
                        },
                        {
                          name: 'MouthTongue',
                          translation: [0, -0.11, 0.294],
                          scale: [1.08, 0.56, 0.4],
                          primitives: [{ geometry: tongueGeo, material: 4 }],
                        },
                        {
                          name: 'ToothL',
                          translation: [-0.032, -0.07, 0.302],
                          scale: [1.05, 0.8, 0.55],
                          primitives: [{ geometry: toothGeo, material: 5 }],
                        },
                        {
                          name: 'ToothR',
                          translation: [0.032, -0.07, 0.302],
                          scale: [1.05, 0.8, 0.55],
                          primitives: [{ geometry: toothGeo, material: 5 }],
                        },
                        // Subtle Warm Cheek Accents
                        {
                          name: 'CheekBlushL',
                          translation: [-0.205, -0.048, 0.262],
                          rotation: [0, -0.35, 0],
                          scale: [1.08, 0.68, 0.28],
                          primitives: [{ geometry: blushGeo, material: 6 }],
                        },
                        {
                          name: 'CheekBlushR',
                          translation: [0.205, -0.048, 0.262],
                          rotation: [0, 0.35, 0],
                          scale: [1.08, 0.68, 0.28],
                          primitives: [{ geometry: blushGeo, material: 6 }],
                        },
                      ],
                    },
                  ],
                },
                // Left Balanced Arm + Amber Cuff + Cream-Mint Hand
                {
                  name: 'UpperArmL',
                  translation: [-0.28, 0.19, 0.01],
                  children: [
                    {
                      name: 'UpperArmL_Visual',
                      translation: [0, -0.1, 0],
                      primitives: [{ geometry: upperArmGeo, material: 0 }],
                    },
                    {
                      name: 'LowerArmL',
                      translation: [0, -0.21, 0],
                      children: [
                        {
                          name: 'LowerArmL_Visual',
                          translation: [0, -0.085, 0],
                          primitives: [{ geometry: lowerArmGeo, material: 0 }],
                        },
                        {
                          name: 'WristCuffL',
                          translation: [0, -0.155, 0],
                          primitives: [{ geometry: cuffGeo, material: 2 }],
                        },
                        {
                          name: 'HandL',
                          translation: [0, -0.21, 0.012],
                          scale: [0.88, 1.12, 0.78],
                          primitives: [{ geometry: handGeo, material: 1 }],
                          children: [
                            {
                              name: 'ThumbL',
                              translation: [0.055, 0.02, 0.045],
                              primitives: [{ geometry: thumbGeo, material: 1 }],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                // Right Balanced Arm + Amber Cuff + Cream-Mint Hand
                {
                  name: 'UpperArmR',
                  translation: [0.28, 0.19, 0.01],
                  children: [
                    {
                      name: 'UpperArmR_Visual',
                      translation: [0, -0.1, 0],
                      primitives: [{ geometry: upperArmGeo, material: 0 }],
                    },
                    {
                      name: 'LowerArmR',
                      translation: [0, -0.21, 0],
                      children: [
                        {
                          name: 'LowerArmR_Visual',
                          translation: [0, -0.085, 0],
                          primitives: [{ geometry: lowerArmGeo, material: 0 }],
                        },
                        {
                          name: 'WristCuffR',
                          translation: [0, -0.155, 0],
                          primitives: [{ geometry: cuffGeo, material: 2 }],
                        },
                        {
                          name: 'HandR',
                          translation: [0, -0.21, 0.012],
                          scale: [0.88, 1.12, 0.78],
                          primitives: [{ geometry: handGeo, material: 1 }],
                          children: [
                            {
                              name: 'ThumbR',
                              translation: [-0.055, 0.02, 0.045],
                              primitives: [{ geometry: thumbGeo, material: 1 }],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        // Left Agile Leg + Sleek Two-Tone Builder Boot
        {
          name: 'UpperLegL',
          translation: [-0.135, -0.18, 0.0],
          children: [
            {
              name: 'UpperLegL_Visual',
              translation: [0, -0.1, 0],
              primitives: [{ geometry: upperLegGeo, material: 0 }],
            },
            {
              name: 'LowerLegL',
              translation: [0, -0.22, 0],
              children: [
                {
                  name: 'LowerLegL_Visual',
                  translation: [0, -0.085, 0],
                  primitives: [{ geometry: lowerLegGeo, material: 0 }],
                },
                {
                  name: 'FootL',
                  translation: [0, -0.19, 0.038],
                  primitives: bootPrimitives,
                },
              ],
            },
          ],
        },
        // Right Agile Leg + Sleek Two-Tone Builder Boot
        {
          name: 'UpperLegR',
          translation: [0.135, -0.18, 0.0],
          children: [
            {
              name: 'UpperLegR_Visual',
              translation: [0, -0.1, 0],
              primitives: [{ geometry: upperLegGeo, material: 0 }],
            },
            {
              name: 'LowerLegR',
              translation: [0, -0.22, 0],
              children: [
                {
                  name: 'LowerLegR_Visual',
                  translation: [0, -0.085, 0],
                  primitives: [{ geometry: lowerLegGeo, material: 0 }],
                },
                {
                  name: 'FootR',
                  translation: [0, -0.19, 0.038],
                  primitives: bootPrimitives,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const glbBuffer = exportHierarchyToGLB(hierarchy, MATERIALS);
const outPath = path.resolve('public/monsters/skill-builder/modern-builder.glb');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, glbBuffer);
console.log(`Generated ${outPath} (${(glbBuffer.length / 1024).toFixed(1)} KB)`);
