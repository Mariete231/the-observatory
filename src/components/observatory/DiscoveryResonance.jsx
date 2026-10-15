import {
  useFrame,
  useThree,
} from '@react-three/fiber'
import {
  useEffect,
  useRef,
} from 'react'
import {
  AdditiveBlending,
  MathUtils,
  Vector2,
  Vector3,
} from 'three'
import {
  EXPERIENCE_STATES,
  dispatchExperience,
  useExperienceState,
} from '../../state/experienceMachine'
import {
  DISCOVERY_RESONANCE,
  ORBIT_PATH,
} from '../../data/discoveryResonance'
import {
  beginDiscoveryResonance,
  completeDiscoveryResonance,
  getDiscoveryResonanceState,
  resetDiscoveryResonance,
  setDiscoveryResonanceEnergy,
  updateDiscoveryResonance,
} from '../../state/discoveryResonanceStore'
import {
  getCelestialSequenceElapsed,
} from '../../state/celestialSequenceStore'

const PATH_POINT_COUNT =
  ORBIT_PATH.length

const PATH_SEGMENT_COUNT =
  Math.max(
    PATH_POINT_COUNT - 1,
    1,
  )

const START_RADIUS =
  DISCOVERY_RESONANCE.startRadius

const CORRIDOR_RADIUS =
  DISCOVERY_RESONANCE.corridorRadius

const BACKTRACK_TOLERANCE =
  DISCOVERY_RESONANCE.backtrackTolerance

const COMPLETION_THRESHOLD =
  DISCOVERY_RESONANCE.completionThreshold

const COMPLETE_HOLD =
  DISCOVERY_RESONANCE.completionHold

const GUIDE_SPEED =
  DISCOVERY_RESONANCE.guideCyclesPerSecond

const SEARCH_AHEAD_SEGMENTS = 18
const SEARCH_BEHIND_SEGMENTS = 3

function clamp01(
  value,
) {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return 0
  }

  return MathUtils.clamp(
    value,
    0,
    1,
  )
}

function pointerToNdc(
  event,
  target,
) {
  const width =
    window.innerWidth

  const height =
    window.innerHeight

  if (
    width <= 0 ||
    height <= 0 ||
    !Number.isFinite(
      event.clientX,
    ) ||
    !Number.isFinite(
      event.clientY,
    )
  ) {
    return false
  }

  target.set(
    (
      event.clientX /
      width
    ) *
      2 -
      1,

    -(
      (
        event.clientY /
        height
      ) *
        2 -
      1
    ),
  )

  return true
}

function distanceToSegment(
  point,
  start,
  end,
) {
  const dx =
    end.x -
    start.x

  const dy =
    end.y -
    start.y

  const lengthSq =
    dx * dx +
    dy * dy

  if (
    lengthSq <=
    Number.EPSILON
  ) {
    const offsetX =
      point.x -
      start.x

    const offsetY =
      point.y -
      start.y

    return {
      distanceSq:
        offsetX *
          offsetX +
        offsetY *
          offsetY,
      t: 0,
    }
  }

  const px =
    point.x -
    start.x

  const py =
    point.y -
    start.y

  const t =
    MathUtils.clamp(
      (
        px * dx +
        py * dy
      ) /
        lengthSq,
      0,
      1,
    )

  const closestX =
    start.x +
    dx * t

  const closestY =
    start.y +
    dy * t

  const offsetX =
    point.x -
    closestX

  const offsetY =
    point.y -
    closestY

  return {
    distanceSq:
      offsetX *
        offsetX +
      offsetY *
        offsetY,
    t,
  }
}

function projectPoint(
  point,
  camera,
  target,
) {
  target.copy(point)
  target.project(camera)

  return (
    Number.isFinite(
      target.x,
    ) &&
    Number.isFinite(
      target.y,
    )
  )
}

