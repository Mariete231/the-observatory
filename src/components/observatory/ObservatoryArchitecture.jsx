import {
  BackSide,
  QuadraticBezierCurve3,
  Vector3,
} from 'three'
import { useMemo } from 'react'

const ROOM_RADIUS = 6.35
const WALL_HEIGHT = 4.75
const DOME_RISE = 3.05

function WallShell() {
  return (
    <mesh position={[0, WALL_HEIGHT / 2, 0]}>
      <cylinderGeometry
        args={[
          ROOM_RADIUS,
          ROOM_RADIUS,
          WALL_HEIGHT,
          96,
          1,
          true,
          Math.PI,
          Math.PI,
        ]}
      />

      <meshStandardMaterial
        color="#202b34"
        roughness={0.82}
        metalness={0.08}
        side={BackSide}
      />
    </mesh>
  )
}

function WallStructure() {
  const columns = useMemo(() => {
    return Array.from({ length: 9 }, (_, index) => {
      const angle =
        Math.PI +
        (index / 8) * Math.PI

      return {
        angle,
        x:
          Math.cos(angle) *
          (ROOM_RADIUS - 0.08),
        z:
          Math.sin(angle) *
          (ROOM_RADIUS - 0.08),
      }
    })
  }, [])

  return (
    <group>
      {columns.map(({ angle, x, z }, index) => (
        <mesh
          key={index}
          position={[
            x,
            WALL_HEIGHT / 2,
            z,
          ]}
          rotation={[0, -angle, 0]}
          castShadow
        >
          <boxGeometry
            args={[
              0.18,
              WALL_HEIGHT - 0.2,
              0.24,
            ]}
          />

          <meshStandardMaterial
            color="#35434e"
            roughness={0.42}
            metalness={0.65}
          />
        </mesh>
      ))}

      {/* Lower wall rail */}
      <mesh position={[0, 0.32, 0]}>
        <torusGeometry
          args={[
            ROOM_RADIUS - 0.08,
            0.12,
            12,
            96,
            Math.PI,
          ]}
        />

        <meshStandardMaterial
          color="#4d5c66"
          roughness={0.4}
          metalness={0.68}
        />
      </mesh>

      {/* Upper wall rail */}
      <mesh position={[0, WALL_HEIGHT - 0.08, 0]}>
        <torusGeometry
          args={[
            ROOM_RADIUS - 0.06,
            0.14,
            12,
            96,
            Math.PI,
          ]}
        />

        <meshStandardMaterial
          color="#596a75"
          roughness={0.34}
          metalness={0.76}
        />
      </mesh>
    </group>
  )
}

function DomeShell() {
  return (
    <mesh
      position={[0, WALL_HEIGHT, 0]}
      scale={[1, 0.44, 1]}
    >
      <sphereGeometry
        args={[
          ROOM_RADIUS,
          72,
          36,
          Math.PI,
          Math.PI,
          0,
          Math.PI / 2,
        ]}
      />

      <meshStandardMaterial
        color="#18232c"
        roughness={0.86}
        metalness={0.1}
        side={BackSide}
      />
    </mesh>
  )
}

function DomeRibs() {
  const curves = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const angle =
        Math.PI * 1.12 +
        (index / 6) * Math.PI * 0.76

      const start = new Vector3(
        Math.cos(angle) *
          (ROOM_RADIUS - 0.08),
        WALL_HEIGHT - 0.02,
        Math.sin(angle) *
          (ROOM_RADIUS - 0.08),
      )

      const control = new Vector3(
        Math.cos(angle) * 3.95,
        WALL_HEIGHT + 1.65,
        Math.sin(angle) * 3.95,
      )

      const end = new Vector3(
        0,
        WALL_HEIGHT + DOME_RISE,
        0,
      )

      return new QuadraticBezierCurve3(
        start,
        control,
        end,
      )
    })
  }, [])

  return (
    <group>
      {curves.map((curve, index) => (
        <mesh key={index}>
          <tubeGeometry
            args={[
              curve,
              40,
              0.055,
              8,
              false,
            ]}
          />

          <meshStandardMaterial
            color="#4f5e68"
            roughness={0.3}
            metalness={0.78}
          />
        </mesh>
      ))}

      {/* Apex hub */}
      <mesh
        position={[
          0,
          WALL_HEIGHT + DOME_RISE,
          0,
        ]}
        castShadow
      >
        <sphereGeometry
          args={[0.16, 24, 24]}
        />

        <meshStandardMaterial
          color="#62727d"
          roughness={0.26}
          metalness={0.85}
        />
      </mesh>
    </group>
  )
}

