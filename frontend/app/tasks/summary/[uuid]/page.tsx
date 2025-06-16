'use client';
import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ImportLibrariesChart } from "@/components/charts/ImportLibrariesChart";
import { EntropyAnalysisChart } from "@/components/charts/EntropyAnalysisChart";
import { FunctionCategoryChart, RawFunctionMapping } from '@/components/charts/FunctionCategoryChart';
import { SimilarTLSHScatterChart, SimilarTLSHHash } from '@/components/charts/SimilarTLSHScatterChart';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, ColDef } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';
import '@/app/styles/tabs.css';

// Import our new components
import {
  TaskSummaryHeader,
  SecurityStatusOverview,
  KeyMetrics,
  SectionsTable,
  ImportsTable,
  MaliciousBytesAnalysis,
  CapaReportModal
} from '@/components/task-summary';

import { PayloadData, SectionDataItem, EmberResult } from '@/lib/types';
import { parseCapaReport, getGridHeight } from '@/lib/capa-utils';

// Register AG-Grid modules
if (typeof window !== 'undefined') {
  ModuleRegistry.registerModules([AllCommunityModule]);
}

const getPayloadData = async (uuid: string): Promise<PayloadData | null> => {
  try {
    console.log(`[TaskSummary] Fetching payload data for UUID: ${uuid}`);
    const response = await fetch(`/api/tasks/${uuid}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`[TaskSummary] No payload found for UUID: ${uuid}`);
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const payload = await response.json();
    console.log(`[TaskSummary] Successfully retrieved payload data for UUID: ${uuid}`);
    return payload as PayloadData;
  } catch (error) {
    console.error(`[TaskSummary] Error fetching payload data for UUID ${uuid}:`, error);
    throw error;
  }
};

export default function TaskSummaryPageRefactored({ params }: { params: { uuid: string } }) {
  const [data, setData] = React.useState<PayloadData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState("overview");
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const showCapaModal = searchParams.get('capa');
  const currentTab = searchParams.get('tab');

  // Update active tab based on search params
  React.useEffect(() => {
    if (currentTab) {
      setActiveTab(currentTab);
    }
  }, [currentTab]);

  // Handle modal opening with smooth navigation
  const handleOpenModal = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/tasks/summary/${params.uuid}?tab=capa&capa=${index}`, { scroll: false });
  };

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const payloadData = await getPayloadData(params.uuid);
        setData(payloadData);
      } catch (err) {
        console.error('Error fetching payload data:', err);
        setError('Failed to load payload data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.uuid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container-fluid px-4 py-6">
          <div className="d-flex align-items-center justify-content-center min-vh-100">
            <div className="text-center">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <h4 className="text-white">Loading Analysis Report...</h4>
              <p className="text-gray-400">Please wait while we retrieve the data.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container-fluid px-4 py-6">
          <div className="d-flex align-items-center justify-content-center min-vh-100">
            <div className="text-center">
              <div className="text-danger mb-3">
                <i className="bi bi-exclamation-triangle fs-1"></i>
              </div>
              <h4 className="text-danger mb-3">Error Loading Data</h4>
              <p className="text-gray-400 mb-4">{error}</p>
              <TaskSummaryHeader />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container-fluid px-4 py-6">
          <div className="d-flex align-items-center justify-content-center min-vh-100">
            <div className="text-center">
              <div className="text-gray-500 mb-3">
                <i className="bi bi-file-earmark-x fs-1"></i>
              </div>
              <h4 className="text-white mb-3">Payload Not Found</h4>
              <p className="text-gray-400 mb-4">No payload data found for UUID: {params.uuid}</p>
              <TaskSummaryHeader />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Process data for visualizations
  const sectionsData: SectionDataItem[] = (data.sections || []).map((section) => ({
    name: section.name,
    size: Math.round(section.size / 1024),
    vsize: Math.round(section.vsize / 1024),
    permissions: section.perm
  }));

  // Group function_mappings by category
  let functionCategoryData: { category: string; count: number }[] = [];
  if (Array.isArray(data.function_mappings)) {
    const categoryCount: Record<string, number> = {};
    (data.function_mappings as RawFunctionMapping[]).forEach((fn) => {
      if (fn.category) {
        categoryCount[fn.category] = (categoryCount[fn.category] || 0) + 1;
      }
    });
    functionCategoryData = Object.entries(categoryCount).map(([category, count]) => ({ category, count }));
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container-fluid px-4 py-6">
        {/* Header Section */}
        <TaskSummaryHeader className="mb-6" />

        {/* Key Metrics - Moved to top */}
        <KeyMetrics data={data} className="mb-6" />

        {/* Security Status Overview */}
        <SecurityStatusOverview data={data} className="mb-6" />

        {/* Main Content Tabs */}
        <div className="row mb-6">
          <div className="col-12">
            <div className="card bg-gray-800 border-gray-700">
              <div className="card-header bg-gray-800 border-gray-700">
                <ul className="nav nav-tabs card-header-tabs" role="tablist">
                  <li className="nav-item" role="presentation">
                    <button
                      className={`nav-link ${activeTab === "overview" ? "active" : ""}`}
                      onClick={() => setActiveTab("overview")}
                      type="button"
                      role="tab"
                    >
                      <i className="bi bi-info-circle me-2"></i>Overview
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className={`nav-link ${activeTab === "analysis" ? "active" : ""}`}
                      onClick={() => setActiveTab("analysis")}
                      type="button"
                      role="tab"
                    >
                      <i className="bi bi-graph-up me-2"></i>Analysis
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className={`nav-link ${activeTab === "technical" ? "active" : ""}`}
                      onClick={() => setActiveTab("technical")}
                      type="button"
                      role="tab"
                    >
                      <i className="bi bi-gear me-2"></i>Technical Details
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className={`nav-link ${activeTab === "capa" ? "active" : ""}`}
                      onClick={() => setActiveTab("capa")}
                      type="button"
                      role="tab"
                    >
                      <i className="bi bi-shield-check me-2"></i>CAPA
                    </button>
                  </li>
                </ul>
              </div>
              <div className="card-body">
                <div className="tab-content">
                  {/* Overview Tab */}
                  {activeTab === "overview" && (
                    <div className="tab-pane show active" id="overview" role="tabpanel">
                      <div className="row g-4">
                        {/* File Information */}
                        <div className="col-lg-6">
                          <div className="card bg-gray-800 border-gray-700 h-100">
                            <div className="card-header bg-gray-800 border-gray-700">
                              <h5 className="card-title text-white mb-0">
                                <i className="bi bi-info-circle me-2"></i>
                                File Information
                              </h5>
                            </div>
                            <div className="card-body">
                              <div className="space-y-4">
                                <div className="d-flex justify-content-between py-3 border-bottom border-gray-600">
                                  <span className="text-gray-400">File Name</span>
                                  <span className="text-white fw-medium">{data.file_name || 'N/A'}</span>
                                </div>
                                <div className="d-flex justify-content-between py-3 border-bottom border-gray-600">
                                  <span className="text-gray-400">File Type</span>
                                  <span className="text-white fw-medium">{data.file_type || 'N/A'}</span>
                                </div>
                                <div className="d-flex justify-content-between py-3 border-bottom border-gray-600">
                                  <span className="text-gray-400">Architecture</span>
                                  <span className="text-white fw-medium">{data.architecture || 'N/A'}</span>
                                </div>
                                <div className="d-flex justify-content-between py-3 border-bottom border-gray-600">
                                  <span className="text-gray-400">Signed</span>
                                  <span className={`fw-medium ${data.signed ? 'text-success' : 'text-danger'}`}>
                                    {data.signed ? 'Yes' : 'No'}
                                  </span>
                                </div>
                                <div className="d-flex justify-content-between py-3">
                                  <span className="text-gray-400">Timestamp</span>
                                  <span className="text-white fw-medium">{data.timestamp || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Hash Information */}
                        <div className="col-lg-6">
                          <div className="card bg-gray-800 border-gray-700 h-100">
                            <div className="card-header bg-gray-800 border-gray-700">
                              <h5 className="card-title text-white mb-0">
                                <i className="bi bi-fingerprint me-2"></i>
                                Cryptographic Hashes
                              </h5>
                            </div>
                            <div className="card-body">
                              <div className="space-y-4">
                                <div>
                                  <h6 className="text-gray-400 mb-2">SHA256</h6>
                                  <code className="d-block p-3 bg-gray-700 rounded text-white font-monospace small text-break">
                                    {data.sha256 || data.file_sha256 || 'N/A'}
                                  </code>
                                </div>
                                <div>
                                  <h6 className="text-gray-400 mb-2">TLSH</h6>
                                  <code className="d-block p-3 bg-gray-700 rounded text-white font-monospace small text-break">
                                    {data.tlsh || 'N/A'}
                                  </code>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* LLM Summary Section - Only show if llm_summary exists */}
                        {data.llm_summary && (
                          <div className="row g-4 mt-4">
                            <div className="col-12">
                              <div className="card bg-gray-800 border-gray-700">
                                <div className="card-header bg-gray-800 border-gray-700">
                                  <h5 className="card-title text-white mb-0">
                                    <i className="bi bi-robot me-2"></i>
                                    AI Analysis Summary
                                  </h5>
                                </div>
                                <div className="card-body">
                                  <div 
                                    className="text-gray-300"
                                    dangerouslySetInnerHTML={{ 
                                      __html: data.llm_summary
                                        // Convert **bold** to <strong>bold</strong>
                                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                        // Convert *italic* to <em>italic</em>
                                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                        // Convert `code` to <code>code</code>
                                        .replace(/`(.*?)`/g, '<code class="bg-gray-600 px-1 rounded text-sm">$1</code>')
                                        // Convert ### headers to h6
                                        .replace(/### (.*?)(\n|$)/g, '<h6 class="text-white mt-3 mb-2">$1</h6>')
                                        // Convert ## headers to h5
                                        .replace(/## (.*?)(\n|$)/g, '<h5 class="text-white mt-4 mb-2">$1</h5>')
                                        // Convert # headers to h4
                                        .replace(/# (.*?)(\n|$)/g, '<h4 class="text-white mt-4 mb-3">$1</h4>')
                                        // Convert line breaks to <br>
                                        .replace(/\n/g, '<br />')
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Analysis Tab */}
                  {activeTab === "analysis" && (
                    <div className="tab-pane show active" id="analysis" role="tabpanel">
                      <div className="row g-4">
                        {/* Entropy Analysis */}
                        <div className="col-12">
                          <div className="card bg-gray-800 border-gray-700">
                            <div className="card-header bg-gray-800 border-gray-700">
                              <div className="d-flex justify-content-between align-items-center">
                                <h5 className="card-title text-white mb-0">
                                  <i className="bi bi-graph-up me-2"></i>
                                  Entropy Analysis
                                </h5>
                                <div className="d-flex align-items-center">
                                  <div className={`badge ${(data.entropy || 0) > 7 ? 'bg-danger' : (data.entropy || 0) > 6 ? 'bg-warning' : 'bg-success'} px-3 py-2 me-2`}>
                                    Score: {(data.entropy || 0).toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="card-body">
                              <EntropyAnalysisChart fileEntropy={data.entropy || 0} />
                            </div>
                          </div>
                        </div>

                        {/* Import Libraries Chart */}
                        <div className="col-12">
                          <div className="card bg-gray-800 border-gray-700">
                            <div className="card-header bg-gray-800 border-gray-700">
                              <h5 className="card-title text-white mb-0">
                                <i className="bi bi-code-square me-2"></i>
                                Import Libraries
                              </h5>
                            </div>
                            <div className="card-body">
                              {data.imports && <ImportLibrariesChart imports={data.imports} />}
                            </div>
                          </div>
                        </div>

                        {/* Function Category Chart */}
                        {functionCategoryData.length > 0 && (
                          <div className="col-12">
                            <div className="card bg-gray-800 border-gray-700">
                              <div className="card-header bg-gray-800 border-gray-700">
                                <h5 className="card-title text-white mb-0">
                                  <i className="bi bi-diagram-3 me-2"></i>
                                  Function Categories
                                </h5>
                              </div>
                              <div className="card-body">
                                <FunctionCategoryChart 
                                  data={functionCategoryData} 
                                  rawFunctionMappings={Array.isArray(data.function_mappings) ? data.function_mappings as RawFunctionMapping[] : []}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Similar TLSH Hashes Scatter Chart */}
                        {Array.isArray(data.similar_tlsh_hashes) && data.similar_tlsh_hashes.length > 0 && (
                          <div className="col-12">
                            <div className="card bg-gray-800 border-gray-700">
                              <div className="card-header bg-gray-800 border-gray-700">
                                <h5 className="card-title text-white mb-0 d-flex align-items-center">
                                  <i className="bi bi-scatter-chart me-2"></i>
                                  Similar TLSH Hashes
                                </h5>
                              </div>
                              <div className="card-body">
                                <SimilarTLSHScatterChart data={data.similar_tlsh_hashes as SimilarTLSHHash[]} />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Malicious Bytes Analysis */}
                        <MaliciousBytesAnalysis
                          zeroXMaliciousBytes={data.zero_x_malicious_bytes}
                          xYMaliciousBytes={data.x_y_malicious_bytes}
                          className="col-12"
                        />
                      </div>
                    </div>
                  )}

                  {/* Technical Details Tab */}
                  {activeTab === "technical" && (
                    <div className="tab-pane show active" id="technical" role="tabpanel">
                      <div className="row g-4">
                        {/* File Sections */}
                        <div className="col-12">
                          <SectionsTable sections={sectionsData} />
                        </div>

                        {/* Import Libraries Table */}
                        <div className="col-12">
                          <ImportsTable imports={data.imports || []} />
                        </div>

                        {/* Optional Headers Table */}
                        <div className="col-12">
                          <div className="card bg-gray-800 border-gray-700">
                            <div className="card-header bg-gray-800 border-gray-700">
                              <h5 className="card-title text-white mb-0">
                                <i className="bi bi-gear me-2"></i>
                                Optional Headers
                              </h5>
                            </div>
                            <div className="card-body">
                              {data.optional_headers ? (
                                <div
                                  className="ag-theme-alpine"
                                  style={{
                                    width: '100%',
                                    background: '#1f2937',
                                    color: '#f3f4f6',
                                    borderRadius: 8,
                                    border: '1px solid #374151',
                                    height: getGridHeight(Object.keys(data.optional_headers).length, 44, 48, true)
                                  }}
                                >
                                  <AgGridReact
                                    rowData={Object.entries(data.optional_headers).map(([key, value]) => ({
                                      name: key,
                                      value: typeof value === 'boolean' ? value.toString() : value
                                    }))}
                                    columnDefs={[
                                      { 
                                        field: 'name', 
                                        headerName: 'Property', 
                                        flex: 1,
                                        valueFormatter: (params) => {
                                          return params.value
                                            .replace(/([A-Z])/g, ' $1')
                                            .replace(/^./, (str: string) => str.toUpperCase());
                                        }
                                      },
                                      { field: 'value', headerName: 'Value', flex: 1 }
                                    ]}
                                    defaultColDef={{
                                      sortable: true,
                                      filter: true,
                                      resizable: true,
                                      menuTabs: ['filterMenuTab']
                                    }}
                                    animateRows={true}
                                    headerHeight={48}
                                    rowHeight={44}
                                    pagination={Object.keys(data.optional_headers).length > 10}
                                    paginationPageSize={10}
                                    domLayout="autoHeight"
                                  />
                                </div>
                              ) : (
                                <div className="text-gray-400 text-center py-4">No optional headers available.</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CAPA Tab */}
                  {activeTab === "capa" && (
                    <div className="tab-pane show active" id="capa" role="tabpanel">
                      <div className="row g-4">
                        {Array.isArray(data.capa_reports) && data.capa_reports.length > 0 ? (
                          <>
                            {/* CAPA Overview */}
                            <div className="col-12">
                              <div className="card bg-gray-800 border-gray-700">
                                <div className="card-header bg-gray-800 border-gray-700">
                                  <div className="d-flex justify-content-between align-items-center">
                                    <h5 className="card-title text-white mb-0">
                                      <i className="bi bi-shield-check me-2"></i>
                                      CAPA Analysis Overview
                                    </h5>
                                    <div className="badge bg-info px-3 py-2">
                                      {data.capa_reports.length} Capabilities Identified
                                    </div>
                                  </div>
                                </div>
                                <div className="card-body">
                                  <p className="text-gray-300 mb-3">
                                    CAPA (FLARE team's open-source tool) identifies capabilities in executable files. 
                                    Each capability represents a behavior or technique that the malware might exhibit.
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* CAPA Reports Table */}
                            <div className="col-12">
                              <div className="card bg-gray-800 border-gray-700">
                                <div className="card-header bg-gray-800 border-gray-700">
                                  <h5 className="card-title text-white mb-0">
                                    <i className="bi bi-table me-2"></i>
                                    Detected Capabilities
                                  </h5>
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
                                      height: getGridHeight(data.capa_reports.length, 60, 48, true)
                                    }}
                                  >
                                    <AgGridReact
                                      rowData={data.capa_reports.map((rawReport: any, index: number) => {
                                        const report = parseCapaReport(rawReport);
                                        return {
                                          id: index,
                                          name: report.name,
                                          namespace: report.namespace || 'N/A',
                                          description: report.description || 'No description available',
                                          mitre_count: report.mitre_techniques.length,
                                          mbc_count: report.malware_behaviour_catalogs.length,
                                          references_count: report.references.length
                                        };
                                      })}
                                      columnDefs={[
                                        { 
                                          field: 'name', 
                                          headerName: 'Capability Name', 
                                          flex: 2,
                                          cellClass: 'text-white fw-medium'
                                        },
                                        { 
                                          field: 'namespace', 
                                          headerName: 'Namespace', 
                                          flex: 1,
                                          cellRenderer: (params: any) => (
                                            params.value !== 'N/A' 
                                              ? <span className="badge bg-secondary px-2 py-1">{params.value}</span>
                                              : <span className="text-gray-400">{params.value}</span>
                                          )
                                        },
                                        { 
                                          field: 'description', 
                                          headerName: 'Description', 
                                          flex: 3,
                                          cellClass: 'text-gray-300 small'
                                        },
                                        { 
                                          headerName: 'Actions', 
                                          width: 120,
                                          cellRenderer: (params: any) => (
                                            <button
                                              className="btn btn-sm btn-primary"
                                              type="button"
                                              onClick={() => handleOpenModal(params.data.id, { preventDefault: () => {} } as React.MouseEvent)}
                                            >
                                              <i className="bi bi-eye me-1"></i>
                                              View
                                            </button>
                                          ),
                                          sortable: false,
                                          filter: false
                                        }
                                      ]}
                                      defaultColDef={{
                                        sortable: true,
                                        filter: true,
                                        resizable: true,
                                        menuTabs: ['filterMenuTab']
                                      }}
                                      animateRows={true}
                                      headerHeight={48}
                                      rowHeight={60}
                                      pagination={data.capa_reports.length > 10}
                                      paginationPageSize={10}
                                      domLayout="autoHeight"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="col-12">
                            <div className="card bg-gray-800 border-gray-700">
                              <div className="card-body text-center py-5">
                                <div className="text-gray-500 mb-3">
                                  <i className="bi bi-shield-x fs-1"></i>
                                </div>
                                <h5 className="text-white mb-2">No CAPA Reports Available</h5>
                                <p className="text-gray-400 mb-0">
                                  No CAPA analysis reports were generated for this file.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CAPA Report Modal */}
        {showCapaModal && data && Array.isArray(data.capa_reports) && data.capa_reports.length > 0 && (
          <CapaReportModal 
            report={parseCapaReport(data.capa_reports[parseInt(showCapaModal)])} 
            reportIndex={parseInt(showCapaModal)}
            uuid={params.uuid}
          />
        )}
      </div>
    </div>
  );
} 