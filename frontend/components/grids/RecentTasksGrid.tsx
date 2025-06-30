'use client';
import Link from "next/link";
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ICellRendererParams, ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';
import { Task } from '@/lib/types';

// Register AG-Grid modules
if (typeof window !== 'undefined') {
  ModuleRegistry.registerModules([AllCommunityModule]);
}

interface RecentTasksGridProps {
  tasks: Task[];
}

// Status Badge Renderer Component
const StatusBadgeRenderer = (params: ICellRendererParams) => {
  const { value } = params;
  const field = params.colDef?.field;
  
  if (value === null || value === undefined || value === '') {
    return <span style={{ color: '#9ca3af' }}>-</span>;
  }
  
  let badgeClass = '';
  let displayValue = value;
  let customStyle = {};
  
  if (field === 'amsi_result') {
    if (value === 'AMSI_RESULT_NOT_DETECTED') {
      badgeClass = 'badge bg-success';
    } else {
      badgeClass = 'badge bg-danger';
    }
    displayValue = String(value);
  } else if (field === 'defender_result') {
    if (value === 'DEFENDER_RESULT_NOT_DETECTED') {
      badgeClass = 'badge bg-success';
    } else {
      badgeClass = 'badge bg-danger';
    }
    displayValue = String(value);
  } else if (field === 'ember_result') {
    const score = Number(value);
    if (isNaN(score) || value === null || value === undefined) {
      badgeClass = 'badge';
      displayValue = 'N/A';
      customStyle = {
        backgroundColor: '#6b7280',
        color: '#ffffff'
      };
    } else {
      // Convert float to percentage (multiply by 100)
      const percentage = (score * 100).toFixed(1);
      displayValue = `${percentage}%`;
      
      // Create color gradient from green (0) to red (1)
      const clampedScore = Math.max(0, Math.min(1, score));
      const red = Math.round(clampedScore * 255);
      const green = Math.round((1 - clampedScore) * 255);
      const blue = 0;
      
      // Calculate luminance to determine text color
      const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
      const textColor = luminance > 0.5 ? '#000000' : '#ffffff';
      
      // Create enhanced progress bar container
      return (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          padding: '0 12px'
        }}>
          {/* Background bar with subtle gradient */}
          <div style={{
            position: 'absolute',
            left: '12px',
            right: '12px',
            height: '12px',
            background: 'linear-gradient(180deg, #2d3748 0%, #1a202c 100%)',
            borderRadius: '6px',
            border: '1px solid #4a5568',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
            zIndex: 1
          }} />
          
          {/* Progress bar with enhanced styling */}
          <div style={{
            position: 'absolute',
            left: '12px',
            height: '12px',
            width: `${clampedScore * 100}%`,
            background: `linear-gradient(180deg, rgb(${Math.min(255, red + 40)}, ${Math.min(255, green + 40)}, ${blue}) 0%, rgb(${red}, ${green}, ${blue}) 100%)`,
            borderRadius: '6px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: `
              0 1px 3px rgba(0,0,0,0.3),
              inset 0 1px 0 rgba(255,255,255,0.1),
              0 0 8px rgba(${red}, ${green}, ${blue}, 0.3)
            `,
            zIndex: 2,
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden'
          }}>
            {/* Shimmer effect overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
              animation: 'shimmer 2s infinite',
              zIndex: 3
            }} />
          </div>
          
          {/* Percentage text with enhanced styling */}
          <span style={{
            position: 'absolute',
            right: '12px',
            fontSize: '0.75rem',
            fontWeight: '700',
            color: textColor,
            zIndex: 3,
            textShadow: `
              0 1px 2px rgba(0,0,0,0.8),
              0 0 4px rgba(${red}, ${green}, ${blue}, 0.5)
            `,
            letterSpacing: '0.025em',
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
          }}>
            {displayValue}
          </span>
          
          {/* CSS Animation for shimmer effect */}
          <style jsx>{`
            @keyframes shimmer {
              0% { left: -100%; }
              100% { left: 100%; }
            }
          `}</style>
        </div>
      );
    }
  } else if (field === 'task_status') {
    if (value === 'COMPLETED') {
      badgeClass = 'badge bg-success';
      displayValue = 'Completed';
    } else if (value === 'PENDING') {
      badgeClass = 'badge bg-warning text-dark';
      displayValue = 'Pending';
    } else if (value === 'FAILED') {
      badgeClass = 'badge bg-danger';
      displayValue = 'Failed';
    } else if (value === 'RUNNING') {
      badgeClass = 'badge bg-info';
      displayValue = 'Running';
    } else {
      badgeClass = 'badge bg-secondary';
      displayValue = String(value);
    }
  }
  
  return (
    <span 
      className={badgeClass} 
      style={{ 
        fontSize: '0.75rem', 
        fontWeight: '600',
        padding: '0.25rem 0.5rem',
        borderRadius: '0.375rem',
        display: 'inline-block',
        minWidth: 'fit-content',
        ...customStyle
      }}
    >
      {displayValue}
    </span>
  );
};

// File Link Renderer Component
const FileLinkRenderer = (params: ICellRendererParams) => {
  const { value, data } = params;
  
  if (!value || !data?.uuid) {
    return <span style={{ color: '#9ca3af' }}>-</span>;
  }
  
  // Extract just the filename from the full path
  const fileName = value.split('/').pop() || value;
  
  return (
    <Link 
      href={`/tasks/summary/${data.uuid}`}
      className="text-decoration-none"
      style={{ 
        color: '#60a5fa',
        transition: 'color 0.2s ease',
        fontSize: '0.875rem',
        fontWeight: '500',
      }}
      onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#93c5fd'}
      onMouseLeave={(e) => (e.target as HTMLElement).style.color = '#60a5fa'}
    >
      {fileName}
    </Link>
  );
};

// Date Formatter Component
const DateRenderer = (params: ICellRendererParams) => {
  const { value } = params;
  
  if (!value) {
    return <span style={{ color: '#9ca3af' }}>-</span>;
  }
  
  // Handle both timestamp (number) and string formats
  let date: Date;
  if (typeof value === 'number') {
    date = new Date(value * 1000); // Convert Unix timestamp to milliseconds
  } else if (typeof value === 'string') {
    date = new Date(value);
  } else {
    return <span style={{ color: '#9ca3af' }}>Invalid Date</span>;
  }
  
  if (isNaN(date.getTime())) {
    return <span style={{ color: '#9ca3af' }}>Invalid Date</span>;
  }
  
  return (
    <span style={{ color: '#f3f4f6', fontSize: '0.875rem' }}>
      {date.toLocaleString()}
    </span>
  );
};

export function RecentTasksGrid({ tasks }: RecentTasksGridProps) {
  const columnDefs: ColDef[] = [
    {
      field: 'file_name',
      headerName: 'File Name',
      cellRenderer: FileLinkRenderer,
      flex: 1,
      minWidth: 150,
      sortable: true,
      filter: true,
      filterParams: {
        filterOptions: ['contains', 'startsWith', 'endsWith'],
        suppressAndOrCondition: true,
      },
    },
    {
      field: 'time_sent',
      headerName: 'Time Sent',
      cellRenderer: DateRenderer,
      flex: 1,
      minWidth: 140,
      sortable: true,
      filter: 'agDateColumnFilter',
    },
    {
      field: 'time_updated',
      headerName: 'Time Updated',
      cellRenderer: DateRenderer,
      flex: 1,
      minWidth: 140,
      sortable: true,
      filter: 'agDateColumnFilter',
    },
    {
      field: 'amsi_result',
      headerName: 'AMSI Result',
      cellRenderer: StatusBadgeRenderer,
      flex: 1,
      minWidth: 120,
      sortable: true,
      filter: true,
      filterParams: {
        filterOptions: ['equals'],
        suppressAndOrCondition: true,
      },
    },
    {
      field: 'defender_result',
      headerName: 'Defender Result',
      cellRenderer: StatusBadgeRenderer,
      flex: 1,
      minWidth: 140,
      sortable: true,
      filter: true,
      filterParams: {
        filterOptions: ['equals'],
        suppressAndOrCondition: true,
      },
    },
    {
      field: 'ember_result',
      headerName: 'Ember Score',
      cellRenderer: StatusBadgeRenderer,
      valueGetter: (params) => {
        const emberResult = params.data?.ember_result;
        if (emberResult && typeof emberResult === 'object' && emberResult.score !== undefined) {
          return emberResult.score;
        }
        return null;
      },
      flex: 0.5,
      minWidth: 80,
      sortable: true,
      filter: 'agNumberColumnFilter',
    },
    {
      field: 'task_status',
      headerName: 'Status',
      cellRenderer: StatusBadgeRenderer,
      flex: 1,
      minWidth: 120,
      sortable: true,
      filter: true,
      filterParams: {
        filterOptions: ['equals'],
        suppressAndOrCondition: true,
      },
    },
  ];

  const defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    menuTabs: ['filterMenuTab'],
  };

  return (
    <div 
      className="ag-theme-alpine-dark w-100"
      style={{
        height: '400px',
        backgroundColor: '#1f2937',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #374151',
      }}
    >
      <style jsx global>{`
        .ag-theme-alpine-dark {
          --ag-background-color: #1f2937 !important;
          --ag-header-background-color: #374151 !important;
          --ag-odd-row-background-color: #1f2937 !important;
          --ag-even-row-background-color: #111827 !important;
          --ag-row-hover-color: #374151 !important;
          --ag-selected-row-background-color: #1e40af !important;
          --ag-border-color: #4b5563 !important;
          --ag-header-foreground-color: #f9fafb !important;
          --ag-foreground-color: #f3f4f6 !important;
          --ag-data-color: #f3f4f6 !important;
          --ag-secondary-foreground-color: #9ca3af !important;
          --ag-input-focus-border-color: #3b82f6 !important;
          --ag-range-selection-border-color: #3b82f6 !important;
          --ag-header-column-separator-color: #4b5563 !important;
          --ag-row-border-color: #374151 !important;
        }
        
        .ag-theme-alpine-dark .ag-root-wrapper {
          background-color: #1f2937 !important;
          border: 1px solid #374151 !important;
          border-radius: 8px !important;
        }
        
        .ag-theme-alpine-dark .ag-header {
          background-color: #374151 !important;
          border-bottom: 1px solid #4b5563 !important;
        }
        
        .ag-theme-alpine-dark .ag-header-cell {
          background-color: #374151 !important;
          color: #f9fafb !important;
          border-right: 1px solid #4b5563 !important;
        }
        
        .ag-theme-alpine-dark .ag-row {
          background-color: #1f2937 !important;
          border-bottom: 1px solid #374151 !important;
        }
        
        .ag-theme-alpine-dark .ag-row-even {
          background-color: #111827 !important;
        }
        
        .ag-theme-alpine-dark .ag-row:hover {
          background-color: #374151 !important;
        }
        
        .ag-theme-alpine-dark .ag-cell {
          color: #f3f4f6 !important;
          border-right: 1px solid #374151 !important;
        }
      `}</style>
      <AgGridReact
        rowData={tasks}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        animateRows={true}
        rowSelection="multiple"
        suppressRowClickSelection={true}
        headerHeight={48}
        rowHeight={44}
        domLayout="normal"
      />
    </div>
  );
} 