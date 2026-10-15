let active = false
let elapsed = 0
let absoluteTime = 0
let startedAt = 0

export function beginCelestialSequence(
  startTime,
) {
  if (active) {
    return
  }

  active = true
  startedAt = startTime
  absoluteTime = startTime
  elapsed = 0
}

export function updateCelestialSequence(
  currentTime,
) {
  if (!active) {
    return
  }

  absoluteTime = currentTime

  elapsed = Math.max(
    0,
    currentTime - startedAt,
  )
}

export function resetCelestialSequence() {
  active = false
  elapsed = 0
  absoluteTime = 0
  startedAt = 0
}

export function isCelestialSequenceActive() {
  return active
}

export function getCelestialSequenceElapsed() {
  return elapsed
}

export function getCelestialSequenceAbsoluteTime() {
  return absoluteTime
}