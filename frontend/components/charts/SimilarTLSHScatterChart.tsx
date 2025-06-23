import React from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';

export interface SimilarTLSHHash {
  tlsh: string;
  sha256: string;
  distance: number;
}

interface SimilarTLSHScatterChartProps {
  data: SimilarTLSHHash[];
}

export const SimilarTLSHScatterChart: React.FC<SimilarTLSHScatterChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ height: '300px' }}>
        <div className="text-center">
          <i className="bi bi-table text-muted" style={{ fontSize: '3rem' }}></i>
          <p className="text-muted mt-2 mb-0">No similar TLSH hashes available</p>
        </div>
      </div>
    );
  }

  // Find the maximum distance value
  const maxDistance = Math.max(...data.map(d => d.distance), 1); // Avoid division by zero

  // Helper to interpolate between red and yellow
  const getGradientColor = (value: number) => {
    // Red:   #ef4444 (239,68,68)
    // Yellow: #f59e0b (245,158,11)
    const r1 = 239, g1 = 68, b1 = 68;
    const r2 = 245, g2 = 158, b2 = 11;
    const t = Math.max(0, Math.min(1, value / maxDistance));
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `rgb(${r},${g},${b})`;
  };

  // AG Grid column definitions for raw TLSH hashes
  const columnDefs: ColDef<SimilarTLSHHash>[] = [
    { field: 'sha256', headerName: 'SHA256', flex: 2, cellStyle: { color: '#60a5fa', fontWeight: '600', background: '#1f2937', fontFamily: 'monospace' } },
    { field: 'tlsh', headerName: 'TLSH', flex: 2, cellStyle: { color: '#8b5cf6', fontWeight: '600', background: '#1f2937', fontFamily: 'monospace' } },
    {
      field: 'distance',
      headerName: 'Distance',
      flex: 1,
      cellStyle: (params: any) => ({
        background: getGradientColor(params.value),
        color: '#fff',
        fontWeight: '600',
        transition: 'background 0.3s, color 0.3s',
      }),
    },
  ];

  // Calculate grid height
  const getGridHeight = (rowCount: number, rowHeight = 44, headerHeight = 48, pagination = false) => {
    if (pagination && rowCount > 10) {
      return rowHeight * 10 + headerHeight + 56;
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
      <div className="ag-theme-alpine w-100" style={{
        width: '100%',
        background: '#1f2937',
        color: '#f3f4f6',
        borderRadius: 8,
        border: '1px solid #374151',
        height: getGridHeight(data.length, 44, 48, true)
      }}>
        <AgGridReact
          rowData={data}
          columnDefs={columnDefs}
          defaultColDef={{
            sortable: true,
            filter: true,
            resizable: true,
            menuTabs: ['filterMenuTab']
          }}
          animateRows={true}
          headerHeight={48}
          rowHeight={44}
          pagination={data.length > 10}
          paginationPageSize={10}
          domLayout="autoHeight"
        />
      </div>
    </div>
  );
}; 