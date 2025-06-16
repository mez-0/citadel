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

  // AG Grid column definitions for raw TLSH hashes
  const columnDefs: ColDef<SimilarTLSHHash>[] = [
    { field: 'sha256', headerName: 'SHA256', flex: 2, cellStyle: { color: '#60a5fa', fontWeight: '600', background: '#1f2937', fontFamily: 'monospace' } },
    { field: 'tlsh', headerName: 'TLSH', flex: 2, cellStyle: { color: '#8b5cf6', fontWeight: '600', background: '#1f2937', fontFamily: 'monospace' } },
    { field: 'distance', headerName: 'Distance', flex: 1, cellStyle: { color: '#f59e0b', fontWeight: '600', background: '#1f2937' } },
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