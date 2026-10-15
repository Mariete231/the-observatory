import { useFrame } from '@react-three/fiber'
import {
  useMemo,
  useRef,
} from 'react'
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  MathUtils,
} from 'three'
import {
  EXPERIENCE_STATES,
  useExperienceState,
} from '../../state/experienceMachine'
import {
  getDomeOpeningState,
} from '../../data/domeOpeningTimeline'

const FAINT_STAR_COUNT = 620
const MID_STAR_COUNT = 170
const BRIGHT_STAR_COUNT = 42
const CLUSTER_STAR_COUNT = 120
const DUST_STAR_COUNT = 220

const TWO_PI =
  Math.PI * 2

function createSeededRandom(
  seed = 1337,
) {
  let value = seed

  return () => {
    value =
      (
        value * 1664525 +
        1013904223
      ) %
      4294967296

    return (
      value /
      4294967296
    )
  }
}

function createUpperSkyDirection(
  random,
  verticalBias = 0.76,
) {
  const y =
    Math.pow(
      random(),
      verticalBias,
    )

  const horizontalRadius =
    Math.sqrt(
      Math.max(
        0,
        1 -
          y * y,
      ),
    )

  const angle =
    random() *
    TWO_PI

  return {
    x:
      Math.cos(angle) *
      horizontalRadius,

    y,

    z:
      Math.sin(angle) *
      horizontalRadius,
  }
}

function normalizeVector(
  x,
  y,
  z,
) {
  const length =
    Math.sqrt(
      x * x +
        y * y +
        z * z,
    )

  if (
    length ===
    0
  ) {
    return {
      x: 0,
      y: 1,
      z: 0,
    }
  }

  return {
    x:
      x /
      length,

    y:
      y /
      length,

    z:
      z /
      length,
  }
}

function writeStarPosition(
  positions,
  index,
  direction,
  radius,
) {
  positions[
    index * 3
  ] =
    direction.x *
    radius

  positions[
    index * 3 + 1
  ] =
    direction.y *
      radius +
    4.2

  positions[
    index * 3 + 2
  ] =
    direction.z *
    radius
}

function createNaturalStarGeometry(
  count,
  seed,
  verticalBias,
  radiusMin,
  radiusMax,
) {
  const random =
    createSeededRandom(
      seed,
    )

  const positions =
    new Float32Array(
      count * 3,
    )

  for (
    let index = 0;
    index <
    count;
    index += 1
  ) {
    const direction =
      createUpperSkyDirection(
        random,
        verticalBias,
      )

    const radius =
      MathUtils.lerp(
        radiusMin,
        radiusMax,
        Math.pow(
          random(),
          0.72,
        ),
      )

    writeStarPosition(
      positions,
      index,
      direction,
      radius,
    )
  }

  const geometry =
    new BufferGeometry()

  geometry.setAttribute(
    'position',
    new BufferAttribute(
      positions,
      3,
    ),
  )

  return geometry
}

function createClusterStarGeometry(
  count,
  seed,
) {
  const random =
    createSeededRandom(
      seed,
    )

  const positions =
    new Float32Array(
      count * 3,
    )

  const centers = [
    [-0.3, 0.78, -0.55],
    [0.58, 0.7, -0.32],
    [-0.64, 0.62, 0.35],
    [0.12, 0.55, 0.78],
    [0.02, 0.88, 0.12],
  ]

  for (
    let index = 0;
    index <
    count;
    index += 1
  ) {
    const center =
      centers[
        Math.floor(
          random() *
            centers.length,
        )
      ]

    const spread =
      0.035 +
      Math.pow(
        random(),
        1.65,
      ) *
        0.23

    const direction =
      normalizeVector(
        center[0] +
          (
            random() *
              2 -
            1
          ) *
            spread,

        center[1] +
          (
            random() *
              2 -
            1
          ) *
            spread,

        center[2] +
          (
            random() *
              2 -
            1
          ) *
            spread,
      )

    const radius =
      30 +
      random() *
        4.5

    writeStarPosition(
      positions,
      index,
      direction,
      radius,
    )
  }

  const geometry =
    new BufferGeometry()

  geometry.setAttribute(
    'position',
    new BufferAttribute(
      positions,
      3,
    ),
  )

  return geometry
}

function createDustGeometry(
  count,
  seed,
) {
  const random =
    createSeededRandom(
      seed,
    )

  const positions =
    new Float32Array(
      count * 3,
    )

  const bandAngle =
    -0.58

  const cosBand =
    Math.cos(
      bandAngle,
    )

  const sinBand =
    Math.sin(
      bandAngle,
    )

  const width =
    0.25

  let index = 0

  while (
    index <
    count
  ) {
    const direction =
      createUpperSkyDirection(
        random,
        0.82,
      )

    const projected =
      Math.abs(
        direction.x *
            cosBand +
          direction.z *
            sinBand,
      )

    const density =
      Math.exp(
        -(
          projected *
          projected
        ) /
          (
            2 *
            width *
            width
          ),
      )

    if (
      random() >
      density *
        0.54
    ) {
      continue
    }

    writeStarPosition(
      positions,
      index,
      direction,
      30.5 +
        random() *
          4.5,
    )

    index += 1
  }

  const geometry =
    new BufferGeometry()

  geometry.setAttribute(
    'position',
    new BufferAttribute(
      positions,
      3,
    ),
  )

  return geometry
}

