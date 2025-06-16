import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface EntropyDataItem {
  segment: string;
  entropy: number;
  risk: string;
}

interface EntropyAnalysisChartProps {
  fileEntropy: number;
}

export const EntropyAnalysisChart: React.FC<EntropyAnalysisChartProps> = ({ fileEntropy }) => {
  const entropyData: EntropyDataItem[] = [
    { segment: "Header", entropy: 6.2, risk: "Medium" },
    { segment: "Code", entropy: fileEntropy || 0, risk: (fileEntropy || 0) > 7 ? "High" : (fileEntropy || 0) > 6 ? "Medium" : "Low" },
    { segment: "Data", entropy: 5.8, risk: "Low" },
    { segment: "Resources", entropy: 4.1, risk: "Low" }
  ];

  const getBarColor = (risk: string) => {
    switch (risk) {
      case 'High':
        return '#ef4444'; // red-500
      case 'Medium':
        return '#f59e0b'; // amber-500
      case 'Low':
        return '#22c55e'; // green-500
      default:
        return '#6366f1'; // indigo-500
    }
  };

  return (
    <div 
      className="w-full h-[400px]"
      style={{
        backgroundColor: '#1f2937',
        borderRadius: '8px',
        border: '1px solid #374151',
        padding: '16px',
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={entropyData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="segment" 
            stroke="#9CA3AF"
            tick={{ fill: '#f3f4f6' }}
          />
          <YAxis 
            stroke="#9CA3AF"
            tick={{ fill: '#f3f4f6' }}
            domain={[0, 8]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '6px',
              color: '#f3f4f6',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
            formatter={(value: number) => [
              `${value.toFixed(2)}`,
              'Entropy'
            ]}
          />
          <Bar
            dataKey="entropy"
            fill="#6366f1"
            radius={[4, 4, 0, 0]}
            maxBarSize={60}
          >
            {entropyData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getBarColor(entry.risk)}
                stroke="#374151"
                strokeWidth={1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}; 