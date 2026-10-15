import { motion } from 'motion/react'
import { useState } from 'react'
import { startObservatoryMusic } from '../../audio/observatoryMusic'
import {
  dispatchExperience,
  EXPERIENCE_STATES,
  useExperienceState,
} from '../../state/experienceMachine'

function IntroOverlay() {
  const { phase } =
    useExperienceState()

  const [isLeaving, setIsLeaving] =
    useState(false)

  const [isVisible, setIsVisible] =
    useState(true)

  /*
   * Once the intro has been dismissed,
   * this component stays gone for the
   * remainder of the experience.
   */
  if (
    !isVisible ||
    (
      phase !==
        EXPERIENCE_STATES.ARRIVAL &&
      !isLeaving
    )
  ) {
    return null
  }

  const handleEnter = () => {
    if (isLeaving) {
      return
    }

    // Start audio synchronously from the click gesture so browser autoplay policies allow it.
    void startObservatoryMusic()

    setIsLeaving(true)

    dispatchExperience({
      type: 'START_EXPLORATION',
    })
  }

  return (
    <motion.div
      className="intro-overlay"
      initial={{
        opacity: 1,
      }}
      animate={{
        opacity: isLeaving
          ? 0
          : 1,
      }}
      transition={{
        duration: 1.7,
        ease: [
          0.22,
          1,
          0.36,
          1,
        ],
      }}
      onAnimationComplete={() => {
        if (isLeaving) {
          setIsVisible(false)
        }
      }}
    >
      <motion.div
        className="intro-overlay__atmosphere"
        initial={{
          opacity: 0,
          scale: 0.96,
        }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        transition={{
          duration: 2.4,
          ease: 'easeOut',
        }}
      />

      <div className="intro-overlay__content">
        <motion.div
          className="intro-overlay__title"
          initial={{
            opacity: 0,
            y: 5,
          }}
          animate={{
            opacity:
              isLeaving ? 0 : 0.64,
            y: 0,
          }}
          transition={{
            duration: 1.2,
            delay: 0.35,
            ease: [
              0.22,
              1,
              0.36,
              1,
            ],
          }}
        >
          THE OBSERVATORY
        </motion.div>

        <motion.span
          className="intro-overlay__hairline"
          initial={{
            scaleX: 0,
            opacity: 0,
          }}
          animate={{
            scaleX:
              isLeaving ? 0 : 1,
            opacity:
              isLeaving ? 0 : 1,
          }}
          transition={{
            duration: 1,
            delay: 0.8,
            ease: [
              0.22,
              1,
              0.36,
              1,
            ],
          }}
        />

        <motion.button
          type="button"
          className="intro-overlay__enter"
          disabled={isLeaving}
          initial={{
            opacity: 0,
            y: 7,
          }}
          animate={{
            opacity:
              isLeaving ? 0 : 1,
            y: isLeaving ? -3 : 0,
          }}
          transition={{
            duration: 1,
            delay: 1,
            ease: [
              0.22,
              1,
              0.36,
              1,
            ],
          }}
          onClick={handleEnter}
        >
          <span className="intro-overlay__enter-line" />

          <span className="intro-overlay__enter-label">
            ENTER
          </span>

          <span className="intro-overlay__enter-line" />
        </motion.button>
      </div>
    </motion.div>
  )
}

export default IntroOverlay