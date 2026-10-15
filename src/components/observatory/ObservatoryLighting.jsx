import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { MathUtils } from 'three'
import {
  EXPERIENCE_STATES,
  useExperienceState,
} from '../../state/experienceMachine'
import { getDomeOpeningState } from '../../data/domeOpeningTimeline'

function ObservatoryLighting() {
  const { phase } =
    useExperienceState()

  const ambientRef =
    useRef(null)

  const moonRef =
    useRef(null)

  const backRef =
    useRef(null)

  const floorRef =
    useRef(null)

  useFrame((state, delta) => {
    const awakened =
      phase !==
        EXPERIENCE_STATES.ARRIVAL &&
      phase !==
        EXPERIENCE_STATES.EXPLORATION

    const isOpening =
      phase ===
        EXPERIENCE_STATES.DOME_OPENING ||
      phase ===
        EXPERIENCE_STATES.SKY_EXPLORATION ||
      phase ===
        EXPERIENCE_STATES.DISCOVERY ||
      phase ===
        EXPERIENCE_STATES.ENDING

    const timeline =
      isOpening
        ? getDomeOpeningState(
            state.clock.elapsedTime,
          )
        : null

    const roomFade =
      timeline?.roomFade ?? 0

    const ambientBase =
      awakened ? 0.27 : 0.22

    const moonBase =
      awakened ? 1.35 : 1.18

    const backBase =
      awakened ? 0.48 : 0.32

    const floorBase =
      awakened ? 0.14 : 0.09

    /*
     * Keep the original interior atmosphere
     * much longer into the transition.
     */
    const ambientTarget =
      isOpening
        ? MathUtils.lerp(
            ambientBase,
            0.19,
            roomFade * 0.72,
          )
        : ambientBase

    const moonTarget =
      isOpening
        ? MathUtils.lerp(
            moonBase,
            0.92,
            roomFade * 0.58,
          )
        : moonBase

    const backTarget =
      isOpening
        ? MathUtils.lerp(
            backBase,
            0.28,
            roomFade * 0.85,
          )
        : backBase

    const floorTarget =
      isOpening
        ? MathUtils.lerp(
            floorBase,
            0.1,
            roomFade * 0.9,
          )
        : floorBase

    if (ambientRef.current) {
      ambientRef.current.intensity =
        MathUtils.damp(
          ambientRef.current.intensity,
          ambientTarget,
          2.2,
          delta,
        )
    }

    if (moonRef.current) {
      moonRef.current.intensity =
        MathUtils.damp(
          moonRef.current.intensity,
          moonTarget,
          2.2,
          delta,
        )
    }

    if (backRef.current) {
      backRef.current.intensity =
        MathUtils.damp(
          backRef.current.intensity,
          backTarget,
          2.5,
          delta,
        )
    }

    if (floorRef.current) {
      floorRef.current.intensity =
        MathUtils.damp(
          floorRef.current.intensity,
          floorTarget,
          3,
          delta,
        )
    }
  })

  return (
    <>
      <hemisphereLight
        ref={ambientRef}
        skyColor="#a9bbc8"
        groundColor="#070d12"
        intensity={0.22}
      />

      <directionalLight
        ref={moonRef}
        position={[
          -5.5,
          8,
          5.5,
        ]}
        color="#d5e4ef"
        intensity={1.18}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.1}
        shadow-camera-far={30}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      <pointLight
        ref={backRef}
        position={[
          0,
          3.1,
          -4.35,
        ]}
        color="#58728a"
        distance={7}
        decay={2}
        intensity={0.32}
      />

      <pointLight
        ref={floorRef}
        position={[
          0,
          1,
          0,
        ]}
        color="#243746"
        distance={7}
        decay={2}
        intensity={0.09}
      />
    </>
  )
}

export default ObservatoryLighting