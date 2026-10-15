import { useFrame } from '@react-three/fiber'
import {
  useMemo,
  useRef,
} from 'react'
import {
  BackSide,
  Curve,
  DoubleSide,
  MathUtils,
  Vector3,
} from 'three'
import {
  EXPERIENCE_STATES,
  useExperienceState,
} from '../../state/experienceMachine'
import { getDomeOpeningState } from '../../data/domeOpeningTimeline'

const ROOM_RADIUS = 6
const WALL_HEIGHT = 4.6
const DOME_RADIUS = ROOM_RADIUS

/*
 * The dome opens as two rigid roof assemblies
 * rotating around fixed exterior hinge axes.
 *
 * 88 degrees creates a very large central
 * aperture. The roof halves become nearly
 * vertical while remaining mechanically attached
 * to the exterior hinge points.
 */
const DOME_OPEN_ANGLE = MathUtils.degToRad(88)

/*
 * Meridian ribs distributed across each roof half.
 *
 * Every rib uses the exact same spherical radius
 * as the shell and remains a child of that same
 * rigid roof assembly.
 */
const RIB_ANGLES = [
  0,
  Math.PI / 6,
  Math.PI / 3,
  Math.PI / 2,
  (Math.PI * 2) / 3,
  (Math.PI * 5) / 6,
  Math.PI,
]

class DomeMeridianCurve extends Curve {
  constructor(
    radius,
    azimuth,
  ) {
    super()

    this.radius = radius
    this.azimuth = azimuth
  }

  getPoint(
    t,
    target = new Vector3(),
  ) {
    /*
     * Move from the apex toward the base
     * along the spherical surface.
     *
     * We stop fractionally before theta = 0
     * so the tube never collapses into a
     * degenerate point at the apex.
     */
    const theta =
      0.018 +
      t *
        (Math.PI / 2 - 0.018)

    const sinTheta =
      Math.sin(theta)

    const cosTheta =
      Math.cos(theta)

    const horizontalRadius =
      this.radius *
      sinTheta

    /*
     * Spherical coordinates matching the dome
     * shell before its Y-axis orientation.
     */
    target.set(
      -horizontalRadius *
        Math.cos(this.azimuth),

      this.radius *
        cosTheta,

      horizontalRadius *
        Math.sin(this.azimuth),
    )

    return target
  }
}

function getOpeningProgress(
  phase,
  elapsedTime,
) {
  const isOpenPhase =
    phase ===
      EXPERIENCE_STATES.DOME_OPENING ||
    phase ===
      EXPERIENCE_STATES.SKY_EXPLORATION ||
    phase ===
      EXPERIENCE_STATES.DISCOVERY ||
    phase ===
      EXPERIENCE_STATES.ENDING

  if (!isOpenPhase) {
    return 0
  }

  return getDomeOpeningState(
    elapsedTime,
  ).opening
}

