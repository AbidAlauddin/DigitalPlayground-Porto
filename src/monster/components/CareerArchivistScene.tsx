import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { getFurBumpTexture } from '../utils/furTextures';
import {
  getArchivistBadgeTexture,
  getDocumentTexture,
} from '../utils/archivistTextures';

const MODEL_PATH = '/monsters/archivist/archivist-mascot.glb';
const DESK_PATH = '/models/workspace/desk.glb';

// Rebalanced Workstation Dimensions (consistent with Section 02 About desk design)
const MONSTER_SCALE = 0.66; // ~78.5% of previous 0.84 scale for natural desk-to-monster balance
const DESK_WIDTH = 1.58;
const DESK_HEIGHT = 0.72;
const DESK_DEPTH = 0.64;

/**
 * Clones & normalizes the shared Section 02 desk GLB into an independent instance
 * with exact target width/height/depth and its bottom resting flush at y = 0.
 */
function buildArchivistDesk(source: THREE.Object3D): THREE.Group {
  const wrapper = new THREE.Group();
  const cloned = source.clone(true);
  wrapper.add(cloned);
  wrapper.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(cloned);
  const rawSize = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(rawSize);
  box.getCenter(center);

  const sx = rawSize.x > 0.0001 ? DESK_WIDTH / rawSize.x : 1;
  const sy = rawSize.y > 0.0001 ? DESK_HEIGHT / rawSize.y : 1;
  const sz = rawSize.z > 0.0001 ? DESK_DEPTH / rawSize.z : 1;

  cloned.scale.set(cloned.scale.x * sx, cloned.scale.y * sy, cloned.scale.z * sz);
  cloned.position.set(-center.x * sx, -box.min.y * sy, -center.z * sz);

  // Apply exact Section 02 About desk material palette (#DFC3A3 warm wood + #3A3735 matte dark)
  cloned.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const matName = (mesh.material as THREE.MeshStandardMaterial)?.name || '';
      if (matName.toLowerCase().includes('wood')) {
        mesh.material = new THREE.MeshStandardMaterial({
          color: '#DFC3A3',
          roughness: 0.72,
          metalness: 0.02,
        });
      } else {
        mesh.material = new THREE.MeshStandardMaterial({
          color: '#3A3735',
          roughness: 0.5,
          metalness: 0.25,
        });
      }
    }
  });

  return wrapper;
}

export type ArchivistActivity = 'idle' | 'inspect' | 'organize' | 'stamp' | 'review' | 'celebrate';
type GripAnchorId = 'L' | 'R' | 'BOTH';
type PropId = 'paper' | 'folder' | 'stamp';
type HandPose = 'relaxed' | 'documentHold' | 'folderHold' | 'stampGrip' | 'waveOpen';

export interface CareerArchivistDebugState {
  loaded: boolean;
  activity: ArchivistActivity;
  isBlinking: boolean;
  isTracking: boolean;
  headYaw: number;
  headPitch: number;
  headRoll: number;
  drawerOpenAmount: number;
  stampPressed: boolean;
  stampedDocument: boolean;
  stageProgress: number;
  attachedProps: Record<PropId, GripAnchorId | null>;
  leftHandWorld: [number, number, number];
  rightHandWorld: [number, number, number];
  stampWorld: [number, number, number];
  paperWorld: [number, number, number];
}

declare global {
  interface Window {
    __ARCHIVIST_STATE__?: CareerArchivistDebugState;
    __TRIGGER_ARCHIVIST_ACTION__?: (action: ArchivistActivity) => void;
    __PAUSE_ARCHIVIST__?: boolean;
    __SEEK_ARCHIVIST__?: (action: ArchivistActivity, stageTime: number) => void;
    __ARCHIVIST_BONES__?: Record<string, THREE.Bone>;
    __ARCHIVIST_SCENE__?: THREE.Object3D;
  }
}

