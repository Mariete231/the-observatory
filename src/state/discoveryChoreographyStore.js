import { useSyncExternalStore } from 'react'

const initialState = Object.freeze({
  activeStageIndex: -1,
})

let state = initialState

const listeners = new Set()

function emit() {
  listeners.forEach((listener) => {
    listener()
  })
}

function updateState(nextState) {
  state = Object.freeze(nextState)
  emit()
}

export function getDiscoveryChoreographyState() {
  return state
}

export function subscribeToDiscoveryChoreography(
  listener,
) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export function setActiveDiscoveryStage(
  activeStageIndex,
) {
  if (
    state.activeStageIndex ===
    activeStageIndex
  ) {
    return
  }

  updateState({
    activeStageIndex,
  })
}

export function resetDiscoveryChoreography() {
  if (
    state === initialState
  ) {
    return
  }

  updateState(
    initialState,
  )
}

export function useDiscoveryChoreographyState() {
  return useSyncExternalStore(
    subscribeToDiscoveryChoreography,
    getDiscoveryChoreographyState,
    getDiscoveryChoreographyState,
  )
}