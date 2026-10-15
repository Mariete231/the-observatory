import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { MathUtils } from 'three'
import {
  dispatchExperience,
  EXPERIENCE_STATES,
  useExperienceState,
} from '../../state/experienceMachine'

function pulse(elapsed, start, duration) {
  const local =
    (elapsed - start) / duration

  if (local <= 0 || local >= 1) {
    return 0
  }

  return Math.sin(local * Math.PI)
}

function ObservatoryAwakening() {
  const { phase } = useExperienceState()

  const elapsedRef = useRef(0)
  const previousPhaseRef = useRef(phase)
  const transitionTriggeredRef =
    useRef(false)

  const relayOneRef = useRef(null)
  const relayTwoRef = useRef(null)
  const roomPowerRef = useRef(null)
  const consolePowerRef = useRef(null)
  const ceilingPowerRef = useRef(null)

  const isAwakePhase =
    phase ===
      EXPERIENCE_STATES.OBSERVATORY_AWAKENED ||
    phase ===
      EXPERIENCE_STATES.TELESCOPE_ALIGNMENT

  useFrame((_, delta) => {
    const justEnteredAwakening =
      phase ===
        EXPERIENCE_STATES.OBSERVATORY_AWAKENED &&
      previousPhaseRef.current !==
        EXPERIENCE_STATES.OBSERVATORY_AWAKENED

    if (justEnteredAwakening) {
      elapsedRef.current = 0
      transitionTriggeredRef.current = false
    }

    previousPhaseRef.current = phase

    if (!isAwakePhase) {
      elapsedRef.current = 0
      transitionTriggeredRef.current = false

      if (relayOneRef.current) {
        relayOneRef.current.intensity =
          MathUtils.damp(
            relayOneRef.current.intensity,
            0,
            7,
            delta,
          )
      }

      if (relayTwoRef.current) {
        relayTwoRef.current.intensity =
          MathUtils.damp(
            relayTwoRef.current.intensity,
            0,
            7,
            delta,
          )
      }

      if (roomPowerRef.current) {
        roomPowerRef.current.intensity =
          MathUtils.damp(
            roomPowerRef.current.intensity,
            0,
            4,
            delta,
          )
      }

      if (consolePowerRef.current) {
        consolePowerRef.current.intensity =
          MathUtils.damp(
            consolePowerRef.current.intensity,
            0,
            4,
            delta,
          )
      }

      if (ceilingPowerRef.current) {
        ceilingPowerRef.current.intensity =
          MathUtils.damp(
            ceilingPowerRef.current.intensity,
            0,
            4,
            delta,
          )
      }

      return
    }

    /*
     * Once alignment has started, the room
     * stays powered on at its final level.
     */
    if (
      phase ===
      EXPERIENCE_STATES.TELESCOPE_ALIGNMENT
    ) {
      if (relayOneRef.current) {
        relayOneRef.current.intensity =
          MathUtils.damp(
            relayOneRef.current.intensity,
            0,
            5,
            delta,
          )
      }

      if (relayTwoRef.current) {
        relayTwoRef.current.intensity =
          MathUtils.damp(
            relayTwoRef.current.intensity,
            0,
            5,
            delta,
          )
      }

      if (roomPowerRef.current) {
        roomPowerRef.current.intensity =
          MathUtils.damp(
            roomPowerRef.current.intensity,
            0.65,
            3,
            delta,
          )
      }

      if (consolePowerRef.current) {
        consolePowerRef.current.intensity =
          MathUtils.damp(
            consolePowerRef.current.intensity,
            1.25,
            3,
            delta,
          )
      }

      if (ceilingPowerRef.current) {
        ceilingPowerRef.current.intensity =
          MathUtils.damp(
            ceilingPowerRef.current.intensity,
            0.8,
            3,
            delta,
          )
      }

      return
    }

    elapsedRef.current += delta

    const elapsed = elapsedRef.current

    /*
     * First relay.
     */
    const relayOne =
      pulse(elapsed, 0.18, 0.24) *
      5.5

    /*
     * Second relay.
     */
    const relayTwo =
      pulse(elapsed, 0.46, 0.28) *
      4.8

    /*
     * Room power.
     */
    const roomProgress =
      MathUtils.smoothstep(
        Math.min(
          Math.max(
            (elapsed - 0.58) / 1.35,
            0,
          ),
          1,
        ),
        0,
        1,
      )

    /*
     * Console.
     */
    const consoleProgress =
      MathUtils.smoothstep(
        Math.min(
          Math.max(
            (elapsed - 0.72) / 0.8,
            0,
          ),
          1,
        ),
        0,
        1,
      )

    /*
     * Ceiling.
     */
    const ceilingProgress =
      MathUtils.smoothstep(
        Math.min(
          Math.max(
            (elapsed - 1.05) / 1.15,
            0,
          ),
          1,
        ),
        0,
        1,
      )

    if (relayOneRef.current) {
      relayOneRef.current.intensity =
        relayOne
    }

    if (relayTwoRef.current) {
      relayTwoRef.current.intensity =
        relayTwo
    }

    if (roomPowerRef.current) {
      roomPowerRef.current.intensity =
        MathUtils.damp(
          roomPowerRef.current.intensity,
          roomProgress * 0.65,
          5,
          delta,
        )
    }

    if (consolePowerRef.current) {
      consolePowerRef.current.intensity =
        MathUtils.damp(
          consolePowerRef.current.intensity,
          consoleProgress * 1.25,
          5,
          delta,
        )
    }

    if (ceilingPowerRef.current) {
      ceilingPowerRef.current.intensity =
        MathUtils.damp(
          ceilingPowerRef.current.intensity,
          ceilingProgress * 0.8,
          5,
          delta,
        )
    }

    /*
     * Transition into alignment once the
     * awakening sequence has settled.
     */
    if (
      elapsed >= 3.25 &&
      !transitionTriggeredRef.current
    ) {
      transitionTriggeredRef.current = true

      dispatchExperience({
        type: 'START_TELESCOPE_ALIGNMENT',
      })
    }
  })

  return (
    <>
      <pointLight
        ref={relayOneRef}
        position={[2.9, 2.5, -3.9]}
        color="#86b4c9"
        distance={3}
        decay={2}
        intensity={0}
      />

      <pointLight
        ref={relayTwoRef}
        position={[-2.8, 2.4, -4]}
        color="#86b4c9"
        distance={3}
        decay={2}
        intensity={0}
      />

      <pointLight
        ref={roomPowerRef}
        position={[0, 3.4, -2.2]}
        color="#66879b"
        distance={7}
        decay={2}
        intensity={0}
      />

      <pointLight
        ref={consolePowerRef}
        position={[1.45, 1.05, -1.3]}
        color="#78b4cc"
        distance={2.6}
        decay={2}
        intensity={0}
      />

      <pointLight
        ref={ceilingPowerRef}
        position={[0, 4.15, -0.7]}
        color="#9ab4c3"
        distance={6}
        decay={2}
        intensity={0}
      />
    </>
  )
}

export default ObservatoryAwakening