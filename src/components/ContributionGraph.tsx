'use client';

interface Contribution {
  date: string;
  count: number;
  weekday: number;
}

interface ContributionGraphProps {
  contributions: Contribution[];
}

// Función para obtener el color según el número de contribuciones
const getColorClass = (count: number): string => {
  if (count === 0) return 'bg-gray-300 dark:bg-gray-800'; // Gris más oscuro para 0 contribuciones
  if (count <= 2) return 'bg-green-200 dark:bg-green-900'; // Nivel 1
  if (count <= 5) return 'bg-green-400 dark:bg-green-700'; // Nivel 2
  if (count <= 10) return 'bg-green-600 dark:bg-green-500'; // Nivel 3
  return 'bg-green-800 dark:bg-green-300'; // Nivel 4
};

export default function ContributionGraph({ contributions }: ContributionGraphProps) {
  if (!contributions || contributions.length === 0) {
    return <div className="text-xs text-gray-400">No contribution data.</div>;
  }

  // Añadir días vacíos al principio para alinear la primera semana
  const firstDayWeekday = contributions[0].weekday;
  const emptyDays = Array.from({ length: firstDayWeekday }, (_, i) => ({ key: `empty-${i}` }));

  return (
    <div className="flex flex-col items-end p-2 bg-white/80 dark:bg-black/80 rounded shadow">
        <p className="text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">Contribution Activity</p>
        <div className="grid grid-flow-col grid-rows-7 gap-0.5">
            {/* Renderizar días vacíos */}
            {emptyDays.map(day => (
                <div key={day.key} className="w-2 h-2 rounded-sm"></div>
            ))}
            {/* Renderizar días con contribuciones */}
            {contributions.map((day) => (
                <div
                key={day.date}
                className={`w-2 h-2 rounded-sm ${getColorClass(day.count)}`}
                title={`${day.date}: ${day.count} contributions`}
                />
            ))}
        </div>
    </div>
  );
} 