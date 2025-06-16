'use client';
import { AgCharts } from 'ag-charts-react';
import { AgChartOptions, AgPieSeriesOptions } from 'ag-charts-community';
import { ThreatData } from '@/lib/types';

const CHART_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#f59e0b', // amber
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#f97316', // orange
  '#06b6d4', // cyan
  '#84cc16'  // lime
];

// Enhanced color palette with hover states
const ENHANCED_COLORS = [
  { fill: '#3b82f6', hover: '#2563eb', stroke: '#1d4ed8' }, // blue
  { fill: '#ef4444', hover: '#dc2626', stroke: '#b91c1c' }, // red
  { fill: '#f59e0b', hover: '#d97706', stroke: '#b45309' }, // amber
  { fill: '#10b981', hover: '#059669', stroke: '#047857' }, // emerald
  { fill: '#8b5cf6', hover: '#7c3aed', stroke: '#6d28d9' }, // violet
  { fill: '#f97316', hover: '#ea580c', stroke: '#c2410c' }, // orange
  { fill: '#06b6d4', hover: '#0891b2', stroke: '#0e7490' }, // cyan
  { fill: '#84cc16', hover: '#65a30d', stroke: '#4d7c0f' }  // lime
];

interface ThreatDistributionChartProps {
  data: ThreatData[];
}

export function ThreatDistributionChart({ data }: ThreatDistributionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ height: '300px' }}>
        <div className="text-center">
          <i className="bi bi-pie-chart text-muted" style={{ fontSize: '3rem' }}></i>
          <p className="text-muted mt-2 mb-0">No threat data available</p>
        </div>
      </div>
    );
  }

  const chartOptions: AgChartOptions = {
    data,
    theme: {
      palette: {
        fills: CHART_COLORS,
        strokes: CHART_COLORS,
      },
      overrides: {
        common: {
          background: {
            fill: '#1f2937', // gray-800 to match card background
          },
        },
        pie: {
          title: {
            color: '#f1f5f9',
          },
        },
      },
    },
    background: {
      fill: '#1f2937', // gray-800 to match card background
    },
    padding: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20,
    },
    series: [{
      type: 'pie',
      angleKey: 'value',
      calloutLabelKey: 'name',
      sectorLabelKey: 'value',
      innerRadiusRatio: 0.65,
      strokeWidth: 2,
      stroke: '#374151',
      // Enhanced highlighting for better interactivity
      highlightStyle: {
        item: {
          strokeWidth: 3,
          stroke: '#ffffff',
          fillOpacity: 0.9,
        },
        series: {
          dimOpacity: 0.3, // Dim other sectors when one is highlighted
        },
      },
      // Advanced item styler for dynamic coloring based on threat severity
      itemStyler: ({ datum, highlighted }: { datum: ThreatData; highlighted: boolean }) => {
        const dataIndex = data.findIndex(item => item.name === datum.name);
        const colorSet = ENHANCED_COLORS[dataIndex % ENHANCED_COLORS.length];
        
        // Dynamic styling based on threat value (severity)
        const isHighThreat = datum.value > (data.reduce((sum, item) => sum + item.value, 0) / data.length);
        
        return {
          fill: highlighted ? colorSet.hover : colorSet.fill,
          stroke: highlighted ? '#ffffff' : colorSet.stroke,
          strokeWidth: highlighted ? 3 : (isHighThreat ? 2 : 1),
          fillOpacity: highlighted ? 1 : 0.9,
        };
      },
      calloutLabel: {
        enabled: true,
        fontSize: 13,
        fontWeight: 600,
        color: '#f9fafb',
        minAngle: 5, // Only show callout labels for sectors larger than 5 degrees
        formatter: ({ datum }: { datum: ThreatData }) => {
          const total = data.reduce((sum, item) => sum + item.value, 0);
          const percentage = ((datum.value / total) * 100).toFixed(1);
          return `${datum.name} (${percentage}%)`;
        },
      },
      calloutLine: {
        length: 18,
        strokeWidth: 1.5,
        colors: ['#6b7280'], // gray-500
      },
      sectorLabel: {
        enabled: true,
        fontSize: 12,
        fontWeight: 600,
        color: '#ffffff',
        formatter: ({ datum }: { datum: ThreatData }) => {
          const total = data.reduce((sum, item) => sum + item.value, 0);
          const percentage = ((datum.value / total) * 100).toFixed(1);
          // Only show percentage in sector if it's large enough (> 8%)
          return percentage > '8.0' ? `${percentage}%` : '';
        },
      },
      tooltip: {
        renderer: ({ datum }: { datum: ThreatData }) => {
          const total = data.reduce((sum, item) => sum + item.value, 0);
          const percentage = ((datum.value / total) * 100).toFixed(1);
          const isHighThreat = datum.value > (total / data.length);
          
          return {
            content: `<div style="background: #1e293b; padding: 16px; border-radius: 12px; border: 1px solid #475569; box-shadow: 0 8px 24px rgba(0,0,0,0.4); min-width: 200px;">
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <div style="width: 12px; height: 12px; border-radius: 50%; background: ${ENHANCED_COLORS[data.findIndex(item => item.name === datum.name) % ENHANCED_COLORS.length].fill}; margin-right: 8px;"></div>
                <div style="color: #ffffff; font-weight: 600; font-size: 14px;">${datum.name}</div>
              </div>
              <div style="color: #94a3b8; font-size: 13px; margin-bottom: 4px;">${datum.value} threats (${percentage}%)</div>
              ${isHighThreat ? '<div style="color: #fbbf24; font-size: 12px; font-weight: 500;">⚠️ Above average threat level</div>' : ''}
            </div>`,
          };
        },
      },
    } as AgPieSeriesOptions],
    legend: {
      enabled: true,
      position: 'bottom',
      spacing: 20,
      maxWidth: 600,
      toggleSeries: false, // Disable series toggling for pie charts
      preventHidingAll: true,
      item: {
        paddingX: 20,
        paddingY: 10,
        maxWidth: 180,
        marker: {
          size: 12,
          strokeWidth: 0,
          shape: 'circle',
        },
        label: {
          color: '#f9fafb',
          fontSize: 13,
          fontWeight: 500,
          maxLength: 20,
          // Enhanced label formatter with threat count
          formatter: ({ value }: { value: string }) => {
            const threatItem = data.find(item => item.name === value);
            if (threatItem) {
              const total = data.reduce((sum, item) => sum + item.value, 0);
              const percentage = ((threatItem.value / total) * 100).toFixed(0);
              return `${value} (${percentage}%)`;
            }
            return value;
          },
        },
        line: {
          strokeWidth: 0, // Remove line for pie charts
          length: 0,
        },
      },
    },
    // Enhanced interactivity
    listeners: {
      seriesNodeClick: (event: { datum: ThreatData }) => {
        console.log('Pie sector clicked:', event.datum);
      },
    },
  };

  return (
    <div className="w-100 h-100 d-flex align-items-center justify-content-center">
      <div style={{ width: '100%', height: '100%', minHeight: '320px' }}>
        <AgCharts options={chartOptions} />
      </div>
    </div>
  );
} 