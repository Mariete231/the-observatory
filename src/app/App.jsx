import { Canvas } from '@react-three/fiber'
import DOMOverlayRoot from '../components/ui/DOMOverlayRoot'
import DiscoveryOverlay from '../components/ui/DiscoveryOverlay'
import IntroOverlay from '../components/ui/IntroOverlay'
import TelescopeAlignmentHUD from '../components/ui/TelescopeAlignmentHUD'
import ObservatoryScene from '../scenes/ObservatoryScene'

function App() {
  return (
    <>
      <Canvas
        shadows
        dpr={[
          1,
          1.5,
        ]}
        gl={{
          antialias: true,
          powerPreference:
            'high-performance',
        }}
        camera={{
          fov: 48,
          near: 0.1,
          far: 80,
          position: [
            4.3,
            2.35,
            5.1,
          ],
        }}
        onCreated={({ gl }) => {
          gl.toneMappingExposure =
            1.15
        }}
      >
        <ObservatoryScene />
      </Canvas>

      <DOMOverlayRoot>
        <>
          <IntroOverlay />
          <TelescopeAlignmentHUD />
          <DiscoveryOverlay />
        </>
      </DOMOverlayRoot>
    </>
  )
}

export default App