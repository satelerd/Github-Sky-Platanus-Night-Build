'use client';

import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RefObject, useState, useEffect, useMemo } from 'react';
// import { PointerLockControls } from '@react-three/drei'; // No necesitamos importar aquí si usamos any

interface PlayerProps {
  // TODO: Encontrar el tipo correcto para la instancia de PointerLockControls
  controlsRef: RefObject<any>; // Usar any temporalmente
  groundRef: RefObject<THREE.Mesh>;
  isLocked: boolean;
}

const playerHeight = 5;
const movementSpeed = 30; // Velocidad de movimiento (ajustable)
const raycaster = new THREE.Raycaster();
const downVector = new THREE.Vector3(0, -1, 0);

export default function Player({ controlsRef, groundRef, isLocked }: PlayerProps) {

  // Estado para teclas de movimiento
  const [moveState, setMoveState] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  // Listeners de teclado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case 'w': setMoveState(s => ({ ...s, forward: true })); break;
        case 's': setMoveState(s => ({ ...s, backward: true })); break;
        case 'a': setMoveState(s => ({ ...s, left: true })); break;
        case 'd': setMoveState(s => ({ ...s, right: true })); break;
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case 'w': setMoveState(s => ({ ...s, forward: false })); break;
        case 's': setMoveState(s => ({ ...s, backward: false })); break;
        case 'a': setMoveState(s => ({ ...s, left: false })); break;
        case 'd': setMoveState(s => ({ ...s, right: false })); break;
      }
    };

    if (isLocked) {
      // Añadir listeners solo si está bloqueado
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
    } else {
      // Quitar listeners y resetear estado si no está bloqueado
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      setMoveState({ forward: false, backward: false, left: false, right: false });
    }

    // Limpieza al desmontar o cambiar isLocked
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isLocked]);

  // Vectores para cálculo (memoizados para eficiencia)
  const forwardVector = useMemo(() => new THREE.Vector3(), []);
  const rightVector = useMemo(() => new THREE.Vector3(), []);
  const moveDirection = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    if (isLocked && groundRef.current && controlsRef.current?.getObject) {
      const camera = controlsRef.current.getObject();

      // --- Movimiento --- (Nueva Lógica)
      camera.getWorldDirection(forwardVector); // Obtener dirección de cámara
      rightVector.crossVectors(camera.up, forwardVector).normalize(); // Vector derecho

      moveDirection.set(0, 0, 0);
      if (moveState.forward) moveDirection.add(forwardVector);
      if (moveState.backward) moveDirection.sub(forwardVector);
      if (moveState.left) moveDirection.add(rightVector);
      if (moveState.right) moveDirection.sub(rightVector);

      // Proyectar en plano XZ y normalizar
      moveDirection.y = 0;
      moveDirection.normalize();

      if (moveDirection.lengthSq() > 0) { // Mover solo si hay input
        camera.position.addScaledVector(moveDirection, movementSpeed * delta);
      }

      // --- Grounding --- (Corregido)
      raycaster.set(camera.position, downVector);
      const intersects = raycaster.intersectObject(groundRef.current);
      if (intersects.length > 0) {
        const groundY = intersects[0].point.y;
        // Forzar altura exacta para seguir terreno hacia arriba Y hacia abajo
        camera.position.y = groundY + playerHeight;
      }
      // No necesitamos un 'else' por ahora, si no hay suelo, flotará.
    }
  });

  // Este componente no renderiza nada visible, solo ejecuta lógica en useFrame
  return null;
} 