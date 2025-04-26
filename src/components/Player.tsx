'use client';

import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RefObject, useState, useEffect, useMemo } from 'react';
// import { PointerLockControls } from '@react-three/drei'; // No necesitamos importar aquí si usamos any

interface PlayerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controlsRef: RefObject<any>; // Usar any y deshabilitar linter
  groundRef: RefObject<THREE.Mesh>;
  portalRef: RefObject<THREE.Group>; // Portal ref ahora es Group
  isLocked: boolean;
  onInteract: () => void; // Añadir la función callback
  onCanInteractChange: (canInteract: boolean) => void; // Callback para notificar cambio de estado
}

const playerHeight = 5;
const movementSpeed = 30; // Velocidad de movimiento (ajustable)
const raycaster = new THREE.Raycaster();
const downVector = new THREE.Vector3(0, -1, 0);
const interactDistance = 20; // Distancia máxima para interactuar con el portal

export default function Player({ controlsRef, groundRef, portalRef, isLocked, onInteract, onCanInteractChange }: PlayerProps) {

  // Estado para teclas de movimiento
  const [moveState, setMoveState] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  // Estado para indicar si se puede interactuar
  const [canInteract, setCanInteract] = useState(false);

  // Notificar cambio de estado canInteract
  useEffect(() => {
      onCanInteractChange(canInteract);
  }, [canInteract, onCanInteractChange]);

  // Listeners de teclado para MOVIMIENTO (WASD)
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
  }, [isLocked]); // Depende solo de isLocked para añadir/quitar listeners WASD

  // Listener de teclado para INTERACCIÓN (E)
  useEffect(() => {
    const handleInteractionKey = (event: KeyboardEvent) => {
        // Verificar si estamos en modo FPS (isLocked) y si podemos interactuar
        if (isLocked && canInteract && event.key.toLowerCase() === 'e') {
            onInteract();
            controlsRef.current?.unlock();
        }
    };
    window.addEventListener('keydown', handleInteractionKey);
    return () => {
        window.removeEventListener('keydown', handleInteractionKey);
    };
  }, [isLocked, canInteract, onInteract, controlsRef]); // <- Mantener dependencias aquí

  // Vectores para cálculo (memoizados para eficiencia)
  const forwardVector = useMemo(() => new THREE.Vector3(), []);
  const rightVector = useMemo(() => new THREE.Vector3(), []);
  const moveDirection = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    if (isLocked && groundRef.current && controlsRef.current?.getObject && portalRef.current) {
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
      const groundIntersects = raycaster.intersectObject(groundRef.current);
      if (groundIntersects.length > 0) {
        const groundY = groundIntersects[0].point.y;
        // Forzar altura exacta para seguir terreno hacia arriba Y hacia abajo
        camera.position.y = groundY + playerHeight;
      }

      // --- Interacción con Portal ---
      // Raycast desde la cámara hacia donde mira
      const pointer = new THREE.Vector2(0, 0); // Coordenadas del centro de la pantalla normalizadas
      raycaster.setFromCamera(pointer, camera);
      // Intersectar con los hijos del grupo (los anillos)
      const portalIntersects = raycaster.intersectObjects(portalRef.current.children, false); // false = no recursivo (solo anillos)

      let lookingAtPortal = false;
      if (portalIntersects.length > 0) {
          // Verificar si el portal intersectado es el más cercano y está dentro del rango
          if (portalIntersects[0].distance < interactDistance) {
              lookingAtPortal = true;
          }
      }

      if (lookingAtPortal && !canInteract) {
          setCanInteract(true);
          // TODO: Cambiar apariencia del portal o mostrar tooltip
          // (portalRef.current.material as THREE.MeshStandardMaterial).color.set('lime');
      } else if (!lookingAtPortal && canInteract) {
          setCanInteract(false);
          // TODO: Restaurar apariencia del portal
          // (portalRef.current.material as THREE.MeshStandardMaterial).color.set('purple');
      }
    }
  });

  // Este componente no renderiza nada visible, solo ejecuta lógica en useFrame
  return null;
} 