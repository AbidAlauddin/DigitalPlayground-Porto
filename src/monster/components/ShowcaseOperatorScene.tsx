import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { getFurBumpTexture } from '../utils/furTextures';
import { getOperatorBadgeTexture } from '../utils/operatorTextures';

const MODEL_PATH = '/monsters/showcase-operator/operator-mascot.glb';

export type OperatorPhase =
  | 'sitting_idle'
  | 'waking'
  | 'standing_up'
  | 'prep_walk'
  | 'walking_to_btn'
  | 'raising_hand'
  | 'pressing'
  | 'retracting'
  | 'pause_between'
  | 'finishing_react'
  | 'walking_home'
  | 'sitting_down'
  | 'completed_idle'
  | 'manual_react'
  | 'interrupted_notice'
  | 'angry_react'
  | 'sulking_react'
  | 'sulking_idle';

type HandPose = 'relaxed' | 'buttonPress' | 'proudWave' | 'headsetTouch';

export interface PaginationTargetNdc {
  index: number;
  ndcX: number;
  ndcY: number;
}

export interface ShowcaseOperatorDebugState {
  loaded: boolean;
  phase: OperatorPhase;
  sitBlend: number;
  walkActivity: number;
  walkPhase: number;
  rootRotY: number;
  currentRound: number;
  completedRounds: number;
  totalRoundsTarget: number;
  interruptionCount: number;
  isAngry: boolean;
  isSulking: boolean;
  wakeClickCount: number;
  activeProjectIdx: number;
  currentTargetIdx: number;
  buttonCount: number;
  pressedSequence: number[];
  stageX: number;
  activeHand: 'L' | 'R';
  eyeMountCount: number;
  handToButtonErrorCm: number;
  headYaw: number;
  headPitch: number;
}

declare global {
  interface Window {
    __OPERATOR_STATE__?: ShowcaseOperatorDebugState;
    __OPERATOR_SCENE__?: THREE.Object3D;
    __OPERATOR_BONES__?: Record<string, THREE.Bone>;
    __PAUSE_OPERATOR__?: boolean;
    __OPERATOR_TIME_SCALE__?: number;
  }
}

export interface ShowcaseOperatorSceneProps {
  isActive: boolean;
  reducedMotion: boolean;
  stageContainerRef: React.RefObject<HTMLDivElement | null>;
  activeProjectIdx: number;
  manualTriggerVersion: number;
  getPaginationTargets: () => PaginationTargetNdc[];
  getSitAnchorNdcX: () => number;
  onPressButton: (idx: number) => void;
  onPressVisualChange: (idx: number | null) => void;
}

// Calm, natural animation timings (~35-40% slower overall with extended actual motion durations)
const DUR_WAKING = 1.15;
const DUR_STAND_UP = 1.55;
const DUR_PREP_WALK = 0.65;
const DUR_RAISE_HAND = 0.72;
const DUR_PRESS = 0.46;
const DUR_RETRACT = 0.65;
const DUR_PAUSE_BETWEEN = 0.80;
const DUR_FINISHING_REACT = 1.15;
const DUR_SIT_DOWN = 1.35;
const DUR_MANUAL_REACT = 0.90;
const DUR_INTERRUPTED_NOTICE = 0.52;
const DUR_ANGRY_REACT = 1.35;
const DUR_SULKING_REACT = 1.05;

const WALK_SPEED = 1.02; // Calm walking speed synced to Walk clip timeScale (zero foot sliding)
const MONSTER_SCALE = 0.56; // ~17.7% smaller than previous 0.68 scale for balanced companion proportion
const HAND_SCALE = 0.80;
const INTERACTION_PLANE_Z = 0.42;
const DEFAULT_TOTAL_ROUNDS = 3; // Monster completes 3 full rounds of pressing all pagination buttons before sitting idle

function easeInOutSine(t: number): number {
  const c = THREE.MathUtils.clamp(t, 0, 1);
  return -(Math.cos(Math.PI * c) - 1) * 0.5;
}

function easeInOutCubic(t: number): number {
  const c = THREE.MathUtils.clamp(t, 0, 1);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) * 0.5;
}

// Pre-allocated scratch math objects (zero per-frame GC allocations)
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
const _axisY = new THREE.Vector3(0, 1, 0);
const _vUnproj = new THREE.Vector3();
const _vBtnWorld = new THREE.Vector3();
const _vSitWorld = new THREE.Vector3();
const _vLeftTarget = new THREE.Vector3();
const _vRightTarget = new THREE.Vector3();
const _vLeftPalmWorld = new THREE.Vector3();
const _vRightPalmWorld = new THREE.Vector3();
const _qWalkShoulderL = new THREE.Quaternion();
const _qWalkUpperArmL = new THREE.Quaternion();
const _qWalkLowerArmL = new THREE.Quaternion();
const _qWalkShoulderR = new THREE.Quaternion();
const _qWalkUpperArmR = new THREE.Quaternion();
const _qWalkLowerArmR = new THREE.Quaternion();
const _raycaster = new THREE.Raycaster();
const _vPointerNdc = new THREE.Vector2();
const _vClickWorld = new THREE.Vector3();

