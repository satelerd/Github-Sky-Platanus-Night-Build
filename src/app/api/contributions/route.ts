import { NextRequest, NextResponse } from 'next/server';

// !! ADVERTENCIA DE SEGURIDAD !!
// Usar el token directamente aquí es inseguro.
// TODO: Cambiar a process.env.GITHUB_TOKEN inmediatamente.
// Se lee desde las variables de entorno (.env.local para desarrollo)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

// Definimos interfaces para un tipado más estricto
interface ContributionDay {
  contributionCount: number;
  date: string;
  weekday: number; // Incluido en la query aunque no se use directamente en la normalización
}

interface ContributionWeek {
  contributionDays: ContributionDay[];
}

const GITHUB_CONTRIBUTIONS_QUERY = `
  query($userName: String!) {
    user(login: $userName) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
              weekday
            }
          }
        }
      }
    }
  }
`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userName = searchParams.get('username');

  if (!userName) {
    return NextResponse.json({ error: 'Username query parameter is required' }, { status: 400 });
  }

  if (!GITHUB_TOKEN) {
      return NextResponse.json({ error: 'GitHub token not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(GITHUB_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Authorization': `bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GITHUB_CONTRIBUTIONS_QUERY,
        variables: { userName },
      }),
      // Configurar Next.js para cachear la respuesta por 1 hora (3600 segundos)
      // Esto ayuda a evitar el rate limiting de la API de GitHub.
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
        const errorData = await response.text();
        console.error('GitHub API Error Response:', errorData);
        return NextResponse.json({ error: `GitHub API responded with ${response.status}`, details: errorData }, { status: response.status });
    }

    const data = await response.json();

    if (data.errors) {
        console.error('GitHub GraphQL Errors:', data.errors);
        // Podría ser un usuario no encontrado, etc.
        return NextResponse.json({ error: 'Error fetching data from GitHub GraphQL', details: data.errors }, { status: 400 });
    }

    // TODO: Normalizar la estructura de datos antes de devolverla.
    // Por ahora, devolvemos la data cruda para verificar la conexión.
    const contributionCalendar = data?.data?.user?.contributionsCollection?.contributionCalendar;

    if (!contributionCalendar) {
        console.error('Contribution calendar data not found in response:', data);
        return NextResponse.json({ error: 'Contribution data not found for the user' }, { status: 404 });
    }

    // Normalización simple inicial: Aplanar los días
    const contributions: { date: string; count: number; weekday: number }[] = contributionCalendar.weeks.flatMap(
        (week: ContributionWeek) =>
            week.contributionDays.map((day: ContributionDay) => ({
                date: day.date,
                count: day.contributionCount,
                weekday: day.weekday
            }))
    );


    // Devolver los datos normalizados
    // return NextResponse.json(contributionCalendar); // Devolver crudo temporalmente
     return NextResponse.json(contributions); // Devolver normalizado


  } catch (error) {
    console.error('Error fetching GitHub contributions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 