'use client';

import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { RefObject, useMemo } from 'react';

// Copiar tipo JoystickData de page.tsx o importarlo si se mueve a un archivo compartido
interface JoystickData {
    x: number | null;
    y: number | null;
    direction: string | null;
    distance: number | null;
}

interface MobilePlayerProps {
  groundRef: RefObject<THREE.Mesh>;
  moveJoystick: JoystickData;
  lookJoystick: JoystickData;
}

const playerHeight = 5;
const movementSpeed = 20; // Reducir velocidad para joystick?
const lookSpeed = 0.025;   // Sensibilidad de la vista
const raycaster = new THREE.Raycaster();
const downVector = new THREE.Vector3(0, -1, 0);

// Vectores auxiliares para cálculos (evitar crear en cada frame)
const moveDirection = new THREE.Vector3();
const cameraDirection = new THREE.Vector3();
const rotationEuler = new THREE.Euler(0, 0, 0, 'YXZ'); // Orden para first-person
const rotationQuaternion = new THREE.Quaternion();

export default function MobilePlayer({ groundRef, moveJoystick, lookJoystick }: MobilePlayerProps) {
  const { camera } = useThree(); // Obtener cámara del contexto R3F

  useFrame((_state, delta) => {
    if (!groundRef.current) return;

    // --- Rotación (Vista) con Joystick Derecho ---
    if (lookJoystick.x !== null && lookJoystick.y !== null) {
        const yaw = -lookJoystick.x * lookSpeed;  // <-- Re-añadir negativo
        const pitch = lookJoystick.y * lookSpeed; // Mantener positivo

        // Aplicar rotación usando Euler y Quaternion
        // Adaptado de PointerLockControls
        rotationEuler.setFromQuaternion(camera.quaternion);

        rotationEuler.y += yaw;
        rotationEuler.x += pitch;

        // Limitar pitch para no dar vueltas completas verticalmente
        rotationEuler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationEuler.x));

        camera.quaternion.setFromEuler(rotationEuler);
    }

    // --- Movimiento con Joystick Izquierdo ---
    if (moveJoystick.x !== null && moveJoystick.y !== null && moveJoystick.distance !== null && moveJoystick.distance > 0) {
        // Obtener dirección de la cámara actual (en plano XZ)
        camera.getWorldDirection(cameraDirection);
        cameraDirection.y = 0;
        cameraDirection.normalize();

        // Calcular dirección de movimiento relativa a la cámara
        // moveJoystick.y es forward/backward (-1 a 1)
        // moveJoystick.x es left/right (-1 a 1)
        const forwardMovement = cameraDirection.clone().multiplyScalar(moveJoystick.y);
        const rightMovement = cameraDirection.clone().cross(camera.up).multiplyScalar(moveJoystick.x);
        
        moveDirection.addVectors(forwardMovement, rightMovement).normalize();

        // Aplicar movimiento escalado por distancia del joystick y delta
        const speedMultiplier = (moveJoystick.distance / 50); // Ajustar 50 según el rango del joystick
        camera.position.addScaledVector(moveDirection, movementSpeed * speedMultiplier * delta);
    }

    // --- Grounding (igual que en Player.tsx) ---
    raycaster.set(camera.position, downVector);
    const groundIntersects = raycaster.intersectObject(groundRef.current);
    if (groundIntersects.length > 0) {
      const groundY = groundIntersects[0].point.y;
      camera.position.y = groundY + playerHeight;
    }
  });

  return null; // Componente lógico, no renderiza nada
} 