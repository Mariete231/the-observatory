import { useFrame } from '@react-three/fiber'
import {
  useEffect,
  useMemo,
  useRef,
} from 'react'
import {
  AdditiveBlending,
  BufferGeometry,
  LineCurve3,
  MathUtils,
  Vector3,
} from 'three'
import {
  EXPERIENCE_STATES,
  dispatchExperience,
  useExperienceState,
} from '../../state/experienceMachine'
import {
  CYGNUS_STARS,
  CYGNUS_VISIBLE_CONNECTIONS,
  createCygnusConnectionCurve,
} from '../../data/cygnusData'
import {
  DISCOVERY_ROUTE,
  DISCOVERY_TIMELINE,
} from '../../data/discoveryChoreographyData'
import {
  getCelestialSequenceElapsed,
  isCelestialSequenceActive,
} from '../../state/celestialSequenceStore'
import {
  resetDiscoveryChoreography,
  setActiveDiscoveryStage,
} from '../../state/discoveryChoreographyStore'

const STAR_PULSE_DURATION = 1.65
const GUIDE_CORE_SIZE = 0.11
const GUIDE_GLOW_SIZE = 0.3
const FINAL_PULSE_SIZE = 0.42

const STAR_INDEX_BY_ID = Object.freeze(
  CYGNUS_STARS.reduce(
    (result, star, index) => {
      result[star.id] = index
      return result
    },
    {},
  ),
)

function findStar(id) {
  const index = STAR_INDEX_BY_ID[id]

  if (index === undefined) {
    return null
  }

  return CYGNUS_STARS[index]
}

function getCanonicalRoute(stage) {
  const connection =
    CYGNUS_VISIBLE_CONNECTIONS[
      stage.connectionIndex
    ]

  if (!connection) {
    return null
  }

  const fromStar =
    CYGNUS_STARS[connection.from]
  const toStar =
    CYGNUS_STARS[connection.to]

  if (!fromStar || !toStar) {
    return null
  }

  const forward =
    fromStar.id === stage.from &&
    toStar.id === stage.to

  const reverse =
    fromStar.id === stage.to &&
    toStar.id === stage.from

  if (!forward && !reverse) {
    return null
  }

  return {
    curve: createCygnusConnectionCurve(
      stage.connectionIndex,
    ),
    reverse,
  }
}

function createRouteGeometry(route) {
  if (!route?.curve) {
    return null
  }

  const points = route.curve.getPoints(48)

  if (route.reverse) {
    points.reverse()
  }

  const geometry = new BufferGeometry()
  geometry.setFromPoints(points)
  geometry.setDrawRange(0, 0)

  return geometry
}

function createConnectionGeometry(connectionIndex) {
  const curve = createCygnusConnectionCurve(
    connectionIndex,
  )

  if (!curve) {
    return null
  }

  const geometry = new BufferGeometry()
  geometry.setFromPoints(
    curve.getPoints(48),
  )

  return geometry
}

function createFinalBridgeCurve() {
  const deneb = findStar('deneb')
  const albireo = findStar('albireo')

  if (!deneb || !albireo) {
    return null
  }

  return new LineCurve3(
    new Vector3(...deneb.position),
    new Vector3(...albireo.position),
  )
}

function createFinalBridgeGeometry() {
  const curve = createFinalBridgeCurve()

  if (!curve) {
    return null
  }

  const geometry = new BufferGeometry()
  geometry.setFromPoints(
    curve.getPoints(64),
  )
  geometry.setDrawRange(0, 0)

  return geometry
}

function getRoutePoint(
  route,
  progress,
  target,
) {
  if (!route?.curve) {
    return false
  }

  const t = route.reverse
    ? 1 - progress
    : progress

  route.curve.getPoint(
    MathUtils.clamp(t, 0, 1),
    target,
  )

  return true
}

function getLatestArrival(
  elapsed,
  starIndex,
) {
  let latest = -Infinity

  for (const stage of DISCOVERY_TIMELINE.stages) {
    const destinationIndex =
      STAR_INDEX_BY_ID[stage.to]

    if (
      destinationIndex === starIndex &&
      elapsed >= stage.travelEnd
    ) {
      latest = Math.max(
        latest,
        stage.travelEnd,
      )
    }
  }

  return latest
}

