'use client';
import { AgCharts } from 'ag-charts-react';
import { AgChartOptions, AgBarSeriesOptions } from 'ag-charts-community';
import { DefenderData } from '@/lib/types';

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

// Enhanced color palette with hover states for defender status
const ENHANCED_COLORS = [
  { fill: '#10b981', hover: '#059669', stroke: '#047857', name: 'Protected' }, // emerald for protected
  { fill: '#ef4444', hover: '#dc2626', stroke: '#b91c1c', name: 'Unprotected' }, // red for unprotected
  { fill: '#f59e0b', hover: '#d97706', stroke: '#b45309', name: 'Warning' }, // amber for warnings
  { fill: '#8b5cf6', hover: '#7c3aed', stroke: '#6d28d9', name: 'Scanning' }, // violet for scanning
  { fill: '#06b6d4', hover: '#0891b2', stroke: '#0e7490', name: 'Updating' }, // cyan for updating
  { fill: '#3b82f6', hover: '#2563eb', stroke: '#1d4ed8', name: 'Unknown' }, // blue for unknown
];

interface DefenderAnalysisChartProps {
  data: DefenderData[];
}

export function DefenderAnalysisChart({ data }: DefenderAnalysisChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ height: '300px' }}>
        <div className="text-center">
          <i className="bi bi-bar-chart text-muted" style={{ fontSize: '3rem' }}></i>
          <p className="text-muted mt-2 mb-0">No defender data available</p>
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
        bar: {
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
      right: 30,
      bottom: 60,
      left: 60,
    },
    series: [{
      type: 'bar',
      xKey: 'status',
      yKey: 'count',
      yName: 'File Count',
      strokeWidth: 2,
      cornerRadius: 6,
      // Enhanced highlighting for better interactivity
      highlightStyle: {
        item: {
          strokeWidth: 3,
          stroke: '#ffffff',
          fillOpacity: 0.9,
        },
        series: {
          dimOpacity: 0.4, // Dim other bars when one is highlighted
        },
      },
      // Advanced item styler for dynamic coloring based on defender status
      itemStyler: ({ datum, highlighted }: { datum: DefenderData; highlighted: boolean }) => {
        // Map status to appropriate color
        let colorSet = ENHANCED_COLORS[5]; // default to blue (unknown)
        
        const status = datum.status.toLowerCase();
        if (status.includes('protected') || status.includes('secure')) {
          colorSet = ENHANCED_COLORS[0]; // green
        } else if (status.includes('unprotected') || status.includes('vulnerable') || status.includes('threat')) {
          colorSet = ENHANCED_COLORS[1]; // red
        } else if (status.includes('warning') || status.includes('caution')) {
          colorSet = ENHANCED_COLORS[2]; // amber
        } else if (status.includes('scanning') || status.includes('analyzing')) {
          colorSet = ENHANCED_COLORS[3]; // violet
        } else if (status.includes('updating') || status.includes('pending')) {
          colorSet = ENHANCED_COLORS[4]; // cyan
        }
        
        // Dynamic styling based on count (severity)
        const total = data.reduce((sum, item) => sum + item.count, 0);
        const isHighCount = datum.count > (total / data.length);
        
        return {
          fill: highlighted ? colorSet.hover : colorSet.fill,
          stroke: highlighted ? '#ffffff' : colorSet.stroke,
          strokeWidth: highlighted ? 3 : (isHighCount ? 2 : 1),
          fillOpacity: highlighted ? 1 : 0.9,
        };
      },
      label: {
        enabled: true,
        color: '#ffffff',
        fontSize: 13,
        fontWeight: 600,
        formatter: ({ value }: { value: number }) => {
          const total = data.reduce((sum, item) => sum + item.count, 0);
          const percentage = ((value / total) * 100).toFixed(0);
          return value > (total * 0.05) ? `${value} (${percentage}%)` : `${value}`;
        },
      },
      tooltip: {
        renderer: ({ datum }: { datum: DefenderData }) => {
          const total = data.reduce((sum, item) => sum + item.count, 0);
          const percentage = ((datum.count / total) * 100).toFixed(1);
          const isHighCount = datum.count > (total / data.length);
          
          // Determine status color and icon
          const status = datum.status.toLowerCase();
          let statusIcon = '📊';
          
          if (status.includes('protected') || status.includes('secure')) {
            statusIcon = '🛡️';
          } else if (status.includes('unprotected') || status.includes('vulnerable') || status.includes('threat')) {
            statusIcon = '⚠️';
          } else if (status.includes('warning') || status.includes('caution')) {
            statusIcon = '⚡';
          } else if (status.includes('scanning') || status.includes('analyzing')) {
            statusIcon = '🔍';
          } else if (status.includes('updating') || status.includes('pending')) {
            statusIcon = '🔄';
          }
          
          return {
            content: `<div style="background: #1e293b; padding: 16px; border-radius: 12px; border: 1px solid #475569; box-shadow: 0 8px 24px rgba(0,0,0,0.4); min-width: 220px;">
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <div style="font-size: 16px; margin-right: 8px;">${statusIcon}</div>
                <div style="color: #ffffff; font-weight: 600; font-size: 14px;">${datum.status}</div>
              </div>
              <div style="color: #94a3b8; font-size: 13px; margin-bottom: 4px;">${datum.count} files (${percentage}%)</div>
              ${isHighCount ? '<div style="color: #fbbf24; font-size: 12px; font-weight: 500;">📈 Above average file count</div>' : ''}
            </div>`,
          };
        },
      },
    } as AgBarSeriesOptions],
    legend: {
      enabled: false, // Keep disabled for bar charts with single series
    },
    // Enhanced interactivity
    listeners: {
      seriesNodeClick: (event: { datum: DefenderData }) => {
        console.log('Bar clicked:', event.datum);
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