import React, { useState } from 'react';
import { AgCharts } from 'ag-charts-react';
import { AgChartOptions } from 'ag-charts-community';

interface Import {
  ordinal: number;
  bind: string;
  type: string;
  name: string;
  libname: string;
  plt: number;
}

interface ImportLibrariesChartProps {
  imports: Import[];
}

const COLORS = ["#FF5A5F", "#00A699", "#FC642D", "#007A87", "#FFB400"];
const ROWS_PER_PAGE = 10;

export const ImportLibrariesChart: React.FC<ImportLibrariesChartProps> = ({ imports }) => {
  const [selectedDll, setSelectedDll] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Group imports by DLL
  const importsByDLL: Record<string, Import[]> = {};
  imports.forEach((imp: Import) => {
    if (!importsByDLL[imp.libname]) importsByDLL[imp.libname] = [];
    importsByDLL[imp.libname].push(imp);
  });
  
  const dllNames = Object.keys(importsByDLL);
  const importChartData = dllNames.length > 0 
    ? dllNames.map(name => ({ dll: name, count: importsByDLL[name].length })) 
    : [];

  const importChartOptions = {
    data: importChartData,
    series: [{
      type: 'donut',
      angleKey: 'count',
      labelKey: 'dll',
      innerRadiusRatio: 0.7,
      callout: {
        minAngle: 0,
        strokeWidth: 1,
        colors: COLORS,
      },
      highlightStyle: {
        item: {
          fillOpacity: 0.7,
          stroke: '#fff',
          strokeWidth: 1,
        },
      },
    }],
    legend: { 
      enabled: true, 
      position: 'bottom',
      item: {
        label: {
          color: '#f3f4f6',
          fontSize: 12,
        },
      },
    },
    background: { 
      fill: '#1f2937',
      visible: true,
    },
    title: { 
      text: 'Imports by DLL', 
      color: '#f3f4f6', 
      fontSize: 18,
      fontWeight: 'bold',
    },
    theme: {
      palette: {
        fills: COLORS,
        strokes: ['#374151'],
      },
      overrides: {
        common: {
          background: {
            fill: '#1f2937',
          },
        },
        donut: {
          title: {
            color: '#f3f4f6',
          },
        },
      },
    },
  } as unknown as AgChartOptions;

  if (dllNames.length === 0) {
    return <p className="text-gray-400 text-center">No import data available</p>;
  }

  // Get current page imports
  const currentImports = selectedDll 
    ? importsByDLL[selectedDll]
    : imports;
  const totalPages = Math.ceil(currentImports.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = startIndex + ROWS_PER_PAGE;
  const currentPageImports = currentImports.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      {/* Chart Section */}
      <div 
        className="mb-4" 
        style={{ 
          background: '#1f2937',
          height: '300px',
          borderRadius: '8px',
          border: '1px solid #374151',
          padding: '16px',
        }}
      >
        <AgCharts options={importChartOptions} />
      </div>

      {/* DLL Selection Pills */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        {dllNames.map((dll) => (
          <button
            key={dll}
            onClick={() => {
              setSelectedDll(dll === selectedDll ? null : dll);
              setCurrentPage(1);
            }}
            className={`btn btn-sm ${
              dll === selectedDll 
                ? 'btn-primary' 
                : 'btn-outline-secondary'
            }`}
            style={{
              backgroundColor: dll === selectedDll ? '#3b82f6' : 'transparent',
              color: dll === selectedDll ? '#ffffff' : '#9ca3af',
              border: `1px solid ${dll === selectedDll ? '#3b82f6' : '#374151'}`,
            }}
          >
            {dll} <span className="badge ms-1" style={{ 
              backgroundColor: dll === selectedDll ? '#2563eb' : '#374151',
              color: '#ffffff'
            }}>{importsByDLL[dll].length}</span>
          </button>
        ))}
      </div>

      {/* Imports Table */}
      <div className="table-responsive">
        <table className="table table-dark table-hover align-middle mb-0" style={{
          backgroundColor: '#1f2937',
          borderColor: '#374151',
        }}>
          <thead>
            <tr>
              <th style={{ color: '#60a5fa' }}>Function Name</th>
              <th style={{ color: '#f3f4f6' }}>Ordinal</th>
              <th style={{ color: '#f3f4f6' }}>Type</th>
              <th style={{ color: '#f3f4f6' }}>Bind</th>
              <th style={{ color: '#f3f4f6' }}>PLT Address</th>
            </tr>
          </thead>
          <tbody>
            {currentPageImports.map((imp, i) => (
              <tr key={imp.name + i} style={{ borderColor: '#374151' }}>
                <td style={{ color: '#93c5fd', fontWeight: '600' }}>{imp.name}</td>
                <td style={{ color: '#f3f4f6' }}>{imp.ordinal}</td>
                <td style={{ color: '#f3f4f6' }}>{imp.type}</td>
                <td style={{ color: '#f3f4f6' }}>{imp.bind}</td>
                <td style={{ color: '#f3f4f6' }}>{imp.plt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="text-gray-400">
            Showing {startIndex + 1}-{Math.min(endIndex, currentImports.length)} of {currentImports.length} imports
          </div>
          <div className="btn-group">
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 