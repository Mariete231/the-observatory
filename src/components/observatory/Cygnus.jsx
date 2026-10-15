import { useFrame } from '@react-three/fiber'
import {
  useMemo,
  useRef,
} from 'react'
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
  CYGNUS_CONNECTION_REVEAL_DELAY,
  CYGNUS_CONNECTION_REVEAL_DURATION,
  CYGNUS_CONNECTION_START,
  CYGNUS_FIRST_DELAY,
  CYGNUS_REVEAL_DELAY,
  CYGNUS_REVEAL_DURATION,
  CYGNUS_REVEAL_ORDER,
  CYGNUS_STARS,
  CYGNUS_VISIBLE_CONNECTIONS,
  createCygnusConnectionCurve,
} from '../../data/cygnusData'
import {
  getDiscoveryResonanceState,
} from '../../state/discoveryResonanceStore'
import {
  getCelestialSequenceElapsed,
  isCelestialSequenceActive,
} from '../../state/celestialSequenceStore'

function createConnectionGeometry(
  connectionIndex,
) {
  const curve =
    createCygnusConnectionCurve(
      connectionIndex,
    )

  if (!curve) {
    return null
  }

  const points =
    curve.getPoints(
      24,
    )

  const geometry =
    new BufferGeometry()

  geometry.setFromPoints(
    points,
  )

  return geometry
}