interface CareerArchivistSceneProps {
  isActive: boolean;
  reducedMotion: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

interface StageDef {
  activity: ArchivistActivity;
  duration: number;
}

const STAGES: StageDef[] = [
  { activity: 'idle', duration: 2.5 },
  { activity: 'inspect', duration: 4.2 },
  { activity: 'organize', duration: 3.8 },
  { activity: 'stamp', duration: 3.4 },
  { activity: 'review', duration: 2.2 },
  { activity: 'celebrate', duration: 1.8 },
];

interface PropAttachmentRecord {
  attachedTo: GripAnchorId | null;
  localOffset: THREE.Vector3;
  targetEuler: THREE.Euler;
  restPos: THREE.Vector3;
  restEuler: THREE.Euler;
}

const HAND_SCALE = 0.72; // Proportional 28% reduction of monster hands for realistic prop interaction

// Resting desk-local coordinates for props (desk top surface is at y = DESK_HEIGHT = 0.72)
const PAPER_REST_POS = new THREE.Vector3(-0.10, DESK_HEIGHT + 0.004, 0.00);
const PAPER_REST_EULER = new THREE.Euler(-Math.PI * 0.5, 0, 0.05, 'XYZ');

// Enlarged stamp (~1.42x) placed in the open foreground-right zone for crystal-clear idle visibility
const STAMP_REST_POS = new THREE.Vector3(0.22, DESK_HEIGHT + 0.018, 0.12);
const STAMP_REST_EULER = new THREE.Euler(0, 0, 0, 'XYZ');
const STAMP_GRIP_OFFSET = new THREE.Vector3(0, -0.098, 0.010); // Curled fingers grip top knob 9.8cm above rubber die

const FOLDER_REST_POS = new THREE.Vector3(0.58, DESK_HEIGHT + 0.042, 0.04);
const FOLDER_REST_EULER = new THREE.Euler(-Math.PI * 0.5, 0, -0.12, 'XYZ');

// Natural resting hand (Middle2 grip center) positions — Left hand rests clear of the stamp in open view
const LEFT_HAND_IDLE_DESK = new THREE.Vector3(0.42, DESK_HEIGHT + 0.042, -0.06);
const RIGHT_HAND_IDLE_DESK = new THREE.Vector3(-0.34, DESK_HEIGHT + 0.042, 0.04);

function easeInOut(t: number): number {
  const c = THREE.MathUtils.clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
}

// Reusable scratch math objects (zero per-frame allocations)
const _vS = new THREE.Vector3();
const _vE0 = new THREE.Vector3();
const _vW0 = new THREE.Vector3();
const _vDir = new THREE.Vector3();
const _vU = new THREE.Vector3();
const _vPole = new THREE.Vector3();
const _vElbow = new THREE.Vector3();
const _vCur1 = new THREE.Vector3();
const _vDes1 = new THREE.Vector3();
const _vCur2 = new THREE.Vector3();
const _vDes2 = new THREE.Vector3();
const _vEcur = new THREE.Vector3();
const _vWcur = new THREE.Vector3();
const _qRoot = new THREE.Quaternion();
const _qParent = new THREE.Quaternion();
const _qParentInv = new THREE.Quaternion();
const _qDelta = new THREE.Quaternion();
const _qTwist = new THREE.Quaternion();
const _qTarget = new THREE.Quaternion();
const _axisY = new THREE.Vector3(0, 1, 0);
const _vTmp1 = new THREE.Vector3();
const _vTmp2 = new THREE.Vector3();
const _vMid = new THREE.Vector3();
const _vLocalAnchor = new THREE.Vector3();
const _vLeftHandWorld = new THREE.Vector3();
const _vRightHandWorld = new THREE.Vector3();
const _vStampWorld = new THREE.Vector3();
const _vPaperWorld = new THREE.Vector3();

export const CareerArchivistScene: React.FC<CareerArchivistSceneProps> = ({
  isActive,
  reducedMotion,
  containerRef,
}) => {
  const { scene, animations } = useGLTF(MODEL_PATH);
  const deskGltf = useGLTF(DESK_PATH);
  const archivistDeskObj = useMemo(() => buildArchivistDesk(deskGltf.scene), [deskGltf.scene]);

  // Scene & Skeleton References
  const stageGroupRef = useRef<THREE.Group>(null);
  const deskGroupRef = useRef<THREE.Group>(null);
  const monsterRootRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  // Bones
  const headBoneRef = useRef<THREE.Bone | null>(null);
  const neckBoneRef = useRef<THREE.Bone | null>(null);
  const torsoBoneRef = useRef<THREE.Bone | null>(null);
  const bonesRef = useRef<Record<string, THREE.Bone>>({});
  const restQuatsRef = useRef<Record<string, THREE.Quaternion>>({});
  const restPosRef = useRef<Record<string, THREE.Vector3>>({});
  const restScaleRef = useRef<Record<string, THREE.Vector3>>({});

  // Eye rigs
  const eyeLidsRef = useRef<{
    leftUpper: THREE.Mesh;
    leftLower: THREE.Mesh;
    rightUpper: THREE.Mesh;
    rightLower: THREE.Mesh;
  } | null>(null);
  const eyePupilsRef = useRef<{
    leftPupil: THREE.Group;
    rightPupil: THREE.Group;
  } | null>(null);
  const blinkAmountRef = useRef(0);

  // Props
  const filingDrawerRef = useRef<THREE.Group>(null);
  const deskStampRef = useRef<THREE.Group>(null);
  const heldFolderRef = useRef<THREE.Group>(null);
  const deskDocGroupRef = useRef<THREE.Group>(null);
  const deskDocMeshRef = useRef<THREE.Mesh | null>(null);
  const tieGroupRef = useRef<THREE.Group>(null);

  // Animation & Activity State Machine
  const [activity, setActivity] = useState<ArchivistActivity>('idle');
  const stageIndexRef = useRef(0);
  const stageTimeRef = useRef(0);
  const totalTimeRef = useRef(0);
  const isStampedRef = useRef(false);
  const justSeekedRef = useRef(false);

  // Smoothed Single-Controller Head State (strictly bounded, zero accumulation)
  const headStateRef = useRef({ pitch: 0.05, yaw: 0, roll: 0 });

  // Smoothed Hand IK Targets (in desk-local space for stable desk-relative choreography)
  const handTargetsRef = useRef({
    leftDesk: LEFT_HAND_IDLE_DESK.clone(),
    rightDesk: RIGHT_HAND_IDLE_DESK.clone(),
    leftTwist: 0,
    rightTwist: 0,
  });

  // Reusable Attachment Registry for Paper, Folder, and Stamp
  const attachmentsRef = useRef<Record<PropId, PropAttachmentRecord>>({
    paper: {
      attachedTo: null,
      localOffset: new THREE.Vector3(0, 0, 0),
      targetEuler: PAPER_REST_EULER.clone(),
      restPos: PAPER_REST_POS.clone(),
      restEuler: PAPER_REST_EULER.clone(),
    },
    folder: {
      attachedTo: null,
      localOffset: new THREE.Vector3(0, 0, 0),
      targetEuler: FOLDER_REST_EULER.clone(),
      restPos: FOLDER_REST_POS.clone(),
      restEuler: FOLDER_REST_EULER.clone(),
    },
    stamp: {
      attachedTo: null,
      localOffset: STAMP_GRIP_OFFSET.clone(),
      targetEuler: STAMP_REST_EULER.clone(),
      restPos: STAMP_REST_POS.clone(),
      restEuler: STAMP_REST_EULER.clone(),
    },
  });

  // Cursor Tracking
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, isHovering: false });

  // Clone GLTF with intact skeleton bindings
  const clonedScene = useMemo(() => cloneSkeleton(scene), [scene]);

  // Pre-generate textures
  const badgeTexture = useMemo(() => getArchivistBadgeTexture(), []);
  const docUnstampedTexture = useMemo(() => getDocumentTexture(false), []);
  const docStampedTexture = useMemo(() => getDocumentTexture(true), []);
  const furBump = useMemo(() => getFurBumpTexture(), []);

  // Reusable Attachment Helpers
  const attachProp = (
    id: PropId,
    anchor: GripAnchorId,
    offset: THREE.Vector3,
    targetEuler: THREE.Euler
  ) => {
    const rec = attachmentsRef.current[id];
    rec.attachedTo = anchor;
    rec.localOffset.copy(offset);
    rec.targetEuler.copy(targetEuler);
  };

  const releaseProp = (
    id: PropId,
    obj: THREE.Object3D | null,
    snapPos?: THREE.Vector3,
    snapEuler?: THREE.Euler
  ) => {
    const rec = attachmentsRef.current[id];
    if (snapPos) {
      rec.restPos.copy(snapPos);
    } else if (obj) {
      rec.restPos.copy(obj.position);
    }
    if (snapEuler) {
      rec.restEuler.copy(snapEuler);
    } else if (obj) {
      rec.restEuler.setFromQuaternion(obj.quaternion);
    }
    rec.attachedTo = null;
  };

  const resetAllAttachments = () => {
    const att = attachmentsRef.current;
    att.paper.attachedTo = null;
    att.paper.restPos.copy(PAPER_REST_POS);
    att.paper.restEuler.copy(PAPER_REST_EULER);

    att.stamp.attachedTo = null;
    att.stamp.restPos.copy(STAMP_REST_POS);
    att.stamp.restEuler.copy(STAMP_REST_EULER);

    att.folder.attachedTo = null;
    att.folder.restPos.copy(FOLDER_REST_POS);
    att.folder.restEuler.copy(FOLDER_REST_EULER);
  };

  const syncPropTransform = (
    id: PropId,
    obj: THREE.Object3D | null,
    parentGroup: THREE.Group | null,
    leftHandWorld: THREE.Vector3,
    rightHandWorld: THREE.Vector3,
    dt: number,
    snap: boolean
  ) => {
    if (!obj || !parentGroup) return;
    const rec = attachmentsRef.current[id];

    if (rec.attachedTo === null) {
      obj.position.copy(rec.restPos);
      obj.quaternion.setFromEuler(rec.restEuler);
      return;
    }

    if (rec.attachedTo === 'L') {
      _vMid.copy(leftHandWorld);
    } else if (rec.attachedTo === 'R') {
      _vMid.copy(rightHandWorld);
    } else {
      _vMid.copy(leftHandWorld).add(rightHandWorld).multiplyScalar(0.5);
    }

    _vLocalAnchor.copy(_vMid);
    parentGroup.worldToLocal(_vLocalAnchor);
    _vLocalAnchor.add(rec.localOffset);

    obj.position.copy(_vLocalAnchor);
    _qTarget.setFromEuler(rec.targetEuler);
    if (snap || dt <= 0) {
      obj.quaternion.copy(_qTarget);
    } else {
      obj.quaternion.slerp(_qTarget, 1 - Math.exp(-14 * dt));
    }
  };

  // Helper to apply character-space Euler delta cleanly onto a bone's rest quaternion (NEVER accumulates!)
  const applyCharSpaceDelta = (
    name: string,
    rx: number,
    ry: number,
    rz: number,
    order: THREE.EulerOrder = 'YXZ'
  ) => {
    const bone = bonesRef.current[name];
    const rest = restQuatsRef.current[name];
    const root = monsterRootRef.current;
    if (!bone || !rest || !bone.parent || !root) return;

    bone.quaternion.copy(rest);
    root.updateMatrixWorld(true);

    root.getWorldQuaternion(_qRoot);
    bone.parent.getWorldQuaternion(_qParent);

    const parentInChar = _qRoot.clone().invert().multiply(_qParent);
    _qDelta.setFromEuler(new THREE.Euler(rx, ry, rz, order));

    bone.quaternion
      .copy(parentInChar)
      .invert()
      .multiply(_qDelta)
      .multiply(parentInChar)
      .multiply(rest);
  };

  // Exact Analytical 2-Bone Arm IK Solver (UpperArm -> LowerArm -> Middle2 finger-grip center)
  const solveArmIK = (
    side: 'L' | 'R',
    targetWorldPos: THREE.Vector3,
    poleDirWorld: THREE.Vector3,
    wristTwist: number,
    outPalmWorld: THREE.Vector3
  ) => {
    const bones = bonesRef.current;
    const restQuats = restQuatsRef.current;
    const root = monsterRootRef.current;
    const shoulder = bones[`Shoulder${side}`];
    const upper = bones[`UpperArm${side}`];
    const lower = bones[`LowerArm${side}`];
    const middle1 = bones[`Middle1${side}`];
    const hand = bones[`Middle2${side}`] ?? middle1;
    if (!shoulder || !upper || !lower || !hand || !upper.parent || !lower.parent || !root) return;

    // 1. Reset arm chain to anatomical rest pose so lengths & axes are exact
    if (restQuats[`Shoulder${side}`]) shoulder.quaternion.copy(restQuats[`Shoulder${side}`]);
    if (restQuats[`UpperArm${side}`]) upper.quaternion.copy(restQuats[`UpperArm${side}`]);
    if (restQuats[`LowerArm${side}`]) lower.quaternion.copy(restQuats[`LowerArm${side}`]);
    if (middle1 && restQuats[`Middle1${side}`]) {
      middle1.quaternion.copy(restQuats[`Middle1${side}`]);
      middle1.scale.set(HAND_SCALE, HAND_SCALE, HAND_SCALE);
    }
    root.updateMatrixWorld(true);

    // 2. Measure exact world segment lengths L1 (upper arm) and L2 (forearm to finger-grip center)
    upper.getWorldPosition(_vS);
    lower.getWorldPosition(_vE0);
    hand.getWorldPosition(_vW0);

    const L1 = _vS.distanceTo(_vE0);
    const L2 = _vE0.distanceTo(_vW0);
    if (L1 < 1e-4 || L2 < 1e-4) return;

    // 3. Law of cosines for exact elbow position
    _vDir.copy(targetWorldPos).sub(_vS);
    const rawDist = _vDir.length();
    const minDist = Math.abs(L1 - L2) + 0.03;
    const maxDist = L1 + L2 - 0.015;
    const d = THREE.MathUtils.clamp(rawDist, minDist, maxDist);

    if (rawDist > 1e-5) {
      _vU.copy(_vDir).multiplyScalar(1 / rawDist);
    } else {
      _vU.set(0, -1, 0);
    }

    const cosAlpha = THREE.MathUtils.clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1);
    const sinAlpha = Math.sqrt(Math.max(0, 1 - cosAlpha * cosAlpha));

    // Project pole vector perpendicular to shoulder->target axis
    _vPole.copy(poleDirWorld).addScaledVector(_vU, -poleDirWorld.dot(_vU));
    if (_vPole.lengthSq() < 1e-6) {
      _vPole.set(side === 'L' ? 1 : -1, -0.3, -0.5);
    }
    _vPole.normalize();

    _vElbow
      .copy(_vS)
      .addScaledVector(_vU, L1 * cosAlpha)
      .addScaledVector(_vPole, L1 * sinAlpha);

    // 4. Aim UpperArm along (S -> E)
    _vCur1.copy(_vE0).sub(_vS).normalize();
    _vDes1.copy(_vElbow).sub(_vS).normalize();
    _qDelta.setFromUnitVectors(_vCur1, _vDes1);

    upper.parent.getWorldQuaternion(_qParent);
    _qParentInv.copy(_qParent).invert();
    upper.quaternion.copy(_qParentInv).multiply(_qDelta).multiply(_qParent).multiply(restQuats[`UpperArm${side}`]);
    upper.updateMatrixWorld(true);

    // 5. Aim LowerArm along (E -> Target)
    lower.getWorldPosition(_vEcur);
    hand.getWorldPosition(_vWcur);
    _vCur2.copy(_vWcur).sub(_vEcur).normalize();
    _vDes2.copy(targetWorldPos).sub(_vEcur).normalize();
    _qDelta.setFromUnitVectors(_vCur2, _vDes2);

    lower.parent.getWorldQuaternion(_qParent);
    _qParentInv.copy(_qParent).invert();
    lower.quaternion.copy(_qParentInv).multiply(_qDelta).multiply(_qParent).multiply(restQuats[`LowerArm${side}`]);

    // Natural forearm/palm roll twist
    if (Math.abs(wristTwist) > 1e-4) {
      _qTwist.setFromAxisAngle(_axisY, wristTwist);
      lower.quaternion.multiply(_qTwist);
    }
    lower.updateMatrixWorld(true);

    // 6. Report exact live finger-grip center world position
    hand.getWorldPosition(outPalmWorld);
  };

  // Anatomically calibrated hand poses with proportional 28% hand reduction & multi-joint finger articulation
  const applyHandPose = (side: 'L' | 'R', pose: HandPose) => {
    const bones = bonesRef.current;
    const restQuats = restQuatsRef.current;
    if (!bones || !restQuats) return;

    const s = side;
    const sign = s === 'L' ? 1 : -1;

    // Scale root finger joints by HAND_SCALE (propagates cleanly down finger chains)
    const rootFingers = [`Thumb1${s}`, `Index1${s}`, `Middle1${s}`, `Pinky1${s}`];
    rootFingers.forEach((name) => {
      const b = bones[name];
      if (b) {
        b.scale.set(HAND_SCALE, HAND_SCALE, HAND_SCALE);
      }
    });

    const setJoint = (name: string, rx = 0, ry = 0, rz = 0) => {
      const b = bones[name];
      const rest = restQuats[name];
      if (!b || !rest) return;
      _qDelta.setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ'));
      b.quaternion.copy(rest).multiply(_qDelta);
    };

    if (pose === 'relaxed') {
      setJoint(`Thumb1${s}`, -0.10, 0, sign * 0.32);
      setJoint(`Thumb2${s}`, -0.15, 0, 0);
      setJoint(`Index1${s}`, 0, 0, sign * 0.12);
      setJoint(`Index2${s}`, -0.28, 0, 0);
      setJoint(`Index3${s}`, -0.18, 0, 0);
      setJoint(`Middle1${s}`, 0, 0, 0);
      setJoint(`Middle2${s}`, -0.30, 0, 0);
      setJoint(`Middle3${s}`, -0.20, 0, 0);
      setJoint(`Pinky1${s}`, 0, 0, -sign * 0.14);
      setJoint(`Pinky2${s}`, -0.32, 0, 0);
      setJoint(`Pinky3${s}`, -0.22, 0, 0);
    } else if (pose === 'documentHold') {
      setJoint(`Thumb1${s}`, -0.20, 0, sign * 0.46);
      setJoint(`Thumb2${s}`, -0.18, 0, 0);
      setJoint(`Index1${s}`, 0, 0, sign * 0.15);
      setJoint(`Index2${s}`, -0.45, 0, 0);
      setJoint(`Index3${s}`, -0.30, 0, 0);
      setJoint(`Middle1${s}`, 0, 0, 0);
      setJoint(`Middle2${s}`, -0.48, 0, 0);
      setJoint(`Middle3${s}`, -0.32, 0, 0);
      setJoint(`Pinky1${s}`, 0, 0, -sign * 0.14);
      setJoint(`Pinky2${s}`, -0.50, 0, 0);
      setJoint(`Pinky3${s}`, -0.35, 0, 0);
    } else if (pose === 'folderHold') {
      setJoint(`Thumb1${s}`, -0.22, 0, sign * 0.42);
      setJoint(`Thumb2${s}`, -0.18, 0, 0);
      setJoint(`Index1${s}`, 0, 0, sign * 0.12);
      setJoint(`Index2${s}`, -0.72, 0, 0);
      setJoint(`Index3${s}`, -0.50, 0, 0);
      setJoint(`Middle1${s}`, 0, 0, 0);
      setJoint(`Middle2${s}`, -0.76, 0, 0);
      setJoint(`Middle3${s}`, -0.54, 0, 0);
      setJoint(`Pinky1${s}`, 0, 0, -sign * 0.12);
      setJoint(`Pinky2${s}`, -0.80, 0, 0);
      setJoint(`Pinky3${s}`, -0.58, 0, 0);
    } else if (pose === 'stampGrip') {
      setJoint(`Thumb1${s}`, -0.34, 0, sign * 0.58);
      setJoint(`Thumb2${s}`, -0.40, 0, 0);
      setJoint(`Index1${s}`, 0, 0, sign * 0.16);
      setJoint(`Index2${s}`, -0.88, 0, 0);
      setJoint(`Index3${s}`, -0.64, 0, 0);
      setJoint(`Middle1${s}`, 0, 0, 0);
      setJoint(`Middle2${s}`, -0.92, 0, 0);
      setJoint(`Middle3${s}`, -0.68, 0, 0);
      setJoint(`Pinky1${s}`, 0, 0, -sign * 0.12);
      setJoint(`Pinky2${s}`, -0.82, 0, 0);
      setJoint(`Pinky3${s}`, -0.60, 0, 0);
    } else if (pose === 'waveOpen') {
      setJoint(`Thumb1${s}`, -0.06, 0, sign * 0.18);
      setJoint(`Thumb2${s}`, -0.08, 0, 0);
      setJoint(`Index1${s}`, 0, 0, sign * 0.06);
      setJoint(`Index2${s}`, -0.12, 0, 0);
      setJoint(`Index3${s}`, -0.08, 0, 0);
      setJoint(`Middle1${s}`, 0, 0, 0);
      setJoint(`Middle2${s}`, -0.14, 0, 0);
      setJoint(`Middle3${s}`, -0.10, 0, 0);
      setJoint(`Pinky1${s}`, 0, 0, -sign * 0.08);
      setJoint(`Pinky2${s}`, -0.16, 0, 0);
      setJoint(`Pinky3${s}`, -0.12, 0, 0);
    }
  };

  // Expose global triggers for automated verification & seeking
  useEffect(() => {
    window.__TRIGGER_ARCHIVIST_ACTION__ = (action: ArchivistActivity) => {
      const idx = STAGES.findIndex((s) => s.activity === action);
      if (idx !== -1) {
        stageIndexRef.current = idx;
        stageTimeRef.current = 0;
        justSeekedRef.current = true;
        resetAllAttachments();
        setActivity(action);
      }
    };
    window.__SEEK_ARCHIVIST__ = (action: ArchivistActivity, timeSec: number) => {
      const idx = STAGES.findIndex((s) => s.activity === action);
      if (idx !== -1) {
        stageIndexRef.current = idx;
        stageTimeRef.current = timeSec;
        justSeekedRef.current = true;
        resetAllAttachments();
        // Sync stamped state when seeking into review/celebrate or late stamp
        const shouldBeStamped =
          action === 'review' ||
          action === 'celebrate' ||
          (action === 'stamp' && timeSec >= 1.85);
        isStampedRef.current = shouldBeStamped;
        if (deskDocMeshRef.current) {
          (deskDocMeshRef.current.material as THREE.MeshBasicMaterial).map = shouldBeStamped
            ? docStampedTexture
            : docUnstampedTexture;
        }
        setActivity(action);
      }
    };
    return () => {
      delete window.__TRIGGER_ARCHIVIST_ACTION__;
      delete window.__SEEK_ARCHIVIST__;
      delete window.__ARCHIVIST_STATE__;
      delete window.__ARCHIVIST_BONES__;
      delete window.__ARCHIVIST_SCENE__;
    };
  }, [docStampedTexture, docUnstampedTexture]);

  // Setup Materials, Eyes, Outfit & Subtle Idle Breathing Mixer
  useEffect(() => {
    const disposables: (THREE.BufferGeometry | THREE.Material)[] = [];
    const attachedNodes: Array<{ parent: THREE.Object3D; child: THREE.Object3D }> = [];

    const mainCoatMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#228B82'),
      roughness: 0.85,
      metalness: 0.05,
      sheen: 1.0,
      sheenRoughness: 0.55,
      sheenColor: new THREE.Color('#A7F3D0'),
      bumpMap: furBump,
      bumpScale: 0.012,
    });

    const secondaryMintMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#86D6CC'),
      roughness: 0.78,
      metalness: 0.02,
      sheen: 0.75,
      sheenRoughness: 0.65,
      sheenColor: new THREE.Color('#CCFBF1'),
      bumpMap: furBump,
      bumpScale: 0.008,
    });

    disposables.push(mainCoatMat, secondaryMintMat);

    clonedScene.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh) {
        child.frustumCulled = false;
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.name === 'Frog_2') {
          child.material = mainCoatMat;
        } else if (child.name === 'Frog_1') {
          child.material = secondaryMintMat;
        } else if (child.name === 'Frog_3' || child.name === 'Frog_4') {
          // Disable original flat eye meshes so only our single pair of 3D eyes renders
          child.visible = false;
        }
      }

      if (child instanceof THREE.Bone) {
        const cleanName = child.name.replace(/\./g, '');
        bonesRef.current[cleanName] = child;
        restQuatsRef.current[cleanName] = child.quaternion.clone();
        restPosRef.current[cleanName] = child.position.clone();
        restScaleRef.current[cleanName] = child.scale.clone();

        if (cleanName === 'Head') headBoneRef.current = child;
        if (cleanName === 'Neck') neckBoneRef.current = child;
        if (cleanName === 'Torso') torsoBoneRef.current = child;
      }
    });

    window.__ARCHIVIST_BONES__ = bonesRef.current;
    window.__ARCHIVIST_SCENE__ = clonedScene;

    // Helper to strip any previously mounted custom nodes before mounting (prevents StrictMode/HMR duplicates)
    const removeByNames = (parent: THREE.Object3D, names: string[]) => {
      const toRemove = parent.children.filter((c) => names.includes(c.name));
      toRemove.forEach((c) => parent.remove(c));
    };

    // 2. Single Pair of 3D Glossy Expressive Eyes nestled cleanly in anatomical Head sockets
    const headBone = headBoneRef.current;
    if (headBone) {
      removeByNames(headBone, ['ArchivistEye_L', 'ArchivistEye_R', 'ArchivistNewsboyCap']);

      const eyeRadius = 0.00120;

      const scleraGeo = new THREE.SphereGeometry(eyeRadius, 32, 24);
      const irisGeo = new THREE.SphereGeometry(eyeRadius * 0.72, 24, 16);
      const pupilGeo = new THREE.SphereGeometry(eyeRadius * 0.42, 20, 14);
      const catchBigGeo = new THREE.SphereGeometry(eyeRadius * 0.20, 12, 10);
      const catchSmallGeo = new THREE.SphereGeometry(eyeRadius * 0.12, 10, 8);

      // Tight-fitting eyelids matching the #228B82 head coat (no protruding pale-mint double-sphere illusion)
      const upperLidGeo = new THREE.SphereGeometry(
        eyeRadius * 1.04,
        24,
        14,
        0,
        Math.PI * 2,
        0,
        Math.PI * 0.52
      );
      const lowerLidGeo = new THREE.SphereGeometry(
        eyeRadius * 1.04,
        24,
        14,
        0,
        Math.PI * 2,
        Math.PI * 0.48,
        Math.PI * 0.52
      );

      const scleraMat = new THREE.MeshPhysicalMaterial({
        color: '#FFFFFF',
        roughness: 0.08,
        metalness: 0.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.06,
      });
      const irisMat = new THREE.MeshStandardMaterial({
        color: '#0D6E68',
        roughness: 0.22,
        metalness: 0.04,
      });
      const pupilMat = new THREE.MeshBasicMaterial({ color: '#141316' });
      const catchMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });
      const lidMat = new THREE.MeshPhysicalMaterial({
        color: '#228B82',
        roughness: 0.85,
        metalness: 0.05,
        sheen: 1.0,
        sheenRoughness: 0.55,
        sheenColor: new THREE.Color('#A7F3D0'),
      });

      disposables.push(
        scleraGeo,
        irisGeo,
        pupilGeo,
        catchBigGeo,
        catchSmallGeo,
        upperLidGeo,
        lowerLidGeo,
        scleraMat,
        irisMat,
        pupilMat,
        catchMat,
        lidMat
      );

      // Symmetrical anatomical socket centers inside the frog's eye mounds (zero forward protrusion)
      const leftInHead = new THREE.Vector3(-0.00350, 0.00552, 0.00342);
      const rightInHead = new THREE.Vector3(0.00350, 0.00552, 0.00342);
      const fwdLeft = new THREE.Vector3(-0.18, 0.16, 0.97).normalize();
      const fwdRight = new THREE.Vector3(0.18, 0.16, 0.97).normalize();

      const lids = {
        leftUpper: null as unknown as THREE.Mesh,
        leftLower: null as unknown as THREE.Mesh,
        rightUpper: null as unknown as THREE.Mesh,
        rightLower: null as unknown as THREE.Mesh,
      };
      const pupils = {
        leftPupil: null as unknown as THREE.Group,
        rightPupil: null as unknown as THREE.Group,
      };

      for (const [idx, eyePos] of [leftInHead, rightInHead].entries()) {
        const eyeMount = new THREE.Group();
        eyeMount.name = idx === 0 ? 'ArchivistEye_L' : 'ArchivistEye_R';
        eyeMount.position.copy(eyePos);

        const fwd = idx === 0 ? fwdLeft : fwdRight;
        eyeMount.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), fwd);

        const scleraMesh = new THREE.Mesh(scleraGeo, scleraMat);
        scleraMesh.name = idx === 0 ? 'Sclera_L' : 'Sclera_R';
        eyeMount.add(scleraMesh);

        const pupilGroup = new THREE.Group();
        pupilGroup.name = idx === 0 ? 'PupilPivot_L' : 'PupilPivot_R';

        const irisMesh = new THREE.Mesh(irisGeo, irisMat);
        irisMesh.position.set(0, 0, eyeRadius * 0.76);
        irisMesh.scale.set(1, 1, 0.36);
        pupilGroup.add(irisMesh);

        const pupilMesh = new THREE.Mesh(pupilGeo, pupilMat);
        pupilMesh.position.set(0, 0, eyeRadius * 0.88);
        pupilMesh.scale.set(1, 1, 0.32);
        pupilGroup.add(pupilMesh);

        const catch1 = new THREE.Mesh(catchBigGeo, catchMat);
        catch1.position.set(eyeRadius * 0.22, eyeRadius * 0.24, eyeRadius * 1.00);
        pupilGroup.add(catch1);

        const catch2 = new THREE.Mesh(catchSmallGeo, catchMat);
        catch2.position.set(-eyeRadius * 0.20, -eyeRadius * 0.18, eyeRadius * 0.98);
        pupilGroup.add(catch2);

        eyeMount.add(pupilGroup);

        // Eyelids tucked cleanly flush inside the head when open
        const upperLid = new THREE.Mesh(upperLidGeo, lidMat);
        upperLid.rotation.set(-1.55, 0, 0);
        eyeMount.add(upperLid);

        const lowerLid = new THREE.Mesh(lowerLidGeo, lidMat);
        lowerLid.rotation.set(1.50, 0, 0);
        eyeMount.add(lowerLid);

        headBone.add(eyeMount);
        attachedNodes.push({ parent: headBone, child: eyeMount });

        if (idx === 0) {
          lids.leftUpper = upperLid;
          lids.leftLower = lowerLid;
          pupils.leftPupil = pupilGroup;
        } else {
          lids.rightUpper = upperLid;
          lids.rightLower = lowerLid;
          pupils.rightPupil = pupilGroup;
        }
      }

      eyeLidsRef.current = lids;
      eyePupilsRef.current = pupils;

      // 3. Compact, Fitted Newsboy Cap
      const capGroup = new THREE.Group();
      capGroup.name = 'ArchivistNewsboyCap';
      capGroup.position.set(0, 0.0070, 0.0006);
      capGroup.rotation.set(-0.06, 0, 0);

      const capMat = new THREE.MeshStandardMaterial({
        color: '#334155',
        roughness: 0.82,
        metalness: 0.04,
      });
      const capVisorMat = new THREE.MeshStandardMaterial({
        color: '#1E293B',
        roughness: 0.75,
      });
      disposables.push(capMat, capVisorMat);

      const crownGeo = new THREE.SphereGeometry(0.0034, 24, 16);
      crownGeo.scale(1.02, 0.38, 1.04);
      disposables.push(crownGeo);
      const crownMesh = new THREE.Mesh(crownGeo, capMat);
      crownMesh.position.set(0, 0.0004, -0.0002);
      crownMesh.castShadow = true;
      capGroup.add(crownMesh);

      const buttonGeo = new THREE.CylinderGeometry(0.00045, 0.00055, 0.00025, 12);
      disposables.push(buttonGeo);
      const buttonMesh = new THREE.Mesh(buttonGeo, capVisorMat);
      buttonMesh.position.set(0, 0.0018, -0.0002);
      capGroup.add(buttonMesh);

      const visorGeo = new THREE.CylinderGeometry(
        0.0032,
        0.0034,
        0.00025,
        20,
        1,
        false,
        Math.PI * 0.22,
        Math.PI * 0.56
      );
      visorGeo.rotateX(Math.PI * 0.5);
      visorGeo.scale(0.92, 0.92, 0.30);
      disposables.push(visorGeo);
      const visorMesh = new THREE.Mesh(visorGeo, capVisorMat);
      visorMesh.position.set(0, -0.0003, 0.0028);
      visorMesh.rotation.set(0.15, 0, 0);
      visorMesh.castShadow = true;
      capGroup.add(visorMesh);

      headBone.add(capGroup);
      attachedNodes.push({ parent: headBone, child: capGroup });
    }

    // 4. Work Shirt Collar, Tie & ID Badge on Torso Bone
    const torsoBone = torsoBoneRef.current;
    if (torsoBone) {
      removeByNames(torsoBone, ['ShirtCollar', 'ArchivistBadge']);
      const shirtMat = new THREE.MeshStandardMaterial({
        color: '#F8FAFC',
        roughness: 0.65,
        metalness: 0.0,
      });
      const tieMat = new THREE.MeshStandardMaterial({
        color: '#D97706',
        roughness: 0.50,
        metalness: 0.05,
      });
      const badgeHolderMat = new THREE.MeshPhysicalMaterial({
        color: '#FFFFFF',
        roughness: 0.12,
        transmission: 0.7,
        transparent: true,
        opacity: 0.90,
      });
      const badgeFaceMat = new THREE.MeshBasicMaterial({
        map: badgeTexture,
        transparent: true,
      });

      disposables.push(shirtMat, tieMat, badgeHolderMat, badgeFaceMat);

      const collarGroup = new THREE.Group();
      collarGroup.name = 'ShirtCollar';
      collarGroup.position.set(0, 0.0105, 0.0040);
      collarGroup.rotation.set(-0.14, 0, 0);

      const tabGeo = new THREE.BoxGeometry(0.0020, 0.0026, 0.0005);
      disposables.push(tabGeo);
      const leftTab = new THREE.Mesh(tabGeo, shirtMat);
      leftTab.position.set(-0.0013, -0.0004, 0.0008);
      leftTab.rotation.set(0.10, 0.14, -0.38);
      collarGroup.add(leftTab);

      const rightTab = new THREE.Mesh(tabGeo, shirtMat);
      rightTab.position.set(0.0013, -0.0004, 0.0008);
      rightTab.rotation.set(0.10, -0.14, 0.38);
      collarGroup.add(rightTab);

      const placketGeo = new THREE.BoxGeometry(0.0013, 0.009, 0.0003);
      disposables.push(placketGeo);
      const placketMesh = new THREE.Mesh(placketGeo, shirtMat);
      placketMesh.position.set(0, -0.0050, 0.0004);
      collarGroup.add(placketMesh);

      const tieGroup = new THREE.Group();
      tieGroup.name = 'ArchivistTie';
      tieGroup.position.set(0, -0.0012, 0.0013);

      const knotGeo = new THREE.CylinderGeometry(0.00065, 0.00045, 0.0009, 8);
      disposables.push(knotGeo);
      const knotMesh = new THREE.Mesh(knotGeo, tieMat);
      tieGroup.add(knotMesh);

      const bladeGeo = new THREE.BoxGeometry(0.0010, 0.0068, 0.00025);
      disposables.push(bladeGeo);
      const bladeMesh = new THREE.Mesh(bladeGeo, tieMat);
      bladeMesh.position.set(0, -0.0038, 0.0002);
      tieGroup.add(bladeMesh);

      tieGroupRef.current = tieGroup;
      collarGroup.add(tieGroup);
      torsoBone.add(collarGroup);
      attachedNodes.push({ parent: torsoBone, child: collarGroup });

      const badgeGroup = new THREE.Group();
      badgeGroup.name = 'ArchivistBadge';
      badgeGroup.position.set(-0.0028, 0.0065, 0.0054);
      badgeGroup.rotation.set(-0.08, 0.14, 0.04);

      const casingGeo = new THREE.BoxGeometry(0.0024, 0.0034, 0.0002);
      disposables.push(casingGeo);
      const casingMesh = new THREE.Mesh(casingGeo, badgeHolderMat);
      badgeGroup.add(casingMesh);

      const faceGeo = new THREE.PlaneGeometry(0.0022, 0.0032);
      disposables.push(faceGeo);
      const faceMesh = new THREE.Mesh(faceGeo, badgeFaceMat);
      faceMesh.position.set(0, 0, 0.00015);
      badgeGroup.add(faceMesh);

      torsoBone.add(badgeGroup);
      attachedNodes.push({ parent: torsoBone, child: badgeGroup });
    }

    // 5. Setup Animation Mixer: ONLY gentle Idle breathing (no conflicting Yes/Wave head/arm overrides)
    if (animations && animations.length > 0) {
      const mixer = new THREE.AnimationMixer(clonedScene);
      mixerRef.current = mixer;
      const idleClip = animations.find((c) => c.name.endsWith('Idle'));
      if (idleClip) {
        const action = mixer.clipAction(idleClip);
        action.reset().setEffectiveWeight(0.45).setEffectiveTimeScale(0.65).play();
      }
    }

    return () => {
      attachedNodes.forEach(({ parent, child }) => parent.remove(child));
      disposables.forEach((d) => d.dispose());
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current = null;
      }
    };
  }, [clonedScene, animations, furBump, badgeTexture]);

  // Cursor Glance Listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseRef.current.targetX = THREE.MathUtils.clamp(nx, -1, 1);
      mouseRef.current.targetY = THREE.MathUtils.clamp(ny, -1, 1);
      mouseRef.current.isHovering = true;
    };

    const onPointerLeave = () => {
      mouseRef.current.targetX = 0;
      mouseRef.current.targetY = 0;
      mouseRef.current.isHovering = false;
    };

    container.addEventListener('pointermove', onPointerMove, { passive: true });
    container.addEventListener('pointerleave', onPointerLeave, { passive: true });

    return () => {
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [containerRef]);

  // Unified Frame Loop (60 FPS): Single Controller for Body, Head, 2-Bone Arm IK, and Hand-Attached Props
  useFrame((_, delta) => {
    if (!isActive) return;

    const isPaused = Boolean(window.__PAUSE_ARCHIVIST__);
    const dt = isPaused ? 0 : Math.min(delta, 0.05);
    const snap = justSeekedRef.current;
    justSeekedRef.current = false;
    totalTimeRef.current += dt;

    // 1. Advance subtle body breathing mixer
    if (mixerRef.current) {
      mixerRef.current.update(dt);
    }

    // 2. Continuous Activity Timeline
    if (!reducedMotion && !isPaused) {
      stageTimeRef.current += dt;
      const curStage = STAGES[stageIndexRef.current];
      if (curStage && stageTimeRef.current >= curStage.duration) {
        stageTimeRef.current = 0;
        const nextIdx = (stageIndexRef.current + 1) % STAGES.length;
        stageIndexRef.current = nextIdx;
        const nextStage = STAGES[nextIdx];
        resetAllAttachments();
        setActivity(nextStage.activity);

        // Reset document to blank at start of new inspect cycle
        if (nextStage.activity === 'inspect') {
          isStampedRef.current = false;
          if (deskDocMeshRef.current) {
            (deskDocMeshRef.current.material as THREE.MeshBasicMaterial).map = docUnstampedTexture;
          }
        }
      }
    }

    const curStage = STAGES[stageIndexRef.current];
    const curActivity = curStage ? curStage.activity : activity;
    const stageTime = stageTimeRef.current;
    const totalTime = totalTimeRef.current;

    // 3. Smooth Cursor Tracking
    const mouse = mouseRef.current;
    mouse.x = THREE.MathUtils.damp(mouse.x, mouse.targetX, 3.5, dt);
    mouse.y = THREE.MathUtils.damp(mouse.y, mouse.targetY, 3.5, dt);

    // 4. Eyes (Blinking & Purposeful Gaze)
    const lids = eyeLidsRef.current;
    const pupils = eyePupilsRef.current;

    const isBlink = Math.sin(totalTime * 1.8) > 0.985 || totalTime % 3.8 < 0.12;
    const targetBlink = curActivity === 'celebrate' ? 0.65 : isBlink ? 1.0 : 0.0;
    blinkAmountRef.current = snap
      ? targetBlink
      : THREE.MathUtils.damp(blinkAmountRef.current, targetBlink, 22, dt);

    if (lids) {
      const upperLidX = THREE.MathUtils.lerp(-1.55, 0.10, blinkAmountRef.current);
      const lowerLidX = THREE.MathUtils.lerp(1.50, -0.08, blinkAmountRef.current);
      lids.leftUpper.rotation.x = upperLidX;
      lids.leftLower.rotation.x = lowerLidX;
      lids.rightUpper.rotation.x = upperLidX;
      lids.rightLower.rotation.x = lowerLidX;
    }

    // Spherical eye gaze rotation (rad) keeps iris/pupil/catchlights glued to eyeball surface
    let targetGazeYaw = mouse.isHovering ? mouse.x * 0.22 : 0;
    let targetGazePitch = mouse.isHovering ? -mouse.y * 0.16 : 0;

    if (curActivity === 'inspect') {
      targetGazeYaw = Math.sin(stageTime * 2.2) * 0.18;
      targetGazePitch = 0.16;
    } else if (curActivity === 'organize') {
      targetGazeYaw = stageTime < 1.8 ? -0.18 : 0.12;
      targetGazePitch = 0.12;
    } else if (curActivity === 'stamp') {
      targetGazeYaw = stageTime < 1.0 ? 0.20 : -0.06;
      targetGazePitch = 0.18;
    } else if (curActivity === 'review') {
      targetGazeYaw = -0.06;
      targetGazePitch = 0.18;
    } else if (curActivity === 'celebrate') {
      targetGazeYaw = 0;
      targetGazePitch = -0.06;
    }

    targetGazeYaw = THREE.MathUtils.clamp(targetGazeYaw, -0.24, 0.24);
    targetGazePitch = THREE.MathUtils.clamp(targetGazePitch, -0.18, 0.22);

    if (pupils) {
      pupils.leftPupil.rotation.y = snap
        ? targetGazeYaw
        : THREE.MathUtils.damp(pupils.leftPupil.rotation.y, targetGazeYaw, 10, dt);
      pupils.leftPupil.rotation.x = snap
        ? targetGazePitch
        : THREE.MathUtils.damp(pupils.leftPupil.rotation.x, targetGazePitch, 10, dt);
      pupils.rightPupil.rotation.y = snap
        ? targetGazeYaw
        : THREE.MathUtils.damp(pupils.rightPupil.rotation.y, targetGazeYaw, 10, dt);
      pupils.rightPupil.rotation.x = snap
        ? targetGazePitch
        : THREE.MathUtils.damp(pupils.rightPupil.rotation.x, targetGazePitch, 10, dt);
    }

    // 5. Procedural Tie Micro-Sway
    if (tieGroupRef.current) {
      const swayZ =
        curActivity === 'celebrate'
          ? Math.sin(stageTime * 5.0) * 0.10
          : Math.sin(totalTime * 2.2) * 0.04;
      const swayX = Math.cos(totalTime * 1.8) * 0.025;
      tieGroupRef.current.rotation.z = THREE.MathUtils.damp(
        tieGroupRef.current.rotation.z,
        swayZ,
        6,
        dt
      );
      tieGroupRef.current.rotation.x = THREE.MathUtils.damp(
        tieGroupRef.current.rotation.x,
        swayX,
        6,
        dt
      );
    }

    // 6. Stage Choreography: Body Yaw, Head Target, Hand IK Targets, Hand Poses & Prop Attachments
    const monsterRoot = monsterRootRef.current;
    const deskGroup = deskGroupRef.current;
    const drawer = filingDrawerRef.current;
    const stampObj = deskStampRef.current;
    const paperObj = deskDocGroupRef.current;
    const folderObj = heldFolderRef.current;

    // Default neutral targets
    let targetMonsterRotY = -0.08;
    let targetHeadPitch = 0.05;
    let targetHeadYaw = 0.0;
    let targetHeadRoll = 0.0;
    let targetDrawerZ = 0.0;

    // Hand IK targets in desk-local space
    const targetLeftDesk = _vTmp1.copy(LEFT_HAND_IDLE_DESK);
    const targetRightDesk = _vTmp2.copy(RIGHT_HAND_IDLE_DESK);
    let leftPose: HandPose = 'relaxed';
    let rightPose: HandPose = 'relaxed';
    let leftTwist = 0.0;
    let rightTwist = 0.0;

    // Default prop visibility & resting state
    let folderVisible = false;

    if (curActivity === 'idle') {
      // Calm, attentive waiting posture with subtle breathing & gentle cursor glance
      targetHeadPitch = 0.05 + Math.sin(totalTime * 0.9) * 0.015;
      targetHeadYaw = Math.sin(totalTime * 0.5) * 0.025;
      if (mouse.isHovering) {
        targetHeadYaw += mouse.x * 0.10;
        targetHeadPitch += -mouse.y * 0.06;
      }
      releaseProp('paper', paperObj, PAPER_REST_POS, PAPER_REST_EULER);
      releaseProp('stamp', stampObj, STAMP_REST_POS, STAMP_REST_EULER);
      releaseProp('folder', folderObj, FOLDER_REST_POS, FOLDER_REST_EULER);
    } else if (curActivity === 'inspect') {
      // INSPECT: Reach paper -> Grip & Attach -> Lift & Read -> Lower & Release -> Return to idle
      releaseProp('stamp', stampObj, STAMP_REST_POS, STAMP_REST_EULER);
      releaseProp('folder', folderObj, FOLDER_REST_POS, FOLDER_REST_EULER);

      // Paper edge grip coordinates in desk-local space (Middle2 curled fingers hold exact left & right edges)
      const rightEdgeGripX = 0.06; // Monster's Left hand (viewer's right)
      const leftEdgeGripX = -0.22; // Monster's Right hand (viewer's left)
      const deskGripY = DESK_HEIGHT + 0.015;
      const deskGripZ = -0.02;

      const liftY = DESK_HEIGHT + 0.28;
      const liftZ = 0.06;

      if (stageTime < 0.75) {
        // Phase A: Approach paper on desk (paper does NOT move yet!)
        const p = easeInOut(stageTime / 0.75);
        targetHeadPitch = THREE.MathUtils.lerp(0.05, 0.16, p);
        targetHeadYaw = -0.02;

        targetLeftDesk.set(
          THREE.MathUtils.lerp(LEFT_HAND_IDLE_DESK.x, rightEdgeGripX, p),
          THREE.MathUtils.lerp(LEFT_HAND_IDLE_DESK.y, deskGripY, p),
          THREE.MathUtils.lerp(LEFT_HAND_IDLE_DESK.z, deskGripZ, p)
        );
        targetRightDesk.set(
          THREE.MathUtils.lerp(RIGHT_HAND_IDLE_DESK.x, leftEdgeGripX, p),
          THREE.MathUtils.lerp(RIGHT_HAND_IDLE_DESK.y, deskGripY, p),
          THREE.MathUtils.lerp(RIGHT_HAND_IDLE_DESK.z, deskGripZ, p)
        );
        leftPose = p > 0.65 ? 'documentHold' : 'relaxed';
        rightPose = p > 0.65 ? 'documentHold' : 'relaxed';
        releaseProp('paper', paperObj, PAPER_REST_POS, PAPER_REST_EULER);
      } else if (stageTime < 1.45) {
        // Phase B: Grip established -> Attach paper to BOTH hands -> Lift smoothly to reading height
        const p = easeInOut((stageTime - 0.75) / 0.70);
        targetHeadPitch = THREE.MathUtils.lerp(0.16, 0.10, p);
        targetHeadYaw = -0.02;

        targetLeftDesk.set(
          rightEdgeGripX,
          THREE.MathUtils.lerp(deskGripY, liftY, p),
          THREE.MathUtils.lerp(deskGripZ, liftZ, p)
        );
        targetRightDesk.set(
          leftEdgeGripX,
          THREE.MathUtils.lerp(deskGripY, liftY, p),
          THREE.MathUtils.lerp(deskGripZ, liftZ, p)
        );
        leftPose = 'documentHold';
        rightPose = 'documentHold';
        leftTwist = -0.25 * p;
        rightTwist = 0.25 * p;

        // Paper follows hands rigidly while tilting smoothly toward monster's eyes
        const tiltX = THREE.MathUtils.lerp(-Math.PI * 0.5, -0.58, p);
        attachProp(
          'paper',
          'BOTH',
          new THREE.Vector3(0, -0.01, 0),
          new THREE.Euler(tiltX, 0, THREE.MathUtils.lerp(0.06, 0, p), 'XYZ')
        );
      } else if (stageTime < 2.85) {
        // Phase C: Holding & reading paper calmly with tiny natural breathing & eye/head focus
        const readT = stageTime - 1.45;
        const gentleBob = Math.sin(readT * 2.0) * 0.008;
        targetHeadPitch = 0.10 + Math.sin(readT * 1.6) * 0.015;
        targetHeadYaw = -0.02 + Math.sin(readT * 1.8) * 0.045;

        targetLeftDesk.set(rightEdgeGripX, liftY + gentleBob, liftZ);
        targetRightDesk.set(leftEdgeGripX, liftY + gentleBob, liftZ);
        leftPose = 'documentHold';
        rightPose = 'documentHold';
        leftTwist = -0.25;
        rightTwist = 0.25;

        attachProp(
          'paper',
          'BOTH',
          new THREE.Vector3(0, -0.01, 0),
          new THREE.Euler(-0.58, 0, 0, 'XYZ')
        );
      } else if (stageTime < 3.60) {
        // Phase D: Lower paper smoothly back onto desk surface (still attached until touchdown!)
        const p = easeInOut((stageTime - 2.85) / 0.75);
        targetHeadPitch = THREE.MathUtils.lerp(0.10, 0.15, p);
        targetHeadYaw = -0.02;

        targetLeftDesk.set(
          rightEdgeGripX,
          THREE.MathUtils.lerp(liftY, deskGripY, p),
          THREE.MathUtils.lerp(liftZ, deskGripZ, p)
        );
        targetRightDesk.set(
          leftEdgeGripX,
          THREE.MathUtils.lerp(liftY, deskGripY, p),
          THREE.MathUtils.lerp(liftZ, deskGripZ, p)
        );
        leftPose = 'documentHold';
        rightPose = 'documentHold';
        leftTwist = -0.25 * (1 - p);
        rightTwist = 0.25 * (1 - p);

        const tiltX = THREE.MathUtils.lerp(-0.58, -Math.PI * 0.5, p);
        attachProp(
          'paper',
          'BOTH',
          new THREE.Vector3(0, -0.01 * (1 - p), 0),
          new THREE.Euler(tiltX, 0, THREE.MathUtils.lerp(0, 0.06, p), 'XYZ')
        );
      } else {
        // Phase E: Touchdown complete -> Release paper onto desk -> Hands return to idle
        const p = easeInOut((stageTime - 3.60) / 0.60);
        targetHeadPitch = THREE.MathUtils.lerp(0.15, 0.06, p);
        targetHeadYaw = THREE.MathUtils.lerp(-0.02, 0, p);

        releaseProp('paper', paperObj, PAPER_REST_POS, PAPER_REST_EULER);

        targetLeftDesk.set(
          THREE.MathUtils.lerp(rightEdgeGripX, LEFT_HAND_IDLE_DESK.x, p),
          THREE.MathUtils.lerp(deskGripY + 0.02, LEFT_HAND_IDLE_DESK.y, p),
          THREE.MathUtils.lerp(deskGripZ, LEFT_HAND_IDLE_DESK.z, p)
        );
        targetRightDesk.set(
          THREE.MathUtils.lerp(leftEdgeGripX, RIGHT_HAND_IDLE_DESK.x, p),
          THREE.MathUtils.lerp(deskGripY + 0.02, RIGHT_HAND_IDLE_DESK.y, p),
          THREE.MathUtils.lerp(deskGripZ, RIGHT_HAND_IDLE_DESK.z, p)
        );
        leftPose = 'relaxed';
        rightPose = 'relaxed';
      }
    } else if (curActivity === 'organize') {
      // ORGANIZE: Open cabinet drawer with Right hand -> Grip & carry folder with BOTH hands -> Place onto desk stack
      releaseProp('paper', paperObj, PAPER_REST_POS, PAPER_REST_EULER);
      releaseProp('stamp', stampObj, STAMP_REST_POS, STAMP_REST_EULER);

      if (stageTime < 0.95) {
        // Phase A: Turn slightly toward cabinet, Right hand reaches & opens drawer
        const p = easeInOut(stageTime / 0.95);
        targetMonsterRotY = THREE.MathUtils.lerp(-0.08, -0.28, p);
        targetHeadYaw = THREE.MathUtils.lerp(0, -0.18, p);
        targetHeadPitch = THREE.MathUtils.lerp(0.05, 0.12, p);
        targetDrawerZ = p > 0.35 ? easeInOut((p - 0.35) / 0.65) * 0.20 : 0;

        targetRightDesk.set(
          THREE.MathUtils.lerp(RIGHT_HAND_IDLE_DESK.x, -0.74, p),
          THREE.MathUtils.lerp(RIGHT_HAND_IDLE_DESK.y, DESK_HEIGHT - 0.08, p),
          THREE.MathUtils.lerp(RIGHT_HAND_IDLE_DESK.z, -0.14 + targetDrawerZ * 0.7, p)
        );
        targetLeftDesk.copy(LEFT_HAND_IDLE_DESK);
        rightPose = p > 0.35 ? 'folderHold' : 'relaxed';
        folderVisible = false;
        releaseProp('folder', folderObj, FOLDER_REST_POS, FOLDER_REST_EULER);
      } else if (stageTime < 1.55) {
        // Phase B: Right hand lifts folder from open drawer toward chest, Left hand moves to meet it
        const p = easeInOut((stageTime - 0.95) / 0.60);
        targetMonsterRotY = THREE.MathUtils.lerp(-0.28, -0.16, p);
        targetHeadYaw = THREE.MathUtils.lerp(-0.18, -0.06, p);
        targetHeadPitch = 0.10;
        targetDrawerZ = 0.20;

        targetRightDesk.set(
          THREE.MathUtils.lerp(-0.68, -0.18, p),
          THREE.MathUtils.lerp(DESK_HEIGHT + 0.06, DESK_HEIGHT + 0.24, p),
          THREE.MathUtils.lerp(-0.06, -0.02, p)
        );
        targetLeftDesk.set(
          THREE.MathUtils.lerp(LEFT_HAND_IDLE_DESK.x, 0.12, p),
          THREE.MathUtils.lerp(LEFT_HAND_IDLE_DESK.y, DESK_HEIGHT + 0.24, p),
          THREE.MathUtils.lerp(LEFT_HAND_IDLE_DESK.z, -0.02, p)
        );
        rightPose = 'folderHold';
        leftPose = p > 0.5 ? 'folderHold' : 'relaxed';
        folderVisible = true;
        attachProp(
          'folder',
          p > 0.7 ? 'BOTH' : 'R',
          new THREE.Vector3(p > 0.7 ? 0 : 0.12, 0, 0),
          new THREE.Euler(-0.35, 0, 0, 'XYZ')
        );
      } else if (stageTime < 2.65) {
        // Phase C: Both hands hold & carry teal folder smoothly over to desk stack
        const p = easeInOut((stageTime - 1.55) / 1.10);
        targetMonsterRotY = THREE.MathUtils.lerp(-0.16, -0.04, p);
        targetHeadYaw = THREE.MathUtils.lerp(-0.06, 0.14, p);
        targetHeadPitch = THREE.MathUtils.lerp(0.10, 0.14, p);
        targetDrawerZ = THREE.MathUtils.lerp(0.20, 0.0, p);

        const cx = THREE.MathUtils.lerp(-0.03, FOLDER_REST_POS.x - 0.04, p);
        const cy = THREE.MathUtils.lerp(DESK_HEIGHT + 0.24, DESK_HEIGHT + 0.055, p);
        const cz = THREE.MathUtils.lerp(-0.02, FOLDER_REST_POS.z, p);

        targetRightDesk.set(cx - 0.14, cy, cz);
        targetLeftDesk.set(cx + 0.12, cy, cz);
        leftPose = 'folderHold';
        rightPose = 'folderHold';
        leftTwist = -0.2;
        rightTwist = 0.2;
        folderVisible = true;
        attachProp(
          'folder',
          'BOTH',
          new THREE.Vector3(0, 0, 0),
          new THREE.Euler(THREE.MathUtils.lerp(-0.35, -Math.PI * 0.5, p), 0, -0.12 * p, 'XYZ')
        );
      } else {
        // Phase D: Release folder cleanly onto desk stack -> Hands return smoothly to idle
        const p = easeInOut((stageTime - 2.65) / 1.15);
        targetMonsterRotY = THREE.MathUtils.lerp(-0.04, -0.08, p);
        targetHeadYaw = THREE.MathUtils.lerp(0.14, 0.0, p);
        targetHeadPitch = THREE.MathUtils.lerp(0.14, 0.06, p);
        targetDrawerZ = 0.0;

        releaseProp('folder', folderObj, FOLDER_REST_POS, FOLDER_REST_EULER);
        folderVisible = p < 0.55; // Settles into stack smoothly

        targetRightDesk.set(
          THREE.MathUtils.lerp(FOLDER_REST_POS.x - 0.18, RIGHT_HAND_IDLE_DESK.x, p),
          THREE.MathUtils.lerp(DESK_HEIGHT + 0.09, RIGHT_HAND_IDLE_DESK.y, p),
          THREE.MathUtils.lerp(FOLDER_REST_POS.z, RIGHT_HAND_IDLE_DESK.z, p)
        );
        targetLeftDesk.set(
          THREE.MathUtils.lerp(FOLDER_REST_POS.x + 0.08, LEFT_HAND_IDLE_DESK.x, p),
          THREE.MathUtils.lerp(DESK_HEIGHT + 0.09, LEFT_HAND_IDLE_DESK.y, p),
          THREE.MathUtils.lerp(FOLDER_REST_POS.z, LEFT_HAND_IDLE_DESK.z, p)
        );
        leftPose = 'relaxed';
        rightPose = 'relaxed';
      }
    } else if (curActivity === 'stamp') {
      // STAMP: Left hand reaches stamp -> Grips & attaches -> Lifts -> Glides over paper -> Presses firmly -> Returns -> Releases!
      releaseProp('paper', paperObj, PAPER_REST_POS, PAPER_REST_EULER);
      releaseProp('folder', folderObj, FOLDER_REST_POS, FOLDER_REST_EULER);

      // Right hand gently steadies left edge of the document on the desk (clear of stamp center)
      targetRightDesk.set(-0.24, DESK_HEIGHT + 0.024, 0.03);
      rightPose = 'documentHold';

      // Exact stamp grip height in desk-local space (6.6cm above stamp rubber die)
      const stampGripOnPadY = STAMP_REST_POS.y - STAMP_GRIP_OFFSET.y;
      const stampLiftY = stampGripOnPadY + 0.16;
      const stampImpactY = DESK_HEIGHT + 0.006 - STAMP_GRIP_OFFSET.y;

      if (stageTime < 0.60) {
        // Phase A: Approach stamp on ink pad (stamp stays COMPLETELY STATIONARY until hand reaches it!)
        const p = easeInOut(stageTime / 0.60);
        targetHeadYaw = THREE.MathUtils.lerp(0, 0.13, p);
        targetHeadPitch = THREE.MathUtils.lerp(0.06, 0.14, p);

        targetLeftDesk.set(
          THREE.MathUtils.lerp(LEFT_HAND_IDLE_DESK.x, STAMP_REST_POS.x, p),
          THREE.MathUtils.lerp(LEFT_HAND_IDLE_DESK.y, stampGripOnPadY, p),
          THREE.MathUtils.lerp(LEFT_HAND_IDLE_DESK.z, STAMP_REST_POS.z, p)
        );
        leftPose = p > 0.7 ? 'stampGrip' : 'relaxed';
        releaseProp('stamp', stampObj, STAMP_REST_POS, STAMP_REST_EULER);
      } else if (stageTime < 1.15) {
        // Phase B: Grip established -> Attach stamp to Left hand -> Lift straight up off ink pad
        const p = easeInOut((stageTime - 0.60) / 0.55);
        targetHeadYaw = 0.13;
        targetHeadPitch = 0.13;

        targetLeftDesk.set(
          STAMP_REST_POS.x,
          THREE.MathUtils.lerp(stampGripOnPadY, stampLiftY, p),
          STAMP_REST_POS.z
        );
        leftPose = 'stampGrip';
        attachProp('stamp', 'L', STAMP_GRIP_OFFSET, STAMP_REST_EULER);
      } else if (stageTime < 1.70) {
        // Phase C: Carry attached stamp smoothly over the document center
        const p = easeInOut((stageTime - 1.15) / 0.55);
        targetHeadYaw = THREE.MathUtils.lerp(0.13, -0.02, p);
        targetHeadPitch = THREE.MathUtils.lerp(0.13, 0.16, p);

        // Gentle arc above desk
        const arcY = stampLiftY + Math.sin(p * Math.PI) * 0.03;
        targetLeftDesk.set(
          THREE.MathUtils.lerp(STAMP_REST_POS.x, PAPER_REST_POS.x, p),
          arcY,
          THREE.MathUtils.lerp(STAMP_REST_POS.z, PAPER_REST_POS.z, p)
        );
        leftPose = 'stampGrip';
        attachProp('stamp', 'L', STAMP_GRIP_OFFSET, STAMP_REST_EULER);
      } else if (stageTime < 2.25) {
        // Phase D: Press hand + stamp firmly straight down onto document, hold impact, imprint red seal!
        const localT = stageTime - 1.70;
        targetHeadYaw = -0.02;
        targetHeadPitch = 0.18;

        let handY: number;
        if (localT < 0.22) {
          const p = easeInOut(localT / 0.22);
          handY = THREE.MathUtils.lerp(stampLiftY, stampImpactY, p);
        } else if (localT < 0.40) {
          // Firm contact press
          handY = stampImpactY;
          if (!isStampedRef.current) {
            isStampedRef.current = true;
            if (deskDocMeshRef.current) {
              (deskDocMeshRef.current.material as THREE.MeshBasicMaterial).map = docStampedTexture;
            }
          }
        } else {
          // Begin lifting cleanly
          const p = easeInOut((localT - 0.40) / 0.15);
          handY = THREE.MathUtils.lerp(stampImpactY, stampLiftY, p);
        }

        targetLeftDesk.set(PAPER_REST_POS.x, handY, PAPER_REST_POS.z);
        leftPose = 'stampGrip';
        attachProp('stamp', 'L', STAMP_GRIP_OFFSET, STAMP_REST_EULER);
      } else if (stageTime < 2.95) {
        // Phase E: Carry stamp smoothly back over ink pad and lower onto pad (still attached!)
        const p = easeInOut((stageTime - 2.25) / 0.70);
        targetHeadYaw = THREE.MathUtils.lerp(-0.02, 0.10, p);
        targetHeadPitch = 0.14;

        let handY: number;
        if (p < 0.65) {
          handY = stampLiftY + Math.sin((p / 0.65) * Math.PI) * 0.02;
        } else {
          handY = THREE.MathUtils.lerp(stampLiftY, stampGripOnPadY, easeInOut((p - 0.65) / 0.35));
        }

        const moveP = easeInOut(Math.min(1, p / 0.68));
        targetLeftDesk.set(
          THREE.MathUtils.lerp(PAPER_REST_POS.x, STAMP_REST_POS.x, moveP),
          handY,
          THREE.MathUtils.lerp(PAPER_REST_POS.z, STAMP_REST_POS.z, moveP)
        );
        leftPose = 'stampGrip';
        attachProp('stamp', 'L', STAMP_GRIP_OFFSET, STAMP_REST_EULER);
      } else {
        // Phase F: Stamp touches pad -> Release stamp (stays stationary on pad!) -> Hand returns to idle
        const p = easeInOut((stageTime - 2.95) / 0.45);
        targetHeadYaw = THREE.MathUtils.lerp(0.10, 0.0, p);
        targetHeadPitch = THREE.MathUtils.lerp(0.14, 0.06, p);

        releaseProp('stamp', stampObj, STAMP_REST_POS, STAMP_REST_EULER);

        targetLeftDesk.set(
          THREE.MathUtils.lerp(STAMP_REST_POS.x, LEFT_HAND_IDLE_DESK.x, p),
          THREE.MathUtils.lerp(stampGripOnPadY + 0.02, LEFT_HAND_IDLE_DESK.y, p),
          THREE.MathUtils.lerp(STAMP_REST_POS.z, LEFT_HAND_IDLE_DESK.z, p)
        );
        targetRightDesk.set(
          THREE.MathUtils.lerp(-0.24, RIGHT_HAND_IDLE_DESK.x, p),
          THREE.MathUtils.lerp(DESK_HEIGHT + 0.024, RIGHT_HAND_IDLE_DESK.y, p),
          THREE.MathUtils.lerp(0.03, RIGHT_HAND_IDLE_DESK.z, p)
        );
        leftPose = 'relaxed';
        rightPose = 'relaxed';
      }
    } else if (curActivity === 'review') {
      // REVIEW: Calm satisfied inspection & two gentle nods over the stamped document
      releaseProp('paper', paperObj, PAPER_REST_POS, PAPER_REST_EULER);
      releaseProp('stamp', stampObj, STAMP_REST_POS, STAMP_REST_EULER);
      releaseProp('folder', folderObj, FOLDER_REST_POS, FOLDER_REST_EULER);

      targetHeadPitch = 0.13 + Math.sin(stageTime * 3.8) * 0.045;
      targetHeadYaw = -0.02;
    } else if (curActivity === 'celebrate') {
      // CELEBRATE: Friendly small wave with Right hand (viewer's left), head slightly lifted
      releaseProp('paper', paperObj, PAPER_REST_POS, PAPER_REST_EULER);
      releaseProp('stamp', stampObj, STAMP_REST_POS, STAMP_REST_EULER);
      releaseProp('folder', folderObj, FOLDER_REST_POS, FOLDER_REST_EULER);

      targetHeadPitch = -0.06;
      targetHeadYaw = 0.0;
      targetHeadRoll = 0.04;

      const waveOsc = Math.sin(stageTime * 7.0) * 0.055;
      targetRightDesk.set(-0.30 + waveOsc, DESK_HEIGHT + 0.44, 0.02);
      rightPose = 'waveOpen';
      rightTwist = 0.45;
      leftPose = 'relaxed';
    }

    if (folderObj) {
      folderObj.visible = folderVisible;
    }

    // 7. Apply Body Rotation & Single-Controller Clamped Head Pose
    if (monsterRoot) {
      monsterRoot.rotation.y = snap
        ? targetMonsterRotY
        : THREE.MathUtils.damp(monsterRoot.rotation.y, targetMonsterRotY, 5.0, dt);
    }

    // Reset Neck to rest so Idle clip never adds erratic head bobbing
    if (neckBoneRef.current && restQuatsRef.current['Neck']) {
      neckBoneRef.current.quaternion.copy(restQuatsRef.current['Neck']);
    }

    // Hard-clamp head angles (yaw ±12.6°, pitch -8°..+12.6°, roll ±4.5°)
    const clampedPitch = THREE.MathUtils.clamp(targetHeadPitch, -0.14, 0.22);
    const clampedYaw = THREE.MathUtils.clamp(targetHeadYaw, -0.22, 0.22);
    const clampedRoll = THREE.MathUtils.clamp(targetHeadRoll, -0.08, 0.08);

    const hs = headStateRef.current;
    if (snap) {
      hs.pitch = clampedPitch;
      hs.yaw = clampedYaw;
      hs.roll = clampedRoll;
    } else {
      hs.pitch = THREE.MathUtils.damp(hs.pitch, clampedPitch, 5.5, dt);
      hs.yaw = THREE.MathUtils.damp(hs.yaw, clampedYaw, 5.5, dt);
      hs.roll = THREE.MathUtils.damp(hs.roll, clampedRoll, 5.5, dt);
    }
    applyCharSpaceDelta('Head', hs.pitch, hs.yaw, hs.roll, 'YXZ');

    // 8. Smooth Hand IK Targets & Solve Exact 2-Bone IK for Both Arms
    const ht = handTargetsRef.current;
    if (snap) {
      ht.leftDesk.copy(targetLeftDesk);
      ht.rightDesk.copy(targetRightDesk);
      ht.leftTwist = leftTwist;
      ht.rightTwist = rightTwist;
    } else {
      const k = 1 - Math.exp(-14 * dt);
      ht.leftDesk.lerp(targetLeftDesk, k);
      ht.rightDesk.lerp(targetRightDesk, k);
      ht.leftTwist = THREE.MathUtils.damp(ht.leftTwist, leftTwist, 12, dt);
      ht.rightTwist = THREE.MathUtils.damp(ht.rightTwist, rightTwist, 12, dt);
    }

    if (deskGroup) {
      deskGroup.updateMatrixWorld(true);
      const leftTargetWorld = ht.leftDesk.clone();
      deskGroup.localToWorld(leftTargetWorld);
      const rightTargetWorld = ht.rightDesk.clone();
      deskGroup.localToWorld(rightTargetWorld);

      solveArmIK(
        'L',
        leftTargetWorld,
        new THREE.Vector3(0.85, -0.15, -0.45),
        ht.leftTwist,
        _vLeftHandWorld
      );
      solveArmIK(
        'R',
        rightTargetWorld,
        new THREE.Vector3(-0.85, -0.15, -0.45),
        ht.rightTwist,
        _vRightHandWorld
      );
    }

    applyHandPose('L', leftPose);
    applyHandPose('R', rightPose);

    // 9. Update Drawer & Sync All Attached Props to Live Hand World Transforms
    if (drawer) {
      drawer.position.z = snap
        ? targetDrawerZ
        : THREE.MathUtils.damp(drawer.position.z, targetDrawerZ, 8.0, dt);
    }

    syncPropTransform('paper', paperObj, deskGroup, _vLeftHandWorld, _vRightHandWorld, dt, snap);
    syncPropTransform('stamp', stampObj, deskGroup, _vLeftHandWorld, _vRightHandWorld, dt, snap);
    syncPropTransform('folder', folderObj, deskGroup, _vLeftHandWorld, _vRightHandWorld, dt, snap);

    // 10. Telemetry for automated inspection & hand-prop distance verification
    if (stampObj) stampObj.getWorldPosition(_vStampWorld);
    if (paperObj) paperObj.getWorldPosition(_vPaperWorld);

    window.__ARCHIVIST_STATE__ = {
      loaded: true,
      activity: curActivity,
      isBlinking: blinkAmountRef.current > 0.5,
      isTracking: mouse.isHovering,
      headYaw: hs.yaw,
      headPitch: hs.pitch,
      headRoll: hs.roll,
      drawerOpenAmount: drawer ? drawer.position.z : 0,
      stampPressed: stampObj ? stampObj.position.y < DESK_HEIGHT + 0.012 : false,
      stampedDocument: isStampedRef.current,
      stageProgress: stageTime / (curStage ? curStage.duration : 1),
      attachedProps: {
        paper: attachmentsRef.current.paper.attachedTo,
        folder: attachmentsRef.current.folder.attachedTo,
        stamp: attachmentsRef.current.stamp.attachedTo,
      },
      leftHandWorld: [
        Number(_vLeftHandWorld.x.toFixed(4)),
        Number(_vLeftHandWorld.y.toFixed(4)),
        Number(_vLeftHandWorld.z.toFixed(4)),
      ],
      rightHandWorld: [
        Number(_vRightHandWorld.x.toFixed(4)),
        Number(_vRightHandWorld.y.toFixed(4)),
        Number(_vRightHandWorld.z.toFixed(4)),
      ],
      stampWorld: [
        Number(_vStampWorld.x.toFixed(4)),
        Number(_vStampWorld.y.toFixed(4)),
        Number(_vStampWorld.z.toFixed(4)),
      ],
      paperWorld: [
        Number(_vPaperWorld.x.toFixed(4)),
        Number(_vPaperWorld.y.toFixed(4)),
        Number(_vPaperWorld.z.toFixed(4)),
      ],
    };
  });

  return (
    <group ref={stageGroupRef} position={[0.12, -0.78, 0]}>
      {/* Monster Mascot — Uniformly scaled to 0.66 (~78.5% of previous 0.84) with feet planted on floor y=0 */}
      <group ref={monsterRootRef} position={[0, -0.015, 0.02]} scale={MONSTER_SCALE}>
        <primitive object={clonedScene} />
      </group>

      {/* MINIATURE OFFICE WORKSTATION (Shared Section 02 Desk Visual Language) */}

      {/* 1. Spacious Architectural Archivist Desk (Cloned instance of /models/workspace/desk.glb) */}
      <group ref={deskGroupRef} position={[0.06, 0, 0.44]}>
        <primitive object={archivistDeskObj} />

        {/* Career Milestone Document (Attached to BOTH hands during inspect, stationary on desk otherwise) */}
        <group
          ref={deskDocGroupRef}
          position={[PAPER_REST_POS.x, PAPER_REST_POS.y, PAPER_REST_POS.z]}
          rotation={[PAPER_REST_EULER.x, PAPER_REST_EULER.y, PAPER_REST_EULER.z]}
        >
          <mesh ref={deskDocMeshRef} receiveShadow castShadow>
            <planeGeometry args={[0.25, 0.34]} />
            <meshBasicMaterial map={docUnstampedTexture} side={THREE.DoubleSide} />
          </mesh>
        </group>

        {/* Held Archive Folder (Attached to hands during organize) */}
        <group ref={heldFolderRef} visible={false}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.28, 0.38, 0.020]} />
            <meshStandardMaterial color="#0D9488" roughness={0.65} />
          </mesh>
          <mesh position={[0, 0.008, 0.011]}>
            <planeGeometry args={[0.23, 0.31]} />
            <meshBasicMaterial map={docUnstampedTexture} side={THREE.DoubleSide} />
          </mesh>
        </group>

        {/* Ink Pad Box on Desk (Sized to match enlarged ~1.42x stamp) */}
        <group position={[STAMP_REST_POS.x, DESK_HEIGHT + 0.008, STAMP_REST_POS.z]}>
          <mesh receiveShadow castShadow>
            <boxGeometry args={[0.115, 0.016, 0.095]} />
            <meshStandardMaterial color="#1E293B" roughness={0.5} metalness={0.6} />
          </mesh>
          {/* Crimson Ink Sponge */}
          <mesh position={[0, 0.009, 0]}>
            <boxGeometry args={[0.096, 0.005, 0.076]} />
            <meshStandardMaterial color="#DC2626" roughness={0.8} />
          </mesh>
        </group>

        {/* Enlarged Iconic Desk Stamp (~1.42x — Attached to Left hand during stamp activity, unobstructed in idle) */}
        <group ref={deskStampRef}>
          {/* Turned Wood Handle */}
          <mesh castShadow receiveShadow position={[0, 0.058, 0]}>
            <cylinderGeometry args={[0.017, 0.027, 0.085, 16]} />
            <meshStandardMaterial color="#B45309" roughness={0.4} />
          </mesh>
          {/* Top Knob */}
          <mesh castShadow receiveShadow position={[0, 0.106, 0]}>
            <sphereGeometry args={[0.030, 16, 16]} />
            <meshStandardMaterial color="#B45309" roughness={0.4} />
          </mesh>
          {/* Brass Collar */}
          <mesh castShadow position={[0, 0.016, 0]}>
            <cylinderGeometry args={[0.030, 0.030, 0.012, 16]} />
            <meshStandardMaterial color="#F59E0B" metalness={0.85} roughness={0.25} />
          </mesh>
          {/* Rubber Stamp Die */}
          <mesh castShadow receiveShadow position={[0, 0.0065, 0]}>
            <boxGeometry args={[0.066, 0.013, 0.066]} />
            <meshStandardMaterial color="#DC2626" roughness={0.7} />
          </mesh>
        </group>

        {/* Neat Unprocessed Document Stack on Left Side of Wide Desk */}
        <group position={[-0.52, DESK_HEIGHT + 0.004, 0.04]} rotation={[0, 0.08, 0]}>
          {[0, 1, 2].map((idx) => (
            <mesh
              key={idx}
              position={[idx * 0.004, idx * 0.006, -idx * 0.003]}
              rotation={[0, (idx - 1) * 0.04, 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[0.22, 0.005, 0.30]} />
              <meshStandardMaterial color={idx === 2 ? '#FFFFFF' : '#F5F5F4'} roughness={0.82} />
            </mesh>
          ))}
        </group>

        {/* Miniature Milestone Calendar Block ("2026") tucked neatly at back-left */}
        <group position={[-0.56, DESK_HEIGHT + 0.022, -0.18]} rotation={[0, 0.14, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.075, 0.044, 0.052]} />
            <meshStandardMaterial color="#FAFAF9" roughness={0.8} />
          </mesh>
          <mesh position={[0, -0.018, 0]}>
            <boxGeometry args={[0.088, 0.010, 0.064]} />
            <meshStandardMaterial color="#78350F" roughness={0.5} />
          </mesh>
        </group>

        {/* Stack of Archive Folders on Far-Right Side of Wide Desk */}
        <group position={[0.58, DESK_HEIGHT + 0.006, 0.04]} rotation={[0, -0.12, 0]}>
          {['#0D9488', '#D97706', '#475569'].map((c, idx) => (
            <mesh key={idx} position={[0, idx * 0.012, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.22, 0.011, 0.30]} />
              <meshStandardMaterial color={c} roughness={0.7} />
            </mesh>
          ))}
        </group>
      </group>

      {/* 2. Vintage-Modern Mini Filing Cabinet (Proportional 0.76m height aligned beside the wider desk) */}
      <group position={[-0.96, 0.38, 0.24]} rotation={[0, 0.22, 0]}>
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[0.36, 0.76, 0.44]} />
          <meshStandardMaterial color="#475569" roughness={0.65} metalness={0.2} />
        </mesh>

        {/* Top Drawer (Animates open on Z axis during 'organize') */}
        <group ref={filingDrawerRef} position={[0, 0.19, 0]}>
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={[0.32, 0.33, 0.42]} />
            <meshStandardMaterial color="#334155" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.018, 0.212]}>
            <boxGeometry args={[0.095, 0.048, 0.005]} />
            <meshStandardMaterial color="#F59E0B" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0, -0.052, 0.220]} rotation={[Math.PI * 0.5, 0, 0]}>
            <torusGeometry args={[0.028, 0.005, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#F59E0B" metalness={0.85} roughness={0.25} />
          </mesh>
          {['#0D9488', '#D97706', '#E11D48', '#38BDF8'].map((c, i) => (
            <mesh key={i} position={[-0.095 + i * 0.064, 0.145, -0.04 + i * 0.05]}>
              <boxGeometry args={[0.048, 0.020, 0.005]} />
              <meshStandardMaterial color={c} roughness={0.5} />
            </mesh>
          ))}
        </group>

        {/* Bottom Drawer (Fixed) */}
        <group position={[0, -0.19, 0.01]}>
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={[0.32, 0.33, 0.42]} />
            <meshStandardMaterial color="#334155" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.018, 0.212]}>
            <boxGeometry args={[0.095, 0.048, 0.005]} />
            <meshStandardMaterial color="#F59E0B" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0, -0.052, 0.220]} rotation={[Math.PI * 0.5, 0, 0]}>
            <torusGeometry args={[0.028, 0.005, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#F59E0B" metalness={0.85} roughness={0.25} />
          </mesh>
        </group>
      </group>
    </group>
  );
};

useGLTF.preload(MODEL_PATH);
useGLTF.preload(DESK_PATH);