export const ShowcaseOperatorScene: React.FC<ShowcaseOperatorSceneProps> = ({
  isActive,
  reducedMotion,
  stageContainerRef,
  activeProjectIdx,
  manualTriggerVersion,
  getPaginationTargets,
  getSitAnchorNdcX,
  onPressButton,
  onPressVisualChange,
}) => {
  const { scene, animations } = useGLTF(MODEL_PATH);
  const { camera } = useThree();

  const stageGroupRef = useRef<THREE.Group>(null);
  const monsterRootRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const idleActionRef = useRef<THREE.AnimationAction | null>(null);
  const walkActionRef = useRef<THREE.AnimationAction | null>(null);

  // Skeleton bones
  const bonesRef = useRef<Record<string, THREE.Bone>>({});
  const restQuatsRef = useRef<Record<string, THREE.Quaternion>>({});
  const headBoneRef = useRef<THREE.Bone | null>(null);
  const neckBoneRef = useRef<THREE.Bone | null>(null);
  const torsoBoneRef = useRef<THREE.Bone | null>(null);

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
  const eyeMountCountRef = useRef(0);
  const blinkAmountRef = useRef(0);

  // Latest props ref (prevents stale closures in useFrame)
  const latestPropsRef = useRef({
    activeProjectIdx,
    getPaginationTargets,
    getSitAnchorNdcX,
    onPressButton,
    onPressVisualChange,
  });
  useEffect(() => {
    latestPropsRef.current = {
      activeProjectIdx,
      getPaginationTargets,
      getSitAnchorNdcX,
      onPressButton,
      onPressVisualChange,
    };
  }, [
    activeProjectIdx,
    getPaginationTargets,
    getSitAnchorNdcX,
    onPressButton,
    onPressVisualChange,
  ]);

  // Complete Lifecycle State Machine (with 3-Round Counter, Interruption Counter, Angry/Sulking Reactions & Wake-on-Click)
  const stateRef = useRef({
    phase: 'sitting_idle' as OperatorPhase,
    phaseTime: 0,
    totalTime: 0,
    hasTriggeredOnce: false,
    sequenceCancelled: false,
    currentTargetIdx: 0,
    currentRound: 0, // Current 0-based round counter (0, 1, 2 for 3 rounds)
    completedRounds: 0, // Number of full rounds completed in the current session
    totalRoundsTarget: DEFAULT_TOTAL_ROUNDS, // 3 full rounds before returning to sitting idle
    pressedInCurrentRound: 0, // Number of buttons successfully pressed in the current round
    interruptionCount: 0, // Counts manual user pagination clicks while monster is actively working (1..2 = notice & continue, 3 = angry & continue, 4+ = sulk & stop)
    isAngry: false,
    isSulking: false,
    stompFootAmt: 0.0, // Right-foot stomp height offset during angry_react
    wakeClickCount: 0, // Total times user clicked the seated idle/sulking monster to wake/coax it
    pressedThisButton: false,
    pressedSequence: [] as number[],
    lastManualVersion: manualTriggerVersion,
    sitBlend: 1.0, // 1 = sitting relaxed on floor, 0 = standing upright
    walkWeight: 0.0,
    walkActivity: 0.0, // Continuous 0..1 locomotion blend (eliminates hard boolean IK cutoffs)
    walkPhase: 0.0, // Distance-driven stride cycle angle (rad) — zero foot sliding
    walkStartDist: 1.0, // Initial walk segment distance for smooth facing turn modulation
    pressYaw: 0.0, // Saved torso yaw during button press for glitch-free retraction
    stageX: -0.95,
    stageXInitialized: false,
    rootRotY: 0.14,
    activeHand: 'L' as 'L' | 'R',
    headPitch: 0.08,
    headYaw: 0.06,
    headRoll: 0.0,
  });

  // Smoothed world hand targets
  const handTargetsRef = useRef({
    left: new THREE.Vector3(-0.7, -0.5, 0.25),
    right: new THREE.Vector3(-1.2, -0.5, 0.25),
  });

  // Cursor tracking
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, isHovering: false });

  // Clone GLTF with intact skeleton bindings
  const clonedScene = useMemo(() => cloneSkeleton(scene), [scene]);
  const badgeTexture = useMemo(() => getOperatorBadgeTexture(), []);
  const furBump = useMemo(() => getFurBumpTexture(), []);

  // Unproject exact DOM (ndcX, ndcY) onto the 3D interaction plane Z using live camera projection
  const unprojectNdcToPlane = useCallback(
    (ndcX: number, ndcY: number, planeZ: number, out: THREE.Vector3) => {
      _vUnproj.set(
        THREE.MathUtils.clamp(ndcX, -0.96, 0.96),
        THREE.MathUtils.clamp(ndcY, -0.92, 0.96),
        0.5
      );
      _vUnproj.unproject(camera);
      const dir = _vUnproj.sub(camera.position).normalize();
      const denom = Math.abs(dir.z) > 1e-4 ? dir.z : -1;
      const t = (planeZ - camera.position.z) / denom;
      out.set(
        camera.position.x + dir.x * t,
        camera.position.y + dir.y * t,
        planeZ
      );
    },
    [camera]
  );

  // Single-controller character-space delta (always resets to restQuat first — zero accumulation)
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

  // Skeletal Sitting & Locomotion Posture (coordinates hips, legs, ankles, torso, stride vertical bob & angry foot stomp)
  const applyBodyLocomotionAndSitting = (
    sitBlend: number,
    walkActivity: number,
    walkPhase: number,
    extraTorsoPitch = 0,
    extraTorsoYaw = 0,
    stompFootAmt = 0
  ) => {
    const root = monsterRootRef.current;
    if (!root) return;

    // 1. Vertical root pelvis height: floor sit (-0.20) vs standing (0) + double-frequency stride bob
    const sitY = THREE.MathUtils.lerp(0, -0.20, sitBlend);
    const strideBobY = Math.abs(Math.sin(walkPhase)) * 0.032 * walkActivity * (1 - sitBlend);
    root.position.y = sitY + strideBobY;

    // 2. Leg & Foot Kinematics: smooth blend between seated posture, distance-driven walking stride & angry stomp
    const sL = Math.sin(walkPhase);
    const cL = Math.cos(walkPhase);
    const sR = Math.sin(walkPhase + Math.PI);
    const cR = Math.cos(walkPhase + Math.PI);

    // Thigh pitch: negative = leg swings forward/up in character space, positive = leg pushes backward
    const walkThighPitchL = -sL * 0.56 * walkActivity;
    const walkThighPitchR = -sR * 0.56 * walkActivity - stompFootAmt * 0.62;

    // Knee flexion: positive bends calf backward during swing recovery phase (c > 0) + slight stance yield
    const walkKneePitchL = (Math.max(0, cL) * 0.68 + Math.max(0, -sL) * 0.14) * walkActivity;
    const walkKneePitchR =
      (Math.max(0, cR) * 0.68 + Math.max(0, -sR) * 0.14) * walkActivity + stompFootAmt * 0.72;

    // Ankle pitch: heel-strike & toe-off articulation synchronized with step cycle
    const walkFootPitchL = (-cL * 0.24 + sL * 0.12) * walkActivity;
    const walkFootPitchR = (-cR * 0.24 + sR * 0.12) * walkActivity - stompFootAmt * 0.28;

    if (sitBlend > 0.002 || walkActivity > 0.002 || stompFootAmt > 0.002) {
      applyCharSpaceDelta(
        'UpperLegL',
        -1.28 * sitBlend + walkThighPitchL * (1 - sitBlend),
        0.14 * sitBlend,
        -0.22 * sitBlend,
        'YXZ'
      );
      applyCharSpaceDelta(
        'UpperLegR',
        -1.28 * sitBlend + walkThighPitchR * (1 - sitBlend),
        -0.14 * sitBlend,
        0.22 * sitBlend,
        'YXZ'
      );
      applyCharSpaceDelta(
        'LowerLegL',
        0.34 * sitBlend + walkKneePitchL * (1 - sitBlend),
        0,
        0,
        'YXZ'
      );
      applyCharSpaceDelta(
        'LowerLegR',
        0.34 * sitBlend + walkKneePitchR * (1 - sitBlend),
        0,
        0,
        'YXZ'
      );
      applyCharSpaceDelta(
        'FootL',
        0.28 * sitBlend + walkFootPitchL * (1 - sitBlend),
        0,
        0,
        'YXZ'
      );
      applyCharSpaceDelta(
        'FootR',
        0.28 * sitBlend + walkFootPitchR * (1 - sitBlend),
        0,
        0,
        'YXZ'
      );
    }

    // 3. Torso Pitch, Counter-Twist & Lateral Weight Shift over planted stance foot
    const totalTorsoPitch = 0.07 * sitBlend + extraTorsoPitch + 0.05 * walkActivity;
    const torsoWalkYaw = -sL * 0.075 * walkActivity + extraTorsoYaw;
    const torsoWalkRoll = cL * 0.042 * walkActivity + stompFootAmt * 0.06;
    if (
      Math.abs(totalTorsoPitch) > 0.001 ||
      Math.abs(torsoWalkYaw) > 0.001 ||
      Math.abs(torsoWalkRoll) > 0.001
    ) {
      applyCharSpaceDelta('Torso', totalTorsoPitch, torsoWalkYaw, torsoWalkRoll, 'YXZ');
    }
  };

  // Exact Analytical 2-Bone Arm IK Solver (UpperArm -> LowerArm -> Middle2 press tip)
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

    if (restQuats[`Shoulder${side}`]) shoulder.quaternion.copy(restQuats[`Shoulder${side}`]);
    if (restQuats[`UpperArm${side}`]) upper.quaternion.copy(restQuats[`UpperArm${side}`]);
    if (restQuats[`LowerArm${side}`]) lower.quaternion.copy(restQuats[`LowerArm${side}`]);
    if (middle1 && restQuats[`Middle1${side}`]) {
      middle1.quaternion.copy(restQuats[`Middle1${side}`]);
      middle1.scale.set(HAND_SCALE, HAND_SCALE, HAND_SCALE);
    }
    root.updateMatrixWorld(true);

    upper.getWorldPosition(_vS);
    lower.getWorldPosition(_vE0);
    hand.getWorldPosition(_vW0);

    const L1 = _vS.distanceTo(_vE0);
    const L2 = _vE0.distanceTo(_vW0);
    if (L1 < 1e-4 || L2 < 1e-4) return;

    _vDir.copy(targetWorldPos).sub(_vS);
    const rawDist = _vDir.length();
    const minDist = Math.abs(L1 - L2) + 0.03;
    const maxDist = L1 + L2 - 0.012;
    const d = THREE.MathUtils.clamp(rawDist, minDist, maxDist);

    if (rawDist > 1e-5) {
      _vU.copy(_vDir).multiplyScalar(1 / rawDist);
    } else {
      _vU.set(0, 1, 0);
    }

    const cosAlpha = THREE.MathUtils.clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1);
    const sinAlpha = Math.sqrt(Math.max(0, 1 - cosAlpha * cosAlpha));

    _vPole.copy(poleDirWorld).addScaledVector(_vU, -poleDirWorld.dot(_vU));
    if (_vPole.lengthSq() < 1e-6) {
      _vPole.set(side === 'L' ? 1 : -1, -0.3, -0.5);
    }
    _vPole.normalize();

    _vElbow
      .copy(_vS)
      .addScaledVector(_vU, L1 * cosAlpha)
      .addScaledVector(_vPole, L1 * sinAlpha);

    _vCur1.copy(_vE0).sub(_vS).normalize();
    _vDes1.copy(_vElbow).sub(_vS).normalize();
    _qDelta.setFromUnitVectors(_vCur1, _vDes1);

    upper.parent.getWorldQuaternion(_qParent);
    _qParentInv.copy(_qParent).invert();
    upper.quaternion
      .copy(_qParentInv)
      .multiply(_qDelta)
      .multiply(_qParent)
      .multiply(restQuats[`UpperArm${side}`]);
    upper.updateMatrixWorld(true);

    lower.getWorldPosition(_vEcur);
    hand.getWorldPosition(_vWcur);
    _vCur2.copy(_vWcur).sub(_vEcur).normalize();
    _vDes2.copy(targetWorldPos).sub(_vEcur).normalize();
    _qDelta.setFromUnitVectors(_vCur2, _vDes2);

    lower.parent.getWorldQuaternion(_qParent);
    _qParentInv.copy(_qParent).invert();
    lower.quaternion
      .copy(_qParentInv)
      .multiply(_qDelta)
      .multiply(_qParent)
      .multiply(restQuats[`LowerArm${side}`]);

    if (Math.abs(wristTwist) > 1e-4) {
      _qTwist.setFromAxisAngle(_axisY, wristTwist);
      lower.quaternion.multiply(_qTwist);
    }
    lower.updateMatrixWorld(true);
    hand.getWorldPosition(outPalmWorld);
  };

  const applyHandPose = (side: 'L' | 'R', pose: HandPose) => {
    const bones = bonesRef.current;
    const restQuats = restQuatsRef.current;
    const s = side;
    const sign = s === 'L' ? 1 : -1;

    const rootFingers = [`Thumb1${s}`, `Index1${s}`, `Middle1${s}`, `Pinky1${s}`];
    rootFingers.forEach((name) => {
      const b = bones[name];
      if (b) b.scale.set(HAND_SCALE, HAND_SCALE, HAND_SCALE);
    });

    const setJoint = (name: string, rx = 0, ry = 0, rz = 0) => {
      const b = bones[name];
      const rest = restQuats[name];
      if (!b || !rest) return;
      _qDelta.setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ'));
      b.quaternion.copy(rest).multiply(_qDelta);
    };

    if (pose === 'relaxed') {
      setJoint(`Thumb1${s}`, -0.10, 0, sign * 0.25);
      setJoint(`Thumb2${s}`, -0.12, 0, 0);
      setJoint(`Index1${s}`, 0, 0, sign * 0.08);
      setJoint(`Index2${s}`, -0.24, 0, 0);
      setJoint(`Index3${s}`, -0.16, 0, 0);
      setJoint(`Middle1${s}`, 0, 0, 0);
      setJoint(`Middle2${s}`, -0.26, 0, 0);
      setJoint(`Middle3${s}`, -0.18, 0, 0);
      setJoint(`Pinky1${s}`, 0, 0, -sign * 0.10);
      setJoint(`Pinky2${s}`, -0.28, 0, 0);
      setJoint(`Pinky3${s}`, -0.20, 0, 0);
    } else if (pose === 'buttonPress') {
      setJoint(`Thumb1${s}`, -0.22, 0, sign * 0.42);
      setJoint(`Thumb2${s}`, -0.24, 0, 0);
      setJoint(`Index1${s}`, 0.08, 0, sign * 0.04);
      setJoint(`Index2${s}`, 0.05, 0, 0);
      setJoint(`Index3${s}`, 0.02, 0, 0);
      setJoint(`Middle1${s}`, 0, 0, 0);
      setJoint(`Middle2${s}`, -0.78, 0, 0);
      setJoint(`Middle3${s}`, -0.55, 0, 0);
      setJoint(`Pinky1${s}`, 0, 0, -sign * 0.10);
      setJoint(`Pinky2${s}`, -0.82, 0, 0);
      setJoint(`Pinky3${s}`, -0.58, 0, 0);
    } else if (pose === 'proudWave') {
      setJoint(`Thumb1${s}`, -0.05, 0, sign * 0.15);
      setJoint(`Thumb2${s}`, -0.06, 0, 0);
      setJoint(`Index1${s}`, 0, 0, sign * 0.05);
      setJoint(`Index2${s}`, -0.10, 0, 0);
      setJoint(`Index3${s}`, -0.08, 0, 0);
      setJoint(`Middle1${s}`, 0, 0, 0);
      setJoint(`Middle2${s}`, -0.12, 0, 0);
      setJoint(`Middle3${s}`, -0.08, 0, 0);
      setJoint(`Pinky1${s}`, 0, 0, -sign * 0.08);
      setJoint(`Pinky2${s}`, -0.14, 0, 0);
      setJoint(`Pinky3${s}`, -0.10, 0, 0);
    } else if (pose === 'headsetTouch') {
      setJoint(`Thumb1${s}`, -0.16, 0, sign * 0.30);
      setJoint(`Thumb2${s}`, -0.18, 0, 0);
      setJoint(`Index1${s}`, 0, 0, sign * 0.10);
      setJoint(`Index2${s}`, -0.45, 0, 0);
      setJoint(`Index3${s}`, -0.32, 0, 0);
      setJoint(`Middle1${s}`, 0, 0, 0);
      setJoint(`Middle2${s}`, -0.48, 0, 0);
      setJoint(`Middle3${s}`, -0.34, 0, 0);
      setJoint(`Pinky1${s}`, 0, 0, -sign * 0.10);
      setJoint(`Pinky2${s}`, -0.52, 0, 0);
      setJoint(`Pinky3${s}`, -0.36, 0, 0);
    }
  };

  // Setup Materials, Extracted Anatomical 3D Eyes, Operator Headset, Cap, Vest, Gloves, Badge & Idle/Walk Mixer
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

    let origEyeWhiteMesh: THREE.SkinnedMesh | null = null;

    clonedScene.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh) {
        child.frustumCulled = false;
        child.castShadow = true;
        child.receiveShadow = true;

        const matName = (child.material as THREE.MeshStandardMaterial)?.name || '';
        if (matName === 'Dino_Main') {
          child.material = mainCoatMat;
        } else if (matName === 'Dino_Secondary') {
          child.material = secondaryMintMat;
        } else if (matName === 'Eye_White') {
          origEyeWhiteMesh = child;
          child.visible = false;
        } else if (matName === 'Eye_Black') {
          child.visible = false;
        } else if (matName === 'Dino_Teeth' || matName === 'Dino_Tongue') {
          child.visible = false;
        }
      }

      if (child instanceof THREE.Bone) {
        const cleanName = child.name.replace(/\./g, '');
        bonesRef.current[cleanName] = child;
        restQuatsRef.current[cleanName] = child.quaternion.clone();

        if (cleanName === 'Head') headBoneRef.current = child;
        if (cleanName === 'Neck') neckBoneRef.current = child;
        if (cleanName === 'Torso') torsoBoneRef.current = child;
      }
    });

    window.__OPERATOR_BONES__ = bonesRef.current;
    window.__OPERATOR_SCENE__ = clonedScene;

    const removeByNames = (parent: THREE.Object3D, names: string[]) => {
      parent.children.filter((c) => names.includes(c.name)).forEach((c) => parent.remove(c));
    };

    const headBone = headBoneRef.current;
    if (headBone) {
      removeByNames(headBone, [
        'OperatorEye_L',
        'OperatorEye_R',
        'OperatorHeadset',
        'OperatorCap',
      ]);

      let leftSocket = new THREE.Vector3(-0.0038, 0.00521, 0.00094);
      let rightSocket = new THREE.Vector3(0.0038, 0.00521, 0.00094);
      const eyeRadius = 0.00112;

      const eyeMesh = origEyeWhiteMesh as THREE.SkinnedMesh | null;
      if (eyeMesh && eyeMesh.skeleton) {
        const headIdx = eyeMesh.skeleton.bones.findIndex((b) => b === headBone);
        if (headIdx !== -1) {
          const headInv = eyeMesh.skeleton.boneInverses[headIdx];
          const posAttr = eyeMesh.geometry.attributes.position;
          const lSum = new THREE.Vector3();
          const rSum = new THREE.Vector3();
          let lCnt = 0;
          let rCnt = 0;
          const v = new THREE.Vector3();
          for (let i = 0; i < posAttr.count; i++) {
            v.fromBufferAttribute(posAttr, i)
              .applyMatrix4(eyeMesh.bindMatrix)
              .applyMatrix4(headInv);
            if (v.x < 0) {
              lSum.add(v);
              lCnt++;
            } else {
              rSum.add(v);
              rCnt++;
            }
          }
          if (lCnt > 0 && rCnt > 0) {
            lSum.divideScalar(lCnt);
            rSum.divideScalar(rCnt);
            const avgX = (Math.abs(lSum.x) + Math.abs(rSum.x)) * 0.5;
            const avgY = (lSum.y + rSum.y) * 0.5;
            const avgZ = (lSum.z + rSum.z) * 0.5;
            leftSocket = new THREE.Vector3(-avgX, avgY, avgZ);
            rightSocket = new THREE.Vector3(avgX, avgY, avgZ);
          }
        }
      }

      const scleraGeo = new THREE.SphereGeometry(eyeRadius, 28, 20);
      const irisGeo = new THREE.SphereGeometry(eyeRadius * 0.72, 22, 16);
      const pupilGeo = new THREE.SphereGeometry(eyeRadius * 0.42, 18, 12);
      const catchBigGeo = new THREE.SphereGeometry(eyeRadius * 0.20, 12, 10);
      const catchSmallGeo = new THREE.SphereGeometry(eyeRadius * 0.12, 10, 8);
      const upperLidGeo = new THREE.SphereGeometry(
        eyeRadius * 1.045,
        22,
        14,
        0,
        Math.PI * 2,
        0,
        Math.PI * 0.52
      );
      const lowerLidGeo = new THREE.SphereGeometry(
        eyeRadius * 1.045,
        22,
        14,
        0,
        Math.PI * 2,
        Math.PI * 0.48,
        Math.PI * 0.52
      );

      const scleraMat = new THREE.MeshPhysicalMaterial({
        color: '#FFFFFF',
        roughness: 0.08,
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

      const fwdLeft = new THREE.Vector3(-0.28, 0.08, 0.96).normalize();
      const fwdRight = new THREE.Vector3(0.28, 0.08, 0.96).normalize();

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

      for (const [idx, eyePos] of [leftSocket, rightSocket].entries()) {
        const eyeMount = new THREE.Group();
        eyeMount.name = idx === 0 ? 'OperatorEye_L' : 'OperatorEye_R';
        eyeMount.position.copy(eyePos);

        const fwd = idx === 0 ? fwdLeft : fwdRight;
        eyeMount.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), fwd);

        const scleraMesh = new THREE.Mesh(scleraGeo, scleraMat);
        scleraMesh.name = idx === 0 ? 'OperatorSclera_L' : 'OperatorSclera_R';
        eyeMount.add(scleraMesh);

        const pupilGroup = new THREE.Group();
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
      eyeMountCountRef.current = 2;

      // Operator Headset
      const headsetGroup = new THREE.Group();
      headsetGroup.name = 'OperatorHeadset';
      headsetGroup.position.set(0, 0.0032, -0.0008);

      const bandMat = new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.45, metalness: 0.35 });
      const accentRingMat = new THREE.MeshStandardMaterial({ color: '#0D9488', roughness: 0.35, metalness: 0.25 });
      const cushionMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.78 });
      disposables.push(bandMat, accentRingMat, cushionMat);

      const bandGeo = new THREE.TorusGeometry(0.0063, 0.00048, 10, 28, Math.PI * 1.06);
      disposables.push(bandGeo);
      const bandMesh = new THREE.Mesh(bandGeo, bandMat);
      bandMesh.position.set(0, 0.0004, 0);
      bandMesh.rotation.set(0.06, 0, -0.03);
      bandMesh.castShadow = true;
      headsetGroup.add(bandMesh);

      const cupGeo = new THREE.CylinderGeometry(0.00175, 0.00175, 0.00095, 20);
      const ringGeo = new THREE.TorusGeometry(0.00145, 0.00020, 8, 20);
      disposables.push(cupGeo, ringGeo);

      for (const side of [-1, 1]) {
        const cup = new THREE.Mesh(cupGeo, cushionMat);
        cup.rotation.z = Math.PI * 0.5;
        cup.position.set(side * 0.00625, 0.0004, 0);
        cup.castShadow = true;
        headsetGroup.add(cup);

        const ring = new THREE.Mesh(ringGeo, accentRingMat);
        ring.rotation.y = Math.PI * 0.5;
        ring.position.set(side * 0.00675, 0.0004, 0);
        headsetGroup.add(ring);
      }

      const boomGeo = new THREE.CylinderGeometry(0.00020, 0.00020, 0.0056, 8);
      const micTipGeo = new THREE.SphereGeometry(0.00052, 12, 10);
      disposables.push(boomGeo, micTipGeo);

      const boom = new THREE.Mesh(boomGeo, bandMat);
      boom.position.set(0.0052, -0.0010, 0.0028);
      boom.rotation.set(1.22, 0, 0.42);
      headsetGroup.add(boom);

      const micTip = new THREE.Mesh(micTipGeo, cushionMat);
      micTip.position.set(0.0038, -0.0019, 0.0054);
      headsetGroup.add(micTip);

      headBone.add(headsetGroup);
      attachedNodes.push({ parent: headBone, child: headsetGroup });

      // Operator Cap
      const capGroup = new THREE.Group();
      capGroup.name = 'OperatorCap';
      capGroup.position.set(0, 0.0076, 0.0004);
      capGroup.rotation.set(-0.08, 0, 0);

      const capCrownMat = new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.78, metalness: 0.05 });
      const capBrimMat = new THREE.MeshStandardMaterial({ color: '#0F766E', roughness: 0.65 });
      disposables.push(capCrownMat, capBrimMat);

      const crownGeo = new THREE.SphereGeometry(0.0044, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.56);
      crownGeo.scale(1.04, 0.52, 1.12);
      disposables.push(crownGeo);
      const crownMesh = new THREE.Mesh(crownGeo, capCrownMat);
      crownMesh.castShadow = true;
      capGroup.add(crownMesh);

      const brimGeo = new THREE.CylinderGeometry(
        0.0042,
        0.0044,
        0.00036,
        20,
        1,
        false,
        Math.PI * 0.20,
        Math.PI * 0.60
      );
      brimGeo.rotateX(Math.PI * 0.5);
      brimGeo.scale(0.95, 0.95, 0.36);
      disposables.push(brimGeo);
      const brimMesh = new THREE.Mesh(brimGeo, capBrimMat);
      brimMesh.position.set(0, 0.0001, 0.0038);
      brimMesh.rotation.set(0.10, 0, 0);
      brimMesh.castShadow = true;
      capGroup.add(brimMesh);

      headBone.add(capGroup);
      attachedNodes.push({ parent: headBone, child: capGroup });
    }

    // Casual Work Shirt Collar, Vest Trim & "PROJECT OPERATOR" ID Badge
    const torsoBone = torsoBoneRef.current;
    if (torsoBone) {
      removeByNames(torsoBone, ['OperatorOutfit', 'OperatorBadge']);

      const shirtMat = new THREE.MeshStandardMaterial({ color: '#F8FAFC', roughness: 0.65 });
      const vestMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.78 });
      const badgeCasingMat = new THREE.MeshPhysicalMaterial({
        color: '#FFFFFF',
        roughness: 0.14,
        transmission: 0.6,
        transparent: true,
        opacity: 0.92,
      });
      const badgeFaceMat = new THREE.MeshBasicMaterial({ map: badgeTexture, transparent: true });
      disposables.push(shirtMat, vestMat, badgeCasingMat, badgeFaceMat);

      const outfitGroup = new THREE.Group();
      outfitGroup.name = 'OperatorOutfit';
      outfitGroup.position.set(0, 0.0068, 0.0028);

      const collarGeo = new THREE.BoxGeometry(0.0018, 0.0022, 0.00045);
      disposables.push(collarGeo);
      const lTab = new THREE.Mesh(collarGeo, shirtMat);
      lTab.position.set(-0.0012, 0.0004, 0.0009);
      lTab.rotation.set(0.08, 0.15, -0.36);
      outfitGroup.add(lTab);

      const rTab = new THREE.Mesh(collarGeo, shirtMat);
      rTab.position.set(0.0012, 0.0004, 0.0009);
      rTab.rotation.set(0.08, -0.15, 0.36);
      outfitGroup.add(rTab);

      const lapelGeo = new THREE.BoxGeometry(0.0013, 0.0056, 0.0004);
      disposables.push(lapelGeo);
      const lLapel = new THREE.Mesh(lapelGeo, vestMat);
      lLapel.position.set(-0.0024, -0.0028, 0.0008);
      lLapel.rotation.set(-0.06, 0.20, 0.05);
      outfitGroup.add(lLapel);

      const rLapel = new THREE.Mesh(lapelGeo, vestMat);
      rLapel.position.set(0.0024, -0.0028, 0.0008);
      rLapel.rotation.set(-0.06, -0.20, -0.05);
      outfitGroup.add(rLapel);

      torsoBone.add(outfitGroup);
      attachedNodes.push({ parent: torsoBone, child: outfitGroup });

      const badgeGroup = new THREE.Group();
      badgeGroup.name = 'OperatorBadge';
      badgeGroup.position.set(-0.0024, 0.0046, 0.0042);
      badgeGroup.rotation.set(-0.06, 0.16, 0.04);

      const casingGeo = new THREE.BoxGeometry(0.0020, 0.0028, 0.0002);
      const faceGeo = new THREE.PlaneGeometry(0.0018, 0.0026);
      disposables.push(casingGeo, faceGeo);

      badgeGroup.add(new THREE.Mesh(casingGeo, badgeCasingMat));
      const faceMesh = new THREE.Mesh(faceGeo, badgeFaceMat);
      faceMesh.position.set(0, 0, 0.00014);
      badgeGroup.add(faceMesh);

      torsoBone.add(badgeGroup);
      attachedNodes.push({ parent: torsoBone, child: badgeGroup });
    }

    // Operator Glove Cuffs
    const cuffMat = new THREE.MeshStandardMaterial({ color: '#F8FAFC', roughness: 0.6 });
    const trimMat = new THREE.MeshStandardMaterial({ color: '#D97706', roughness: 0.45 });
    const cuffGeo = new THREE.CylinderGeometry(0.00168, 0.00150, 0.0018, 16);
    const trimGeo = new THREE.TorusGeometry(0.00164, 0.00022, 8, 16);
    disposables.push(cuffMat, trimMat, cuffGeo, trimGeo);

    for (const side of ['L', 'R'] as const) {
      const lowerArm = bonesRef.current[`LowerArm${side}`];
      if (!lowerArm) continue;
      removeByNames(lowerArm, [`OperatorGloveCuff_${side}`]);

      const cuffGroup = new THREE.Group();
      cuffGroup.name = `OperatorGloveCuff_${side}`;
      cuffGroup.position.set(0, 0.0042, 0);

      cuffGroup.add(new THREE.Mesh(cuffGeo, cuffMat));
      const trim = new THREE.Mesh(trimGeo, trimMat);
      trim.rotation.x = Math.PI * 0.5;
      trim.position.set(0, -0.0005, 0);
      cuffGroup.add(trim);

      lowerArm.add(cuffGroup);
      attachedNodes.push({ parent: lowerArm, child: cuffGroup });
    }

    // Setup AnimationMixer with calm Idle breathing (~3.5s cycle) + synced Walk footsteps
    if (animations && animations.length > 0) {
      const mixer = new THREE.AnimationMixer(clonedScene);
      mixerRef.current = mixer;
      const idleClip = animations.find((c) => c.name.endsWith('Idle'));
      const walkClip = animations.find((c) => c.name.endsWith('Walk'));
      if (idleClip) {
        const a = mixer.clipAction(idleClip);
        a.reset().setEffectiveWeight(0.40).setEffectiveTimeScale(0.42).play();
        idleActionRef.current = a;
      }
      if (walkClip) {
        const w = mixer.clipAction(walkClip);
        w.reset().setEffectiveWeight(0.0).setEffectiveTimeScale(0.75).play();
        walkActionRef.current = w;
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

  // Cursor Glance & Wake-on-Click Listener on shared stage wrapper (never blocks DOM buttons!)
  useEffect(() => {
    const container = stageContainerRef.current;
    if (!container) return;

    const isPointerOverMonster = (nx: number, ny: number): boolean => {
      // Fast 3D raycast against monster character mesh + 2D world bounding envelope fallback
      _vPointerNdc.set(nx, ny);
      _raycaster.setFromCamera(_vPointerNdc, camera);
      if (monsterRootRef.current) {
        const hits = _raycaster.intersectObject(monsterRootRef.current, true);
        if (hits.length > 0) return true;
      }
      unprojectNdcToPlane(nx, ny, INTERACTION_PLANE_Z, _vClickWorld);
      const st = stateRef.current;
      const dx = Math.abs(_vClickWorld.x - st.stageX);
      const dy = _vClickWorld.y - -0.42;
      return dx <= 0.44 && dy >= -0.58 && dy <= 0.58;
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseRef.current.targetX = THREE.MathUtils.clamp(nx, -1, 1);
      mouseRef.current.targetY = THREE.MathUtils.clamp(ny, -1, 1);
      mouseRef.current.isHovering = true;

      // Show pointer cursor ONLY when monster is seated idle or sulking AND pointer is over monster body (not over buttons)
      const st = stateRef.current;
      const isIdleOrSulking =
        st.phase === 'sitting_idle' ||
        st.phase === 'completed_idle' ||
        st.phase === 'sulking_idle';
      const targetEl = e.target as HTMLElement | null;
      const isOverInteractiveUi = !!targetEl?.closest('button, a');
      if (isIdleOrSulking && !isOverInteractiveUi && isPointerOverMonster(nx, ny)) {
        container.style.cursor = 'pointer';
      } else if (container.style.cursor === 'pointer') {
        container.style.cursor = '';
      }
    };

    const onPointerLeave = () => {
      mouseRef.current.targetX = 0;
      mouseRef.current.targetY = 0;
      mouseRef.current.isHovering = false;
      if (container.style.cursor === 'pointer') {
        container.style.cursor = '';
      }
    };

    const onClick = (e: MouseEvent) => {
      // Never intercept or wake if user clicked a pagination button, prev/next button, or action link
      const targetEl = e.target as HTMLElement | null;
      if (targetEl?.closest('button, a')) return;

      const st = stateRef.current;
      // Wake/coax click ONLY works when monster is seated in idle or sulking_idle state (ignores clicks when already waking/walking/pressing)
      if (
        st.phase !== 'sitting_idle' &&
        st.phase !== 'completed_idle' &&
        st.phase !== 'sulking_idle'
      ) {
        return;
      }

      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      if (!isPointerOverMonster(nx, ny)) return;

      const lp = latestPropsRef.current;
      const targets = lp.getPaginationTargets();
      if (targets.length === 0) return;

      // Synchronize with current active pagination state and always continue from the button AFTER the user's current active page
      const currentDomIdx = targets.findIndex((t) => t.index === lp.activeProjectIdx);
      const startTargetIdx =
        st.pressedSequence.length === 0 && !st.isSulking && lp.activeProjectIdx === 0
          ? 0
          : currentDomIdx >= 0
            ? (currentDomIdx + 1) % targets.length
            : 0;

      st.wakeClickCount += 1;
      st.hasTriggeredOnce = true;
      st.sequenceCancelled = false;
      st.interruptionCount = 0;
      st.isAngry = false;
      st.isSulking = false;
      st.stompFootAmt = 0;
      st.currentRound = 0;
      st.completedRounds = 0;
      st.totalRoundsTarget = DEFAULT_TOTAL_ROUNDS;
      st.pressedInCurrentRound = 0;
      st.currentTargetIdx = startTargetIdx;
      st.pressedThisButton = false;
      st.phase = 'waking';
      st.phaseTime = 0;
      container.style.cursor = '';
    };

    container.addEventListener('pointermove', onPointerMove, { passive: true });
    container.addEventListener('pointerleave', onPointerLeave, { passive: true });
    container.addEventListener('click', onClick);
    return () => {
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerleave', onPointerLeave);
      container.removeEventListener('click', onClick);
      container.style.cursor = '';
    };
  }, [stageContainerRef, camera, unprojectNdcToPlane]);

  // Unified Frame Loop (60 FPS)
  useFrame((_, delta) => {
    const timeScale = window.__OPERATOR_TIME_SCALE__ ?? 1;
    const dt = window.__PAUSE_OPERATOR__ ? 0 : Math.min(delta, 0.05) * timeScale;
    const st = stateRef.current;
    const lp = latestPropsRef.current;
    st.totalTime += dt;

    // 1. Dynamically query current rendered DOM pagination buttons & sitting anchor
    const targets = lp.getPaginationTargets();
    const sitNdcX = lp.getSitAnchorNdcX();
    unprojectNdcToPlane(sitNdcX, -0.3, INTERACTION_PLANE_Z, _vSitWorld);
    const sitWorldX = THREE.MathUtils.clamp(_vSitWorld.x, -1.65, 0.25);

    if (!st.stageXInitialized) {
      st.stageX = sitWorldX;
      st.stageXInitialized = true;
    }

    // Clamp currentTargetIdx safely if projects were dynamically removed
    if (targets.length > 0 && st.currentTargetIdx >= targets.length) {
      st.currentTargetIdx = targets.length - 1;
    }

    // Compute exact world coordinates of the current target DOM button
    const curTarget = targets[st.currentTargetIdx] ?? targets[0] ?? { index: 0, ndcX: 0.2, ndcY: 0.72 };
    unprojectNdcToPlane(curTarget.ndcX, curTarget.ndcY, INTERACTION_PLANE_Z, _vBtnWorld);

    // 2. Section Activation Trigger: Wake up ONLY when Section 05 becomes active (never before!)
    if (!isActive) {
      // Clear any active DOM button highlight & pause safely if user left section mid-sequence
      lp.onPressVisualChange(null);
      if (mixerRef.current) mixerRef.current.update(dt);
      applyBodyLocomotionAndSitting(st.sitBlend, st.walkActivity, st.walkPhase);
      return;
    }

    if (!st.hasTriggeredOnce && !reducedMotion && targets.length > 0) {
      st.hasTriggeredOnce = true;
      st.sequenceCancelled = false;
      st.interruptionCount = 0;
      st.isAngry = false;
      st.isSulking = false;
      st.stompFootAmt = 0;
      st.phase = 'waking';
      st.phaseTime = 0;
      st.currentTargetIdx = 0;
      st.currentRound = 0;
      st.completedRounds = 0;
      st.totalRoundsTarget = DEFAULT_TOTAL_ROUNDS;
      st.pressedInCurrentRound = 0;
      st.pressedThisButton = false;
      st.pressedSequence = [];
    }

    // 3. Immediate Manual User Click Interruption & Target Synchronization:
    // Monster ALWAYS continues from the number AFTER the user's latest selected page!
    // Read activeProjectIdx directly from React props (not latestPropsRef which updates in a post-paint useEffect)
    if (manualTriggerVersion !== st.lastManualVersion) {
      st.lastManualVersion = manualTriggerVersion;
      st.pressedThisButton = false;
      lp.onPressVisualChange(null);

      // Compute exact next sequential pagination target after the user's selected page
      if (targets.length > 0) {
        const manualDomIdx = targets.findIndex((t) => t.index === activeProjectIdx);
        if (manualDomIdx >= 0) {
          st.currentTargetIdx = (manualDomIdx + 1) % targets.length;
        }
      }

      const isMonsterIdle =
        st.phase === 'sitting_idle' ||
        st.phase === 'completed_idle' ||
        st.phase === 'sulking_idle';

      // Count user interruptions ONLY when monster is actively working (never when idle or sulking)
      if (!isMonsterIdle && !st.isSulking) {
        st.interruptionCount += 1;
        const nextT = targets[st.currentTargetIdx] ?? targets[0];
        if (nextT) {
          unprojectNdcToPlane(nextT.ndcX, nextT.ndcY, INTERACTION_PLANE_Z, _vBtnWorld);
        }

        if (st.interruptionCount <= 2) {
          // Interruption 1 & 2: Brief natural notice toward newly selected pagination, then CONTINUE working!
          st.isAngry = false;
          if (st.phase !== 'waking' && st.phase !== 'standing_up') {
            st.sitBlend = 0;
            st.phase = 'interrupted_notice';
            st.phaseTime = 0;
          }
        } else if (st.interruptionCount === 3) {
          // Interruption 3: Expressive angry reaction (furrowed brow, foot stomp, head shake), then CONTINUE working if not interrupted again!
          st.isAngry = true;
          st.sitBlend = 0;
          st.phase = 'angry_react';
          st.phaseTime = 0;
        } else {
          // Interruption 4+: Monster gets fed up & sulks! Stops automatic task, turns away, walks home, and sits sulking
          st.isAngry = false;
          st.isSulking = true;
          st.sequenceCancelled = true;
          st.sitBlend = 0;
          st.phase = 'sulking_react';
          st.phaseTime = 0;
        }
      }
    }

    // 4. Advance Lifecycle State Machine (Calm, unhurried tempo with anticipation & follow-through)
    let targetWalkWeight = 0;
    let targetWalkActivity = 0;
    let desiredStageX = st.stageX;
    let desiredRootRotY = st.rootRotY;
    let desiredHeadPitch = 0.04;
    let desiredHeadYaw = 0;
    let desiredHeadRoll = 0;
    let desiredSitBlend = 0;
    let extraTorsoPitch = 0;
    let extraTorsoYaw = 0;
    st.stompFootAmt = 0;

    // Stop position beneath the target button scaled proportionally for MONSTER_SCALE = 0.56
    const btnStopOffsetX = st.activeHand === 'L' ? -0.18 : 0.18;
    const stopXForBtn = THREE.MathUtils.clamp(_vBtnWorld.x + btnStopOffsetX, -1.65, 1.65);

    if (!reducedMotion) {
      st.phaseTime += dt;

      if (st.phase === 'sitting_idle' || st.phase === 'completed_idle') {
        desiredSitBlend = 1.0;
        desiredStageX = sitWorldX;
        desiredRootRotY = 0.16;
        // Calm ~3.5-4s idle breathing & occasional gentle glance
        desiredHeadPitch = 0.06 + Math.sin(st.totalTime * 0.65) * 0.02;
        desiredHeadYaw = 0.08 + Math.sin(st.totalTime * 0.38) * 0.045;
      } else if (st.phase === 'sulking_idle') {
        // Seated sulking posture: hunched forward torso, head bowed down & turned away from pagination, occasional annoyed side-eye
        desiredSitBlend = 1.0;
        desiredStageX = sitWorldX;
        desiredRootRotY = -0.26;
        extraTorsoPitch = 0.14 + Math.sin(st.totalTime * 0.85) * 0.015;
        const sideGlance = Math.sin(st.totalTime * 0.72) > 0.72 ? 0.18 : -0.18;
        desiredHeadPitch = 0.16;
        desiredHeadYaw = sideGlance;
        desiredHeadRoll = -0.05;
      } else if (st.phase === 'interrupted_notice') {
        // Interruption 1 & 2: Brief natural notice toward newly selected pagination button, then resume working from next target!
        const p = easeInOutSine(st.phaseTime / DUR_INTERRUPTED_NOTICE);
        desiredSitBlend = 0;
        desiredStageX = st.stageX;
        const lookYaw = THREE.MathUtils.clamp((_vBtnWorld.x - st.stageX) * 0.55, -0.26, 0.26);
        desiredRootRotY = THREE.MathUtils.lerp(st.rootRotY, lookYaw * 0.65, p);
        desiredHeadYaw = lookYaw;
        desiredHeadPitch = -0.14;
        extraTorsoPitch = 0.03 * Math.sin(p * Math.PI);
        if (st.phaseTime >= DUR_INTERRUPTED_NOTICE) {
          st.activeHand = _vBtnWorld.x >= st.stageX ? 'L' : 'R';
          const nextStopX = THREE.MathUtils.clamp(
            _vBtnWorld.x + (st.activeHand === 'L' ? -0.18 : 0.18),
            -1.65,
            1.65
          );
          st.walkStartDist = Math.abs(nextStopX - st.stageX);
          st.pressedThisButton = false;
          st.phase = 'walking_to_btn';
          st.phaseTime = 0;
        }
      } else if (st.phase === 'angry_react') {
        // Interruption 3: Expressive angry reaction (furrowed/squinted eyes, head shake, foot stomp, hands on hips) -> then RESUME task!
        const p = THREE.MathUtils.clamp(st.phaseTime / DUR_ANGRY_REACT, 0, 1);
        desiredSitBlend = 0;
        desiredStageX = st.stageX;
        desiredRootRotY = 0.04;
        desiredHeadPitch = 0.12;
        desiredHeadYaw = Math.sin(p * Math.PI * 5) * 0.22 * (1 - p * 0.4);
        desiredHeadRoll = Math.sin(p * Math.PI * 3) * 0.06;
        extraTorsoPitch = 0.09 + Math.sin(p * Math.PI * 2) * 0.03;
        // Two expressive right-foot stomps during angry reaction
        st.stompFootAmt = Math.max(0, Math.sin(p * Math.PI * 3.5)) * (1 - p * 0.3);
        if (st.phaseTime >= DUR_ANGRY_REACT) {
          st.isAngry = false;
          st.stompFootAmt = 0;
          st.activeHand = _vBtnWorld.x >= st.stageX ? 'L' : 'R';
          const nextStopX = THREE.MathUtils.clamp(
            _vBtnWorld.x + (st.activeHand === 'L' ? -0.18 : 0.18),
            -1.65,
            1.65
          );
          st.walkStartDist = Math.abs(nextStopX - st.stageX);
          st.pressedThisButton = false;
          st.phase = 'walking_to_btn';
          st.phaseTime = 0;
        }
      } else if (st.phase === 'sulking_react') {
        // Interruption 4+: Monster gets fed up! Pulls hands in, bows head in frustration, turns away from pagination, then walks home to sulk
        const p = easeInOutSine(st.phaseTime / DUR_SULKING_REACT);
        desiredSitBlend = 0;
        desiredStageX = st.stageX;
        desiredRootRotY = THREE.MathUtils.lerp(st.rootRotY, -0.48, p);
        desiredHeadPitch = THREE.MathUtils.lerp(0.08, 0.17, p);
        desiredHeadYaw = THREE.MathUtils.lerp(0.0, -0.24, p);
        desiredHeadRoll = -0.06 * p;
        extraTorsoPitch = 0.12 * p;
        if (st.phaseTime >= DUR_SULKING_REACT) {
          st.walkStartDist = Math.abs(sitWorldX - st.stageX);
          st.phase = 'walking_home';
          st.phaseTime = 0;
        }
      } else if (st.phase === 'waking') {
        // Notice visitor gently, lift head, shift gaze smoothly toward pagination
        const p = easeInOutSine(st.phaseTime / DUR_WAKING);
        desiredSitBlend = 1.0;
        desiredStageX = sitWorldX;
        desiredRootRotY = THREE.MathUtils.lerp(0.16, 0.24, p);
        desiredHeadPitch = THREE.MathUtils.lerp(0.06, -0.16, p);
        desiredHeadYaw = THREE.MathUtils.lerp(0.08, 0.24, p);
        if (st.phaseTime >= DUR_WAKING) {
          st.phase = 'standing_up';
          st.phaseTime = 0;
        }
      } else if (st.phase === 'standing_up') {
        // Anticipation (0-22%): lean torso gently forward before pushing up smoothly via easeInOutCubic
        const rawP = THREE.MathUtils.clamp(st.phaseTime / DUR_STAND_UP, 0, 1);
        const riseP = rawP < 0.22 ? 0 : easeInOutCubic((rawP - 0.22) / 0.78);
        extraTorsoPitch = Math.sin(rawP * Math.PI) * 0.15; // Natural forward weight shift while rising
        desiredSitBlend = 1.0 - riseP;
        st.sitBlend = desiredSitBlend; // Direct curve adherence prevents end-of-phase snap
        desiredStageX = sitWorldX;
        desiredRootRotY = THREE.MathUtils.lerp(0.24, 0.32, riseP);
        desiredHeadPitch = THREE.MathUtils.lerp(-0.16, -0.10, riseP);
        desiredHeadYaw = 0.22;
        if (st.phaseTime >= DUR_STAND_UP) {
          st.sitBlend = 0;
          st.activeHand = _vBtnWorld.x >= st.stageX ? 'L' : 'R';
          const nextStopX = THREE.MathUtils.clamp(
            _vBtnWorld.x + (st.activeHand === 'L' ? -0.18 : 0.18),
            -1.65,
            1.65
          );
          st.walkStartDist = Math.abs(nextStopX - st.stageX);
          st.phase = 'prep_walk';
          st.phaseTime = 0;
        }
      } else if (st.phase === 'prep_walk') {
        // Turn body cleanly to face the direction of travel (+X right or -X left) before stepping
        const p = easeInOutSine(st.phaseTime / DUR_PREP_WALK);
        desiredSitBlend = 0;
        desiredStageX = st.stageX;
        const dx = stopXForBtn - st.stageX;
        const dirSign = Math.sign(dx) || 1;
        // Full right/left profile turn (+1.18 rad = ~68°) for long walks; diagonal turn (+0.86 rad = ~49°) for short steps
        const targetWalkYaw = dirSign * (st.walkStartDist > 0.35 ? 1.18 : 0.86);
        desiredRootRotY = THREE.MathUtils.lerp(0.32, targetWalkYaw, p);
        desiredHeadYaw = THREE.MathUtils.lerp(0.22, dirSign * 0.12, p);
        desiredHeadPitch = -0.10;
        extraTorsoPitch = Math.sin(p * Math.PI) * 0.045;
        targetWalkActivity = p * 0.25; // Gentle weight transfer into first step
        if (st.phaseTime >= DUR_PREP_WALK) {
          st.phase = 'walking_to_btn';
          st.phaseTime = 0;
        }
      } else if (st.phase === 'walking_to_btn') {
        desiredSitBlend = 0;
        const dx = stopXForBtn - st.stageX;
        const dist = Math.abs(dx);
        const dirSign = Math.sign(dx) || 1;
        if (dist > 0.022) {
          // Smooth ease-in at walk start & soft deceleration as approaching target (zero abrupt stop)
          const accel = easeInOutSine(Math.min(1, st.phaseTime / 0.32));
          const decel = easeInOutSine(Math.min(1, dist / 0.28));
          const speedFactor = THREE.MathUtils.clamp(Math.min(accel, decel), 0.30, 1.0);
          const step = Math.min(dist, WALK_SPEED * speedFactor * dt);
          st.stageX += dirSign * step;
          desiredStageX = st.stageX;

          // Advance stride cycle directly proportional to horizontal distance traveled (zero foot sliding!)
          st.walkPhase += (step / 0.145) * Math.PI;
          targetWalkActivity = THREE.MathUtils.clamp(speedFactor * 1.15, 0.42, 1.0);
          targetWalkWeight = 0.72 * speedFactor;

          // True directional facing (+1.18 rad right / -1.18 rad left), turning smoothly toward button in final 0.16m
          const fullWalkYaw = dirSign * (st.walkStartDist > 0.35 ? 1.18 : 0.86);
          const arrivalTurnT = dist < 0.16 ? 1.0 - dist / 0.16 : 0.0;
          const btnFacingYaw = THREE.MathUtils.clamp((_vBtnWorld.x - st.stageX) * 0.45, -0.22, 0.22);
          desiredRootRotY = THREE.MathUtils.lerp(fullWalkYaw, btnFacingYaw, easeInOutSine(arrivalTurnT));
          desiredHeadYaw = THREE.MathUtils.lerp(dirSign * 0.12, btnFacingYaw, arrivalTurnT);
          desiredHeadPitch = -0.10;
          extraTorsoPitch = 0.045 * speedFactor;
        } else {
          st.stageX = stopXForBtn;
          desiredStageX = stopXForBtn;
          targetWalkWeight = 0;
          targetWalkActivity = 0;
          st.pressedThisButton = false;
          st.phase = 'raising_hand';
          st.phaseTime = 0;
        }
      } else if (st.phase === 'raising_hand') {
        const p = easeInOutCubic(st.phaseTime / DUR_RAISE_HAND);
        desiredSitBlend = 0;
        desiredStageX = stopXForBtn;
        const btnFacingYaw = THREE.MathUtils.clamp((_vBtnWorld.x - st.stageX) * 0.45, -0.22, 0.22);
        desiredRootRotY = btnFacingYaw;
        st.pressYaw = btnFacingYaw;
        desiredHeadPitch = THREE.MathUtils.lerp(-0.12, -0.22, p);
        desiredHeadYaw = THREE.MathUtils.clamp((_vBtnWorld.x - st.stageX) * 0.55, -0.24, 0.24);
        extraTorsoPitch = -0.035 * p; // Slight chest lift as arm reaches up
        extraTorsoYaw = (st.activeHand === 'L' ? -0.06 : 0.06) * p; // Natural upper-torso follow toward active arm
        if (st.phaseTime >= DUR_RAISE_HAND) {
          st.phase = 'pressing';
          st.phaseTime = 0;
        }
      } else if (st.phase === 'pressing') {
        desiredSitBlend = 0;
        desiredStageX = stopXForBtn;
        const btnFacingYaw = THREE.MathUtils.clamp((_vBtnWorld.x - st.stageX) * 0.45, -0.22, 0.22);
        desiredRootRotY = btnFacingYaw;
        st.pressYaw = btnFacingYaw;
        desiredHeadPitch = -0.24;
        desiredHeadYaw = THREE.MathUtils.clamp((_vBtnWorld.x - st.stageX) * 0.55, -0.24, 0.24);
        extraTorsoPitch = -0.03;
        extraTorsoYaw = st.activeHand === 'L' ? -0.06 : 0.06;

        // Fire real DOM pagination click ONCE at exact peak finger contact (p = 0.48)
        if (!st.pressedThisButton && st.phaseTime >= DUR_PRESS * 0.48) {
          st.pressedThisButton = true;
          if (targets[st.currentTargetIdx]) {
            const targetBtnIndex = curTarget.index;
            st.pressedSequence.push(targetBtnIndex);
            st.pressedInCurrentRound += 1;
            lp.onPressVisualChange(targetBtnIndex);
            lp.onPressButton(targetBtnIndex);
          }
        }
        if (st.phaseTime >= DUR_PRESS) {
          lp.onPressVisualChange(null);
          st.phase = 'retracting';
          st.phaseTime = 0;
        }
      } else if (st.phase === 'retracting') {
        const p = easeInOutSine(st.phaseTime / DUR_RETRACT);
        desiredSitBlend = 0;
        desiredStageX = stopXForBtn;
        // Interpolate cleanly from saved st.pressYaw (zero discontinuity snap!)
        desiredRootRotY = THREE.MathUtils.lerp(st.pressYaw, 0.14, p);
        desiredHeadYaw = THREE.MathUtils.lerp(st.pressYaw, 0.18, p); // Smooth glance toward newly switched preview
        desiredHeadPitch = THREE.MathUtils.lerp(-0.22, -0.06, p);
        extraTorsoYaw = (st.activeHand === 'L' ? -0.06 : 0.06) * (1 - p);
        if (st.phaseTime >= DUR_RETRACT) {
          st.phase = 'pause_between';
          st.phaseTime = 0;
        }
      } else if (st.phase === 'pause_between') {
        desiredSitBlend = 0;
        desiredStageX = stopXForBtn;
        desiredRootRotY = 0.14;
        desiredHeadYaw = 0.16;
        desiredHeadPitch = -0.05;

        if (st.phaseTime >= DUR_PAUSE_BETWEEN) {
          if (st.sequenceCancelled || targets.length === 0) {
            st.walkStartDist = Math.abs(sitWorldX - st.stageX);
            st.phase = 'walking_home';
            st.phaseTime = 0;
          } else if (st.pressedInCurrentRound < targets.length) {
            // Advance to next dynamic pagination button in the current round
            st.currentTargetIdx = (st.currentTargetIdx + 1) % targets.length;
            const nextT = targets[st.currentTargetIdx];
            unprojectNdcToPlane(nextT.ndcX, nextT.ndcY, INTERACTION_PLANE_Z, _vBtnWorld);
            st.activeHand = _vBtnWorld.x >= st.stageX ? 'L' : 'R';
            const nextStopX = THREE.MathUtils.clamp(
              _vBtnWorld.x + (st.activeHand === 'L' ? -0.18 : 0.18),
              -1.65,
              1.65
            );
            st.walkStartDist = Math.abs(nextStopX - st.stageX);
            st.pressedThisButton = false;
            st.phase = 'walking_to_btn';
            st.phaseTime = 0;
          } else {
            // Current round finished ONLY after all actual pagination targets were successfully pressed
            st.completedRounds += 1;
            if (st.completedRounds < st.totalRoundsTarget) {
              // Start next round seamlessly from the next sequential pagination target (01 -> 02 -> ... -> 0N)
              st.currentRound += 1;
              st.pressedInCurrentRound = 0;
              st.currentTargetIdx = (st.currentTargetIdx + 1) % targets.length;
              const nextT = targets[st.currentTargetIdx];
              unprojectNdcToPlane(nextT.ndcX, nextT.ndcY, INTERACTION_PLANE_Z, _vBtnWorld);
              st.activeHand = _vBtnWorld.x >= st.stageX ? 'L' : 'R';
              const nextStopX = THREE.MathUtils.clamp(
                _vBtnWorld.x + (st.activeHand === 'L' ? -0.18 : 0.18),
                -1.65,
                1.65
              );
              st.walkStartDist = Math.abs(nextStopX - st.stageX);
              st.pressedThisButton = false;
              st.phase = 'walking_to_btn';
              st.phaseTime = 0;
            } else {
              // All 3 rounds completed! Reset interruption counter cleanly and transition to finishing_react -> walk_home -> sit_down -> idle
              st.interruptionCount = 0;
              st.isAngry = false;
              st.isSulking = false;
              st.phase = 'finishing_react';
              st.phaseTime = 0;
            }
          }
        }
      } else if (st.phase === 'finishing_react' || st.phase === 'manual_react') {
        const dur = st.phase === 'finishing_react' ? DUR_FINISHING_REACT : DUR_MANUAL_REACT;
        const p = st.phaseTime / dur;
        desiredSitBlend = 0;
        desiredStageX = st.stageX;
        desiredRootRotY = 0.20;
        desiredHeadYaw = 0.22;
        desiredHeadPitch = -0.04 + Math.sin(p * Math.PI * 2) * 0.055;
        desiredHeadRoll = 0.045;
        if (st.phaseTime >= dur) {
          st.walkStartDist = Math.abs(sitWorldX - st.stageX);
          st.phase = 'walking_home';
          st.phaseTime = 0;
        }
      } else if (st.phase === 'walking_home') {
        desiredSitBlend = 0;
        const dx = sitWorldX - st.stageX;
        const dist = Math.abs(dx);
        const dirSign = Math.sign(dx) || -1;
        if (dist > 0.022) {
          const accel = easeInOutSine(Math.min(1, st.phaseTime / 0.35));
          const decel = easeInOutSine(Math.min(1, dist / 0.35));
          const speedFactor = THREE.MathUtils.clamp(Math.min(accel, decel), 0.30, 1.0);
          const step = Math.min(dist, WALK_SPEED * speedFactor * dt);
          st.stageX += dirSign * step;
          desiredStageX = st.stageX;

          // Distance-driven stride cycle back to home seat
          st.walkPhase += (step / 0.145) * Math.PI;
          targetWalkActivity = THREE.MathUtils.clamp(speedFactor * 1.15, 0.42, 1.0);
          targetWalkWeight = 0.72 * speedFactor;

          // True leftward facing (-1.18 rad = -68°) when walking home to the left, turning forward in final 0.22m
          const fullHomeYaw = dirSign * 1.18;
          const arrivalTurnT = dist < 0.22 ? 1.0 - dist / 0.22 : 0.0;
          const endYaw = st.isSulking ? -0.26 : 0.08;
          desiredRootRotY = THREE.MathUtils.lerp(fullHomeYaw, endYaw, easeInOutSine(arrivalTurnT));
          desiredHeadYaw = THREE.MathUtils.lerp(dirSign * 0.12, st.isSulking ? -0.18 : 0.06, arrivalTurnT);
          desiredHeadPitch = st.isSulking ? 0.14 : 0.02;
          extraTorsoPitch = (st.isSulking ? 0.11 : 0.045) * speedFactor;
        } else {
          st.stageX = sitWorldX;
          desiredStageX = sitWorldX;
          targetWalkWeight = 0;
          targetWalkActivity = 0;
          st.phase = 'sitting_down';
          st.phaseTime = 0;
        }
      } else if (st.phase === 'sitting_down') {
        const p = easeInOutCubic(st.phaseTime / DUR_SIT_DOWN);
        extraTorsoPitch = st.isSulking ? 0.14 : Math.sin(p * Math.PI) * 0.11;
        desiredSitBlend = p;
        st.sitBlend = desiredSitBlend; // Direct curve adherence
        desiredStageX = sitWorldX;
        desiredRootRotY = st.isSulking ? -0.26 : THREE.MathUtils.lerp(0.08, 0.16, p);
        desiredHeadPitch = st.isSulking ? 0.16 : THREE.MathUtils.lerp(0.02, 0.06, p);
        desiredHeadYaw = st.isSulking ? -0.18 : THREE.MathUtils.lerp(0.06, 0.08, p);
        if (st.phaseTime >= DUR_SIT_DOWN) {
          st.sitBlend = 1.0;
          if (st.isSulking) {
            st.phase = 'sulking_idle';
          } else {
            st.interruptionCount = 0;
            st.isAngry = false;
            st.phase = 'completed_idle';
          }
          st.phaseTime = 0;
        }
      }
    }

    // 5. Update Idle/Walk AnimationMixer weights & smooth locomotion activity blend
    st.walkWeight = THREE.MathUtils.damp(st.walkWeight, targetWalkWeight, 8.0, dt);
    st.walkActivity = THREE.MathUtils.damp(st.walkActivity, targetWalkActivity, 9.5, dt);
    if (idleActionRef.current) {
      idleActionRef.current.setEffectiveWeight(THREE.MathUtils.lerp(0.36, 0.06, st.walkActivity));
    }
    if (walkActionRef.current) {
      walkActionRef.current.setEffectiveWeight(st.walkWeight * 0.45);
    }
    if (mixerRef.current) {
      mixerRef.current.update(dt);
    }

    // 6. Apply Smooth Position, Facing Rotation, Stride Locomotion, Sitting Posture & Clamped Head
    if (st.phase !== 'walking_to_btn' && st.phase !== 'walking_home') {
      st.stageX = THREE.MathUtils.damp(st.stageX, desiredStageX, 5.5, dt);
    }
    if (st.phase !== 'standing_up' && st.phase !== 'sitting_down') {
      st.sitBlend = THREE.MathUtils.damp(st.sitBlend, desiredSitBlend, 7.5, dt);
    }
    // Faster, natural yaw turn responsiveness when rotating into/out of walk direction
    const rotDamp =
      st.phase === 'prep_walk' || st.phase === 'walking_to_btn' || st.phase === 'walking_home'
        ? 7.5
        : 5.5;
    st.rootRotY = THREE.MathUtils.damp(st.rootRotY, desiredRootRotY, rotDamp, dt);

    if (stageGroupRef.current) {
      stageGroupRef.current.position.x = st.stageX;
    }
    if (monsterRootRef.current) {
      monsterRootRef.current.rotation.y = st.rootRotY;
    }

    applyBodyLocomotionAndSitting(
      st.sitBlend,
      st.walkActivity,
      st.walkPhase,
      extraTorsoPitch,
      extraTorsoYaw,
      st.stompFootAmt
    );

    // Subtle cursor glance only when seated calmly idle (never overrides pressing, walking, angry, or sulking)
    const mouse = mouseRef.current;
    mouse.x = THREE.MathUtils.damp(mouse.x, mouse.targetX, 3.0, dt);
    mouse.y = THREE.MathUtils.damp(mouse.y, mouse.targetY, 3.0, dt);
    if ((st.phase === 'sitting_idle' || st.phase === 'completed_idle') && mouse.isHovering) {
      desiredHeadYaw = THREE.MathUtils.clamp(mouse.x * 0.20, -0.22, 0.22);
      desiredHeadPitch = THREE.MathUtils.clamp(-mouse.y * 0.12, -0.16, 0.14);
    }

    if (neckBoneRef.current && restQuatsRef.current['Neck']) {
      neckBoneRef.current.quaternion.copy(restQuatsRef.current['Neck']);
    }
    st.headPitch = THREE.MathUtils.damp(st.headPitch, THREE.MathUtils.clamp(desiredHeadPitch, -0.26, 0.22), 4.5, dt);
    st.headYaw = THREE.MathUtils.damp(st.headYaw, THREE.MathUtils.clamp(desiredHeadYaw, -0.28, 0.28), 4.5, dt);
    st.headRoll = THREE.MathUtils.damp(st.headRoll, THREE.MathUtils.clamp(desiredHeadRoll, -0.09, 0.09), 4.5, dt);
    applyCharSpaceDelta('Head', st.headPitch, st.headYaw, st.headRoll, 'YXZ');

    // 7. Eyes (Calm Blinking, Angry Brow Furrow, Sulking Squint & Spherical Gaze)
    const lids = eyeLidsRef.current;
    const pupils = eyePupilsRef.current;
    const isBlink = Math.sin(st.totalTime * 1.45) > 0.985 || st.totalTime % 4.0 < 0.13;
    const isHappySquint = st.phase === 'finishing_react' || st.phase === 'manual_react';
    const isAngrySquint = st.phase === 'angry_react' || st.isAngry;
    const isSulkingSquint = st.phase === 'sulking_react' || st.phase === 'sulking_idle' || st.isSulking;
    const targetBlink = isAngrySquint
      ? 0.72
      : isSulkingSquint
        ? 0.64
        : isHappySquint
          ? 0.55
          : isBlink
            ? 1.0
            : 0.0;
    blinkAmountRef.current = THREE.MathUtils.damp(blinkAmountRef.current, targetBlink, 18, dt);

    if (lids) {
      const upperX = THREE.MathUtils.lerp(-1.55, 0.10, blinkAmountRef.current);
      const lowerX = THREE.MathUtils.lerp(1.50, -0.08, blinkAmountRef.current);
      const angrySlant = isAngrySquint ? 0.34 : isSulkingSquint ? 0.20 : 0.0;
      lids.leftUpper.rotation.x = upperX;
      lids.leftLower.rotation.x = lowerX;
      lids.rightUpper.rotation.x = upperX;
      lids.rightLower.rotation.x = lowerX;
      lids.leftUpper.rotation.z = THREE.MathUtils.damp(lids.leftUpper.rotation.z, -angrySlant, 12, dt);
      lids.rightUpper.rotation.z = THREE.MathUtils.damp(lids.rightUpper.rotation.z, angrySlant, 12, dt);
    }
    if (pupils) {
      const gazeYaw = THREE.MathUtils.clamp(st.headYaw * 0.85, -0.24, 0.24);
      const gazePitch = THREE.MathUtils.clamp(st.headPitch * 0.75, -0.20, 0.18);
      pupils.leftPupil.rotation.y = THREE.MathUtils.damp(pupils.leftPupil.rotation.y, gazeYaw, 8, dt);
      pupils.leftPupil.rotation.x = THREE.MathUtils.damp(pupils.leftPupil.rotation.x, gazePitch, 8, dt);
      pupils.rightPupil.rotation.y = THREE.MathUtils.damp(pupils.rightPupil.rotation.y, gazeYaw, 8, dt);
      pupils.rightPupil.rotation.x = THREE.MathUtils.damp(pupils.rightPupil.rotation.x, gazePitch, 8, dt);
    }

    // 8. Compute Hand IK Targets (Proportional for MONSTER_SCALE = 0.56 at stageY = -0.82)
    const restY = THREE.MathUtils.lerp(-0.20, -0.48, st.sitBlend);
    const restZ = THREE.MathUtils.lerp(0.22, 0.30, st.sitBlend);
    const restSpread = THREE.MathUtils.lerp(0.32, 0.24, st.sitBlend);

    _vLeftTarget.set(st.stageX + restSpread, restY, restZ);
    _vRightTarget.set(st.stageX - restSpread, restY, restZ);
    let leftPose: HandPose = 'relaxed';
    let rightPose: HandPose = 'relaxed';
    let leftTwist = 0;
    let rightTwist = 0;

    if (st.phase === 'angry_react') {
      // Frustrated operator gesture: hands akimbo / slightly clenched at sides with emphatic pulse
      const p = st.phaseTime / DUR_ANGRY_REACT;
      const pulse = Math.sin(p * Math.PI * 3.5) * 0.045;
      _vLeftTarget.set(st.stageX + 0.34, -0.08 + pulse, 0.28);
      _vRightTarget.set(st.stageX - 0.34, -0.08 - pulse, 0.28);
      leftPose = 'headsetTouch';
      rightPose = 'headsetTouch';
      leftTwist = -0.35;
      rightTwist = 0.35;
    } else if (st.phase === 'sulking_react' || st.phase === 'sulking_idle') {
      // Sulking crossed/tucked arms tightly across lap/chest
      const tuckY = THREE.MathUtils.lerp(-0.14, -0.42, st.sitBlend);
      const tuckZ = THREE.MathUtils.lerp(0.28, 0.33, st.sitBlend);
      _vLeftTarget.set(st.stageX + 0.11, tuckY, tuckZ);
      _vRightTarget.set(st.stageX - 0.11, tuckY, tuckZ);
      leftPose = 'headsetTouch';
      rightPose = 'headsetTouch';
      leftTwist = -0.40;
      rightTwist = 0.40;
    } else if (st.phase === 'raising_hand') {
      const p = easeInOutCubic(st.phaseTime / DUR_RAISE_HAND);
      // Slight gentle arc outward as arm lifts naturally
      const arcOut = Math.sin(p * Math.PI) * 0.06;
      if (st.activeHand === 'L') {
        _vLeftTarget.set(
          THREE.MathUtils.lerp(st.stageX + restSpread, _vBtnWorld.x, p) + arcOut,
          THREE.MathUtils.lerp(restY, _vBtnWorld.y - 0.05, p),
          THREE.MathUtils.lerp(restZ, INTERACTION_PLANE_Z - 0.05, p)
        );
        leftPose = p > 0.35 ? 'buttonPress' : 'relaxed';
        leftTwist = -0.22 * p;
      } else {
        _vRightTarget.set(
          THREE.MathUtils.lerp(st.stageX - restSpread, _vBtnWorld.x, p) - arcOut,
          THREE.MathUtils.lerp(restY, _vBtnWorld.y - 0.05, p),
          THREE.MathUtils.lerp(restZ, INTERACTION_PLANE_Z - 0.05, p)
        );
        rightPose = p > 0.35 ? 'buttonPress' : 'relaxed';
        rightTwist = 0.22 * p;
      }
    } else if (st.phase === 'pressing') {
      const rawP = THREE.MathUtils.clamp(st.phaseTime / DUR_PRESS, 0, 1);
      // Anticipation pull-back (0..0.22) -> deliberate press onto button (0.22..0.58) -> soft follow-through (0.58..1.0)
      let pressAmt: number;
      if (rawP < 0.22) {
        pressAmt = -0.22 * easeInOutSine(rawP / 0.22);
      } else if (rawP < 0.58) {
        pressAmt = THREE.MathUtils.lerp(-0.22, 1.0, easeInOutCubic((rawP - 0.22) / 0.36));
      } else {
        pressAmt = THREE.MathUtils.lerp(1.0, 0.0, easeInOutSine((rawP - 0.58) / 0.42));
      }
      if (st.activeHand === 'L') {
        _vLeftTarget.set(
          _vBtnWorld.x,
          _vBtnWorld.y - 0.045 + pressAmt * 0.05,
          INTERACTION_PLANE_Z - 0.045 + pressAmt * 0.065
        );
        leftPose = 'buttonPress';
        leftTwist = -0.22;
      } else {
        _vRightTarget.set(
          _vBtnWorld.x,
          _vBtnWorld.y - 0.045 + pressAmt * 0.05,
          INTERACTION_PLANE_Z - 0.045 + pressAmt * 0.065
        );
        rightPose = 'buttonPress';
        rightTwist = 0.22;
      }
    } else if (st.phase === 'retracting') {
      const p = easeInOutSine(st.phaseTime / DUR_RETRACT);
      if (st.activeHand === 'L') {
        _vLeftTarget.set(
          THREE.MathUtils.lerp(_vBtnWorld.x, st.stageX + restSpread, p),
          THREE.MathUtils.lerp(_vBtnWorld.y - 0.05, restY + 0.08, p),
          THREE.MathUtils.lerp(INTERACTION_PLANE_Z - 0.04, restZ, p)
        );
        leftPose = p < 0.4 ? 'buttonPress' : 'relaxed';
      } else {
        _vRightTarget.set(
          THREE.MathUtils.lerp(_vBtnWorld.x, st.stageX - restSpread, p),
          THREE.MathUtils.lerp(_vBtnWorld.y - 0.05, restY + 0.08, p),
          THREE.MathUtils.lerp(INTERACTION_PLANE_Z - 0.04, restZ, p)
        );
        rightPose = p < 0.4 ? 'buttonPress' : 'relaxed';
      }
    } else if (st.phase === 'finishing_react' || st.phase === 'manual_react') {
      const dur = st.phase === 'finishing_react' ? DUR_FINISHING_REACT : DUR_MANUAL_REACT;
      const p = st.phaseTime / dur;
      _vLeftTarget.set(st.stageX + 0.36, 0.24 + Math.sin(p * Math.PI) * 0.10, 0.30);
      leftPose = 'proudWave';
    }

    // 9. Continuous Arm Locomotion & IK Blending (Zero hard cutoff at 0.35, zero hand scale popping, zero arm whipping!)
    // Always keep hand targets tracking st.stageX every frame so transitioning from walk -> raise_hand never whips from stale coordinates
    const ht = handTargetsRef.current;
    const k = 1 - Math.exp(-12 * dt);
    ht.left.lerp(_vLeftTarget, k);
    ht.right.lerp(_vRightTarget, k);

    const ikWeight = THREE.MathUtils.clamp(1.0 - st.walkActivity, 0, 1);
    const bones = bonesRef.current;

    // 9a. Compute natural counter-swinging walk arm pose (Left arm swings opposite to left leg; Right arm opposite to right leg)
    const armSwingL = Math.sin(st.walkPhase) * 0.44 * st.walkActivity;
    const armSwingR = Math.sin(st.walkPhase + Math.PI) * 0.44 * st.walkActivity;
    const elbowWalkFlexL = (-0.36 - Math.max(0, -Math.sin(st.walkPhase)) * 0.24) * st.walkActivity;
    const elbowWalkFlexR = (-0.36 - Math.max(0, -Math.sin(st.walkPhase + Math.PI)) * 0.24) * st.walkActivity;

    applyCharSpaceDelta('ShoulderL', 0, -armSwingL * 0.16, 0.08 * st.walkActivity, 'YXZ');
    applyCharSpaceDelta('UpperArmL', armSwingL, 0, 0.22, 'YXZ');
    applyCharSpaceDelta('LowerArmL', elbowWalkFlexL, 0, 0, 'YXZ');
    if (bones['ShoulderL']) _qWalkShoulderL.copy(bones['ShoulderL'].quaternion);
    if (bones['UpperArmL']) _qWalkUpperArmL.copy(bones['UpperArmL'].quaternion);
    if (bones['LowerArmL']) _qWalkLowerArmL.copy(bones['LowerArmL'].quaternion);

    applyCharSpaceDelta('ShoulderR', 0, armSwingR * 0.16, -0.08 * st.walkActivity, 'YXZ');
    applyCharSpaceDelta('UpperArmR', armSwingR, 0, -0.22, 'YXZ');
    applyCharSpaceDelta('LowerArmR', elbowWalkFlexR, 0, 0, 'YXZ');
    if (bones['ShoulderR']) _qWalkShoulderR.copy(bones['ShoulderR'].quaternion);
    if (bones['UpperArmR']) _qWalkUpperArmR.copy(bones['UpperArmR'].quaternion);
    if (bones['LowerArmR']) _qWalkLowerArmR.copy(bones['LowerArmR'].quaternion);

    // 9b. Solve 2-Bone Analytical Arm IK and smoothly slerp from walk-swing pose by ikWeight (0..1)
    if (ikWeight > 0.002) {
      solveArmIK('L', ht.left, new THREE.Vector3(0.85, -0.25, -0.45), leftTwist, _vLeftPalmWorld);
      solveArmIK('R', ht.right, new THREE.Vector3(-0.85, -0.25, -0.45), rightTwist, _vRightPalmWorld);

      // Subtle natural clavicle/shoulder elevation when raising active arm to press pagination button
      if (
        st.phase === 'raising_hand' ||
        st.phase === 'pressing' ||
        st.phase === 'retracting'
      ) {
        const liftP =
          st.phase === 'raising_hand'
            ? easeInOutCubic(st.phaseTime / DUR_RAISE_HAND)
            : st.phase === 'pressing'
              ? 1.0
              : 1.0 - easeInOutSine(st.phaseTime / DUR_RETRACT);
        if (st.activeHand === 'L') {
          applyCharSpaceDelta('ShoulderL', -0.06 * liftP, -0.08 * liftP, -0.12 * liftP, 'YXZ');
        } else {
          applyCharSpaceDelta('ShoulderR', -0.06 * liftP, 0.08 * liftP, 0.12 * liftP, 'YXZ');
        }
      }

      if (ikWeight < 0.998) {
        if (bones['ShoulderL']) bones['ShoulderL'].quaternion.slerp(_qWalkShoulderL, 1 - ikWeight);
        if (bones['UpperArmL']) bones['UpperArmL'].quaternion.slerp(_qWalkUpperArmL, 1 - ikWeight);
        if (bones['LowerArmL']) bones['LowerArmL'].quaternion.slerp(_qWalkLowerArmL, 1 - ikWeight);
        if (bones['ShoulderR']) bones['ShoulderR'].quaternion.slerp(_qWalkShoulderR, 1 - ikWeight);
        if (bones['UpperArmR']) bones['UpperArmR'].quaternion.slerp(_qWalkUpperArmR, 1 - ikWeight);
        if (bones['LowerArmR']) bones['LowerArmR'].quaternion.slerp(_qWalkLowerArmR, 1 - ikWeight);
        if (monsterRootRef.current) monsterRootRef.current.updateMatrixWorld(true);
      }
    }

    // 9c. Always apply hand finger articulation & HAND_SCALE = 0.80 every frame (never pops during walk!)
    applyHandPose('L', leftPose);
    applyHandPose('R', rightPose);

    // Measure live hand-to-button distance (cm) for automated Stick-to-Button verification
    const activePalm = st.activeHand === 'L' ? _vLeftPalmWorld : _vRightPalmWorld;
    const errCm = activePalm.distanceTo(_vBtnWorld) * 100;

    window.__OPERATOR_STATE__ = {
      loaded: true,
      phase: st.phase,
      sitBlend: Number(st.sitBlend.toFixed(2)),
      walkActivity: Number(st.walkActivity.toFixed(2)),
      walkPhase: Number(st.walkPhase.toFixed(2)),
      rootRotY: Number(st.rootRotY.toFixed(3)),
      currentRound: st.currentRound + 1,
      completedRounds: st.completedRounds,
      totalRoundsTarget: st.totalRoundsTarget,
      interruptionCount: st.interruptionCount,
      isAngry: st.isAngry,
      isSulking: st.isSulking,
      wakeClickCount: st.wakeClickCount,
      activeProjectIdx,
      currentTargetIdx: st.currentTargetIdx,
      buttonCount: targets.length,
      pressedSequence: [...st.pressedSequence],
      stageX: Number(st.stageX.toFixed(3)),
      activeHand: st.activeHand,
      eyeMountCount: eyeMountCountRef.current,
      handToButtonErrorCm: Number(errCm.toFixed(1)),
      headYaw: Number(st.headYaw.toFixed(3)),
      headPitch: Number(st.headPitch.toFixed(3)),
    };
  });

  return (
    <group ref={stageGroupRef} position={[-0.95, -0.82, 0]}>
      <group ref={monsterRootRef} position={[0, 0, 0]} scale={MONSTER_SCALE}>
        <primitive object={clonedScene} />
      </group>
    </group>
  );
};

useGLTF.preload(MODEL_PATH);
