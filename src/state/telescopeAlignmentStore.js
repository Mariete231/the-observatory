import { useSyncExternalStore } from 'react'
import {
  getAlignmentProgress,
  TELESCOPE_ALIGNMENT,
} from '../data/telescopeAlignment'

function createInitialState() {
  const azimuth =
    TELESCOPE_ALIGNMENT.initialAzimuth

  const elevation =
    TELESCOPE_ALIGNMENT.initialElevation

  return Object.freeze({
    azimuth,
    elevation,
    progress: getAlignmentProgress(
      azimuth,
      elevation,
    ),
    aligned: false,
  })
}

let state = createInitialState()

const listeners = new Set()

function emit() {
  listeners.forEach((listener) => {
    listener()
  })
}

export function getTelescopeAlignment() {
  return state
}

export function subscribeToTelescopeAlignment(
  listener,
) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export function setTelescopeAlignment(
  nextState,
) {
  state = Object.freeze({
    ...nextState,
  })

  emit()
}

export function resetTelescopeAlignment() {
  state = createInitialState()
  emit()
}

export function useTelescopeAlignment() {
  return useSyncExternalStore(
    subscribeToTelescopeAlignment,
    getTelescopeAlignment,
    getTelescopeAlignment,
  )
}