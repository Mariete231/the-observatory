import {
  useFrame,
  useThree,
} from '@react-three/fiber'
import { useMemo } from 'react'
import {
  MathUtils,
  Vector3,
} from 'three'
import {
  EXPERIENCE_STATES,
  useExperienceState,
} from '../../state/experienceMachine'
import {
  getDomeOpeningState,
} from '../../data/domeOpeningTimeline'

const CAMERA_CONFIG = {
  arrival: {
    position: [
      0.1,
      2.15,
      5.2,
    ],
    lookAt: [
      0.3,
      1.65,
      -1.8,
    ],
  },

  exploration: {
    position: [
      3.15,
      2.35,
      3.15,
    ],
    lookAt: [
      0.65,
      1.55,
      -1.65,
    ],
  },

  observatoryAwakened: {
    position: [
      2.85,
      2.3,
      2.85,
    ],
    lookAt: [
      0.7,
      1.7,
      -1.5,
    ],
  },

  telescopeAlignment: {
    position: [
      2.0,
      2.05,
      2.35,
    ],
    lookAt: [
      0.72,
      1.72,
      -1.5,
    ],
  },

  /*
   * Stable celestial composition.
   *
   * The tiny Z offset avoids an exact +Y / +Y
   * up-vector singularity while remaining visually vertical.
   */
  skyExploration: {
    position: [
      0,
      4.2,
      0,
    ],
    lookAt: [
      0,
      14.2,
      -0.08,
    ],
  },

  /*
   * DISCOVERY intentionally shares the exact
   * celestial composition.
   *
   * No camera drop.
   * No surprise reframing.
   */
  discovery: {
    position: [
      0,
      4.2,
      0,
    ],
    lookAt: [
      0,
      14.2,
      -0.08,
    ],
  },

  ending: {
    position: [
      0,
      4.0,
      7.2,
    ],
    lookAt: [
      0,
      3.1,
      -0.5,
    ],
  },
}

function cubicBezier(
  out,
  p0,
  p1,
  p2,
  p3,
  t,
) {
  const oneMinusT =
    1 - t

  const oneMinusTSquared =
    oneMinusT *
    oneMinusT

  const tSquared =
    t * t

  const a =
    oneMinusTSquared *
    oneMinusT

  const b =
    3 *
    oneMinusTSquared *
    t

  const c =
    3 *
    oneMinusT *
    tSquared

  const d =
    tSquared *
    t

  out.set(
    0,
    0,
    0,
  )

  out.addScaledVector(
    p0,
    a,
  )

  out.addScaledVector(
    p1,
    b,
  )

  out.addScaledVector(
    p2,
    c,
  )

  out.addScaledVector(
    p3,
    d,
  )

  return out
}

function CameraSystem() {
  const { camera } =
    useThree()

  const { phase } =
    useExperienceState()

  const targetPosition =
    useMemo(
      () =>
        new Vector3(),
      [],
    )

  const targetLookAt =
    useMemo(
      () =>
        new Vector3(),
      [],
    )

  const currentLookAt =
    useMemo(
      () =>
        new Vector3(
          0,
          1.6,
          -1.7,
        ),
      [],
    )

  const domeStartPosition =
    useMemo(
      () =>
        new Vector3(
          ...CAMERA_CONFIG
            .telescopeAlignment
            .position,
        ),
      [],
    )

  const domeControlPositionA =
    useMemo(
      () =>
        new Vector3(
          2.08,
          2.45,
          2.48,
        ),
      [],
    )

  const domeControlPositionB =
    useMemo(
      () =>
        new Vector3(
          1.45,
          3.75,
          3.2,
        ),
      [],
    )

  const domeEndPosition =
    useMemo(
      () =>
        new Vector3(
          ...CAMERA_CONFIG
            .skyExploration
            .position,
        ),
      [],
    )

  const domeStartLookAt =
    useMemo(
      () =>
        new Vector3(
          ...CAMERA_CONFIG
            .telescopeAlignment
            .lookAt,
        ),
      [],
    )

  const domeControlLookAtA =
    useMemo(
      () =>
        new Vector3(
          0.72,
          2.6,
          -1.3,
        ),
      [],
    )

  const domeControlLookAtB =
    useMemo(
      () =>
        new Vector3(
          0.25,
          5.5,
          -0.55,
        ),
      [],
    )

  const domeEndLookAt =
    useMemo(
      () =>
        new Vector3(
          ...CAMERA_CONFIG
            .skyExploration
            .lookAt,
        ),
      [],
    )

  const skyPosition =
    useMemo(
      () =>
        new Vector3(
          ...CAMERA_CONFIG
            .skyExploration
            .position,
        ),
      [],
    )

  const skyLookAt =
    useMemo(
      () =>
        new Vector3(
          ...CAMERA_CONFIG
            .skyExploration
            .lookAt,
        ),
      [],
    )

  useFrame(
    (state, delta) => {
      /*
       * =========================================================
       * DOME OPENING
       * =========================================================
       */

      if (
        phase ===
        EXPERIENCE_STATES.DOME_OPENING
      ) {
        const timeline =
          getDomeOpeningState(
            state.clock.elapsedTime,
          )

        const cinematicT =
          MathUtils.smoothstep(
            timeline.camera,
            0,
            1,
          )

        cubicBezier(
          targetPosition,
          domeStartPosition,
          domeControlPositionA,
          domeControlPositionB,
          domeEndPosition,
          cinematicT,
        )

        cubicBezier(
          targetLookAt,
          domeStartLookAt,
          domeControlLookAtA,
          domeControlLookAtB,
          domeEndLookAt,
          cinematicT,
        )

        const positionAlpha =
          1 -
          Math.exp(
            -delta * 4.5,
          )

        const rotationAlpha =
          1 -
          Math.exp(
            -delta * 5,
          )

        camera.position.lerp(
          targetPosition,
          positionAlpha,
        )

        currentLookAt.lerp(
          targetLookAt,
          rotationAlpha,
        )

        camera.lookAt(
          currentLookAt,
        )

        return
      }

      /*
       * =========================================================
       * SKY + DISCOVERY
       * =========================================================
       *
       * The camera is now part of the celestial composition.
       * Both states intentionally share the exact frame.
       */

      if (
        phase ===
          EXPERIENCE_STATES.SKY_EXPLORATION ||
        phase ===
          EXPERIENCE_STATES.DISCOVERY ||
        phase ===
          EXPERIENCE_STATES.ENDING
      ) {
        camera.position.copy(
          skyPosition,
        )

        currentLookAt.copy(
          skyLookAt,
        )

        camera.lookAt(
          currentLookAt,
        )

        return
      }

      /*
       * =========================================================
       * NORMAL STATE CAMERAS
       * =========================================================
       */

      const config =
        CAMERA_CONFIG[phase] ??
        CAMERA_CONFIG[
          EXPERIENCE_STATES.ARRIVAL
        ]

      targetPosition.set(
        ...config.position,
      )

      targetLookAt.set(
        ...config.lookAt,
      )

      const positionAlpha =
        1 -
        Math.exp(
          -delta * 3.2,
        )

      const rotationAlpha =
        1 -
        Math.exp(
          -delta * 4.2,
        )

      camera.position.lerp(
        targetPosition,
        positionAlpha,
      )

      currentLookAt.lerp(
        targetLookAt,
        rotationAlpha,
      )

      camera.lookAt(
        currentLookAt,
      )
    },
  )

  return null
}

export default CameraSystem