function Cygnus() {
  const { phase } =
    useExperienceState()

  const starGroupRefs =
    useRef([])

  const starMaterialRefs =
    useRef([])

  const starGlowRefs =
    useRef([])

  const connectionMaterialRefs =
    useRef([])

  const geometries =
    useMemo(
      () =>
        CYGNUS_VISIBLE_CONNECTIONS.map(
          (
            _,
            connectionIndex,
          ) =>
            createConnectionGeometry(
              connectionIndex,
            ),
        ),
      [],
    )

  useFrame(
    (state, delta) => {
      const isSkyPhase =
        phase ===
          EXPERIENCE_STATES.SKY_EXPLORATION ||
        phase ===
          EXPERIENCE_STATES.DISCOVERY ||
        phase ===
          EXPERIENCE_STATES.ENDING

      if (
        !isSkyPhase
      ) {
        return
      }

      if (
        !isCelestialSequenceActive()
      ) {
        return
      }

      /*
       * The authored celestial timeline is no
       * longer owned by Cygnus itself.
       */
      const elapsed =
        getCelestialSequenceElapsed()

      const resonance =
        getDiscoveryResonanceState()

      /*
       * ---------------------------------------------------------
       * STARS
       * ---------------------------------------------------------
       */

      CYGNUS_STARS.forEach(
        (
          star,
          index,
        ) => {
          const group =
            starGroupRefs
              .current[index]

          const material =
            starMaterialRefs
              .current[index]

          const glow =
            starGlowRefs
              .current[index]

          if (
            !group ||
            !material
          ) {
            return
          }

          const revealIndex =
            CYGNUS_REVEAL_ORDER.indexOf(
              index,
            )

          const revealStart =
            CYGNUS_FIRST_DELAY +
            revealIndex *
              CYGNUS_REVEAL_DELAY

          const revealProgress =
            MathUtils.clamp(
              (
                elapsed -
                revealStart
              ) /
                CYGNUS_REVEAL_DURATION,
              0,
              1,
            )

          const reveal =
            MathUtils.smootherstep(
              revealProgress,
              0,
              1,
            )

          const isPrimary =
            star.primary === true

          const isDeneb =
            star.id ===
            'deneb'

          /*
           * Primary lights are deliberately more
           * present than the supporting Cygnus stars.
           */
          let targetOpacity =
            reveal *
            (
              isPrimary
                ? 0.9
                : 0.46
            )

          let targetScale =
            1 +
            reveal *
              (
                isPrimary
                  ? 0.11
                  : 0.035
              )

          /*
           * -----------------------------------------------------
           * RESONANCE RESPONSE
           * -----------------------------------------------------
           */

          if (
            resonance.active &&
            !resonance.completed
          ) {
            const progress =
              MathUtils.clamp(
                resonance.progress,
                0,
                1,
              )

            if (
              isPrimary
            ) {
              targetOpacity =
                Math.min(
                  1,
                  targetOpacity +
                    progress *
                      0.07,
                )

              targetScale +=
                progress *
                0.065
            }

            /*
             * Sadr subtly participates as the shared
             * centre between the two principal lights.
             */
            if (
              star.id ===
              'sadr'
            ) {
              targetOpacity =
                Math.min(
                  1,
                  targetOpacity +
                    progress *
                      0.035,
                )

              targetScale +=
                progress *
                0.025
            }
          }

          /*
           * -----------------------------------------------------
           * COMPLETION PULSE
           * -----------------------------------------------------
           */

          if (
            resonance.completed &&
            resonance.completedAt !==
              null &&
            isPrimary
          ) {
            const completedElapsed =
              elapsed -
              resonance.completedAt

            if (
              completedElapsed >=
                0 &&
              completedElapsed <
                1.6
            ) {
              const pulseProgress =
                MathUtils.clamp(
                  completedElapsed /
                    0.9,
                  0,
                  1,
                )

              const pulse =
                Math.sin(
                  pulseProgress *
                    Math.PI,
                ) *
                Math.exp(
                  -completedElapsed *
                    1.65,
                )

              targetScale +=
                pulse *
                0.22

              targetOpacity =
                Math.min(
                  1,
                  targetOpacity +
                    pulse *
                      0.12,
                )
            }
          }

          /*
           * Deneb has a very subtle independent
           * celestial breathing motion.
           */
          if (
            isDeneb &&
            reveal > 0
          ) {
            targetScale *=
              0.985 +
              Math.sin(
                elapsed *
                  0.82,
              ) *
                0.025
          }

          material.opacity =
            MathUtils.damp(
              material.opacity,
              targetOpacity,
              5,
              delta,
            )

          group.scale.setScalar(
            MathUtils.damp(
              group.scale.x,
              targetScale,
              5,
              delta,
            ),
          )

          if (
            glow
          ) {
            let targetGlowOpacity =
              reveal *
              (
                isPrimary
                  ? 0.2
                  : 0.055
              )

            let targetGlowScale =
              1 +
              reveal *
                (
                  isPrimary
                    ? 0.22
                    : 0.08
                )

            if (
              resonance.active &&
              !resonance.completed &&
              isPrimary
            ) {
              targetGlowOpacity +=
                resonance.progress *
                0.075

              targetGlowScale +=
                resonance.progress *
                0.08
            }

            if (
              resonance.completed &&
              resonance.completedAt !==
                null &&
              isPrimary
            ) {
              const completedElapsed =
                elapsed -
                resonance.completedAt

              if (
                completedElapsed >=
                  0 &&
                completedElapsed <
                  1.6
              ) {
                const pulseProgress =
                  MathUtils.clamp(
                    completedElapsed /
                      0.9,
                    0,
                    1,
                  )

                const pulse =
                  Math.sin(
                    pulseProgress *
                      Math.PI,
                  ) *
                  Math.exp(
                    -completedElapsed *
                      1.65,
                  )

                targetGlowOpacity +=
                  pulse *
                  0.16

                targetGlowScale +=
                  pulse *
                  0.18
              }
            }

            glow.material.opacity =
              MathUtils.damp(
                glow.material.opacity,
                targetGlowOpacity,
                5,
                delta,
              )

            glow.scale.setScalar(
              MathUtils.damp(
                glow.scale.x,
                targetGlowScale,
                5,
                delta,
              ),
            )
          }
        },
      )

      /*
       * ---------------------------------------------------------
       * CONNECTIONS
       * ---------------------------------------------------------
       */

      geometries.forEach(
        (
          geometry,
          index,
        ) => {
          const material =
            connectionMaterialRefs
              .current[index]

          if (
            !material
          ) {
            return
          }

          const revealStart =
            CYGNUS_CONNECTION_START +
            index *
              CYGNUS_CONNECTION_REVEAL_DELAY

          const revealProgress =
            MathUtils.clamp(
              (
                elapsed -
                revealStart
              ) /
                CYGNUS_CONNECTION_REVEAL_DURATION,
              0,
              1,
            )

          const reveal =
            MathUtils.smootherstep(
              revealProgress,
              0,
              1,
            )

          const isSpine =
            index === 0 ||
            index === 1

          const resonanceBoost =
            resonance.active &&
            isSpine
              ? resonance.progress *
                0.055
              : 0

          material.opacity =
            MathUtils.damp(
              material.opacity,
              reveal *
                (
                  isSpine
                    ? 0.14
                    : 0.085
                ) +
                resonanceBoost,
              5,
              delta,
            )
        },
      )
    },
  )

  return (
    <group>
      {geometries.map(
        (
          geometry,
          index,
        ) => (
          <line
            key={`cygnus-line-${index}`}
            geometry={
              geometry
            }
            renderOrder={32}
            raycast={() => null}
          >
            <lineBasicMaterial
              ref={(material) => {
                connectionMaterialRefs
                  .current[index] =
                  material
              }}
              color={
                index === 0 ||
                index === 1
                  ? '#b8d8eb'
                  : '#8fa8ba'
              }
              transparent
              opacity={0}
              depthWrite={false}
              depthTest={false}
              blending={
                AdditiveBlending
              }
              toneMapped={false}
            />
          </line>
        ),
      )}

      {CYGNUS_STARS.map(
        (
          star,
          index,
        ) => {
          const isPrimary =
            star.primary === true

          return (
            <group
              key={`cygnus-star-${star.id}`}
              ref={(group) => {
                starGroupRefs
                  .current[index] =
                  group
              }}
              position={
                star.position
              }
              renderOrder={35}
            >
              <mesh
                ref={(mesh) => {
                  starGlowRefs
                    .current[index] =
                    mesh
                }}
                raycast={() => null}
                renderOrder={35}
              >
                <sphereGeometry
                  args={[
                    isPrimary
                      ? 0.34
                      : 0.18,
                    16,
                    16,
                  ]}
                />

                <meshBasicMaterial
                  color={
                    isPrimary
                      ? '#d7ecff'
                      : '#9eb9cc'
                  }
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
                raycast={() => null}
                renderOrder={36}
              >
                <sphereGeometry
                  args={[
                    isPrimary
                      ? 0.13
                      : 0.067,
                    16,
                    16,
                  ]}
                />

                <meshBasicMaterial
                  ref={(material) => {
                    starMaterialRefs
                      .current[index] =
                      material
                  }}
                  color={
                    isPrimary
                      ? '#ffffff'
                      : '#e4eff8'
                  }
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
        },
      )}
    </group>
  )
}

export default Cygnus