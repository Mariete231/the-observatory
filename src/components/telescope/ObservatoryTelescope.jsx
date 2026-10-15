import { useFrame } from '@react-three/fiber'
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { MathUtils } from 'three'

import {
  dispatchExperience,
  EXPERIENCE_STATES,
  useExperienceState,
} from '../../state/experienceMachine'

import {
  clamp,
  getAlignmentIndicatorError,
  getAlignmentProgress,
  TELESCOPE_ALIGNMENT,
} from '../../data/telescopeAlignment'

import {
  TELESCOPE_ALIGNMENT_SEQUENCE,
} from '../../data/telescopeAlignmentSequence'

import {
  getTelescopeAlignment,
  resetTelescopeAlignment,
  setTelescopeAlignment,
} from '../../state/telescopeAlignmentStore'

import {
  getDomeOpeningState,
} from '../../data/domeOpeningTimeline'

// The telescope tube's local Y axis is rotated from vertical to horizontal by -PI/2.
// This small base correction defines zero user elevation as a level tube.
const OPTICAL_ASSEMBLY_BASE_ELEVATION = 0.18

function ObservatoryTelescope() {
  const { phase } = useExperienceState()

  const rootRef = useRef(null)
  const turretRef = useRef(null)
  const opticalAssemblyRef =
    useRef(null)

  const spotlightRef = useRef(null)
  const spotlightTargetRef =
    useRef(null)

  const fillLightRef = useRef(null)
  const floorPoolRef = useRef(null)
  const rimLightRef = useRef(null)

  const lensMaterialRef =
    useRef(null)
  const consoleMaterialRef =
    useRef(null)
  const tubeMaterialRef =
    useRef(null)

  const currentAzimuthRef =
    useRef(
      getTelescopeAlignment().azimuth,
    )

  const targetAzimuthRef =
    useRef(
      getTelescopeAlignment().azimuth,
    )

  const currentElevationRef =
    useRef(
      getTelescopeAlignment()
        .elevation,
    )

  const targetElevationRef =
    useRef(
      getTelescopeAlignment()
        .elevation,
    )

  const dragRef = useRef(null)

  const hudUpdateTimerRef =
    useRef(0)

  const alignmentInitializedRef =
    useRef(false)

  const alignmentCandidateRef =
    useRef({
      active: false,
      startedAt: 0,
    })

  const alignmentSequenceRef =
    useRef({
      active: false,
      startedAt: 0,
    })

  const alignmentPulseLightRef =
    useRef(null)

  const innerLensMaterialRef =
    useRef(null)

  const consoleIndicatorMaterialRef =
    useRef(null)

  const [hovered, setHovered] =
    useState(false)

  const isExploration =
    phase ===
    EXPERIENCE_STATES.EXPLORATION

  const isAwakened =
    phase ===
      EXPERIENCE_STATES.OBSERVATORY_AWAKENED ||
    phase ===
      EXPERIENCE_STATES.TELESCOPE_ALIGNMENT ||
    phase ===
      EXPERIENCE_STATES.DOME_OPENING ||
    phase ===
      EXPERIENCE_STATES.SKY_EXPLORATION ||
    phase ===
      EXPERIENCE_STATES.DISCOVERY ||
    phase ===
      EXPERIENCE_STATES.ENDING

  const isAlignment =
    phase ===
    EXPERIENCE_STATES.TELESCOPE_ALIGNMENT

  const isTelescopeLocked =
    phase ===
      EXPERIENCE_STATES.DOME_OPENING ||
    phase ===
      EXPERIENCE_STATES.SKY_EXPLORATION ||
    phase ===
      EXPERIENCE_STATES.DISCOVERY ||
    phase ===
      EXPERIENCE_STATES.ENDING

  useEffect(() => {
    if (
      phase ===
        EXPERIENCE_STATES.TELESCOPE_ALIGNMENT &&
      !alignmentInitializedRef.current
    ) {
      resetTelescopeAlignment()

      const initial =
        getTelescopeAlignment()

      currentAzimuthRef.current =
        initial.azimuth

      targetAzimuthRef.current =
        initial.azimuth

      currentElevationRef.current =
        initial.elevation

      targetElevationRef.current =
        initial.elevation

      hudUpdateTimerRef.current = 0
      dragRef.current = null

      alignmentCandidateRef.current = {
        active: false,
        startedAt: 0,
      }

      alignmentSequenceRef.current = {
        active: false,
        startedAt: 0,
      }

      alignmentInitializedRef.current =
        true
    }

    if (
      phase !==
      EXPERIENCE_STATES.TELESCOPE_ALIGNMENT
    ) {
      alignmentInitializedRef.current =
        false

      alignmentCandidateRef.current = {
        active: false,
        startedAt: 0,
      }

      alignmentSequenceRef.current = {
        active: false,
        startedAt: 0,
      }

      dragRef.current = null
    }
  }, [phase])

  useLayoutEffect(() => {
    if (
      !spotlightRef.current ||
      !spotlightTargetRef.current
    ) {
      return
    }

    spotlightRef.current.target =
      spotlightTargetRef.current

    spotlightRef.current.target.updateMatrixWorld()
  }, [])

  useEffect(() => {
    if (isAlignment) {
      document.body.style.cursor =
        dragRef.current
          ? 'grabbing'
          : 'grab'
    } else if (
      isExploration &&
      hovered
    ) {
      document.body.style.cursor =
        'pointer'
    } else {
      document.body.style.cursor = ''
    }

    return () => {
      document.body.style.cursor = ''
    }
  }, [
    hovered,
    isExploration,
    isAlignment,
  ])

  useFrame((state, delta) => {
    const elapsed =
      state.clock.elapsedTime

    const alignmentSequence =
      alignmentSequenceRef.current

    const alignmentCandidate =
      alignmentCandidateRef.current

    /*
     * During alignment we follow the user's target.
     * During the confirmation / dome phases we preserve
     * the final target instead of returning to rest.
     */
    if (
      isAlignment ||
      isTelescopeLocked
    ) {
      const movementDamping =
        alignmentSequence.active
          ? 14
          : 5

      currentAzimuthRef.current =
        MathUtils.damp(
          currentAzimuthRef.current,
          targetAzimuthRef.current,
          movementDamping,
          delta,
        )

      currentElevationRef.current =
        MathUtils.damp(
          currentElevationRef.current,
          targetElevationRef.current,
          movementDamping,
          delta,
        )
    } else {
      targetAzimuthRef.current =
        TELESCOPE_ALIGNMENT.initialAzimuth

      targetElevationRef.current =
        TELESCOPE_ALIGNMENT.initialElevation

      currentAzimuthRef.current =
        MathUtils.damp(
          currentAzimuthRef.current,
          TELESCOPE_ALIGNMENT.initialAzimuth,
          3,
          delta,
        )

      currentElevationRef.current =
        MathUtils.damp(
          currentElevationRef.current,
          TELESCOPE_ALIGNMENT.initialElevation,
          3,
          delta,
        )
    }

    const progress =
      getAlignmentProgress(
        currentAzimuthRef.current,
        currentElevationRef.current,
      )

    const {
      horizontalError,
      verticalError,
    } =
      getAlignmentIndicatorError(
        currentAzimuthRef.current,
        currentElevationRef.current,
      )

    /*
     * Same normalized coordinate system as the HUD.
     */
    const alignmentTolerance = 0.08

    const insideAlignmentWindow =
      isAlignment &&
      Math.abs(horizontalError) <=
        alignmentTolerance &&
      Math.abs(verticalError) <=
        alignmentTolerance

    /*
     * Require the telescope to remain inside the
     * target briefly before confirming alignment.
     */
    if (
      isAlignment &&
      !alignmentSequence.active
    ) {
      if (insideAlignmentWindow) {
        if (!alignmentCandidate.active) {
          alignmentCandidate.active = true
          alignmentCandidate.startedAt =
            elapsed
        }

        if (
          elapsed -
            alignmentCandidate.startedAt >=
          TELESCOPE_ALIGNMENT_SEQUENCE
            .confirmationHold
        ) {
          alignmentCandidate.active = false

          /*
           * IMPORTANT:
           * Start the visual sequence immediately,
           * in this same frame.
           *
           * We do NOT wait for the external store.
           */
          alignmentSequence.active = true
          alignmentSequence.startedAt =
            elapsed

          targetAzimuthRef.current =
            TELESCOPE_ALIGNMENT.targetAzimuth

          targetElevationRef.current =
            TELESCOPE_ALIGNMENT.targetElevation

          dragRef.current = null
          document.body.style.cursor = ''

          setTelescopeAlignment({
            azimuth:
              TELESCOPE_ALIGNMENT.targetAzimuth,
            elevation:
              TELESCOPE_ALIGNMENT.targetElevation,
            progress: 1,
            aligned: true,
          })
        }
      } else {
        alignmentCandidate.active = false
        alignmentCandidate.startedAt = 0
      }
    }

    /*
     * Mechanical confirmation animation.
     *
     * Only the turret and optical assembly move.
     * The root/base never moves for this animation.
     */
    let settleYaw = 0
    let settlePitch = 0
    let alignmentFlash = 0
    let alignmentFlashSoft = 0

    if (alignmentSequence.active) {
      const sequenceElapsed =
        Math.max(
          elapsed -
            alignmentSequence.startedAt,
          0,
        )

      const snap =
        Math.exp(
          -TELESCOPE_ALIGNMENT_SEQUENCE
            .snapDecay *
            sequenceElapsed,
        )

      const oscillation =
        Math.sin(
          sequenceElapsed *
            TELESCOPE_ALIGNMENT_SEQUENCE
              .oscillationFrequency,
        ) *
        Math.exp(
          -TELESCOPE_ALIGNMENT_SEQUENCE
            .oscillationDecay *
            sequenceElapsed,
        )

      settleYaw =
        snap *
          TELESCOPE_ALIGNMENT_SEQUENCE
            .yawKick +
        oscillation *
          TELESCOPE_ALIGNMENT_SEQUENCE
            .yawOscillation

      settlePitch =
        snap *
          TELESCOPE_ALIGNMENT_SEQUENCE
            .pitchKick +
        oscillation *
          TELESCOPE_ALIGNMENT_SEQUENCE
            .pitchOscillation

      alignmentFlash =
        Math.exp(
          -TELESCOPE_ALIGNMENT_SEQUENCE
            .flashDecay *
            sequenceElapsed,
        ) *
        (
          0.72 +
          0.28 *
            Math.sin(
              sequenceElapsed *
                TELESCOPE_ALIGNMENT_SEQUENCE
                  .flashFrequency,
            )
        )

      alignmentFlashSoft =
        Math.exp(
          -TELESCOPE_ALIGNMENT_SEQUENCE
            .softFlashDecay *
            sequenceElapsed,
        )
    }

    if (turretRef.current) {
      turretRef.current.rotation.y =
        currentAzimuthRef.current +
        settleYaw
    }

    if (opticalAssemblyRef.current) {
      opticalAssemblyRef.current.rotation.z =
        -Math.PI / 2 +
        OPTICAL_ASSEMBLY_BASE_ELEVATION +
        currentElevationRef.current +
        settlePitch
    }

    /*
     * Keep the HUD synchronized at 20 Hz.
     * Once confirmed, freeze it on the exact target.
     */
    if (isAlignment) {
      hudUpdateTimerRef.current +=
        delta

      if (
        hudUpdateTimerRef.current >=
        1 / 20
      ) {
        hudUpdateTimerRef.current = 0

        const confirmed =
          alignmentSequence.active

        setTelescopeAlignment({
          azimuth: confirmed
            ? TELESCOPE_ALIGNMENT.targetAzimuth
            : currentAzimuthRef.current,
          elevation: confirmed
            ? TELESCOPE_ALIGNMENT.targetElevation
            : currentElevationRef.current,
          progress: confirmed
            ? 1
            : progress,
          aligned: confirmed,
        })
      }
    }

    /*
     * Existing awakening motion.
     * No position/scale/roll movement is introduced here.
     */
    if (rootRef.current) {
      const targetRotation =
        phase ===
        EXPERIENCE_STATES.OBSERVATORY_AWAKENED
          ? 0.09
          : 0

      const awakeningMovement =
        phase ===
        EXPERIENCE_STATES.OBSERVATORY_AWAKENED
          ? Math.sin(
              Math.min(
                elapsed * 3.2,
                Math.PI * 1.15,
              ),
            ) * 0.035
          : 0

      rootRef.current.rotation.y =
        MathUtils.damp(
          rootRef.current.rotation.y,
          targetRotation +
            awakeningMovement,
          2.2,
          delta,
        )
    }

    const breathing =
      1 +
      Math.sin(elapsed * 0.7) *
        0.025

    const hoverMultiplier =
      hovered ? 1.14 : 1

    const domeOpeningProgress =
      isTelescopeLocked
        ? getDomeOpeningState(
            elapsed,
          ).roomFade
        : 0

    const telescopeInteriorFade =
      MathUtils.lerp(
        1,
        0.34,
        domeOpeningProgress,
      )

    if (spotlightRef.current) {
      const targetIntensity =
        (isAwakened
          ? 5.5
          : 4.4) *
        breathing *
        hoverMultiplier *
        telescopeInteriorFade

      spotlightRef.current.intensity =
        MathUtils.damp(
          spotlightRef.current.intensity,
          targetIntensity,
          3.2,
          delta,
        )
    }

    if (fillLightRef.current) {
      const targetIntensity =
        (isAwakened
          ? 1.1
          : 0.8) *
        hoverMultiplier *
        MathUtils.lerp(
          1,
          0.42,
          domeOpeningProgress,
        )

      fillLightRef.current.intensity =
        MathUtils.damp(
          fillLightRef.current.intensity,
          targetIntensity,
          3,
          delta,
        )
    }

    if (floorPoolRef.current) {
      const targetIntensity =
        (isAwakened
          ? 0.7
          : 0.5) *
        (hovered ? 1.1 : 1) *
        MathUtils.lerp(
          1,
          0.62,
          domeOpeningProgress,
        )

      floorPoolRef.current.intensity =
        MathUtils.damp(
          floorPoolRef.current.intensity,
          targetIntensity,
          3.5,
          delta,
        )
    }

    if (rimLightRef.current) {
      const targetIntensity =
        isAwakened
          ? 1.1
          : 0.8

      rimLightRef.current.intensity =
        MathUtils.damp(
          rimLightRef.current.intensity,
          targetIntensity,
          3,
          delta,
        )
    }

    /*
     * Lens + inner lens + console confirmation pulse.
     */
    if (lensMaterialRef.current) {
      const alignmentGlow =
        isAlignment
          ? progress * 0.8
          : 0

      const targetIntensity =
        isAwakened
          ? 0.48 +
            alignmentGlow +
            (hovered ? 0.12 : 0) +
            alignmentFlash *
              TELESCOPE_ALIGNMENT_SEQUENCE
                .lensFlash
          : 0.42

      lensMaterialRef.current
        .emissiveIntensity =
        MathUtils.damp(
          lensMaterialRef.current
            .emissiveIntensity,
          targetIntensity,
          8,
          delta,
        )
    }

    if (
      innerLensMaterialRef.current
    ) {
      const targetIntensity =
        0.4 +
        alignmentFlash *
          TELESCOPE_ALIGNMENT_SEQUENCE
            .innerLensFlash

      innerLensMaterialRef.current
        .emissiveIntensity =
        MathUtils.damp(
          innerLensMaterialRef.current
            .emissiveIntensity,
          targetIntensity,
          10,
          delta,
        )
    }

    if (
      consoleMaterialRef.current
    ) {
      const alignmentGlow =
        isAlignment
          ? progress * 0.85
          : 0

      const targetIntensity =
        isAwakened
          ? 0.5 +
            alignmentGlow +
            (hovered ? 0.1 : 0) +
            alignmentFlashSoft *
              TELESCOPE_ALIGNMENT_SEQUENCE
                .consoleFlash
          : 0.45

      consoleMaterialRef.current
        .emissiveIntensity =
        MathUtils.damp(
          consoleMaterialRef.current
            .emissiveIntensity,
          targetIntensity,
          8,
          delta,
        )
    }

    if (
      consoleIndicatorMaterialRef.current
    ) {
      const targetIntensity =
        1.2 +
        alignmentFlash *
          TELESCOPE_ALIGNMENT_SEQUENCE
            .indicatorFlash

      consoleIndicatorMaterialRef.current
        .emissiveIntensity =
        MathUtils.damp(
          consoleIndicatorMaterialRef.current
            .emissiveIntensity,
          targetIntensity,
          12,
          delta,
        )
    }

    if (tubeMaterialRef.current) {
      const targetEmissive =
        (hovered
          ? 0.055
          : 0.025) +
        alignmentFlash *
          TELESCOPE_ALIGNMENT_SEQUENCE
            .tubeFlash

      tubeMaterialRef.current
        .emissiveIntensity =
        MathUtils.damp(
          tubeMaterialRef.current
            .emissiveIntensity,
          targetEmissive,
          6,
          delta,
        )
    }

    if (
      alignmentPulseLightRef.current
    ) {
      alignmentPulseLightRef.current
        .intensity =
        MathUtils.damp(
          alignmentPulseLightRef.current
            .intensity,
          alignmentFlash *
            TELESCOPE_ALIGNMENT_SEQUENCE
              .pulseLight,
          14,
          delta,
        )
    }
  })

  const activate = (event) => {
    event.stopPropagation()

    if (!isExploration) {
      return
    }

    dispatchExperience({
      type: 'AWAKEN_OBSERVATORY',
    })
  }

  const handlePointerDown = (
    event,
  ) => {
    if (
      !isAlignment ||
      alignmentSequenceRef.current.active
    ) {
      return
    }

    event.stopPropagation()

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startAzimuth:
        targetAzimuthRef.current,
      startElevation:
        targetElevationRef.current,
    }

    event.target?.setPointerCapture?.(
      event.pointerId,
    )
  }

  const handlePointerMove = (
    event,
  ) => {
    if (
      !isAlignment ||
      alignmentSequenceRef.current.active ||
      !dragRef.current
    ) {
      return
    }

    event.stopPropagation()

    const drag =
      dragRef.current

    const deltaX =
      event.clientX -
      drag.startX

    const deltaY =
      event.clientY -
      drag.startY

    targetAzimuthRef.current =
      clamp(
        drag.startAzimuth -
          deltaX *
            TELESCOPE_ALIGNMENT
              .yawSensitivity,
        TELESCOPE_ALIGNMENT.minAzimuth,
        TELESCOPE_ALIGNMENT.maxAzimuth,
      )

    targetElevationRef.current =
      clamp(
        drag.startElevation +
          deltaY *
            TELESCOPE_ALIGNMENT
              .elevationSensitivity,
        TELESCOPE_ALIGNMENT.minElevation,
        TELESCOPE_ALIGNMENT.maxElevation,
      )
  }

  const handlePointerUp = (
    event,
  ) => {
    if (!dragRef.current) {
      return
    }

    event.stopPropagation()

    event.target?.releasePointerCapture?.(
      dragRef.current.pointerId,
    )

    dragRef.current = null
  }

  const handlePointerCancel = (
    event,
  ) => {
    if (!dragRef.current) {
      return
    }

    event.stopPropagation()

    dragRef.current = null
  }

  return (
    <group
      ref={rootRef}
      position={[0.72, 0, -1.5]}
      onClick={activate}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerOver={(event) => {
        event.stopPropagation()

        if (isExploration) {
          setHovered(true)
        }
      }}
      onPointerOut={(event) => {
        event.stopPropagation()
        setHovered(false)
      }}
    >
      <mesh
        position={[0, 0.12, 0]}
        castShadow
      >
        <cylinderGeometry
          args={[
            0.72,
            0.82,
            0.24,
            48,
          ]}
        />
        <meshStandardMaterial
          color="#1d272e"
          roughness={0.34}
          metalness={0.88}
        />
      </mesh>

      <mesh position={[0, 0.25, 0]}>
        <torusGeometry
          args={[
            0.54,
            0.045,
            12,
            48,
          ]}
        />
        <meshStandardMaterial
          color="#71818c"
          roughness={0.23}
          metalness={0.9}
        />
      </mesh>

      <mesh
        position={[0, 0.86, 0]}
        castShadow
      >
        <cylinderGeometry
          args={[
            0.27,
            0.36,
            1.4,
            32,
          ]}
        />
        <meshStandardMaterial
          color="#3a4852"
          roughness={0.3}
          metalness={0.88}
        />
      </mesh>

      <mesh
        position={[0, 1.52, 0]}
        castShadow
      >
        <cylinderGeometry
          args={[
            0.47,
            0.47,
            0.18,
            40,
          ]}
        />
        <meshStandardMaterial
          color="#242f37"
          roughness={0.24}
          metalness={0.92}
        />
      </mesh>

      <group
        ref={turretRef}
        rotation={[0, TELESCOPE_ALIGNMENT.initialAzimuth, 0]}
      >
        <mesh
          position={[0, 1.62, 0]}
          rotation={[
            0,
            Math.PI / 2,
            0,
          ]}
          castShadow
        >
          <torusGeometry
            args={[
              0.34,
              0.065,
              12,
              40,
            ]}
          />
          <meshStandardMaterial
            color="#768691"
            roughness={0.22}
            metalness={0.92}
          />
        </mesh>

        <mesh
          position={[0, 1.62, 0]}
        >
          <sphereGeometry
            args={[
              0.14,
              24,
              24,
            ]}
          />
          <meshStandardMaterial
            color="#313d46"
            roughness={0.22}
            metalness={0.92}
          />
        </mesh>

        <group
          ref={opticalAssemblyRef}
          position={[0, 1.73, 0]}
          rotation={[
            0,
            0,
            -Math.PI / 2 +
              OPTICAL_ASSEMBLY_BASE_ELEVATION +
              TELESCOPE_ALIGNMENT.initialElevation,
          ]}
        >
          <mesh castShadow>
            <cylinderGeometry
              args={[
                0.22,
                0.27,
                2.45,
                40,
              ]}
            />
            <meshStandardMaterial
              ref={tubeMaterialRef}
              color="#394751"
              roughness={0.24}
              metalness={0.9}
              emissive="#101b22"
              emissiveIntensity={
                0.025
              }
            />
          </mesh>

          <mesh>
            <torusGeometry
              args={[
                0.235,
                0.028,
                10,
                40,
              ]}
            />
            <meshStandardMaterial
              color="#8998a2"
              roughness={0.18}
              metalness={0.94}
            />
          </mesh>

          <mesh
            position={[0, 1.22, 0]}
            castShadow
          >
            <cylinderGeometry
              args={[
                0.32,
                0.32,
                0.2,
                40,
              ]}
            />
            <meshStandardMaterial
              color="#1b252d"
              roughness={0.18}
              metalness={0.96}
            />
          </mesh>

          <mesh
            position={[0, 1.35, 0]}
          >
            <cylinderGeometry
              args={[
                0.245,
                0.245,
                0.028,
                48,
              ]}
            />
            <meshStandardMaterial
              ref={lensMaterialRef}
              color="#81aabd"
              roughness={0.06}
              metalness={0.04}
              emissive="#315b70"
              emissiveIntensity={0.5}
            />
          </mesh>

          <mesh
            position={[0, 1.37, 0]}
          >
            <cylinderGeometry
              args={[
                0.18,
                0.18,
                0.012,
                48,
              ]}
            />
            <meshStandardMaterial
              ref={innerLensMaterialRef}
              color="#0c1720"
              roughness={0.06}
              metalness={0.2}
              emissive="#1e536d"
              emissiveIntensity={0.4}
            />
          </mesh>

          <mesh
            position={[0, -1.22, 0]}
            castShadow
          >
            <cylinderGeometry
              args={[
                0.26,
                0.26,
                0.18,
                36,
              ]}
            />
            <meshStandardMaterial
              color="#1e2931"
              roughness={0.18}
              metalness={0.95}
            />
          </mesh>

          {[-0.58, 0.56].map(
            (y) => (
              <mesh
                key={y}
                position={[0, y, 0]}
              >
                <torusGeometry
                  args={[
                    0.225,
                    0.035,
                    10,
                    36,
                  ]}
                />
                <meshStandardMaterial
                  color="#7e8e99"
                  roughness={0.2}
                  metalness={0.92}
                />
              </mesh>
            ),
          )}

          <group
            position={[
              0,
              0.05,
              0.27,
            ]}
            scale={0.55}
          >
            <mesh>
              <cylinderGeometry
                args={[
                  0.07,
                  0.08,
                  0.58,
                  20,
                ]}
              />
              <meshStandardMaterial
                color="#26333b"
                roughness={0.22}
                metalness={0.88}
              />
            </mesh>

            <mesh
              position={[
                0,
                0.31,
                0,
              ]}
            >
              <cylinderGeometry
                args={[
                  0.085,
                  0.085,
                  0.08,
                  20,
                ]}
              />
              <meshStandardMaterial
                color="#596a75"
                roughness={0.22}
                metalness={0.84}
              />
            </mesh>
          </group>
        </group>

        <group
          position={[
            -0.66,
            1.66,
            0,
          ]}
        >
          <mesh>
            <cylinderGeometry
              args={[
                0.055,
                0.055,
                0.55,
                16,
              ]}
            />
            <meshStandardMaterial
              color="#29353d"
              roughness={0.24}
              metalness={0.9}
            />
          </mesh>

          <mesh
            position={[
              0,
              -0.31,
              0,
            ]}
          >
            <sphereGeometry
              args={[
                0.14,
                24,
                24,
              ]}
            />
            <meshStandardMaterial
              color="#1e282f"
              roughness={0.22}
              metalness={0.92}
            />
          </mesh>
        </group>
      </group>

      <group
        position={[
          0.72,
          0.7,
          0.2,
        ]}
      >
        <mesh castShadow>
          <boxGeometry
            args={[
              0.48,
              0.18,
              0.34,
            ]}
          />
          <meshStandardMaterial
            color="#222e36"
            roughness={0.26}
            metalness={0.82}
          />
        </mesh>

        <mesh
          position={[
            0,
            0.103,
            0,
          ]}
        >
          <boxGeometry
            args={[
              0.31,
              0.02,
              0.16,
            ]}
          />
          <meshStandardMaterial
            ref={consoleMaterialRef}
            color="#719aaa"
            roughness={0.14}
            metalness={0.22}
            emissive="#31586a"
            emissiveIntensity={0.5}
          />
        </mesh>

        <mesh
          position={[
            0,
            0.118,
            0,
          ]}
        >
          <boxGeometry
            args={[
              0.08,
              0.004,
              0.025,
            ]}
          />
          <meshStandardMaterial
            ref={
              consoleIndicatorMaterialRef
            }
            color="#d5e8f1"
            emissive="#75bbd8"
            emissiveIntensity={1.2}
          />
        </mesh>
      </group>

      <spotLight
        ref={spotlightRef}
        position={[
          2.65,
          4.2,
          2.15,
        ]}
        color="#d8edf7"
        intensity={4.5}
        distance={7.5}
        angle={0.56}
        penumbra={0.9}
        decay={2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      <group
        ref={spotlightTargetRef}
        position={[
          0.05,
          1.45,
          0,
        ]}
      />

      <pointLight
        ref={fillLightRef}
        position={[
          1.75,
          2.15,
          0.85,
        ]}
        color="#9cc6da"
        intensity={0.82}
        distance={3.8}
        decay={2}
      />

      <pointLight
        ref={floorPoolRef}
        position={[
          0,
          0.38,
          0,
        ]}
        color="#7fa9bc"
        intensity={0.52}
        distance={2.7}
        decay={2}
      />

      <pointLight
        ref={rimLightRef}
        position={[
          -1.15,
          2.2,
          -1.15,
        ]}
        color="#56788d"
        intensity={0.85}
        distance={3.2}
        decay={2}
      />

      <pointLight
        position={[
          1.05,
          2.02,
          0.08,
        ]}
        color="#8bc7df"
        intensity={0.22}
        distance={1.8}
        decay={2}
      />

      <pointLight
        ref={alignmentPulseLightRef}
        position={[
          1.05,
          2.02,
          0.12,
        ]}
        color="#d8f5ff"
        intensity={0}
        distance={2.4}
        decay={2}
      />
    </group>
  )
}

export default ObservatoryTelescope