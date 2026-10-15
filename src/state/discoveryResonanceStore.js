const initialState = Object.freeze({
  active: false,
  started: false,
  progress: 0,
  energy: 0,
  completed: false,
  completedAt: null,
  activatedAt: null,
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

function clamp01(value) {
  return Math.max(
    0,
    Math.min(
      value,
      1,
    ),
  )
}

export function getDiscoveryResonanceState() {
  return state
}

export function subscribeToDiscoveryResonance(
  listener,
) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

/*
 * Normal lifecycle reset.
 *
 * Important:
 * once the resonance has completed, leaving
 * SKY_EXPLORATION must NOT destroy the completed state.
 *
 * The experience controller can explicitly force a reset
 * when the whole experience returns to ARRIVAL.
 */
export function resetDiscoveryResonance(
  force = false,
) {
  if (
    state === initialState
  ) {
    return
  }

  if (
    state.completed &&
    !force
  ) {
    return
  }

  updateState(
    initialState,
  )
}

export function activateDiscoveryResonance(
  activatedAt = 0,
) {
  if (
    state.active
  ) {
    return
  }

  updateState({
    ...state,
    active: true,
    activatedAt,
  })
}

export function beginDiscoveryResonance() {
  if (
    state.started ||
    state.completed
  ) {
    return
  }

  updateState({
    ...state,
    active: true,
    started: true,
  })
}

export function updateDiscoveryResonance(
  progress,
  energy,
) {
  const nextProgress =
    Math.max(
      state.progress,
      clamp01(progress),
    )

  const nextEnergy =
    clamp01(energy)

  if (
    Math.abs(
      nextProgress -
        state.progress,
    ) < 0.003 &&
    Math.abs(
      nextEnergy -
        state.energy,
    ) < 0.04
  ) {
    return
  }

  updateState({
    ...state,
    progress: nextProgress,
    energy: nextEnergy,
  })
}

export function setDiscoveryResonanceEnergy(
  energy,
) {
  const nextEnergy =
    clamp01(energy)

  if (
    Math.abs(
      nextEnergy -
        state.energy,
    ) < 0.035
  ) {
    return
  }

  updateState({
    ...state,
    energy: nextEnergy,
  })
}

export function completeDiscoveryResonance(
  completedAt,
) {
  if (
    state.completed
  ) {
    return
  }

  updateState({
    ...state,
    active: true,
    started: true,
    progress: 1,
    energy: 1,
    completed: true,
    completedAt,
  })
}