function DiscoveryResonance() {
  const { camera } =
    useThree()

  const { phase } =
    useExperienceState()

  const phaseRef =
    useRef(phase)

  const previousPhaseRef =
    useRef(phase)

  const draggingRef =
    useRef(false)

  const pointerIdRef =
    useRef(null)

  const pathPositionRef =
    useRef(0)

  const lastPointerTimeRef =
    useRef(0)

  const completionDispatchRef =
    useRef(false)

  const pointerNdcRef =
    useRef(
      new Vector2(),
    )

  const projectedStartRef =
    useRef(
      new Vector3(),
    )

  const projectedEndRef =
    useRef(
      new Vector3(),
    )

  const guideWorldRef =
    useRef(
      ORBIT_PATH[0]
        ?.clone() ??
      new Vector3(),
    )

  const cursorWorldRef =
    useRef(
      ORBIT_PATH[0]
        ?.clone() ??
      new Vector3(),
    )

  const guideRef =
    useRef(null)

  const guideGlowRef =
    useRef(null)

  const cursorRef =
    useRef(null)

  const cursorGlowRef =
    useRef(null)

  const guideMaterialRef =
    useRef(null)

  const guideGlowMaterialRef =
    useRef(null)

  const cursorMaterialRef =
    useRef(null)

  const cursorGlowMaterialRef =
    useRef(null)

  useEffect(() => {
    phaseRef.current =
      phase
  }, [phase])

  /*
   * -----------------------------------------------------------
   * RESET
   * -----------------------------------------------------------
   */

  useEffect(() => {
    if (
      phase !==
      EXPERIENCE_STATES.SKY_EXPLORATION
    ) {
      resetDiscoveryResonance()

      draggingRef.current =
        false

      pointerIdRef.current =
        null

      pathPositionRef.current =
        0

      lastPointerTimeRef.current =
        0

      completionDispatchRef.current =
        false

      return
    }

    if (
      previousPhaseRef.current !==
      EXPERIENCE_STATES.SKY_EXPLORATION
    ) {
      draggingRef.current =
        false

      pointerIdRef.current =
        null

      pathPositionRef.current =
        0

      lastPointerTimeRef.current =
        0

      completionDispatchRef.current =
        false
    }
  }, [phase])

  /*
   * =========================================================
   * INPUT
   * =========================================================
   */

  useEffect(() => {
    function findClosestPathPosition(
      event,
      startSegment,
      endSegment,
    ) {
      if (
        PATH_POINT_COUNT <
        2
      ) {
        return null
      }

      if (
        !pointerToNdc(
          event,
          pointerNdcRef.current,
        )
      ) {
        return null
      }

      const safeStart =
        Math.max(
          0,
          Math.floor(
            startSegment,
          ),
        )

      const safeEnd =
        Math.min(
          PATH_SEGMENT_COUNT - 1,
          Math.ceil(
            endSegment,
          ),
        )

      let bestDistanceSq =
        Infinity

      let bestPosition =
        pathPositionRef.current

      for (
        let segmentIndex =
          safeStart;
        segmentIndex <=
          safeEnd;
        segmentIndex += 1
      ) {
        const startPoint =
          ORBIT_PATH[
            segmentIndex
          ]

        const endPoint =
          ORBIT_PATH[
            segmentIndex + 1
          ]

        if (
          !startPoint ||
          !endPoint
        ) {
          continue
        }

        if (
          !projectPoint(
            startPoint,
            camera,
            projectedStartRef.current,
          )
        ) {
          continue
        }

        if (
          !projectPoint(
            endPoint,
            camera,
            projectedEndRef.current,
          )
        ) {
          continue
        }

        const result =
          distanceToSegment(
            pointerNdcRef.current,
            projectedStartRef.current,
            projectedEndRef.current,
          )

        if (
          result.distanceSq <
          bestDistanceSq
        ) {
          bestDistanceSq =
            result.distanceSq

          bestPosition =
            segmentIndex +
            result.t
        }
      }

      if (
        !Number.isFinite(
          bestDistanceSq,
        )
      ) {
        return null
      }

      return {
        position:
          bestPosition,
        distance:
          Math.sqrt(
            bestDistanceSq,
          ),
      }
    }

    function handlePointerDown(
      event,
    ) {
      if (
        phaseRef.current !==
        EXPERIENCE_STATES.SKY_EXPLORATION
      ) {
        return
      }

      if (
        draggingRef.current
      ) {
        return
      }

      const resonance =
        getDiscoveryResonanceState()

      if (
        !resonance.active ||
        resonance.completed
      ) {
        return
      }

      /*
       * Start only near Deneb.
       */
      const result =
        findClosestPathPosition(
          event,
          0,
          Math.min(
            4,
            PATH_SEGMENT_COUNT - 1,
          ),
        )

      if (
        !result
      ) {
        return
      }

      if (
        result.distance >
        START_RADIUS
      ) {
        return
      }

      if (
        result.position >
        4
      ) {
        return
      }

      beginDiscoveryResonance()

      pathPositionRef.current =
        Math.max(
          0,
          result.position,
        )

      draggingRef.current =
        true

      pointerIdRef.current =
        event.pointerId

      lastPointerTimeRef.current =
        performance.now()

      event.preventDefault()
    }

    function handlePointerMove(
      event,
    ) {
      if (
        phaseRef.current !==
        EXPERIENCE_STATES.SKY_EXPLORATION
      ) {
        return
      }

      if (
        !draggingRef.current
      ) {
        return
      }

      if (
        pointerIdRef.current !==
        event.pointerId
      ) {
        return
      }

      const currentPosition =
        pathPositionRef.current

      const currentSegment =
        Math.floor(
          currentPosition,
        )

      const result =
        findClosestPathPosition(
          event,
          Math.max(
            0,
            currentSegment -
              SEARCH_BEHIND_SEGMENTS,
          ),
          Math.min(
            PATH_SEGMENT_COUNT - 1,
            currentSegment +
              SEARCH_AHEAD_SEGMENTS,
          ),
        )

      lastPointerTimeRef.current =
        performance.now()

      if (
        !result
      ) {
        setDiscoveryResonanceEnergy(
          0,
        )

        return
      }

      if (
        result.distance >
        CORRIDOR_RADIUS
      ) {
        setDiscoveryResonanceEnergy(
          clamp01(
            1 -
              result.distance /
                (
                  CORRIDOR_RADIUS *
                  1.8
                ),
          ) *
            0.2,
        )

        return
      }

      const minimumAllowed =
        Math.max(
          0,
          currentPosition -
            BACKTRACK_TOLERANCE *
              PATH_SEGMENT_COUNT,
        )

      const nextPosition =
        MathUtils.clamp(
          Math.max(
            result.position,
            minimumAllowed,
          ),
          currentPosition,
          PATH_SEGMENT_COUNT,
        )

      pathPositionRef.current =
        nextPosition

      const progress =
        clamp01(
          nextPosition /
            PATH_SEGMENT_COUNT,
        )

      const energy =
        clamp01(
          1 -
            result.distance /
              CORRIDOR_RADIUS,
        )

      updateDiscoveryResonance(
        progress,
        energy,
      )

      const segmentIndex =
        Math.min(
          Math.floor(
            nextPosition,
          ),
          PATH_POINT_COUNT - 2,
        )

      const segmentT =
        MathUtils.clamp(
          nextPosition -
            segmentIndex,
          0,
          1,
        )

      const startPoint =
        ORBIT_PATH[
          segmentIndex
        ]

      const endPoint =
        ORBIT_PATH[
          segmentIndex + 1
        ]

      if (
        startPoint &&
        endPoint
      ) {
        cursorWorldRef.current.lerpVectors(
          startPoint,
          endPoint,
          segmentT,
        )
      }

      if (
        progress >=
        COMPLETION_THRESHOLD
      ) {
        pathPositionRef.current =
          PATH_SEGMENT_COUNT

        const finalPoint =
          ORBIT_PATH[
            ORBIT_PATH.length - 1
          ] ??
          ORBIT_PATH[0]

        if (
          finalPoint
        ) {
          cursorWorldRef.current.copy(
            finalPoint,
          )
        }

        draggingRef.current =
          false

        pointerIdRef.current =
          null

        completeDiscoveryResonance(
          performance.now() /
            1000,
        )
      }

      event.preventDefault()
    }

    function handlePointerRelease(
      event,
    ) {
      if (
        pointerIdRef.current !==
        event.pointerId
      ) {
        return
      }

      draggingRef.current =
        false

      pointerIdRef.current =
        null

      lastPointerTimeRef.current =
        performance.now()
    }

    window.addEventListener(
      'pointerdown',
      handlePointerDown,
      {
        passive: false,
      },
    )

    window.addEventListener(
      'pointermove',
      handlePointerMove,
      {
        passive: false,
      },
    )

    window.addEventListener(
      'pointerup',
      handlePointerRelease,
    )

    window.addEventListener(
      'pointercancel',
      handlePointerRelease,
    )

    return () => {
      window.removeEventListener(
        'pointerdown',
        handlePointerDown,
      )

      window.removeEventListener(
        'pointermove',
        handlePointerMove,
      )

      window.removeEventListener(
        'pointerup',
        handlePointerRelease,
      )

      window.removeEventListener(
        'pointercancel',
        handlePointerRelease,
      )
    }
  }, [camera])

  /*
   * =========================================================
   * VISUAL LOOP
   * =========================================================
   */

  useFrame(
    (state, delta) => {
      if (
        phase !==
        EXPERIENCE_STATES.SKY_EXPLORATION
      ) {
        previousPhaseRef.current =
          phase

        return
      }

      const resonance =
        getDiscoveryResonanceState()

      /*
       * -------------------------------------------------------
       * GUIDE: DENEB → ALBIREO
       * -------------------------------------------------------
       *
       * This is a finite prelude, not the Discovery sequence itself.
       * The old implementation ping-ponged forever between the two
       * primary lights, which made the new Discovery phase unreachable
       * unless the user happened to complete the hidden drag route.
       *
       * We keep the guide as the invitation, but it now makes one
       * authored forward pass. A user may still take control by
       * beginning the resonance gesture; otherwise the pass completes
       * the resonance automatically at Albireo.
       */
      const guideVisible =
        resonance.active &&
        !resonance.started &&
        !resonance.completed

      if (
        guideVisible &&
        PATH_POINT_COUNT >= 2
      ) {
        const activatedAt =
          resonance.activatedAt ??
          state.clock.elapsedTime

        const elapsed =
          Math.max(
            0,
            state.clock.elapsedTime -
              activatedAt,
          )

        const guideProgress =
          MathUtils.clamp(
            elapsed * GUIDE_SPEED,
            0,
            1,
          )

        const easedProgress =
          MathUtils.smootherstep(
            guideProgress,
            0,
            1,
          )

        const guidePosition =
          easedProgress *
          PATH_SEGMENT_COUNT

        const guideSegment =
          Math.min(
            Math.floor(guidePosition),
            PATH_POINT_COUNT - 2,
          )

        const guideT =
          MathUtils.clamp(
            guidePosition -
              guideSegment,
            0,
            1,
          )

        const startPoint =
          ORBIT_PATH[guideSegment]

        const endPoint =
          ORBIT_PATH[guideSegment + 1]

        if (
          startPoint &&
          endPoint
        ) {
          guideWorldRef.current.lerpVectors(
            startPoint,
            endPoint,
            guideT,
          )
        }

        if (
          guideRef.current
        ) {
          guideRef.current.position.copy(
            guideWorldRef.current,
          )

          guideRef.current.scale.setScalar(
            1 +
              Math.sin(
                state.clock.elapsedTime *
                  3.2,
              ) *
                0.08,
          )
        }

        if (
          guideGlowRef.current
        ) {
          guideGlowRef.current.position.copy(
            guideWorldRef.current,
          )

          guideGlowRef.current.scale.setScalar(
            1.1 +
              Math.sin(
                state.clock.elapsedTime *
                  3.2,
              ) *
                0.12,
          )
        }

        if (
          guideMaterialRef.current
        ) {
          guideMaterialRef.current.opacity =
            MathUtils.damp(
              guideMaterialRef.current
                .opacity,
              0.78,
              8,
              delta,
            )
        }

        if (
          guideGlowMaterialRef.current
        ) {
          guideGlowMaterialRef.current.opacity =
            MathUtils.damp(
              guideGlowMaterialRef.current
                .opacity,
              0.17,
              8,
              delta,
            )
        }

        if (
          guideProgress >= 1
        ) {
          completeDiscoveryResonance(
            getCelestialSequenceElapsed(),
          )
        }
      } else {
        if (
          guideMaterialRef.current
        ) {
          guideMaterialRef.current.opacity =
            MathUtils.damp(
              guideMaterialRef.current
                .opacity,
              0,
              8,
              delta,
            )
        }

        if (
          guideGlowMaterialRef.current
        ) {
          guideGlowMaterialRef.current.opacity =
            MathUtils.damp(
              guideGlowMaterialRef.current
                .opacity,
              0,
              8,
              delta,
            )
        }
      }

      /*
       * -------------------------------------------------------
       * USER CURSOR
       * -------------------------------------------------------
       */

      if (
        cursorRef.current
      ) {
        cursorRef.current.position.lerp(
          cursorWorldRef.current,
          1 -
            Math.exp(
              -delta * 16,
            ),
        )
      }

      if (
        cursorGlowRef.current
      ) {
        cursorGlowRef.current.position.copy(
          cursorWorldRef.current,
        )
      }

      const energy =
        resonance.active
          ? clamp01(
              resonance.energy,
            )
          : 0

      const cursorVisible =
        resonance.started &&
        !resonance.completed

      if (
        cursorMaterialRef.current
      ) {
        cursorMaterialRef.current.opacity =
          MathUtils.damp(
            cursorMaterialRef.current
              .opacity,
            cursorVisible
              ? 0.55 +
                  energy *
                    0.45
              : 0,
            8,
            delta,
          )
      }

      if (
        cursorGlowMaterialRef.current
      ) {
        cursorGlowMaterialRef.current.opacity =
          MathUtils.damp(
            cursorGlowMaterialRef.current
              .opacity,
            cursorVisible
              ? 0.08 +
                  energy *
                    0.16
              : 0,
            7,
            delta,
          )
      }

      /*
       * -------------------------------------------------------
       * ENERGY DECAY
       * -------------------------------------------------------
       */

      if (
        resonance.started &&
        !resonance.completed &&
        !draggingRef.current &&
        lastPointerTimeRef.current >
          0
      ) {
        const idleTime =
          (
            performance.now() -
            lastPointerTimeRef.current
          ) /
          1000

        if (
          idleTime >
          0.12
        ) {
          setDiscoveryResonanceEnergy(
            MathUtils.damp(
              resonance.energy,
              0,
              8,
              delta,
            ),
          )
        }
      }

      /*
       * -------------------------------------------------------
       * DISCOVERY
       * -------------------------------------------------------
       */

      if (
        resonance.completed &&
        resonance.completedAt !==
          null &&
        !completionDispatchRef.current
      ) {
        const completedElapsed =
          getCelestialSequenceElapsed() -
          resonance.completedAt

        if (
          completedElapsed >=
          COMPLETE_HOLD
        ) {
          completionDispatchRef.current =
            true

          dispatchExperience({
            type:
              'REVEAL_DISCOVERY',
          })
        }
      }

      previousPhaseRef.current =
        phase
    },
  )

  if (
    phase !==
    EXPERIENCE_STATES.SKY_EXPLORATION
  ) {
    return null
  }

  return (
    <group>
      <mesh
        ref={
          guideRef
        }
        renderOrder={60}
        raycast={() => null}
      >
        <sphereGeometry
          args={[
            0.115,
            16,
            16,
          ]}
        />

        <meshBasicMaterial
          ref={
            guideMaterialRef
          }
          color="#f5fbff"
          transparent
          opacity={0}
          depthWrite={false}
          depthTest={false}
          blending={
            AdditiveBlending
          }
          toneMapped={false}
        />
      </mesh>

      <mesh
        ref={
          guideGlowRef
        }
        renderOrder={59}
        raycast={() => null}
      >
        <sphereGeometry
          args={[
            0.32,
            16,
            16,
          ]}
        />

        <meshBasicMaterial
          ref={
            guideGlowMaterialRef
          }
          color="#8dc9e8"
          transparent
          opacity={0}
          depthWrite={false}
          depthTest={false}
          blending={
            AdditiveBlending
          }
          toneMapped={false}
        />
      </mesh>

      <mesh
        ref={
          cursorRef
        }
        renderOrder={61}
        raycast={() => null}
      >
        <sphereGeometry
          args={[
            0.08,
            16,
            16,
          ]}
        />

        <meshBasicMaterial
          ref={
            cursorMaterialRef
          }
          color="#ffffff"
          transparent
          opacity={0}
          depthWrite={false}
          depthTest={false}
          blending={
            AdditiveBlending
          }
          toneMapped={false}
        />
      </mesh>

      <mesh
        ref={
          cursorGlowRef
        }
        renderOrder={60}
        raycast={() => null}
      >
        <sphereGeometry
          args={[
            0.24,
            16,
            16,
          ]}
        />

        <meshBasicMaterial
          ref={
            cursorGlowMaterialRef
          }
          color="#8dc9e8"
          transparent
          opacity={0}
          depthWrite={false}
          depthTest={false}
          blending={
            AdditiveBlending
          }
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

export default DiscoveryResonance