import { useFrame } from '@react-three/fiber'
import {
  EXPERIENCE_STATES,
  useExperienceState,
} from '../../state/experienceMachine'
import {
  CYGNUS_COMPLETE_TIME,
  CYGNUS_RESONANCE_UNLOCK_DELAY,
} from '../../data/cygnusData'
import {
  activateDiscoveryResonance,
  getDiscoveryResonanceState,
  resetDiscoveryResonance,
} from '../../state/discoveryResonanceStore'
import {
  beginCelestialSequence,
  getCelestialSequenceElapsed,
  isCelestialSequenceActive,
  resetCelestialSequence,
  updateCelestialSequence,
} from '../../state/celestialSequenceStore'

function CelestialSequenceController() {
  const { phase } =
    useExperienceState()

  useFrame((state) => {
    if (phase === EXPERIENCE_STATES.ARRIVAL) {
      resetCelestialSequence()
      resetDiscoveryResonance(true)
      return
    }

    const isCelestialPhase =
      phase ===
        EXPERIENCE_STATES.SKY_EXPLORATION ||
      phase === EXPERIENCE_STATES.DISCOVERY ||
      phase === EXPERIENCE_STATES.ENDING

    if (!isCelestialPhase) {
      return
    }

    /*
     * The controller is deliberately self-healing. This avoids a
     * hot-reload or remount leaving the experience in SKY/DISCOVERY
     * with no clock producer.
     */
    if (!isCelestialSequenceActive()) {
      beginCelestialSequence(
        state.clock.elapsedTime,
      )
    }

    updateCelestialSequence(
      state.clock.elapsedTime,
    )

    if (
      phase !==
      EXPERIENCE_STATES.SKY_EXPLORATION
    ) {
      return
    }

    const resonance =
      getDiscoveryResonanceState()

    if (resonance.active) {
      return
    }

    const unlockAt =
      CYGNUS_COMPLETE_TIME +
      CYGNUS_RESONANCE_UNLOCK_DELAY

    if (
      getCelestialSequenceElapsed() <
      unlockAt
    ) {
      return
    }

    activateDiscoveryResonance(
      getCelestialSequenceElapsed(),
    )
  }, -10)

  return null
}

export default CelestialSequenceController