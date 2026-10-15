import { motion } from 'motion/react'
import {
  EXPERIENCE_STATES,
  useExperienceState,
} from '../../state/experienceMachine'
import {
  getAlignmentIndicatorError,
} from '../../data/telescopeAlignment'
import {
  useTelescopeAlignment,
} from '../../state/telescopeAlignmentStore'

function TelescopeAlignmentHUD() {
  const { phase } = useExperienceState()

  const {
    azimuth,
    elevation,
    progress,
    aligned,
  } = useTelescopeAlignment()

  if (
    phase !==
    EXPERIENCE_STATES.TELESCOPE_ALIGNMENT
  ) {
    return null
  }

  const {
    horizontalError,
    verticalError,
  } = getAlignmentIndicatorError(
    azimuth,
    elevation,
  )

  // A confirmed alignment is pinned to the exact reticle center.
  const targetX =
    aligned ? 0 : horizontalError * 24

  const targetY =
    aligned ? 0 : verticalError * 17

  return (
    <div className="alignment-hud">
      <motion.div
        className="alignment-hud__content"
        initial={{
          opacity: 0,
          y: 8,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.8,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <div className="alignment-hud__label">
          {aligned ? 'Aligned' : 'Align'}
        </div>

        <div className="alignment-hud__reticle">
          <span className="alignment-hud__line alignment-hud__line--horizontal" />

          <span className="alignment-hud__line alignment-hud__line--vertical" />

          <span className="alignment-hud__target-anchor">
            <motion.span
              className={
                aligned
                  ? 'alignment-hud__target alignment-hud__target--locked'
                  : 'alignment-hud__target'
              }
              animate={{
                x: targetX,
                y: targetY,
              }}
              transition={{
                type: 'tween',
                duration: aligned ? 0 : 0.08,
                ease: 'linear',
              }}
            />
          </span>
        </div>

        <div className="alignment-hud__instruction">
          Drag to aim
        </div>

        <div className="alignment-hud__progress-track">
          <motion.div
            className="alignment-hud__progress"
            animate={{
              scaleX: progress,
            }}
            transition={{
              duration: 0.12,
              ease: 'linear',
            }}
          />
        </div>
      </motion.div>
    </div>
  )
}

export default TelescopeAlignmentHUD