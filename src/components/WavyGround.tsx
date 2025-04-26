'use client';

import * as THREE from 'three';
import { useMemo, forwardRef } from 'react';
import { createNoise2D } from 'simplex-noise';

const noiseFrequency = 0.01; // Qué tan "juntas" están las colinas
const noiseAmplitude = 5;  // Qué tan altas son las colinas
const baseColor = new THREE.Color(0x448844); // Verde base más oscuro
const tipColor = new THREE.Color(0x99dd77); // Verde claro para picos
const tempColor = new THREE.Color(); // Para cálculos

// Usar forwardRef para poder pasar una ref al mesh desde el componente padre
const WavyGround = forwardRef<THREE.Mesh>((props, ref) => {
  const noise2D = useMemo(() => createNoise2D(), []);

  const geometry = useMemo(() => {
    const size = 500; // Tamaño del plano
    const segments = 100; // Mayor número de segmentos para detalle
    const planeGeo = new THREE.PlaneGeometry(size, size, segments, segments);
    planeGeo.rotateX(-Math.PI / 2); // Rotar para que sea horizontal

    const positions = planeGeo.attributes.position;
    const colors = new Float32Array(positions.count * 3); // Array para colores RGB
    const vertex = new THREE.Vector3();
    // Usar constantes definidas fuera
    // const noiseFrequency = 0.01;
    // const noiseAmplitude = 5;

    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      // Calcular ruido basado en la posición XZ
      const noiseValue = noise2D(vertex.x * noiseFrequency, vertex.z * noiseFrequency);
      // Aplicar desplazamiento en Y
      const height = noiseValue * noiseAmplitude;
      positions.setY(i, height);

      // Calcular color basado en altura (normalizada entre -1 y 1 del ruido)
      const colorFactor = (noiseValue + 1) / 2; // Mapear -1..1 a 0..1
      tempColor.lerpColors(baseColor, tipColor, colorFactor);
      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;
    }

    planeGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3)); // Añadir atributo de color
    planeGeo.computeVertexNormals(); // Recalcular normales para iluminación correcta
    return planeGeo;
  }, [noise2D]);

  return (
    // Usar la ref reenviada
    <mesh ref={ref} geometry={geometry} position={[0, -1, 0]} receiveShadow>
      <meshStandardMaterial side={THREE.DoubleSide} vertexColors={true} /> {/* Habilitar vertexColors */}
    </mesh>
  );
});

WavyGround.displayName = 'WavyGround'; // Buena práctica para debugging con forwardRef
export default WavyGround; 