function DomeHalf({
  side,
  phiStart,
}) {
  /*
   * Fixed exterior hinge pivot.
   *
   * Left:
   *   x = -6
   *
   * Right:
   *   x = +6
   *
   * The pivot never translates.
   * Only its Z rotation changes.
   */
  const pivotRef = useRef(null)

  const { phase } =
    useExperienceState()

  const ribCurves = useMemo(
    () =>
      RIB_ANGLES.map(
        (angle) =>
          new DomeMeridianCurve(
            DOME_RADIUS,
            phiStart + angle,
          ),
      ),
    [phiStart],
  )

  useFrame((state, delta) => {
    if (!pivotRef.current) {
      return
    }

    const opening =
      getOpeningProgress(
        phase,
        state.clock.elapsedTime,
      )

    /*
     * The sign is opposite for each half:
     *
     * left  -> positive Z rotation
     * right -> negative Z rotation
     *
     * This makes both halves rise away from
     * the centre simultaneously.
     */
    const targetRotationZ =
      -side *
      DOME_OPEN_ANGLE *
      opening

    pivotRef.current.rotation.z =
      MathUtils.damp(
        pivotRef.current.rotation.z,
        targetRotationZ,
        5.5,
        delta,
      )
  })

  return (
    <>
      {/* =====================================================
       * MOVING ROOF ASSEMBLY
       * =================================================== */}
      <group
        ref={pivotRef}
        position={[
          side * DOME_RADIUS,
          WALL_HEIGHT,
          0,
        ]}
      >
        {/*
         * The spherical half is translated locally
         * so its exterior equator sits exactly on
         * the fixed hinge axis.
         */}
        <group
          position={[
            -side * DOME_RADIUS,
            0,
            0,
          ]}
          rotation={[
            0,
            Math.PI / 2,
            0,
          ]}
        >
          {/* Dome shell */}
          <mesh>
            <sphereGeometry
              args={[
                DOME_RADIUS,
                72,
                36,
                phiStart,
                Math.PI,
                0,
                Math.PI / 2,
              ]}
            />

            <meshStandardMaterial
              color="#273945"
              roughness={0.86}
              metalness={0.08}
              emissive="#0d1720"
              emissiveIntensity={0.3}
              side={BackSide}
            />
          </mesh>

          {/* Structural ribs */}
          {ribCurves.map(
            (curve, index) => (
              <mesh
                key={`${side}-rib-${index}`}
              >
                <tubeGeometry
                  args={[
                    curve,
                    32,
                    0.042,
                    7,
                    false,
                  ]}
                />

                <meshStandardMaterial
                  color="#647784"
                  roughness={0.3}
                  metalness={0.78}
                  emissive="#17252f"
                  emissiveIntensity={0.14}
                  side={DoubleSide}
                />
              </mesh>
            ),
          )}

          {/*
           * IMPORTANT:
           *
           * This is the thin moving collar that
           * belongs to the roof itself.
           *
           * It is intentionally preserved.
           */}
          <mesh
            position={[
              0,
              0.015,
              0,
            ]}
            rotation={[
              Math.PI / 2,
              0,
              side === -1
                ? Math.PI
                : 0,
            ]}
          >
            <torusGeometry
              args={[
                DOME_RADIUS - 0.12,
                0.045,
                8,
                64,
                Math.PI,
              ]}
            />

            <meshStandardMaterial
              color="#536773"
              roughness={0.3}
              metalness={0.82}
              emissive="#12202a"
              emissiveIntensity={0.1}
              side={DoubleSide}
            />
          </mesh>
        </group>
      </group>

      {/* =====================================================
       * FIXED HINGE HARDWARE
       * =================================================== */}
      <group
        position={[
          side * DOME_RADIUS,
          WALL_HEIGHT,
          0,
        ]}
      >
        <mesh
          rotation={[
            Math.PI / 2,
            0,
            0,
          ]}
        >
          <cylinderGeometry
            args={[
              0.18,
              0.18,
              0.42,
              20,
            ]}
          />

          <meshStandardMaterial
            color="#4d5f6b"
            roughness={0.28}
            metalness={0.86}
            emissive="#111d25"
            emissiveIntensity={0.12}
          />
        </mesh>

        <mesh
          position={[
            0,
            0,
            0.23,
          ]}
        >
          <sphereGeometry
            args={[
              0.075,
              16,
              16,
            ]}
          />

          <meshStandardMaterial
            color="#71838e"
            roughness={0.2}
            metalness={0.92}
          />
        </mesh>

        <mesh
          position={[
            0,
            0,
            -0.23,
          ]}
        >
          <sphereGeometry
            args={[
              0.075,
              16,
              16,
            ]}
          />

          <meshStandardMaterial
            color="#71838e"
            roughness={0.2}
            metalness={0.92}
          />
        </mesh>
      </group>
    </>
  )
}

function ObservatoryDome() {
  const mechanismLightRef =
    useRef(null)

  const { phase } =
    useExperienceState()

  useFrame((state, delta) => {
    const isOpenPhase =
      phase ===
        EXPERIENCE_STATES.DOME_OPENING ||
      phase ===
        EXPERIENCE_STATES.SKY_EXPLORATION ||
      phase ===
        EXPERIENCE_STATES.DISCOVERY ||
      phase ===
        EXPERIENCE_STATES.ENDING

    if (
      !isOpenPhase ||
      !mechanismLightRef.current
    ) {
      return
    }

    const openingTimeline =
      getDomeOpeningState(
        state.clock.elapsedTime,
      )

    const mechanism =
      openingTimeline.mechanism

    const settle =
      openingTimeline.settle

    const consolePulse =
      openingTimeline.console

    const openingActivity =
      Math.max(
        mechanism,
        settle * 0.7,
      )

    const opening =
      openingTimeline.opening

    const activityFade =
      1 -
      MathUtils.smoothstep(
        opening,
        0.2,
        0.78,
      )

    const targetIntensity =
      openingActivity *
      activityFade *
      (1.65 +
        consolePulse * 0.45)

    mechanismLightRef.current.intensity =
      MathUtils.damp(
        mechanismLightRef.current.intensity,
        targetIntensity,
        7,
        delta,
      )
  })

  return (
    <>
      {/*
       * PI = LEFT
       * 0  = RIGHT
       *
       * This matches the actual local X
       * distribution after the Y rotation.
       */}
      <DomeHalf
        side={-1}
        phiStart={Math.PI}
      />

      <DomeHalf
        side={1}
        phiStart={0}
      />

      {/* Fixed central mechanical light */}
      <pointLight
        ref={mechanismLightRef}
        position={[
          0,
          WALL_HEIGHT + 0.45,
          0,
        ]}
        color="#d9ecf7"
        intensity={0}
        distance={5.5}
        decay={2}
      />
    </>
  )
}

export default ObservatoryDome