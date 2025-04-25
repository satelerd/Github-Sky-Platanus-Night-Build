'use client'; // Marcar como cliente porque usa next/dynamic con ssr: false
import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback } from 'react';
import ContributionGraph from '@/components/ContributionGraph';

// Definir la interfaz para los datos de contribución que esperamos de la API
interface Contribution {
  date: string;
  count: number;
  weekday: number;
}

// Mover la definición de SceneProps aquí si Scene.tsx no la exporta
// O importar SceneProps desde Scene.tsx si la exporta
// ELIMINAR - SceneProps no se usa aquí
// interface SceneProps {
//  contributions: Contribution[];
// }

// Importamos el componente Scene dinámicamente y deshabilitamos SSR
const Scene = dynamic(() => import('@/components/Scene'), {
  ssr: false,
  loading: () => <p style={{ color: 'white', textAlign: 'center', marginTop: '20%' }}>Loading 3D Scene...</p> // Opcional: Muestra algo mientras carga
});

export default function Home() {
  // Estados deben estar definidos DENTRO del componente
  const [username, setUsername] = useState<string>('satelerd');
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // useCallback también debe estar DENTRO del componente si usa estados/setters
  const fetchContributions = useCallback(async (user: string) => {
    if (!user) return;
    console.log(`[page.tsx] Fetching contributions for: ${user}`);
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/contributions?username=${encodeURIComponent(user)}`);
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[page.tsx] API Error ${response.status}:`, errorData);
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      const data: Contribution[] = await response.json();
      console.log(`[page.tsx] Received ${data.length} contributions. Setting state.`);
      setContributions(data);
    } catch (err) {
      let errorMessage = 'Failed to fetch contributions';
      if (err instanceof Error) {
          errorMessage = err.message;
      }
      console.error("[page.tsx] Failed to fetch contributions:", err);
      setError(errorMessage);
      setContributions([]);
    } finally {
      console.log(`[page.tsx] Finished fetching for: ${user}`);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContributions(username);
  }, [fetchContributions, username]);

  const handleUserSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const newUser = formData.get('usernameInput') as string;
      setUsername(newUser);
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ background: 'rgba(0,0,0,0.7)', padding: '10px', borderRadius: '5px' }}>
            <form onSubmit={handleUserSubmit} style={{ display: 'flex', gap: '5px' }}>
                <input
                    type="text"
                    name="usernameInput"
                    defaultValue={username}
                    placeholder="GitHub Username"
                    style={{ padding: '5px', color: '#333' }}
                />
                <button type="submit" disabled={isLoading} style={{ padding: '5px' }}>
                    {isLoading ? 'Loading...' : 'Load Sky'}
                </button>
            </form>
            {error && <p style={{ color: 'red', marginTop: '5px' }}>Error: {error}</p>}
        </div>

        <ContributionGraph contributions={contributions} />
      </div>
      <Scene contributions={contributions} />
    </div>
  );
}