function hasSettledConnection(
  elapsed,
  connectionIndex,
) {
  return DISCOVERY_TIMELINE.stages.some(
    (stage) =>
      stage.connectionIndex ===
        connectionIndex &&
      elapsed >= stage.travelEnd,
  )
}

function DiscoveryChoreography() {
  const { phase } = useExperienceState()

  const discoveryStartElapsedRef =
    useRef(null)

  const endingDispatchRef =
    useRef(false)

  const narrativeStageRef =
    useRef(-1)

  const guideRef = useRef(null)
  const guideGlowRef = useRef(null)

  const routeMaterialRefs = useRef([])
  const connectionMaterialRefs =
    useRef([])
  const pulseMaterialRefs =
    useRef([])
  const pulseRefs = useRef([])
  const settledGlowMaterialRefs =
    useRef([])
  const finalPulseRefs = useRef([])
  const finalPulseMaterialRefs =
    useRef([])

  const finalBridgeMaterialRef =
    useRef(null)

  const guidePosition = useMemo(
    () => new Vector3(),
    [],
  )

  const finalBridgeStart = useMemo(() => {
    const star = findStar('deneb')

    return new Vector3(
      ...(star?.position ?? [
        0,
        27.8,
        3.35,
      ]),
    )
  }, [])

  const finalBridgeEnd = useMemo(() => {
    const star = findStar('albireo')

    return new Vector3(
      ...(star?.position ?? [
        0.15,
        27.05,
        -2.65,
      ]),
    )
  }, [])

  const routePaths = useMemo(
    () =>
      DISCOVERY_ROUTE.map(
        getCanonicalRoute,
      ),
    [],
  )

  const routeGeometries = useMemo(
    () =>
      routePaths.map(
        createRouteGeometry,
      ),
    [routePaths],
  )

  const connectionGeometries = useMemo(
    () =>
      CYGNUS_VISIBLE_CONNECTIONS.map(
        (_, index) =>
          createConnectionGeometry(index),
      ),
    [],
  )

  const finalBridgeGeometry = useMemo(
    createFinalBridgeGeometry,
    [],
  )

  useEffect(() => {
    return () => {
      routeGeometries.forEach((geometry) => {
        geometry?.dispose()
      })

      connectionGeometries.forEach(
        (geometry) => {
          geometry?.dispose()
        },
      )

      finalBridgeGeometry?.dispose()
      resetDiscoveryChoreography()
    }
  }, [
    connectionGeometries,
    finalBridgeGeometry,
    routeGeometries,
  ])

  useFrame((state, delta) => {
    if (phase !== EXPERIENCE_STATES.DISCOVERY) {
      discoveryStartElapsedRef.current =
        null
      endingDispatchRef.current = false

      if (
        narrativeStageRef.current !== -1
      ) {
        narrativeStageRef.current = -1
        resetDiscoveryChoreography()
      }

      return
    }

    if (!isCelestialSequenceActive()) {
      return
    }

    if (discoveryStartElapsedRef.current === null) {
      discoveryStartElapsedRef.current =
        getCelestialSequenceElapsed()
    }

    const elapsed =
      Math.max(
        0,
        getCelestialSequenceElapsed() -
          discoveryStartElapsedRef.current,
      )

    if (
      elapsed >= DISCOVERY_TIMELINE.end
    ) {
      if (!endingDispatchRef.current) {
        endingDispatchRef.current = true

        dispatchExperience({
          type: 'START_ENDING',
        })
      }

      return
    }

    let activeStageIndex = -1

    for (
      let index = 0;
      index < DISCOVERY_TIMELINE.stages.length;
      index += 1
    ) {
      const stage =
        DISCOVERY_TIMELINE.stages[index]

      if (
        elapsed >= stage.start &&
        elapsed < stage.end
      ) {
        activeStageIndex = index
        break
      }
    }

    const activeStage =
      activeStageIndex >= 0
        ? DISCOVERY_TIMELINE.stages[
            activeStageIndex
          ]
        : null

    if (
      activeStageIndex !==
      narrativeStageRef.current
    ) {
      narrativeStageRef.current =
        activeStageIndex

      setActiveDiscoveryStage(
        activeStageIndex,
      )
    }

    /* ---------------------------------------------------------
     * SETTLED CONNECTIONS
     * --------------------------------------------------------- */

    connectionMaterialRefs.current.forEach(
      (material, index) => {
        if (!material) {
          return
        }

        const settled = hasSettledConnection(
          elapsed,
          index,
        )

        let targetOpacity = settled
          ? index === 0 || index === 1
            ? 0.24
            : 0.15
          : 0.05

        if (
          activeStage?.connectionIndex ===
          index
        ) {
          targetOpacity = 0.29
        }

        if (
          elapsed >=
          DISCOVERY_TIMELINE.finalBridgeEnd
        ) {
          if (index === 0 || index === 1) {
            targetOpacity = 0.28
          }
        }

        material.opacity = MathUtils.damp(
          material.opacity,
          targetOpacity,
          8,
          delta,
        )
      },
    )

    /* ---------------------------------------------------------
     * TRANSIENT TRAVEL LINE
     * --------------------------------------------------------- */

    routeMaterialRefs.current.forEach(
      (material, index) => {
        const geometry = routeGeometries[index]
        const stage =
          DISCOVERY_TIMELINE.stages[index]

        if (!material || !geometry || !stage) {
          return
        }

        if (index !== activeStageIndex) {
          geometry.setDrawRange(0, 0)
          material.opacity = MathUtils.damp(
            material.opacity,
            0,
            10,
            delta,
          )
          return
        }

        const progress = MathUtils.clamp(
          (elapsed - stage.start) /
            stage.duration,
          0,
          1,
        )

        const eased = MathUtils.smootherstep(
          progress,
          0,
          1,
        )

        const count = Math.max(
          2,
          Math.ceil(
            eased *
              geometry.attributes.position
                .count,
          ),
        )

        geometry.setDrawRange(0, count)

        material.opacity = MathUtils.damp(
          material.opacity,
          progress >= 1 ? 0.24 : 0.48,
          9,
          delta,
        )
      },
    )

    /* ---------------------------------------------------------
     * MOVING GUIDE
     * --------------------------------------------------------- */

    let guideVisible = false

    if (activeStage) {
      const route =
        routePaths[activeStageIndex]

      const progress = MathUtils.clamp(
        (elapsed - activeStage.start) /
          activeStage.duration,
        0,
        1,
      )

      const eased = MathUtils.smootherstep(
        progress,
        0,
        1,
      )

      if (
        getRoutePoint(
          route,
          eased,
          guidePosition,
        )
      ) {
        guideVisible = true
      }
    }

    if (
      elapsed >=
        DISCOVERY_TIMELINE.finalBridgeStart &&
      elapsed <
        DISCOVERY_TIMELINE.finalBridgeEnd
    ) {
      const progress = MathUtils.smootherstep(
        MathUtils.clamp(
          (
            elapsed -
            DISCOVERY_TIMELINE.finalBridgeStart
          ) /
            (
              DISCOVERY_TIMELINE.finalBridgeEnd -
              DISCOVERY_TIMELINE.finalBridgeStart
            ),
          0,
          1,
        ),
        0,
        1,
      )

      guidePosition.lerpVectors(
        finalBridgeStart,
        finalBridgeEnd,
        progress,
      )

      guideVisible = true
    }

    if (guideRef.current) {
      guideRef.current.visible = guideVisible

      if (guideVisible) {
        guideRef.current.position.lerp(
          guidePosition,
          1 - Math.exp(-delta * 14),
        )

        guideRef.current.scale.setScalar(
          1 +
            Math.sin(
              state.clock.elapsedTime * 3.4,
            ) *
              0.08,
        )
      }
    }

    if (guideGlowRef.current) {
      guideGlowRef.current.visible =
        guideVisible

      if (guideVisible) {
        guideGlowRef.current.position.copy(
          guidePosition,
        )

        guideGlowRef.current.scale.setScalar(
          1.08 +
            Math.sin(
              state.clock.elapsedTime * 3.4,
            ) *
              0.11,
        )
      }
    }

    /* ---------------------------------------------------------
     * STAR ARRIVAL PULSES
     * --------------------------------------------------------- */

    pulseRefs.current.forEach(
      (mesh, starIndex) => {
        const material =
          pulseMaterialRefs.current[starIndex]

        if (!mesh || !material) {
          return
        }

        const latestArrival =
          getLatestArrival(
            elapsed,
            starIndex,
          )

        if (latestArrival === -Infinity) {
          material.opacity = MathUtils.damp(
            material.opacity,
            0,
            9,
            delta,
          )
          return
        }

        const pulseElapsed =
          elapsed - latestArrival

        const pulseProgress =
          MathUtils.clamp(
            pulseElapsed / STAR_PULSE_DURATION,
            0,
            1,
          )

        const pulse =
          pulseElapsed >= 0 &&
          pulseElapsed < STAR_PULSE_DURATION
            ? Math.sin(
                pulseProgress * Math.PI,
              )
            : 0

        material.opacity = MathUtils.damp(
          material.opacity,
          pulse * 0.42,
          8,
          delta,
        )

        const targetScale =
          1 + pulse * 2.2

        mesh.scale.setScalar(
          MathUtils.damp(
            mesh.scale.x,
            targetScale,
            8,
            delta,
          ),
        )
      },
    )

    /* ---------------------------------------------------------
     * SETTLED STAR GLOW
     * --------------------------------------------------------- */

    settledGlowMaterialRefs.current.forEach(
      (material, starIndex) => {
        if (!material) {
          return
        }

        const settled =
          starIndex === STAR_INDEX_BY_ID.deneb ||
          getLatestArrival(
            elapsed,
            starIndex,
          ) !== -Infinity

        material.opacity = MathUtils.damp(
          material.opacity,
          settled ? 0.075 : 0,
          6,
          delta,
        )
      },
    )

    /* ---------------------------------------------------------
     * FINAL DIRECT BRIDGE
     * --------------------------------------------------------- */

    const finalBridgeProgress = MathUtils.clamp(
      (
        elapsed -
        DISCOVERY_TIMELINE.finalBridgeStart
      ) /
        (
          DISCOVERY_TIMELINE.finalBridgeEnd -
          DISCOVERY_TIMELINE.finalBridgeStart
        ),
      0,
      1,
    )

    if (finalBridgeGeometry) {
      const count = Math.max(
        0,
        Math.ceil(
          MathUtils.smootherstep(
            finalBridgeProgress,
            0,
            1,
          ) *
            finalBridgeGeometry.attributes
              .position.count,
        ),
      )

      finalBridgeGeometry.setDrawRange(
        0,
        elapsed >=
          DISCOVERY_TIMELINE.finalBridgeStart
          ? count
          : 0,
      )
    }

    if (finalBridgeMaterialRef.current) {
      finalBridgeMaterialRef.current.opacity =
        MathUtils.damp(
          finalBridgeMaterialRef.current.opacity,
          elapsed >=
            DISCOVERY_TIMELINE.finalBridgeStart
            ? 0.36
            : 0,
          8,
          delta,
        )
    }

    /* ---------------------------------------------------------
     * FINAL SYNCHRONIZED PRIMARY PULSE
     * --------------------------------------------------------- */

    const pulseElapsed =
      elapsed -
      DISCOVERY_TIMELINE.finalPulseStart

    const finalPulseProgress =
      MathUtils.clamp(
        pulseElapsed /
          (
            DISCOVERY_TIMELINE.finalPulseEnd -
            DISCOVERY_TIMELINE.finalPulseStart
          ),
        0,
        1,
      )

    const finalPulse =
      pulseElapsed >= 0 &&
      pulseElapsed <=
        (
          DISCOVERY_TIMELINE.finalPulseEnd -
          DISCOVERY_TIMELINE.finalPulseStart
        )
        ? Math.sin(
            finalPulseProgress * Math.PI,
          )
        : 0

    finalPulseRefs.current.forEach(
      (mesh, index) => {
        const material =
          finalPulseMaterialRefs.current[
            index
          ]

        if (!mesh || !material) {
          return
        }

        const isPrimary =
          CYGNUS_STARS[index]?.primary === true

        if (!isPrimary) {
          material.opacity = MathUtils.damp(
            material.opacity,
            0,
            10,
            delta,
          )
          return
        }

        material.opacity = MathUtils.damp(
          material.opacity,
          finalPulse * 0.5,
          8,
          delta,
        )

        mesh.scale.setScalar(
          MathUtils.damp(
            mesh.scale.x,
            1 + finalPulse * 2.4,
            8,
            delta,
          ),
        )
      },
    )
  })

  if (phase !== EXPERIENCE_STATES.DISCOVERY) {
    return null
  }

  return (
    <group renderOrder={70}>
      {connectionGeometries.map(
        (geometry, index) => (
          <line
            key={`discovery-connection-${index}`}
            geometry={geometry}
            renderOrder={70}
            raycast={() => null}
          >
            <lineBasicMaterial
              ref={(material) => {
                connectionMaterialRefs.current[
                  index
                ] = material
              }}
              color={
                index === 0 || index === 1
                  ? '#d8ecfa'
                  : '#a8bdcb'
              }
              transparent
              opacity={0}
              depthWrite={false}
              depthTest={false}
              blending={AdditiveBlending}
              toneMapped={false}
            />
          </line>
        ),
      )}

      {routeGeometries.map(
        (geometry, index) => (
          <line
            key={`discovery-route-${index}`}
            geometry={geometry}
            renderOrder={72}
            raycast={() => null}
          >
            <lineBasicMaterial
              ref={(material) => {
                routeMaterialRefs.current[
                  index
                ] = material
              }}
              color="#e7f6ff"
              transparent
              opacity={0}
              depthWrite={false}
              depthTest={false}
              blending={AdditiveBlending}
              toneMapped={false}
            />
          </line>
        ),
      )}

      <line
        geometry={finalBridgeGeometry}
        renderOrder={73}
        raycast={() => null}
      >
        <lineBasicMaterial
          ref={finalBridgeMaterialRef}
          color="#f0f8ff"
          transparent
          opacity={0}
          depthWrite={false}
          depthTest={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </line>

      {CYGNUS_STARS.map((star, index) => (
        <group
          key={`discovery-star-${star.id}`}
          position={star.position}
          renderOrder={74}
        >
          <mesh
            ref={(mesh) => {
              pulseRefs.current[index] = mesh
            }}
            rotation={[-Math.PI / 2, 0, 0]}
            raycast={() => null}
          >
            <torusGeometry
              args={[0.23, 0.012, 8, 48]}
            />

            <meshBasicMaterial
              ref={(material) => {
                pulseMaterialRefs.current[index] =
                  material
              }}
              color="#d8efff"
              transparent
              opacity={0}
              depthWrite={false}
              depthTest={false}
              blending={AdditiveBlending}
              toneMapped={false}
            />
          </mesh>

          <mesh raycast={() => null}>
            <sphereGeometry
              args={[
                star.primary ? 0.39 : 0.24,
                16,
                16,
              ]}
            />

            <meshBasicMaterial
              ref={(material) => {
                settledGlowMaterialRefs.current[
                  index
                ] = material
              }}
              color="#d8efff"
              transparent
              opacity={0}
              depthWrite={false}
              depthTest={false}
              blending={AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}

      <mesh
        ref={guideGlowRef}
        renderOrder={75}
        raycast={() => null}
      >
        <sphereGeometry
          args={[GUIDE_GLOW_SIZE, 16, 16]}
        />

        <meshBasicMaterial
          color="#8ecae9"
          transparent
          opacity={0.18}
          depthWrite={false}
          depthTest={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      <mesh
        ref={guideRef}
        renderOrder={76}
        raycast={() => null}
      >
        <sphereGeometry
          args={[GUIDE_CORE_SIZE, 16, 16]}
        />

        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.92}
          depthWrite={false}
          depthTest={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {CYGNUS_STARS.map((star, index) => (
        <mesh
          key={`final-pulse-${star.id}`}
          position={star.position}
          scale={0.001}
          ref={(mesh) => {
            finalPulseRefs.current[index] = mesh
          }}
          visible={star.primary === true}
          raycast={() => null}
        >
          <sphereGeometry
            args={[FINAL_PULSE_SIZE, 16, 16]}
          />

          <meshBasicMaterial
            ref={(material) => {
              finalPulseMaterialRefs.current[
                index
              ] = material
            }}
            color="#ffffff"
            transparent
            opacity={0}
            depthWrite={false}
            depthTest={false}
            blending={AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}

export default DiscoveryChoreography
