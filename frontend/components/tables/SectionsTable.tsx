import React from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, ColDef } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';
import { SectionDataItem } from '@/lib/types';

// Register AG-Grid modules
if (typeof window !== 'undefined') {
  ModuleRegistry.registerModules([AllCommunityModule]);
}

interface SectionsTableProps {
  sections: SectionDataItem[];
  className?: string;
}

// Helper for dynamic grid height
const getGridHeight = (rowCount: number, rowHeight = 44, headerHeight = 48, pagination = false) => {
  if (pagination && rowCount > 10) {
    return rowHeight * 10 + headerHeight + 56; // 56px for pagination controls
  }
  return rowHeight * Math.max(rowCount, 1) + headerHeight;
};

export const SectionsTable: React.FC<SectionsTableProps> = ({ 
  sections, 
  className = "" 
}) => {
  const columnDefs: ColDef<SectionDataItem>[] = [
    { 
      field: 'name', 
      headerName: 'Section Name', 
      flex: 1,
      cellClass: 'text-white fw-medium'
    },
    { 
      field: 'size', 
      headerName: 'Size (KB)', 
      flex: 1,
      cellClass: 'text-gray-300'
    },
    { 
      field: 'vsize', 
      headerName: 'Virtual Size (KB)', 
      flex: 1,
      cellClass: 'text-gray-300'
    },
    { 
      field: 'permissions', 
      headerName: 'Permissions', 
      flex: 1,
      cellRenderer: (params: any) => (
        <span className="badge bg-secondary px-2 py-1 font-monospace">
          {params.value}
        </span>
      )
    }
  ];

  if (sections.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="card bg-gray-800 border-gray-700">
          <div className="card-header bg-gray-800 border-gray-700">
            <h5 className="card-title text-white mb-0 d-flex align-items-center">
              <i className="bi bi-layers me-2"></i>
              File Sections
            </h5>
          </div>
          <div className="card-body">
            <div className="text-center py-5">
              <div className="text-gray-500 mb-3">
                <i className="bi bi-layers fs-1"></i>
              </div>
              <h6 className="text-gray-400">No sections available</h6>
              <p className="text-gray-500 mb-0 small">
                This file doesn't contain any section information.
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
              <i className="bi bi-layers me-2"></i>
              File Sections
            </h5>
            <div className="badge bg-info px-3 py-2">
              {sections.length} sections
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
              height: getGridHeight(sections.length, 44, 48, true)
            }}
          >
            <AgGridReact<SectionDataItem>
              rowData={sections}
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
              pagination={sections.length > 10}
              paginationPageSize={10}
              domLayout="autoHeight"
            />
          </div>
        </div>
      </div>
    </div>
  );
}; 