function ObservatorySky() {
  const { phase } =
    useExperienceState()

  const skyGroupRef =
    useRef(null)

  const skyMaterialRef =
    useRef(null)

  const dustMaterialRef =
    useRef(null)

  const faintStarMaterialRef =
    useRef(null)

  const midStarMaterialRef =
    useRef(null)

  const clusterStarMaterialRef =
    useRef(null)

  const brightStarMaterialRef =
    useRef(null)

  const horizonMaterialRef =
    useRef(null)

  const skyStoryStartRef =
    useRef(null)

  const previousPhaseRef =
    useRef(phase)

  const faintStarGeometry =
    useMemo(
      () =>
        createNaturalStarGeometry(
          FAINT_STAR_COUNT,
          1847,
          0.84,
          28.5,
          37,
        ),
      [],
    )

  const midStarGeometry =
    useMemo(
      () =>
        createNaturalStarGeometry(
          MID_STAR_COUNT,
          9211,
          0.77,
          29,
          36,
        ),
      [],
    )

  const clusterStarGeometry =
    useMemo(
      () =>
        createClusterStarGeometry(
          CLUSTER_STAR_COUNT,
          5173,
        ),
      [],
    )

  const brightStarGeometry =
    useMemo(
      () =>
        createNaturalStarGeometry(
          BRIGHT_STAR_COUNT,
          7331,
          0.73,
          30,
          35,
        ),
      [],
    )

  const dustGeometry =
    useMemo(
      () =>
        createDustGeometry(
          DUST_STAR_COUNT,
          4307,
        ),
      [],
    )

  useFrame(
    (state, delta) => {
      const enteredSky =
        phase ===
          EXPERIENCE_STATES.SKY_EXPLORATION &&
        previousPhaseRef.current !==
          EXPERIENCE_STATES.SKY_EXPLORATION

      if (
        enteredSky
      ) {
        skyStoryStartRef.current =
          state.clock.elapsedTime
      }

      if (
        phase ===
        EXPERIENCE_STATES.ARRIVAL
      ) {
        skyStoryStartRef.current =
          null
      }

      previousPhaseRef.current =
        phase

      const isOpening =
        phase ===
        EXPERIENCE_STATES.DOME_OPENING

      const isSkyPhase =
        phase ===
          EXPERIENCE_STATES.SKY_EXPLORATION ||
        phase ===
          EXPERIENCE_STATES.DISCOVERY ||
        phase ===
          EXPERIENCE_STATES.ENDING

      const openingTimeline =
        isOpening
          ? getDomeOpeningState(
              state.clock.elapsedTime,
            )
          : null

      const skyProgress =
        isOpening
          ? MathUtils.smoothstep(
              openingTimeline.sky,
              0,
              1,
            )
          : isSkyPhase
            ? 1
            : 0

      if (
        phase ===
          EXPERIENCE_STATES.SKY_EXPLORATION &&
        skyStoryStartRef.current ===
          null
      ) {
        skyStoryStartRef.current =
          state.clock.elapsedTime
      }

      if (
        skyGroupRef.current &&
        phase ===
          EXPERIENCE_STATES.DOME_OPENING
      ) {
        skyGroupRef.current.rotation.y +=
          delta *
          0.00055

        skyGroupRef.current.rotation.x =
          Math.sin(
            state.clock.elapsedTime *
              0.026,
          ) *
          0.003
      }

      if (
        skyGroupRef.current &&
        (
          phase ===
            EXPERIENCE_STATES.SKY_EXPLORATION ||
          phase ===
            EXPERIENCE_STATES.DISCOVERY ||
          phase ===
            EXPERIENCE_STATES.ENDING
        )
      ) {
        skyGroupRef.current.rotation.y =
          0

        skyGroupRef.current.rotation.x =
          0
      }

      if (
        skyMaterialRef.current
      ) {
        skyMaterialRef.current.opacity =
          MathUtils.damp(
            skyMaterialRef.current.opacity,
            skyProgress *
              0.11,
            3,
            delta,
          )
      }

      if (
        dustMaterialRef.current
      ) {
        dustMaterialRef.current.opacity =
          MathUtils.damp(
            dustMaterialRef.current.opacity,
            skyProgress *
              0.085,
            3,
            delta,
          )
      }

      if (
        horizonMaterialRef.current
      ) {
        horizonMaterialRef.current.opacity =
          MathUtils.damp(
            horizonMaterialRef.current.opacity,
            skyProgress *
              0.05,
            3.5,
            delta,
          )
      }

      if (
        faintStarMaterialRef.current
      ) {
        faintStarMaterialRef.current.opacity =
          MathUtils.damp(
            faintStarMaterialRef.current.opacity,
            skyProgress *
              0.68,
            3.8,
            delta,
          )
      }

      if (
        midStarMaterialRef.current
      ) {
        midStarMaterialRef.current.opacity =
          MathUtils.damp(
            midStarMaterialRef.current.opacity,
            skyProgress *
              0.8,
            3.5,
            delta,
          )
      }

      if (
        clusterStarMaterialRef.current
      ) {
        clusterStarMaterialRef.current.opacity =
          MathUtils.damp(
            clusterStarMaterialRef.current.opacity,
            skyProgress *
              0.83,
            3.5,
            delta,
          )
      }

      if (
        brightStarMaterialRef.current
      ) {
        const breathing =
          0.94 +
          Math.sin(
            state.clock.elapsedTime *
              0.24,
          ) *
            0.022

        brightStarMaterialRef.current.opacity =
          MathUtils.damp(
            brightStarMaterialRef.current.opacity,
            skyProgress *
              0.9 *
              breathing,
            3.2,
            delta,
          )
      }
    },
  )

  return (
    <group
      ref={skyGroupRef}
    >
      {/* Deep night atmosphere */}
      <mesh
        raycast={() => null}
      >
        <sphereGeometry
          args={[
            46,
            56,
            32,
          ]}
        />

        <meshBasicMaterial
          ref={
            skyMaterialRef
          }
          color="#07111a"
          side={BackSide}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Subtle horizon haze */}
      <mesh
        position={[
          0,
          8,
          -1.5,
        ]}
        scale={[
          1.8,
          0.9,
          1,
        ]}
        raycast={() => null}
      >
        <sphereGeometry
          args={[
            11,
            32,
            16,
          ]}
        />

        <meshBasicMaterial
          ref={
            horizonMaterialRef
          }
          color="#1c394f"
          transparent
          opacity={0}
          depthWrite={false}
          depthTest={false}
          blending={
            AdditiveBlending
          }
          toneMapped={false}
          side={BackSide}
        />
      </mesh>

      {/* Faint stars */}
      <points
        raycast={() => null}
        frustumCulled={false}
        renderOrder={20}
      >
        <primitive
          object={
            faintStarGeometry
          }
          attach="geometry"
        />

        <pointsMaterial
          ref={
            faintStarMaterialRef
          }
          color="#93aabd"
          size={1.05}
          sizeAttenuation={false}
          transparent
          opacity={0}
          depthWrite={false}
          depthTest={false}
          blending={
            AdditiveBlending
          }
          toneMapped={false}
        />
      </points>

      {/* Milky Way dust */}
      <points
        raycast={() => null}
        frustumCulled={false}
        renderOrder={21}
      >
        <primitive
          object={
            dustGeometry
          }
          attach="geometry"
        />

        <pointsMaterial
          ref={
            dustMaterialRef
          }
          color="#657f93"
          size={1.15}
          sizeAttenuation={false}
          transparent
          opacity={0}
          depthWrite={false}
          depthTest={false}
          blending={
            AdditiveBlending
          }
          toneMapped={false}
        />
      </points>

      {/* Mid stars */}
      <points
        raycast={() => null}
        frustumCulled={false}
        renderOrder={22}
      >
        <primitive
          object={
            midStarGeometry
          }
          attach="geometry"
        />

        <pointsMaterial
          ref={
            midStarMaterialRef
          }
          color="#becedb"
          size={1.3}
          sizeAttenuation={false}
          transparent
          opacity={0}
          depthWrite={false}
          depthTest={false}
          blending={
            AdditiveBlending
          }
          toneMapped={false}
        />
      </points>

      {/* Stellar clusters */}
      <points
        raycast={() => null}
        frustumCulled={false}
        renderOrder={23}
      >
        <primitive
          object={
            clusterStarGeometry
          }
          attach="geometry"
        />

        <pointsMaterial
          ref={
            clusterStarMaterialRef
          }
          color="#d0dde7"
          size={1.45}
          sizeAttenuation={false}
          transparent
          opacity={0}
          depthWrite={false}
          depthTest={false}
          blending={
            AdditiveBlending
          }
          toneMapped={false}
        />
      </points>

      {/* Bright natural stars */}
      <points
        raycast={() => null}
        frustumCulled={false}
        renderOrder={24}
      >
        <primitive
          object={
            brightStarGeometry
          }
          attach="geometry"
        />

        <pointsMaterial
          ref={
            brightStarMaterialRef
          }
          color="#f1f6fa"
          size={1.9}
          sizeAttenuation={false}
          transparent
          opacity={0}
          depthWrite={false}
          depthTest={false}
          blending={
            AdditiveBlending
          }
          toneMapped={false}
        />
      </points>

      {/* Very distant celestial glow */}
      <mesh
        position={[
          0,
          30,
          -10,
        ]}
        raycast={() => null}
        renderOrder={5}
      >
        <sphereGeometry
          args={[
            1.2,
            24,
            24,
          ]}
        />

        <meshBasicMaterial
          color="#d9e9f6"
          transparent
          opacity={0.025}
          depthWrite={false}
          depthTest={false}
          toneMapped={false}
          blending={
            AdditiveBlending
          }
        />
      </mesh>
    </group>
  )
}

export default ObservatorySky