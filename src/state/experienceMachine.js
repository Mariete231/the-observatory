import { useSyncExternalStore } from 'react'

export const EXPERIENCE_STATES = Object.freeze({
  ARRIVAL: 'arrival',
  EXPLORATION: 'exploration',
  OBSERVATORY_AWAKENED: 'observatoryAwakened',
  TELESCOPE_ALIGNMENT: 'telescopeAlignment',
  DOME_OPENING: 'domeOpening',
  SKY_EXPLORATION: 'skyExploration',
  DISCOVERY: 'discovery',
  ENDING: 'ending',
})

const initialState = Object.freeze({
  phase: EXPERIENCE_STATES.ARRIVAL,
})

let state = initialState
const listeners = new Set()

function emit() {
  listeners.forEach((listener) => listener())
}

function setState(nextState) {
  state = Object.freeze(nextState)
  emit()
}

export function getExperienceState() {
  return state
}

export function subscribeToExperience(listener) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export function dispatchExperience(action) {
  switch (action.type) {
    case 'START_EXPLORATION': {
      if (state.phase !== EXPERIENCE_STATES.ARRIVAL) {
        return
      }

      setState({
        ...state,
        phase: EXPERIENCE_STATES.EXPLORATION,
      })

      return
    }

    case 'AWAKEN_OBSERVATORY': {
      if (
        state.phase !==
        EXPERIENCE_STATES.EXPLORATION
      ) {
        return
      }

      setState({
        ...state,
        phase:
          EXPERIENCE_STATES.OBSERVATORY_AWAKENED,
      })

      return
    }

    case 'START_TELESCOPE_ALIGNMENT': {
      if (
        state.phase !==
        EXPERIENCE_STATES.OBSERVATORY_AWAKENED
      ) {
        return
      }

      setState({
        ...state,
        phase:
          EXPERIENCE_STATES.TELESCOPE_ALIGNMENT,
      })

      return
    }

    case 'OPEN_DOME': {
      if (
        state.phase !==
        EXPERIENCE_STATES.TELESCOPE_ALIGNMENT
      ) {
        return
      }

      setState({
        ...state,
        phase:
          EXPERIENCE_STATES.DOME_OPENING,
      })

      return
    }

    case 'ENTER_SKY': {
      if (
        state.phase !==
        EXPERIENCE_STATES.DOME_OPENING
      ) {
        return
      }

      setState({
        ...state,
        phase:
          EXPERIENCE_STATES.SKY_EXPLORATION,
      })

      return
    }

    case 'REVEAL_DISCOVERY': {
      if (
        state.phase !==
        EXPERIENCE_STATES.SKY_EXPLORATION
      ) {
        return
      }

      setState({
        ...state,
        phase:
          EXPERIENCE_STATES.DISCOVERY,
      })

      return
    }

    case 'START_ENDING': {
      if (
        state.phase !==
        EXPERIENCE_STATES.DISCOVERY
      ) {
        return
      }

      setState({
        ...state,
        phase:
          EXPERIENCE_STATES.ENDING,
      })

      return
    }

    case 'RESET': {
      setState(initialState)
      return
    }

    default: {
      console.warn(
        `Unknown experience action: ${action.type}`,
      )
    }
  }
}

export function useExperienceState() {
  return useSyncExternalStore(
    subscribeToExperience,
    getExperienceState,
    getExperienceState,
  )
}