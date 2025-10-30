"use client";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
ChartJS.register(ArcElement, Tooltip, Legend);

export default function BudgetChart({
  breakdown,
}: {
  breakdown: Record<string, number>;
}) {
  if (!breakdown || Object.keys(breakdown).length === 0)
    return (
      <p className="text-sm text-gray-500 text-center mt-2">
        Budget data not available
      </p>
    );

  const labels = Object.keys(breakdown);
  const values = Object.values(breakdown);

  // Consistent colour palette (same order for grid & pie)
  const colors = {
    flights: "#6366F1",
    stay: "#4F46E5",
    food: "#818CF8",
    activities: "#A5B4FC",
    misc: "#C7D2FE",
  };

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: labels.map((key) => colors[key as keyof typeof colors] || "#CBD5E1"),
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    plugins: {
      legend: { position: "bottom" as const },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const total = values.reduce((a, b) => a + b, 0);
            const value = context.parsed;
            const percentage = ((value / total) * 100).toFixed(1);
            return ` £${value} (${percentage}%)`;
          },
        },
      },
    },
    animation: {
      animateRotate: true,
      duration: 800,
    },
  };

  return (
    <div className="h-[250px] w-full flex items-center justify-center">
      <Pie data={data} options={options} />
    </div>
  );
}
