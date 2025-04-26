'use client'; // Este componente *sí* necesita ejecutarse en el cliente

import * as THREE from 'three'; // Importar THREE completo
import { Canvas, useThree } from '@react-three/fiber'; // Importar Canvas y useThree
import { PointerLockControls, Html } from '@react-three/drei'; // Quitar OrbitControls
import { useRef, useState, useEffect } from 'react'; // Necesitamos useEffect
import Stars from './Stars'; // Importar el nuevo componente
import WavyGround from './WavyGround'; // Importar suelo ondulado
import Player from './Player'; // Importar el nuevo componente Player
import Mountains from './Mountains'; // Importar Montañas
import Portal from './Portal'; // Importar el Portal
import MobilePlayer from './MobilePlayer'; // Importar el nuevo componente MobilePlayer
import { EffectComposer, Bloom } from '@react-three/postprocessing'; // <-- IMPORTAR EFECTOS

// Definir la interfaz para los datos que esperamos recibir
// ... (interfaz Contribution)
interface Contribution {
  date: string;
  count: number;
  weekday: number;
}

// Tipos para los datos del Joystick (importados o definidos en page.tsx)
interface JoystickData {
    x: number | null; 
    y: number | null; 
    direction: string | null; 
    distance: number | null;
}

// Definir las props que acepta el componente
interface SceneProps {
  contributions: Contribution[];
  onInteract: () => void; // Callback para iniciar interacción
  onCanInteractChange: (canInteract: boolean) => void; // Callback para estado de interacción
  moveJoystick: JoystickData; // Añadir prop
  lookJoystick: JoystickData; // Añadir prop
  onStarHover: (data: TooltipData | null) => void; // <-- Añadir prop
}

// Componente interno para manejar la lógica dependiente del contexto de R3F
function SceneContent({ 
    contributions, 
    onInteract, 
    onCanInteractChange, 
    moveJoystick, // Recibir prop
    lookJoystick, // Recibir prop
    onStarHover // <-- Recibir prop
}: SceneProps) {
  const { gl, camera } = useThree(); // Hook para acceder al contexto R3F
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null); // Mantener any por ahora, PointerLockControls es difícil de tipar
  const groundRef = useRef<THREE.Mesh>(null!);
  const portalRef = useRef<THREE.Group>(null!);
  const [isLocked, setIsLocked] = useState(false); // Solo para PointerLock
  const [isMobile, setIsMobile] = useState(false);

  // Detección simple de móvil (podría mejorarse)
  useEffect(() => {
      const checkMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      console.log("Is Mobile?", checkMobile);
      setIsMobile(checkMobile);
      // Forzar OrbitControls si PointerLock no está disponible (mejor que userAgent)
      // const isPointerLockAvailable = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
      // setIsMobile(!isPointerLockAvailable);
  }, []);

  useEffect(() => {
      const canvasElement = gl.domElement;
      if (!isMobile || !canvasElement) return;

      const onCanvasPointerDown = (event: PointerEvent) => {
          if (!portalRef.current) return;

          const pointer = new THREE.Vector2();
          pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
          pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

          const raycaster = new THREE.Raycaster();
          raycaster.setFromCamera(pointer, camera);
          const intersects = raycaster.intersectObject(portalRef.current);

          if (intersects.length > 0 && intersects[0].distance < interactDistance * 1.5) {
              console.log("INTERACTION TRIGGERED (Tap)");
              onInteract();
          }
      };

      canvasElement.addEventListener('pointerdown', onCanvasPointerDown);
      return () => {
          canvasElement.removeEventListener('pointerdown', onCanvasPointerDown);
      };

  }, [isMobile, gl.domElement, camera, portalRef, onInteract]); // Añadir dependencias

  return (
    <>
      {/* Envolver contenido 3D con EffectComposer */} 
      <EffectComposer>
        {/* Añadir Niebla */} 
        {/* La niebla puede interactuar de forma extraña con postprocessing a veces,
            quizás sea mejor quitarla o ajustarla si usamos bloom */}
        {/* <fog attach="fog" args={['#0A0A18', 100, 600]} /> */}

        {/* Iluminación Nocturna */} 
        <hemisphereLight args={[0x444488, 0x111122, 0.8]} />
        <directionalLight
            position={[40, 60, -50]}
            intensity={0.3}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
        />

        {/* Renderizar las estrellas */} 
        <Stars contributions={contributions} onStarHover={onStarHover} />

        {/* Suelo ondulado - Comentado para debug de tooltip */} 
        <WavyGround ref={groundRef} />

        {/* Montañas */} 
        <Mountains count={60} radius={350} />

        {/* Portal de interacción */} 
        <Portal ref={portalRef} />

        {/* Efecto Bloom */} 
        <Bloom 
            intensity={0.6} // Intensidad general del brillo
            luminanceThreshold={0.3} // Qué tan brillante debe ser algo para brillar (0=todo, 1=nada)
            luminanceSmoothing={0.2} // Suavizado del umbral
            mipmapBlur // Mejora calidad del blur
        />
      </EffectComposer>

      {/* Controles y Player FUERA del EffectComposer */} 
      {isMobile ? (
        <MobilePlayer 
            groundRef={groundRef} 
            moveJoystick={moveJoystick} 
            lookJoystick={lookJoystick} 
        />
      ) : (
        <>
          <PointerLockControls
              ref={controlsRef}
              onLock={() => setIsLocked(true)}
              onUnlock={() => setIsLocked(false)}
          />
          <Player
              controlsRef={controlsRef}
              groundRef={groundRef}
              portalRef={portalRef}
              isLocked={isLocked}
              onInteract={onInteract}
              onCanInteractChange={onCanInteractChange}
          />
        </>
      )}

      {/* Overlays HTML FUERA del EffectComposer */} 
      {!isMobile && !isLocked && (
        <Html center style={{ pointerEvents: 'none' }}> 
            <div style={overlayStyle}>
                Click to Explore
            </div>
        </Html>
      )}
    </>
  );
}

export default function Scene({ 
    contributions, 
    onInteract, 
    onCanInteractChange, 
    moveJoystick, // Recibir prop
    lookJoystick, // Recibir prop
    onStarHover // <-- Recibir prop
}: SceneProps) {

  return (
    <div style={{ width: '100%', height: '100%' }}>
        <Canvas
            style={{ background: '#0A0A18' }}
            camera={{ fov: 75, position: [0, playerHeight, 0] }} // Posición inicial ligeramente elevada
            shadows
        >
           <SceneContent 
               contributions={contributions} 
               onInteract={onInteract} 
               onCanInteractChange={onCanInteractChange} 
               moveJoystick={moveJoystick} // Pasar prop
               lookJoystick={lookJoystick} // Pasar prop
               onStarHover={onStarHover} // <-- Pasar prop
           />
        </Canvas>
    </div>
  );
}

// Estilos para el overlay (reutilizados)
const overlayStyle: React.CSSProperties = {
    color: 'white',
    background: 'rgba(0,0,0,0.7)',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '1.1em',
    textAlign: 'center',
    pointerEvents: 'none'
};

// Constantes movidas fuera si es posible
const playerHeight = 5;
const interactDistance = 20;

// Definir TooltipData aquí también o importarla
interface TooltipData {
    date: string;
    count: number;
}
 