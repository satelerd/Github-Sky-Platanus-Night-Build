'use client'; // Este componente *sí* necesita ejecutarse en el cliente

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

export default function Scene() {
  return (
    <Canvas style={{ background: '#202020' }}>
      {/* Luces básicas */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />

      {/* Controles de cámara */}
      <OrbitControls />

      {/* Objeto de prueba */}
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" />
      </mesh>
    </Canvas>
  );
} 