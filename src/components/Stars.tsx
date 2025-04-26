'use client';

import * as THREE from 'three';
import { useMemo, useRef, useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';

interface Contribution {
  date: string;
  count: number;
  weekday: number;
}

interface TooltipData {
    date: string;
    count: number;
}

interface StarsProps {
  contributions: Contribution[];
  onStarHover: (data: TooltipData | null) => void;
}

// Geometría base para todas las estrellas (una esfera pequeña)
const starGeometry = new THREE.SphereGeometry(0.5, 8, 8); // Radio 0.5, pocos segmentos
// Material base - Cambiar a Standard con emissive
const starMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, // Color base blanco
    emissive: 0xffffff, // Emitir luz blanca
    emissiveIntensity: 0.5, // Intensidad del brillo (ajustable)
    roughness: 0.8, // No tan reflectante
});

export default function Stars({ contributions, onStarHover }: StarsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!); // Ref para el InstancedMesh
  const [hoveredInstanceId, setHoveredInstanceId] = useState<number | null>(null);
  const { camera, pointer, raycaster } = useThree();

  // Calculamos las posiciones y escalas de las estrellas solo cuando cambian las contribuciones
  const instances = useMemo(() => {
    if (!Array.isArray(contributions)) {
      console.warn("Stars component received non-array contributions:", contributions);
      return [];
    }

    const temp: { matrix: THREE.Matrix4; date: string; count: number; originalIndex: number }[] = [];
    const matrix = new THREE.Matrix4();
    const totalDays = contributions.length;
    if (totalDays === 0) return [];

    const numWeeks = Math.ceil(totalDays / 7);
    const daySpacing = 2;   // Espacio horizontal entre días
    const weekSpacing = 2;  // Espacio vertical entre semanas
    const planeY = 50;      // Altura del plano de estrellas
    const startX = - (6 * daySpacing) / 2; // Centrar horizontalmente
    const startZ = (numWeeks * weekSpacing) / 2; // Empezar desde "arriba" (Z negativo)

    for (let i = 0; i < totalDays; i++) {
      const contribution = contributions[i];
      if (contribution.count === 0) continue; // Saltar días sin contribuciones

      // Calcular posición en grid
      const weekIndex = Math.floor(i / 7);
      const dayOfWeek = i % 7;

      // --- NUEVA LÓGICA: Mapeo a plano XZ ---
      const x = startX + dayOfWeek * daySpacing;
      const y = planeY; // Altura constante
      const z = startZ - weekIndex * weekSpacing; // Ir hacia Z negativo
      // --- FIN NUEVA LÓGICA ---

      // Calcular escala basada en count (ej. logarítmica)
      const scale = 0.5 + Math.log(contribution.count + 1) * 0.5;

      // Crear matriz de instancia (posición y escala)
      matrix.compose(
        new THREE.Vector3(x, y, z),
        new THREE.Quaternion(), // Sin rotación
        new THREE.Vector3(scale, scale, scale)
      );

      // Guardar matriz, datos relevantes y el índice original
      temp.push({
          matrix: matrix.clone(),
          date: contribution.date,
          count: contribution.count,
          originalIndex: i // Guardamos el índice original para referencia si es necesario
      });
    }
    return temp;
  }, [contributions]);

  // Actualizar las matrices en el InstancedMesh
  useEffect(() => {
    if (!meshRef.current) return;
    instances.forEach((instance, i) => {
      meshRef.current.setMatrixAt(i, instance.matrix);
      // Podríamos setear color aquí si quisiéramos: meshRef.current.setColorAt(...)
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    // Si usamos color: meshRef.current.instanceColor.needsUpdate = true;
    meshRef.current.count = instances.length; // Asegurar que el count es correcto
  }, [instances]);

  // --- Lógica de Tooltip con Raycasting Manual ---
  const handlePointerMove = () => {
      if (!meshRef.current) return;

      // Configurar raycaster desde la cámara y el puntero (estado de useThree)
      raycaster.setFromCamera(pointer, camera);

      // Intersectar *solo* con el InstancedMesh de las estrellas
      const intersections = raycaster.intersectObject(meshRef.current, false);

      let currentInstanceId: number | undefined = undefined;
      if (intersections.length > 0) {
          // Tomar la primera intersección (la más cercana)
          currentInstanceId = intersections[0].instanceId;
      }

      // Actualizar estado si el instanceId cambió
      if (currentInstanceId !== undefined && currentInstanceId !== hoveredInstanceId) {
          if(currentInstanceId < instances.length) { // Doble check de validez
            setHoveredInstanceId(currentInstanceId);
            const instanceData = instances[currentInstanceId];
            const dataToSend = { date: instanceData.date, count: instanceData.count };
            onStarHover(dataToSend); 
          } else {
            // ID inválido, tratar como si no hubiera hover
             if (hoveredInstanceId !== null) handlePointerOut();
          }
      } else if (currentInstanceId === undefined && hoveredInstanceId !== null) {
          // No hay intersección ahora, pero antes sí
          handlePointerOut();
      }
  };

  const handlePointerOut = () => {
    if (hoveredInstanceId !== null) {
        setHoveredInstanceId(null);
        onStarHover(null);
    }
  };

  // Renderizar solo el InstancedMesh
  return (
    <instancedMesh 
        ref={meshRef} 
        args={[starGeometry, starMaterial, 366]} 
        frustumCulled={false}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
    />
  );
} 