import React from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, ColDef } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';
import { Import } from '@/lib/types';

// Register AG-Grid modules
if (typeof window !== 'undefined') {
  ModuleRegistry.registerModules([AllCommunityModule]);
}

interface ImportsTableProps {
  imports: Import[];
  className?: string;
}

// Helper for dynamic grid height
const getGridHeight = (rowCount: number, rowHeight = 44, headerHeight = 48, pagination = false) => {
  if (pagination && rowCount > 10) {
    return rowHeight * 10 + headerHeight + 56; // 56px for pagination controls
  }
  return rowHeight * Math.max(rowCount, 1) + headerHeight;
};

export const ImportsTable: React.FC<ImportsTableProps> = ({ 
  imports, 
  className = "" 
}) => {
  const columnDefs: ColDef<Import>[] = [
    { 
      field: 'libname', 
      headerName: 'Library', 
      flex: 1,
      cellRenderer: (params: any) => (
        <span className="text-white fw-medium">
          {params.value}
        </span>
      )
    },
    { 
      field: 'name', 
      headerName: 'Function', 
      flex: 1,
      cellClass: 'text-gray-300 font-monospace'
    },
    { 
      field: 'type', 
      headerName: 'Type', 
      flex: 1,
      cellRenderer: (params: any) => (
        <span className="badge bg-info px-2 py-1">
          {params.value}
        </span>
      )
    },
    { 
      field: 'ordinal', 
      headerName: 'Ordinal', 
      flex: 1,
      cellClass: 'text-gray-300'
    }
  ];

  if (imports.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="card bg-gray-800 border-gray-700">
          <div className="card-header bg-gray-800 border-gray-700">
            <h5 className="card-title text-white mb-0 d-flex align-items-center">
              <i className="bi bi-code-square me-2"></i>
              Import Libraries
            </h5>
          </div>
          <div className="card-body">
            <div className="text-center py-5">
              <div className="text-gray-500 mb-3">
                <i className="bi bi-code-square fs-1"></i>
              </div>
              <h6 className="text-gray-400">No import libraries available</h6>
              <p className="text-gray-500 mb-0 small">
                This file doesn't import any external libraries.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="card bg-gray-800 border-gray-700">
        <div className="card-header bg-gray-800 border-gray-700">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="card-title text-white mb-0 d-flex align-items-center">
              <i className="bi bi-code-square me-2"></i>
              Import Libraries
            </h5>
            <div className="badge bg-info px-3 py-2">
              {imports.length} imports
            </div>
          </div>
        </div>
        <div className="card-body">
          <div
            className="ag-theme-alpine"
            style={{
              width: '100%',
              background: '#1f2937',
              color: '#f3f4f6',
              borderRadius: 8,
              border: '1px solid #374151',
              height: getGridHeight(imports.length, 44, 48, true)
            }}
          >
            <AgGridReact<Import>
              rowData={imports}
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
              pagination={imports.length > 10}
              paginationPageSize={10}
              domLayout="autoHeight"
            />
          </div>
        </div>
      </div>
    </div>
  );
}; 