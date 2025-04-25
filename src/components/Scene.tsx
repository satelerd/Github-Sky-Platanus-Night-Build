'use client'; // Este componente *sí* necesita ejecutarse en el cliente

import * as THREE from 'three'; // Importar THREE completo
import { Canvas } from '@react-three/fiber'; // Importar Canvas
import { PointerLockControls } from '@react-three/drei'; // Mantener PointerLockControls
import { useRef, useState, useEffect } from 'react'; // Necesitamos useEffect de nuevo
import Stars from './Stars'; // Importar el nuevo componente
import WavyGround from './WavyGround'; // Importar suelo ondulado
import Player from './Player'; // Importar el nuevo componente Player
import Mountains from './Mountains'; // Importar Montañas

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
  const controlsRef = useRef<any>(null); // Ref para PointerLockControls
  const groundRef = useRef<THREE.Mesh>(null!); // Ref para el suelo
  const [isLocked, setIsLocked] = useState(false);

  const handleCanvasClick = () => {
    controlsRef.current?.lock();
  };

  return (
    <div style={{ width: '100%', height: '100%', cursor: isLocked ? 'none' : 'pointer' }} onClick={handleCanvasClick}>
        <Canvas
            style={{ background: '#0A0A18' }} // Punto intermedio azul muy oscuro
            camera={{ fov: 75 }}
            shadows
            onPointerDown={(e) => {
                if (!isLocked) controlsRef.current?.lock();
            }}
        >
            {/* Añadir Niebla */}
            <fog attach="fog" args={['#0A0A18', 100, 600]} /> {/* Mismo color que el fondo */}

            {/* Iluminación Nocturna (Reajustar ligeramente si es necesario) */}
            <hemisphereLight args={[0x444488, 0x111122, 0.8]} /> {/* Un poco más de luz ambiental */}
            <directionalLight
                position={[40, 60, -50]}
                intensity={0.3} // Luna un poco más brillante
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
            />

            {/* Controles FPS */}
            <PointerLockControls
                ref={controlsRef}
                onLock={() => {
                    console.log('Pointer Locked');
                    setIsLocked(true);
                }}
                onUnlock={() => {
                    console.log('Pointer Unlocked');
                    setIsLocked(false);
                }}
            />

            {/* Renderizar las estrellas */}
            <Stars contributions={contributions} />

            {/* Suelo ondulado */}
            <WavyGround ref={groundRef} />

            {/* Montañas */}
            <Mountains count={60} radius={350} />

            {/* Componente Player para manejar lógica de frame (grounding) */}
            <Player controlsRef={controlsRef} groundRef={groundRef} isLocked={isLocked} />

        </Canvas>
        {/* Overlay */}
        {!isLocked && (
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'white',
                background: 'rgba(0,0,0,0.7)',
                padding: '15px 25px',
                borderRadius: '8px',
                fontSize: '1.2em',
                textAlign: 'center',
                pointerEvents: 'none'
            }}>
                Click to Explore
            </div>
        )}
    </div>
  );
} 