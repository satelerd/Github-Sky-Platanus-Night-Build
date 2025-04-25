'use client';

import * as THREE from 'three';
import { useMemo, useRef, useEffect } from 'react';

// Geometría base para las montañas (cono) - ELIMINAR ESTA CONSTANTE
// const mountainGeometry = new THREE.ConeGeometry(20, 60, 8);

// Material base - AHORA habilitamos vertexColors
const mountainMaterial = new THREE.MeshStandardMaterial({
  // color: 0xaaaaaa, // El color base viene de los vértices
  roughness: 0.9,
  metalness: 0.1,
  vertexColors: true // *** Habilitar Vertex Colors ***
});

const snowColor = new THREE.Color(0xffffff);
const rockColor = new THREE.Color(0x888899);
const tempColor = new THREE.Color();

interface MountainsProps {
  count?: number; // Cuántas montañas generar
  radius?: number; // Radio del anillo donde se distribuyen
}

export default function Mountains({ count = 50, radius = 400 }: MountainsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);

  // Geometría base - se crea y usa aquí
  const baseGeometry = useMemo(() => {
      const baseRadius = 20;
      const baseHeight = 60;
      const radialSegments = 8;
      const heightSegments = 4; // Añadir segmentos en altura para la transición de color
      const geo = new THREE.ConeGeometry(baseRadius, baseHeight, radialSegments, heightSegments);

      // Calcular colores de vértice para la geometría base
      const positions = geo.attributes.position;
      const colors = new Float32Array(positions.count * 3);
      const vertex = new THREE.Vector3();
      const snowLineFactor = 0.6; // A partir de qué % de altura empieza la nieve

      for (let i = 0; i < positions.count; i++) {
          vertex.fromBufferAttribute(positions, i);
          // Normalizar altura del vértice (Y local / altura total) - va de -0.5 a 0.5 aprox
          const normalizedHeight = vertex.y / baseHeight + 0.5;

          // Interpolar color
          const colorFactor = Math.max(0, Math.min(1, (normalizedHeight - snowLineFactor) / (1 - snowLineFactor)));
          tempColor.lerpColors(rockColor, snowColor, colorFactor);
          colors[i * 3] = tempColor.r;
          colors[i * 3 + 1] = tempColor.g;
          colors[i * 3 + 2] = tempColor.b;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      return geo;
  }, []);

  // Calcular posiciones y escalas aleatorias para las montañas
  const instances = useMemo(() => {
    const temp = [];
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Euler();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    for (let i = 0; i < count; i++) {
      // Posición aleatoria en un anillo
      const angle = Math.random() * Math.PI * 2;
      const r = radius * (0.8 + Math.random() * 0.4); // Variar radio
      position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);

      // Escala aleatoria MÁS VARIADA
      const scaleFactorX = 1.0 + Math.random() * 2.5; // Más anchas o estrechas
      const scaleFactorY = 1.5 + Math.random() * 3.0; // Variación significativa de altura
      scale.set(scaleFactorX, scaleFactorY, scaleFactorX);

      // Rotación aleatoria en Y
      rotation.set(0, Math.random() * Math.PI, 0);
      quaternion.setFromEuler(rotation);

      // Componer la matriz de instancia
      matrix.compose(position, quaternion, scale);
      temp.push(matrix.clone());
    }
    return temp;
  }, [count, radius]);

  // Actualizar matrices en InstancedMesh
  useEffect(() => {
    if (!meshRef.current) return;
    instances.forEach((matrix, i) => {
      meshRef.current.setMatrixAt(i, matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.count = instances.length;
  }, [instances]);

  return (
    // Usar la baseGeometry con colores precalculados
    <instancedMesh ref={meshRef} args={[baseGeometry, mountainMaterial, count]} castShadow receiveShadow />
  );
} 