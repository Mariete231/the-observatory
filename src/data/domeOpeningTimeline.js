export const DOME_OPENING_TIMELINE =
  Object.freeze({
    /*
     * Total physical transition.
     */
    duration: 7,

    /*
     * Interior settling.
     */
    settleEnd: 0.78,

    /*
     * Console response.
     */
    consoleEnd: 1.35,

    /*
     * Mechanical release.
     */
    mechanismStart: 0.55,
    unlockEnd: 1.8,

    /*
     * Actual physical dome movement.
     */
    openingStart: 0.95,
    openingEnd: 5.0,

    /*
     * Exterior sky becomes visible
     * while the roof is opening.
     */
    skyStart: 0.8,
    skyEnd: 4.7,

    /*
     * Interior lighting fades only after
     * the exterior has established itself.
     */
    roomFadeStart: 2.75,
    roomFadeEnd: 6.05,

    /*
     * Exterior moonlight.
     */
    moonlightStart: 0.85,
    moonlightEnd: 5.65,

    /*
     * Camera's physical cinematic movement.
     */
    cameraStart: 0.3,
    cameraEnd: 6.15,
  })

let timelineStart = null
let timelineComplete = false

export function startDomeOpening(
  elapsedTime,
) {
  if (
    timelineStart === null
  ) {
    timelineStart =
      elapsedTime

    timelineComplete =
      false
  }
}

export function finishDomeOpening() {
  timelineComplete =
    true
}

export function resetDomeOpeningTimeline() {
  timelineStart =
    null

  timelineComplete =
    false
}

export function getDomeOpeningElapsed(
  elapsedTime,
) {
  if (
    timelineComplete
  ) {
    return (
      DOME_OPENING_TIMELINE.duration
    )
  }

  if (
    timelineStart === null
  ) {
    return 0
  }

  return Math.min(
    Math.max(
      elapsedTime -
        timelineStart,
      0,
    ),
    DOME_OPENING_TIMELINE.duration,
  )
}

function clamp01(value) {
  return Math.min(
    Math.max(
      value,
      0,
    ),
    1,
  )
}

function smoothstep(value) {
  const t =
    clamp01(value)

  return (
    t *
    t *
    (3 - 2 * t)
  )
}

function smootherstep(value) {
  const t =
    clamp01(value)

  return (
    t *
    t *
    t *
    (
      t *
        (t * 6 - 15) +
      10
    )
  )
}

function rangeProgress(
  elapsed,
  start,
  end,
  easing = smoothstep,
) {
  if (
    end <= start
  ) {
    return elapsed >= end
      ? 1
      : 0
  }

  return easing(
    (
      elapsed - start
    ) /
      (end - start),
  )
}

export function getDomeOpeningState(
  elapsedTime,
) {
  const elapsed =
    getDomeOpeningElapsed(
      elapsedTime,
    )

  const settle =
    rangeProgress(
      elapsed,
      0,
      DOME_OPENING_TIMELINE.settleEnd,
    )

  const console =
    rangeProgress(
      elapsed,
      0.32,
      DOME_OPENING_TIMELINE.consoleEnd,
    )

  const mechanism =
    rangeProgress(
      elapsed,
      DOME_OPENING_TIMELINE.mechanismStart,
      DOME_OPENING_TIMELINE.unlockEnd,
      smootherstep,
    )

  const opening =
    rangeProgress(
      elapsed,
      DOME_OPENING_TIMELINE.openingStart,
      DOME_OPENING_TIMELINE.openingEnd,
      smootherstep,
    )

  const sky =
    rangeProgress(
      elapsed,
      DOME_OPENING_TIMELINE.skyStart,
      DOME_OPENING_TIMELINE.skyEnd,
      smootherstep,
    )

  const roomFade =
    rangeProgress(
      elapsed,
      DOME_OPENING_TIMELINE.roomFadeStart,
      DOME_OPENING_TIMELINE.roomFadeEnd,
      smootherstep,
    )

  const moonlight =
    rangeProgress(
      elapsed,
      DOME_OPENING_TIMELINE.moonlightStart,
      DOME_OPENING_TIMELINE.moonlightEnd,
      smootherstep,
    )

  const camera =
    rangeProgress(
      elapsed,
      DOME_OPENING_TIMELINE.cameraStart,
      DOME_OPENING_TIMELINE.cameraEnd,
      smootherstep,
    )

  return {
    elapsed,
    settle,
    console,
    mechanism,
    opening,
    sky,
    roomFade,
    moonlight,
    camera,
  }
}