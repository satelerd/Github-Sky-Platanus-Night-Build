'use client';

import * as THREE from 'three';
import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';

interface Contribution {
  date: string;
  count: number;
  weekday: number;
}

interface StarsProps {
  contributions: Contribution[];
}

// Geometría base para todas las estrellas (una esfera pequeña)
const starGeometry = new THREE.SphereGeometry(0.5, 8, 8); // Radio 0.5, pocos segmentos
// Material base (simple por ahora)
const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

export default function Stars({ contributions }: StarsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!); // Ref para el InstancedMesh

  // Calculamos las posiciones y escalas de las estrellas solo cuando cambian las contribuciones
  const instances = useMemo(() => {
    if (!Array.isArray(contributions)) {
      console.warn("Stars component received non-array contributions:", contributions);
      return [];
    }

    const temp = [];
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

      temp.push({ matrix: matrix.clone(), count: contribution.count });
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
    console.log(`Rendering ${instances.length} stars.`);
  }, [instances]);

  // Marcar parámetros no usados con _
  useFrame((_state, _delta) => {
     if (meshRef.current) {
       // meshRef.current.rotation.y += _delta * 0.01;
     }
  });

  // Renderizar el InstancedMesh. El número máximo de instancias debe ser >= al número de días posibles (~366)
  return (
    <instancedMesh ref={meshRef} args={[starGeometry, starMaterial, 366]} />
  );
} 