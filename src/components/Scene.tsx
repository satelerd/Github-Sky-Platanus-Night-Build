'use client'; // Este componente *sí* necesita ejecutarse en el cliente

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
// import { useEffect } from 'react'; // ELIMINAR - No se usa
import Stars from './Stars'; // Importar el nuevo componente

// Definir la interfaz para los datos que esperamos recibir
// ... (interfaz Contribution)
interface Contribution {
  date: string;
  count: number;
  weekday: number;
}

// Definir las props que acepta el componente
interface SceneProps {
  contributions: Contribution[];
}

export default function Scene({ contributions }: SceneProps) {

  // Ya no necesitamos el log aquí, se hace en Stars
  // useEffect(() => {
  //   console.log("Contributions updated in Scene:", contributions.length);
  // }, [contributions]);

  return (
    <Canvas style={{ background: '#202020' }} camera={{ position: [0, 0, 150], fov: 50 }}> {/* Ajustar cámara inicial */}
      {/* Luces básicas */}
      <ambientLight intensity={0.5} />
      <pointLight position={[100, 100, 100]} intensity={0.8} /> {/* Luz más lejana/general */}

      {/* Controles de cámara */}
      <OrbitControls enableZoom={true} enablePan={true} />

      {/* Renderizar las estrellas */}
      <Stars contributions={contributions} />

      {/* Objeto de prueba ELIMINADO */}
      {/* <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" />
      </mesh> */}
    </Canvas>
  );
} 