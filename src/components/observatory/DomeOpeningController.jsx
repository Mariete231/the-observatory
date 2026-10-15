import {
  useEffect,
  useRef,
} from 'react'
import { useFrame } from '@react-three/fiber'
import {
  dispatchExperience,
  EXPERIENCE_STATES,
  useExperienceState,
} from '../../state/experienceMachine'
import {
  useTelescopeAlignment,
} from '../../state/telescopeAlignmentStore'
import {
  DOME_OPENING_TIMELINE,
  finishDomeOpening,
  getDomeOpeningState,
  resetDomeOpeningTimeline,
  startDomeOpening,
} from '../../data/domeOpeningTimeline'
import {
  TELESCOPE_ALIGNMENT_SEQUENCE,
} from '../../data/telescopeAlignmentSequence'

function DomeOpeningController() {
  const { phase } =
    useExperienceState()

  const { aligned } =
    useTelescopeAlignment()

  const transitionLockedRef =
    useRef(false)

  const transitionTimerRef =
    useRef(null)

  const wasOpeningRef =
    useRef(false)

  useEffect(() => {
    if (
      transitionTimerRef.current !==
      null
    ) {
      window.clearTimeout(
        transitionTimerRef.current,
      )

      transitionTimerRef.current =
        null
    }

    if (
      phase ===
      EXPERIENCE_STATES.ARRIVAL
    ) {
      transitionLockedRef.current =
        false

      wasOpeningRef.current =
        false

      resetDomeOpeningTimeline()

      return
    }

    if (
      phase ===
      EXPERIENCE_STATES.TELESCOPE_ALIGNMENT
    ) {
      transitionLockedRef.current =
        false

      wasOpeningRef.current =
        false
    }

    /*
     * Entering DOME_OPENING means this is
     * a completely new physical timeline.
     */
    if (
      phase ===
      EXPERIENCE_STATES.DOME_OPENING
    ) {
      wasOpeningRef.current =
        false
    }
  }, [phase])

  /*
   * =========================================================
   * ALIGNED → OPEN DOME
   * =========================================================
   */

  useEffect(() => {
    if (
      phase !==
        EXPERIENCE_STATES.TELESCOPE_ALIGNMENT ||
      !aligned ||
      transitionLockedRef.current
    ) {
      return
    }

    transitionLockedRef.current =
      true

    transitionTimerRef.current =
      window.setTimeout(
        () => {
          transitionTimerRef.current =
            null

          dispatchExperience({
            type: 'OPEN_DOME',
          })
        },
        TELESCOPE_ALIGNMENT_SEQUENCE.lockDuration *
          1000,
      )

    return () => {
      if (
        transitionTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          transitionTimerRef.current,
        )

        transitionTimerRef.current =
          null
      }
    }
  }, [aligned, phase])

  /*
   * =========================================================
   * PHYSICAL DOME TIMELINE
   * =========================================================
   */

  useFrame((state) => {
    if (
      phase !==
      EXPERIENCE_STATES.DOME_OPENING
    ) {
      return
    }

    /*
     * Initialize exactly once.
     */
    if (
      !wasOpeningRef.current
    ) {
      wasOpeningRef.current =
        true

      resetDomeOpeningTimeline()

      startDomeOpening(
        state.clock.elapsedTime,
      )

      return
    }

    const timeline =
      getDomeOpeningState(
        state.clock.elapsedTime,
      )

    if (
      timeline.elapsed >=
      DOME_OPENING_TIMELINE.duration
    ) {
      finishDomeOpening()

      /*
       * This is the sole state transition
       * from the physical dome sequence
       * into the celestial sequence.
       */
      dispatchExperience({
        type: 'ENTER_SKY',
      })
    }
  })

  return null
}

export default DomeOpeningController