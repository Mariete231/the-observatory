function ObservatoryDesk() {
  return (
    <group
      position={[-3.05, 0.98, -4.55]}
      rotation={[0, 0.1, 0]}
    >
      <mesh castShadow>
        <boxGeometry
          args={[2.35, 0.16, 0.82]}
        />

        <meshStandardMaterial
          color="#3e332b"
          roughness={0.76}
          metalness={0.04}
        />
      </mesh>

      {[-0.9, 0.9].map((x) => (
        <mesh
          key={x}
          position={[x, -0.62, 0]}
          castShadow
        >
          <boxGeometry
            args={[
              0.12,
              1.25,
              0.12,
            ]}
          />

          <meshStandardMaterial
            color="#242d32"
            roughness={0.52}
            metalness={0.4}
          />
        </mesh>
      ))}

      {/* Monitor */}
      <mesh
        position={[0, 0.43, -0.04]}
        castShadow
      >
        <boxGeometry
          args={[
            0.86,
            0.5,
            0.08,
          ]}
        />

        <meshStandardMaterial
          color="#0d141a"
          roughness={0.28}
          metalness={0.5}
        />
      </mesh>

      <mesh
        position={[0, 0.43, 0.005]}
      >
        <planeGeometry
          args={[
            0.68,
            0.34,
          ]}
        />

        <meshStandardMaterial
          color="#6c95a5"
          emissive="#284651"
          emissiveIntensity={0.28}
          roughness={0.18}
          metalness={0.06}
        />
      </mesh>

      {/* Desk lamp */}
      <mesh
        position={[0.78, 0.32, 0]}
      >
        <cylinderGeometry
          args={[
            0.035,
            0.035,
            0.44,
            14,
          ]}
        />

        <meshStandardMaterial
          color="#282f34"
          roughness={0.36}
          metalness={0.62}
        />
      </mesh>

      <mesh
        position={[0.78, 0.56, 0]}
      >
        <coneGeometry
          args={[
            0.16,
            0.14,
            24,
          ]}
        />

        <meshStandardMaterial
          color="#5d4d3e"
          roughness={0.62}
          metalness={0.06}
        />
      </mesh>

      <pointLight
        position={[0.78, 0.59, 0.05]}
        color="#d0ad7e"
        distance={3}
        decay={2}
        intensity={0.22}
      />
    </group>
  )
}

export default ObservatoryDesk