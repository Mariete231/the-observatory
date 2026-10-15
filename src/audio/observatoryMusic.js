const AUDIO_SOURCE = '/audio/observatory-soundtrack.mp3'
const TARGET_VOLUME = 0.34
const FADE_IN_DURATION_MS = 4200

let soundtrack = null
let fadeFrame = null

function getSoundtrack() {
  if (typeof window === 'undefined') {
    return null
  }

  if (!soundtrack) {
    soundtrack = new Audio(AUDIO_SOURCE)
    soundtrack.preload = 'auto'
    soundtrack.loop = true
    soundtrack.volume = 0
    soundtrack.setAttribute('playsinline', '')
  }

  return soundtrack
}

function fadeInSoundtrack(audio) {
  if (fadeFrame !== null) {
    window.cancelAnimationFrame(fadeFrame)
    fadeFrame = null
  }

  if (typeof window.requestAnimationFrame !== 'function') {
    audio.volume = TARGET_VOLUME
    return
  }

  let startTime = null

  const animateFade = (timestamp) => {
    if (audio.paused || audio.ended) {
      fadeFrame = null
      return
    }

    if (startTime === null) {
      startTime = timestamp
    }

    const progress = Math.min(
      (timestamp - startTime) / FADE_IN_DURATION_MS,
      1,
    )

    audio.volume = TARGET_VOLUME * progress

    if (progress < 1) {
      fadeFrame = window.requestAnimationFrame(animateFade)
    } else {
      fadeFrame = null
    }
  }

  fadeFrame = window.requestAnimationFrame(animateFade)
}

/**
 * Start the Observatory soundtrack from a real user gesture.
 * Call this directly from the ENTER button's click handler so browser
 * autoplay policies allow playback. The single audio instance loops for
 * the rest of the experience and fades in gently instead of starting loud.
 */
export function startObservatoryMusic() {
  const audio = getSoundtrack()

  if (!audio) {
    return Promise.resolve(false)
  }

  if (!audio.paused && !audio.ended) {
    return Promise.resolve(true)
  }

  if (fadeFrame !== null) {
    window.cancelAnimationFrame(fadeFrame)
    fadeFrame = null
  }

  audio.volume = 0

  try {
    const playback = audio.play()

    if (playback && typeof playback.then === 'function') {
      return playback
        .then(() => {
          fadeInSoundtrack(audio)
          return true
        })
        .catch((error) => {
          console.warn(
            `[THE OBSERVATORY] Could not start soundtrack. Confirm that ${AUDIO_SOURCE} exists under public/.`,
            error,
          )
          return false
        })
    }

    fadeInSoundtrack(audio)
    return Promise.resolve(true)
  } catch (error) {
    console.warn(
      `[THE OBSERVATORY] Could not start soundtrack. Confirm that ${AUDIO_SOURCE} exists under public/.`,
      error,
    )
    return Promise.resolve(false)
  }
}