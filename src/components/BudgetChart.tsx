"use client"; // Marks this component as a client-side component in Next.js (enables interactivity)

import { Pie } from "react-chartjs-2"; // Imports the Pie chart component wrapper for React
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"; // Imports core Chart.js modules needed
ChartJS.register(ArcElement, Tooltip, Legend); // Registers necessary Chart.js components globally

// BudgetChart component definition
export default function BudgetChart({
  breakdown,
}: {
  breakdown: Record<string, number>; // Expects a prop 'breakdown' as an object with string keys and number values
}) {

  // If no breakdown data is provided, show a fallback message
  if (!breakdown || Object.keys(breakdown).length === 0)
    return (
      <p className="text-sm text-gray-500 text-center mt-2">
        Budget data not available
      </p>
    );

  // Extracts category names (labels) and values (amounts) from the breakdown object
  const labels = Object.keys(breakdown);
  const values = Object.values(breakdown);

  // Defines a fixed colour palette for the budget categories
  const colors = {
    flights: "#6366F1",
    stay: "#4F46E5",
    food: "#818CF8",
    activities: "#A5B4FC",
    misc: "#C7D2FE",
  };

  // Prepares the dataset configuration for the Pie chart
  const data = {
    labels,
    datasets: [
      {
        data: values, // Data values for each label
        // Assigns colour to each label, defaults to grey if not found in palette
        backgroundColor: labels.map(
          (key) => colors[key as keyof typeof colors] || "#CBD5E1"
        ),
        borderColor: "#fff", // White border between pie slices
        borderWidth: 2, // Thickness of slice border
      },
    ],
  };

  // Chart appearance and tooltip configuration
  const options = {
    plugins: {
      legend: { position: "bottom" as const }, // Positions the chart legend at the bottom
      tooltip: {
        callbacks: {
          // Custom tooltip to show value and percentage
          label: (context: any) => {
            const total = values.reduce((a, b) => a + b, 0); // Calculate total of all values
            const value = context.parsed; // Current value hovered
            const percentage = ((value / total) * 100).toFixed(1); // Calculate percentage
            return ` £${value} (${percentage}%)`; // Tooltip format: "£value (percentage%)"
          },
        },
      },
    },
    animation: {
      animateRotate: true, // Enables rotation animation
      duration: 800, // Animation duration in milliseconds
    },
  };

  // Renders the Pie chart using prepared data and options
  return (
    <div className="h-[250px] w-full flex items-center justify-center">
      <Pie data={data} options={options} />
    </div>
  );
}
