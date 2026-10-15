import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BufferGeometry,
  MathUtils,
} from 'three'
import {
  EXPERIENCE_STATES,
  useExperienceState,
} from '../../state/experienceMachine'
import {
  activateDiscoveryResonance,
  getDiscoveryResonanceState,
} from '../../state/discoveryResonanceStore'
import {
  CYGNUS_COMPLETE_TIME,
  CYGNUS_CONNECTION_REVEAL_DELAY,
  CYGNUS_CONNECTION_REVEAL_DURATION,
  CYGNUS_CONNECTION_START,
  CYGNUS_RESONANCE_UNLOCK_DELAY,
  CYGNUS_REVEAL_DELAY,
  CYGNUS_REVEAL_DURATION,
  CYGNUS_REVEAL_ORDER,
  CYGNUS_STARS,
  CYGNUS_VISIBLE_CONNECTIONS,
  createCygnusConnectionCurve,
} from '../../data/cygnusData'

function CelestialConstellation({ storyClockRef }) {
  const phase = useExperienceState()

  const starMaterialsRef = useRef([])
  const glowMaterialsRef = useRef([])
  const connectionMaterialsRef = useRef([])
  const resonanceUnlockedRef = useRef(false)

  const connectionGeometries = useMemo(
    () =>
      CYGNUS_VISIBLE_CONNECTIONS.map((_, index) => {
        const curve = createCygnusConnectionCurve(index)

        if (!curve) {
          return null
        }

        return new BufferGeometry().setFromPoints(
          curve.getPoints(24),
        )
      }),
    [],
  )

  useFrame((state) => {
    const isSkyPhase =
      phase === EXPERIENCE_STATES.SKY_EXPLORATION ||
      phase === EXPERIENCE_STATES.DISCOVERY ||
      phase === EXPERIENCE_STATES.ENDING

    if (!isSkyPhase) {
      starMaterialsRef.current.forEach((material) => {
        if (material) {
          material.opacity = 0
        }
      })

      glowMaterialsRef.current.forEach((material) => {
        if (material) {
          material.opacity = 0
        }
      })

      connectionMaterialsRef.current.forEach((material) => {
        if (material) {
          material.opacity = 0
        }
      })

      if (phase === EXPERIENCE_STATES.ARRIVAL) {
        resonanceUnlockedRef.current = false
      }

      return
    }

    const elapsed =
      storyClockRef?.current?.elapsed ?? 0

    const revealComplete =
      elapsed >= CYGNUS_COMPLETE_TIME

    if (
      revealComplete &&
      elapsed >=
        CYGNUS_COMPLETE_TIME +
          CYGNUS_RESONANCE_UNLOCK_DELAY &&
      !resonanceUnlockedRef.current
    ) {
      const resonanceState =
        getDiscoveryResonanceState()

      if (!resonanceState.active) {
        activateDiscoveryResonance(
          elapsed,
        )
      }

      resonanceUnlockedRef.current = true
    }

    const resonanceState =
      getDiscoveryResonanceState()

    const resonanceEnergy =
      resonanceState.active
        ? resonanceState.energy
        : 0

    CYGNUS_REVEAL_ORDER.forEach(
      (starIndex, revealIndex) => {
        const material =
          starMaterialsRef.current[starIndex]

        const glowMaterial =
          glowMaterialsRef.current[starIndex]

        if (!material || !glowMaterial) {
          return
        }

        const revealStart =
          CYGNUS_FIRST_DELAY +
          revealIndex * CYGNUS_REVEAL_DELAY

        const revealProgress = MathUtils.smootherstep(
          MathUtils.clamp(
            (elapsed - revealStart) /
              CYGNUS_REVEAL_DURATION,
            0,
            1,
          ),
          0,
          1,
        )

        const star = CYGNUS_STARS[starIndex]

        const isPrimary = star.primary

        const baseOpacity = isPrimary
          ? 0.96
          : 0.5

        let pulse = 1

        if (isPrimary && revealComplete) {
          pulse =
            1 +
            Math.sin(
              state.clock.elapsedTime * 1.65,
            ) *
              0.08
        }

        if (
          isPrimary &&
          resonanceState.active
        ) {
          pulse += resonanceEnergy * 0.28
        }

        material.opacity =
          revealProgress *
          baseOpacity *
          pulse

        glowMaterial.opacity =
          revealProgress *
          (isPrimary ? 0.16 : 0.045) *
          (1 + resonanceEnergy * 0.9)

        const scale =
          isPrimary
            ? 1 + resonanceEnergy * 0.18
            : 1 + resonanceEnergy * 0.06

        const group =
          starGroupsRef.current[starIndex]

        if (group) {
          group.scale.setScalar(
            scale,
          )
        }
      },
    )

    CYGNUS_VISIBLE_CONNECTIONS.forEach(
      (_, connectionIndex) => {
        const material =
          connectionMaterialsRef.current[
            connectionIndex
          ]

        if (!material) {
          return
        }

        const connectionStart =
          CYGNUS_CONNECTION_START +
          connectionIndex *
            CYGNUS_CONNECTION_REVEAL_DELAY

        const revealProgress =
          MathUtils.smootherstep(
            MathUtils.clamp(
              (elapsed -
                connectionStart) /
                CYGNUS_CONNECTION_REVEAL_DURATION,
              0,
              1,
            ),
            0,
            1,
          )

        const isResonanceSpine =
          connectionIndex === 0 ||
          connectionIndex === 1

        const baseOpacity =
          isResonanceSpine
            ? 0.65
            : 0.3

        const energyBoost =
          isResonanceSpine
            ? resonanceEnergy * 0.38
            : resonanceEnergy * 0.08

        material.opacity =
          revealProgress *
          (baseOpacity + energyBoost)
      },
    )
  })

  const starGroupsRef = useRef([])

  return (
    <group
      visible={
        phase ===
          EXPERIENCE_STATES.SKY_EXPLORATION ||
        phase ===
          EXPERIENCE_STATES.DISCOVERY ||
        phase ===
          EXPERIENCE_STATES.ENDING
      }
      renderOrder={20}
    >
      {connectionGeometries.map(
        (geometry, index) => {
          if (!geometry) {
            return null
          }

          return (
            <line
              key={`cygnus-connection-${index}`}
              geometry={geometry}
              renderOrder={20}
            >
              <lineBasicMaterial
                ref={(node) => {
                  connectionMaterialsRef.current[index] =
                    node
                }}
                transparent
                opacity={0}
                depthWrite={false}
                depthTest={false}
                blending={AdditiveBlending}
                toneMapped={false}
              />
            </line>
          )
        },
      )}

      {CYGNUS_STARS.map((star, index) => {
        const primary = star.primary

        return (
          <group
            key={star.id}
            ref={(node) => {
              starGroupsRef.current[index] =
                node
            }}
            position={star.position}
          >
            <mesh renderOrder={22}>
              <sphereGeometry
                args={[
                  primary ? 0.23 : 0.13,
                  16,
                  16,
                ]}
              />
              <meshBasicMaterial
                ref={(node) => {
                  starMaterialsRef.current[index] =
                    node
                }}
                transparent
                opacity={0}
                depthWrite={false}
                depthTest={false}
                blending={AdditiveBlending}
                toneMapped={false}
              />
            </mesh>

            <mesh renderOrder={21}>
              <sphereGeometry
                args={[
                  primary ? 0.56 : 0.32,
                  20,
                  20,
                ]}
              />
              <meshBasicMaterial
                ref={(node) => {
                  glowMaterialsRef.current[index] =
                    node
                }}
                transparent
                opacity={0}
                depthWrite={false}
                depthTest={false}
                blending={AdditiveBlending}
                toneMapped={false}
              />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

export default CelestialConstellation