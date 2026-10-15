import { useFrame } from '@react-three/fiber'
import {
  useLayoutEffect,
  useRef,
} from 'react'
import {
  Color,
  MathUtils,
} from 'three'
import {
  EXPERIENCE_STATES,
  useExperienceState,
} from '../../state/experienceMachine'
import { getDomeOpeningState } from '../../data/domeOpeningTimeline'

const BASE_BACKGROUND =
  new Color('#03070c')

const SKY_BACKGROUND =
  new Color('#07121c')

function DomeOpeningLighting() {
  const { phase } =
    useExperienceState()

  const moonLightRef =
    useRef(null)

  const openingFillRef =
    useRef(null)

  const skyAmbientRef =
    useRef(null)

  const skyGlowRef =
    useRef(null)

  const skyKeyLightRef =
    useRef(null)

  const moonTargetRef =
    useRef(null)

  const skyKeyTargetRef =
    useRef(null)

  const backgroundRef =
    useRef(
      BASE_BACKGROUND.clone(),
    )

  /*
   * -----------------------------------------------------------
   * LIGHT TARGETS
   * -----------------------------------------------------------
   */

  useLayoutEffect(() => {
    if (
      moonLightRef.current &&
      moonTargetRef.current
    ) {
      moonLightRef.current.target =
        moonTargetRef.current

      moonLightRef.current.target
        .updateMatrixWorld()
    }

    if (
      skyKeyLightRef.current &&
      skyKeyTargetRef.current
    ) {
      skyKeyLightRef.current.target =
        skyKeyTargetRef.current

      skyKeyLightRef.current.target
        .updateMatrixWorld()
    }
  }, [])

  /*
   * -----------------------------------------------------------
   * FRAME
   * -----------------------------------------------------------
   */

  useFrame((state, delta) => {
    const isPhysicalOpening =
      phase ===
      EXPERIENCE_STATES.DOME_OPENING

    const isSkyPhase =
      phase ===
        EXPERIENCE_STATES.SKY_EXPLORATION ||
      phase ===
        EXPERIENCE_STATES.DISCOVERY ||
      phase ===
        EXPERIENCE_STATES.ENDING

    /*
     * ---------------------------------------------------------
     * PHYSICAL DOME TIMELINE
     * ---------------------------------------------------------
     */

    const timeline =
      isPhysicalOpening
        ? getDomeOpeningState(
            state.clock.elapsedTime,
          )
        : null

    /*
     * ---------------------------------------------------------
     * AUTHORITATIVE VALUES
     * ---------------------------------------------------------
     *
     * During SKY_EXPLORATION the physical transition
     * is already complete.
     */

    const moonlight =
      isPhysicalOpening
        ? timeline?.moonlight ?? 0
        : isSkyPhase
          ? 1
          : 0

    const skyProgress =
      isPhysicalOpening
        ? MathUtils.smoothstep(
            timeline?.sky ?? 0,
            0,
            1,
          )
        : isSkyPhase
          ? 1
          : 0

    const opening =
      isPhysicalOpening
        ? timeline?.opening ?? 0
        : isSkyPhase
          ? 1
          : 0

    /*
     * ---------------------------------------------------------
     * MOONLIGHT
     * ---------------------------------------------------------
     */

    if (
      moonLightRef.current
    ) {
      const targetIntensity =
        moonlight * 2.45

      moonLightRef.current.intensity =
        MathUtils.damp(
          moonLightRef.current.intensity,
          targetIntensity,
          3.2,
          delta,
        )
    }

    /*
     * ---------------------------------------------------------
     * EXTERIOR KEY
     * ---------------------------------------------------------
     */

    if (
      skyKeyLightRef.current
    ) {
      const targetIntensity =
        skyProgress * 1.55 +
        moonlight * 0.35

      skyKeyLightRef.current.intensity =
        MathUtils.damp(
          skyKeyLightRef.current.intensity,
          targetIntensity,
          3.2,
          delta,
        )
    }

    /*
     * ---------------------------------------------------------
     * OPENING FILL
     * ---------------------------------------------------------
     */

    if (
      openingFillRef.current
    ) {
      const targetIntensity =
        skyProgress * 0.5 +
        moonlight * 0.28 +
        opening * 0.12

      openingFillRef.current.intensity =
        MathUtils.damp(
          openingFillRef.current.intensity,
          targetIntensity,
          4,
          delta,
        )
    }

    /*
     * ---------------------------------------------------------
     * WIDE ATMOSPHERE
     * ---------------------------------------------------------
     */

    if (
      skyAmbientRef.current
    ) {
      const targetIntensity =
        skyProgress * 0.42

      skyAmbientRef.current.intensity =
        MathUtils.damp(
          skyAmbientRef.current.intensity,
          targetIntensity,
          3.5,
          delta,
        )
    }

    /*
     * ---------------------------------------------------------
     * SOFT SKY GLOW
     * ---------------------------------------------------------
     */

    if (
      skyGlowRef.current
    ) {
      const targetIntensity =
        skyProgress * 0.58

      skyGlowRef.current.intensity =
        MathUtils.damp(
          skyGlowRef.current.intensity,
          targetIntensity,
          4,
          delta,
        )
    }

    /*
     * ---------------------------------------------------------
     * BACKGROUND
     * ---------------------------------------------------------
     *
     * This component is the only runtime owner of the
     * background transition.
     */

    if (
      !state.scene.background
    ) {
      state.scene.background =
        BASE_BACKGROUND.clone()
    }

    if (
      state.scene.background?.isColor
    ) {
      backgroundRef.current.lerpColors(
        BASE_BACKGROUND,
        SKY_BACKGROUND,
        skyProgress * 0.92,
      )

      state.scene.background.copy(
        backgroundRef.current,
      )
    }
  })

  return (
    <>
      <directionalLight
        ref={moonLightRef}
        position={[
          -3.6,
          8.4,
          2.2,
        ]}
        color="#c1d9ef"
        intensity={0}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={2}
        shadow-camera-far={24}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
      />

      <group
        ref={moonTargetRef}
        position={[
          0,
          1.8,
          -0.8,
        ]}
      />

      <directionalLight
        ref={skyKeyLightRef}
        position={[
          0,
          12,
          -1,
        ]}
        color="#82aace"
        intensity={0}
        castShadow={false}
      />

      <group
        ref={skyKeyTargetRef}
        position={[
          0,
          0,
          -0.4,
        ]}
      />

      <pointLight
        ref={openingFillRef}
        position={[
          0,
          5.15,
          -0.5,
        ]}
        color="#88afd0"
        intensity={0}
        distance={11}
        decay={1.65}
      />

      <hemisphereLight
        ref={skyAmbientRef}
        skyColor="#8bb0cf"
        groundColor="#050a10"
        intensity={0}
      />

      <pointLight
        ref={skyGlowRef}
        position={[
          0,
          5.6,
          -0.15,
        ]}
        color="#6d9bc1"
        intensity={0}
        distance={12}
        decay={1.6}
      />
    </>
  )
}

export default DomeOpeningLighting