function Door() {
  return (
    <group
      position={[0, 1.72, -6.18]}
    >
      <mesh
        position={[0, 0, -0.06]}
        castShadow
      >
        <boxGeometry
          args={[1.95, 3.45, 0.22]}
        />

        <meshStandardMaterial
          color="#27333d"
          roughness={0.55}
          metalness={0.48}
        />
      </mesh>

      <mesh position={[0, 0, 0.07]}>
        <boxGeometry
          args={[1.56, 3.05, 0.04]}
        />

        <meshStandardMaterial
          color="#172127"
          roughness={0.6}
          metalness={0.25}
        />
      </mesh>

      {/* Door frame */}
      <mesh
        position={[-0.93, 0, 0.05]}
      >
        <boxGeometry
          args={[0.12, 3.62, 0.16]}
        />

        <meshStandardMaterial
          color="#50606b"
          roughness={0.34}
          metalness={0.72}
        />
      </mesh>

      <mesh
        position={[0.93, 0, 0.05]}
      >
        <boxGeometry
          args={[0.12, 3.62, 0.16]}
        />

        <meshStandardMaterial
          color="#50606b"
          roughness={0.34}
          metalness={0.72}
        />
      </mesh>

      <mesh
        position={[0, 1.76, 0.05]}
      >
        <boxGeometry
          args={[1.98, 0.12, 0.16]}
        />

        <meshStandardMaterial
          color="#596974"
          roughness={0.3}
          metalness={0.76}
        />
      </mesh>

      {/* Handle */}
      <mesh
        position={[0.58, -0.05, 0.15]}
      >
        <sphereGeometry
          args={[0.055, 20, 20]}
        />

        <meshStandardMaterial
          color="#d5dadd"
          roughness={0.12}
          metalness={0.92}
        />
      </mesh>
    </group>
  )
}

function Floor() {
  return (
    <group>
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry
          args={[6.45, 6.45, 0.2, 96]}
        />

        <meshStandardMaterial
          color="#3a464f"
          roughness={0.66}
          metalness={0.24}
        />
      </mesh>

      {/* Telescope platform */}
      <mesh
        position={[0.75, 0.12, -1.48]}
        receiveShadow
      >
        <cylinderGeometry
          args={[1.35, 1.42, 0.12, 64]}
        />

        <meshStandardMaterial
          color="#303b44"
          roughness={0.5}
          metalness={0.38}
        />
      </mesh>

      <mesh
        position={[0.75, 0.19, -1.48]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry
          args={[1.08, 1.14, 64]}
        />

        <meshStandardMaterial
          color="#64737d"
          roughness={0.34}
          metalness={0.65}
        />
      </mesh>

      {/* Outer floor ring */}
      <mesh
        position={[0, 0.11, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry
          args={[4.7, 4.76, 96]}
        />

        <meshStandardMaterial
          color="#596973"
          roughness={0.46}
          metalness={0.38}
        />
      </mesh>
    </group>
  )
}

function ObservatoryArchitecture() {
  return (
    <>
      <Floor />
      <WallShell />
      <WallStructure />
      <DomeShell />
      <DomeRibs />
      <Door />
    </>
  )
}

export default ObservatoryArchitecture