import { DoubleSide } from 'three'
import ObservatoryLighting from '../components/observatory/ObservatoryLighting'
import ObservatoryTelescope from '../components/telescope/ObservatoryTelescope'
import ObservatoryDesk from '../components/observatory/ObservatoryDesk'
import CameraSystem from '../systems/camera/CameraSystem'
import ObservatoryAwakening from '../components/observatory/ObservatoryAwakening'
import ObservatoryDome from '../components/observatory/ObservatoryDome'
import ObservatorySky from '../components/observatory/ObservatorySky'
import DomeOpeningController from '../components/observatory/DomeOpeningController'
import DomeOpeningLighting from '../components/observatory/DomeOpeningLighting'
import CelestialSequenceController from '../components/observatory/CelestialSequenceController'
import DiscoveryChoreography from '../components/observatory/DiscoveryChoreography'
import DiscoveryResonance from '../components/observatory/DiscoveryResonance'
import Cygnus from '../components/observatory/Cygnus'

const ROOM_RADIUS = 6
const WALL_HEIGHT = 4.6

function ObservatoryWalls() {
  return (
    <>
      <mesh
        position={[
          0,
          WALL_HEIGHT / 2,
          0,
        ]}
      >
        <cylinderGeometry
          args={[
            ROOM_RADIUS,
            ROOM_RADIUS,
            WALL_HEIGHT,
            96,
            1,
            true,
          ]}
        />

        <meshStandardMaterial
          color="#26333d"
          roughness={0.84}
          metalness={0.08}
          side={DoubleSide}
        />
      </mesh>

      <mesh
        position={[
          0,
          0.28,
          0,
        ]}
        rotation={[
          -Math.PI / 2,
          0,
          0,
        ]}
      >
        <torusGeometry
          args={[
            ROOM_RADIUS - 0.05,
            0.12,
            12,
            96,
          ]}
        />

        <meshStandardMaterial
          color="#4c5b66"
          roughness={0.38}
          metalness={0.7}
        />
      </mesh>

      {Array.from(
        { length: 12 },
        (_, index) => {
          const angle =
            (index / 12) *
            Math.PI *
            2

          const x =
            Math.cos(angle) *
            (ROOM_RADIUS - 0.08)

          const z =
            Math.sin(angle) *
            (ROOM_RADIUS - 0.08)

          return (
            <mesh
              key={index}
              position={[
                x,
                WALL_HEIGHT / 2,
                z,
              ]}
              rotation={[
                0,
                -angle,
                0,
              ]}
              castShadow
            >
              <boxGeometry
                args={[
                  0.14,
                  WALL_HEIGHT - 0.2,
                  0.2,
                ]}
              />

              <meshStandardMaterial
                color="#3b4a55"
                roughness={0.4}
                metalness={0.72}
              />
            </mesh>
          )
        },
      )}
    </>
  )
}

function ObservatoryFloor() {
  return (
    <>
      <mesh
        receiveShadow
        rotation={[
          -Math.PI / 2,
          0,
          0,
        ]}
      >
        <circleGeometry
          args={[
            ROOM_RADIUS,
            96,
          ]}
        />

        <meshStandardMaterial
          color="#3c4851"
          roughness={0.68}
          metalness={0.22}
        />
      </mesh>

      <mesh
        position={[
          0.7,
          0.1,
          -1.55,
        ]}
        receiveShadow
      >
        <cylinderGeometry
          args={[
            1.35,
            1.42,
            0.14,
            64,
          ]}
        />

        <meshStandardMaterial
          color="#303c45"
          roughness={0.52}
          metalness={0.38}
        />
      </mesh>

      <mesh
        position={[
          0.7,
          0.18,
          -1.55,
        ]}
        rotation={[
          -Math.PI / 2,
          0,
          0,
        ]}
      >
        <ringGeometry
          args={[
            1.04,
            1.1,
            64,
          ]}
        />

        <meshStandardMaterial
          color="#63737d"
          roughness={0.35}
          metalness={0.68}
        />
      </mesh>

      <mesh
        position={[
          0,
          0.012,
          0,
        ]}
        rotation={[
          -Math.PI / 2,
          0,
          0,
        ]}
      >
        <ringGeometry
          args={[
            4.65,
            4.72,
            96,
          ]}
        />

        <meshStandardMaterial
          color="#586872"
          roughness={0.48}
          metalness={0.4}
        />
      </mesh>
    </>
  )
}

function ObservatoryDoor() {
  return (
    <group
      position={[
        0,
        1.7,
        -5.82,
      ]}
    >
      <mesh castShadow>
        <boxGeometry
          args={[
            1.8,
            3.4,
            0.18,
          ]}
        />

        <meshStandardMaterial
          color="#172229"
          roughness={0.55}
          metalness={0.42}
        />
      </mesh>

      <mesh
        position={[
          0,
          0,
          0.105,
        ]}
      >
        <boxGeometry
          args={[
            1.55,
            3.02,
            0.035,
          ]}
        />

        <meshStandardMaterial
          color="#0f171d"
          roughness={0.68}
          metalness={0.2}
        />
      </mesh>

      <mesh
        position={[
          -0.95,
          0,
          0.1,
        ]}
      >
        <boxGeometry
          args={[
            0.11,
            3.6,
            0.16,
          ]}
        />

        <meshStandardMaterial
          color="#596974"
          roughness={0.3}
          metalness={0.74}
        />
      </mesh>

      <mesh
        position={[
          0.95,
          0,
          0.1,
        ]}
      >
        <boxGeometry
          args={[
            0.11,
            3.6,
            0.16,
          ]}
        />

        <meshStandardMaterial
          color="#596974"
          roughness={0.3}
          metalness={0.74}
        />
      </mesh>

      <mesh
        position={[
          0,
          1.75,
          0.1,
        ]}
      >
        <boxGeometry
          args={[
            2,
            0.11,
            0.16,
          ]}
        />

        <meshStandardMaterial
          color="#596974"
          roughness={0.3}
          metalness={0.74}
        />
      </mesh>

      <mesh
        position={[
          0.58,
          -0.05,
          0.14,
        ]}
      >
        <sphereGeometry
          args={[
            0.055,
            20,
            20,
          ]}
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

function ObservatoryScene() {
  return (
    <>
      <color
        attach="background"
        args={[
          '#050a10',
        ]}
      />

      <ObservatoryLighting />
      <ObservatoryAwakening />
      <DomeOpeningController />
      <DomeOpeningLighting />

      <ObservatoryFloor />
      <ObservatoryWalls />
      <ObservatoryDome />
      <ObservatorySky />

      <CelestialSequenceController />
      <Cygnus />
      <DiscoveryResonance />
      <DiscoveryChoreography />

      <ObservatoryDoor />

      <ObservatoryDesk />
      <ObservatoryTelescope />

      <CameraSystem />
    </>
  )
}

export default ObservatoryScene