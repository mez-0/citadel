import React from 'react';
import { AgCharts } from 'ag-charts-react';
import { AgChartOptions, AgBarSeriesOptions } from 'ag-charts-community';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ICellRendererParams } from 'ag-grid-community';

export interface FunctionCategoryData {
  category: string;
  count: number;
  percentage?: string;
}

export interface RawFunctionMapping {
  dll: string;
  function: string;
  description: string;
  category: string;
}

interface FunctionCategoryChartProps {
  data: FunctionCategoryData[];
  rawFunctionMappings?: RawFunctionMapping[];
}

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

const CATEGORY_COLORS: Record<string, string> = {
  'File Operations': '#3b82f6',
  'Network Operations': '#06b6d4',
  'Process and Thread Management': '#f59e0b',
  'Memory Management': '#10b981',
  'Registry Operations': '#f97316',
  'System Information and Control': '#8b5cf6',
  'DLL Injection and Manipulation': '#ef4444',
  'Cryptographic Operations': '#84cc16',
  'Hooking and Interception': '#a21caf',
};

export const FunctionCategoryChart: React.FC<FunctionCategoryChartProps> = ({ data, rawFunctionMappings = [] }) => {
  console.log('FunctionCategoryChart data:', data);
  console.log('FunctionCategoryChart rawFunctionMappings:', rawFunctionMappings);

  if (!data || data.length === 0) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ height: '300px' }}>
        <div className="text-center">
          <i className="bi bi-bar-chart text-muted" style={{ fontSize: '3rem' }}></i>
          <p className="text-muted mt-2 mb-0">No function category data available</p>
        </div>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.count, 0);

  // AG Grid column definitions for raw function mappings
  const rawColumnDefs: ColDef<RawFunctionMapping>[] = [
    { field: 'dll', headerName: 'DLL', flex: 1, filter: true, sortable: true, cellStyle: { color: '#60a5fa', fontWeight: '600', background: '#1f2937' } },
    { field: 'function', headerName: 'Function', flex: 1, filter: true, sortable: true, cellStyle: { color: '#f3f4f6', fontWeight: 'normal', background: '#1f2937' } },
    { field: 'description', headerName: 'Description', flex: 2, filter: true, sortable: true, cellStyle: { color: '#f3f4f6', fontWeight: 'normal', background: '#1f2937' } },
    {
      field: 'category',
      headerName: 'Category',
      flex: 1,
      filter: true,
      sortable: true,
      cellRenderer: (params: ICellRendererParams<RawFunctionMapping, string>) => {
        const color = CATEGORY_COLORS[params.value as string] || '#374151';
        return (
          <span
            style={{
              display: 'inline-block',
              background: color,
              color: '#fff',
              fontWeight: 600,
              borderRadius: 999,
              padding: '4px 14px',
              fontSize: '0.97em',
              letterSpacing: '0.01em',
              boxShadow: '0 1px 4px 0 rgba(0,0,0,0.10)',
              fontFamily: 'Courier New',
            }}
          >
            {params.value}
          </span>
        );
      },
      cellStyle: {
        background: '#1f2937',
        border: 'none',
        padding: '0',
      },
    },
  ];

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
            fill: '#1f2937',
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
      fill: '#1f2937',
    },
    padding: {
      top: 20,
      right: 30,
      bottom: 60,
      left: 60,
    },
    series: [{
      type: 'bar',
      xKey: 'category',
      yKey: 'count',
      yName: 'Function Count',
      strokeWidth: 2,
      cornerRadius: 6,
      highlightStyle: {
        item: {
          strokeWidth: 3,
          stroke: '#ffffff',
          fillOpacity: 0.9,
        },
        series: {
          dimOpacity: 0.4,
        },
      },
      label: {
        enabled: true,
        color: '#ffffff',
        fontSize: 13,
        fontWeight: 600,
        formatter: ({ value }: { value: number }) => {
          const percentage = ((value / total) * 100).toFixed(0);
          return value > (total * 0.05) ? `${value} (${percentage}%)` : `${value}`;
        },
      },
      tooltip: {
        renderer: ({ datum }: { datum: FunctionCategoryData }) => {
          const percentage = ((datum.count / total) * 100).toFixed(1);
          return {
            content: `<div style=\"background: #1e293b; padding: 16px; border-radius: 12px; border: 1px solid #475569; box-shadow: 0 8px 24px rgba(0,0,0,0.4); min-width: 220px;\">
              <div style=\"display: flex; align-items: center; margin-bottom: 8px;\">
                <div style=\"color: #60a5fa; font-weight: 600; font-size: 14px;\">${datum.category}</div>
              </div>
              <div style=\"color: #94a3b8; font-size: 13px; margin-bottom: 4px;\">${datum.count} functions (${percentage}%)</div>
            </div>`,
          };
        },
      },
    } as AgBarSeriesOptions],
    legend: {
      enabled: false,
    },
    listeners: {
      seriesNodeClick: (event: { datum: FunctionCategoryData }) => {
        console.log('Bar clicked:', event.datum);
      },
    },
  };

  console.log('FunctionCategoryChart chartOptions:', chartOptions);

  // Calculate grid height (like in page.tsx)
  const getGridHeight = (rowCount: number, rowHeight = 44, headerHeight = 48, pagination = false) => {
    if (pagination && rowCount > 10) {
      return rowHeight * 10 + headerHeight + 56; // 56px for pagination controls
    }
    return rowHeight * Math.max(rowCount, 1) + headerHeight;
  };

  return (
    <div 
      className="w-100 h-100 d-flex flex-column align-items-center justify-content-center"
      style={{
        backgroundColor: '#1f2937',
        borderRadius: '8px',
        border: '1px solid #374151',
        padding: '16px',
      }}
    >
      <div style={{ width: '100%', height: '100%', minHeight: '320px' }}>
        <AgCharts options={chartOptions} />
      </div>
      {/* AG Grid Table below the chart: RAW FUNCTION MAPPINGS */}
      <div className="ag-theme-alpine mt-4 w-100" style={{
        width: '100%',
        background: '#1f2937',
        color: '#f3f4f6',
        borderRadius: 8,
        border: '1px solid #374151',
        height: getGridHeight(rawFunctionMappings?.length ?? 0, 44, 48, true)
      }}>
        <AgGridReact
          rowData={rawFunctionMappings || []}
          columnDefs={rawColumnDefs}
          defaultColDef={{
            sortable: true,
            filter: true,
            resizable: true,
            menuTabs: ['filterMenuTab']
          }}
          animateRows={true}
          headerHeight={48}
          rowHeight={44}
          pagination={(rawFunctionMappings?.length ?? 0) > 10}
          paginationPageSize={10}
          domLayout="autoHeight"
        />
      </div>
    </div>
  );
}; 