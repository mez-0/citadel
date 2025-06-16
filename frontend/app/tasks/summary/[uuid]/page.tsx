'use client';
import React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ImportLibrariesChart } from "@/components/charts/ImportLibrariesChart";
import { EntropyAnalysisChart } from "@/components/charts/EntropyAnalysisChart";
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';
import '@/app/styles/tabs.css';
import { FunctionCategoryChart, RawFunctionMapping } from '@/components/charts/FunctionCategoryChart';
import { SimilarTLSHScatterChart, SimilarTLSHHash } from '@/components/charts/SimilarTLSHScatterChart';
import { CapaReport, MitreTechnique, MalwareBehaviourCatalog, EmberResult } from '@/lib/types';

// Register AG-Grid modules
if (typeof window !== 'undefined') {
  ModuleRegistry.registerModules([AllCommunityModule]);
}

// TypeScript interfaces for better type safety
interface Section {
  name: string;
  size: number;
  vsize: number;
  perm: string;
  flags: number;
  paddr: number;
  vaddr: number;
}

interface Import {
  ordinal: number;
  bind: string;
  type: string;
  name: string;
  libname: string;
  plt: number;
}

interface Function {
  offset: number;
  name: string;
  size: number;
  type: string;
  cost: number;
  cc: number;
  bits: number;
  nbbs: number;
  ninstrs: number;
}

interface TaskInfo {
  fileName: string;
  status: string;
  amsiResult: string;
  defenderResult: string;
  yara: number;
  timeSent: string;
  timeUpdated: string;
}

interface PayloadData {
  file_name: string;
  file_size?: number;
  file_type?: string;
  timestamp?: string;
  entropy?: number;
  sha256?: string;
  tlsh?: string;
  architecture?: string;
  signed?: boolean;
  internal_name?: string;
  sections?: Section[];
  imports?: Import[];
  functions?: Function[];
  exports?: unknown[];
  task?: TaskInfo;
  // Fields from tasks collection
  uuid?: string;
  task_status?: string;
  time_sent?: string | number;
  time_sent_str?: string;
  time_updated?: string | number;
  time_updated_str?: string;
  file_sha256?: string;
  enable_static_analysis?: boolean;
  enable_dynamic_analysis?: boolean;
  enable_thorough_defender?: boolean;
  amsi_result?: string;
  defender_result?: string;
  threat_names?: unknown[];
  zero_x_malicious_bytes?: unknown;
  x_y_malicious_bytes?: unknown;
  thorough_malicious_bytes?: unknown[];
  function_mappings?: unknown[];
  capa_reports?: unknown[];
  similar_tlsh_hashes?: unknown[];
  yara_matches?: unknown[];
  ember_result?: EmberResult;
  // Add missing fields for technical details
  entrypoint?: unknown[];
  certificates?: unknown[];
  optional_headers?: unknown[];
  compilers?: unknown[];
  libraries?: unknown[];
  linkers?: unknown[];
  packers?: unknown[];
  sign_tools?: unknown[];
  tools?: unknown[];
}

interface SectionDataItem {
  name: string;
  size: number;
  vsize: number;
  permissions: string;
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

// Helper for dynamic grid height
const getGridHeight = (rowCount: number, rowHeight = 44, headerHeight = 48, pagination = false) => {
  if (pagination && rowCount > 10) {
    return rowHeight * 10 + headerHeight + 56; // 56px for pagination controls
  }
  return rowHeight * Math.max(rowCount, 1) + headerHeight;
};

// Helper functions to safely parse CAPA data
const parseCapaReport = (report: any): CapaReport => {
  return {
    name: typeof report.name === 'string' ? report.name : String(report.name || 'Unnamed Capability'),
    namespace: typeof report.namespace === 'string' ? report.namespace : String(report.namespace || ''),
    description: typeof report.description === 'string' ? report.description : String(report.description || ''),
    mitre_techniques: Array.isArray(report.mitre_techniques) ? report.mitre_techniques.map(parseMitreTechnique) : [],
    malware_behaviour_catalogs: Array.isArray(report.malware_behaviour_catalogs) ? report.malware_behaviour_catalogs.map(parseMalwareBehaviourCatalog) : [],
    references: Array.isArray(report.references) ? report.references.map((ref: any) => typeof ref === 'string' ? ref : String(ref)) : [],
    rule: typeof report.rule === 'string' ? report.rule : String(report.rule || '')
  };
};

const parseMitreTechnique = (technique: any): MitreTechnique => {
  return {
    parts: Array.isArray(technique.parts) ? technique.parts.map((p: any) => String(p)) : [],
    tactic: typeof technique.tactic === 'string' ? technique.tactic : String(technique.tactic || ''),
    technique: typeof technique.technique === 'string' ? technique.technique : String(technique.technique || ''),
    subtechnique: typeof technique.subtechnique === 'string' ? technique.subtechnique : String(technique.subtechnique || ''),
    tid: typeof technique.tid === 'string' ? technique.tid : String(technique.tid || '')
  };
};

const parseMalwareBehaviourCatalog = (mbc: any): MalwareBehaviourCatalog => {
  return {
    parts: Array.isArray(mbc.parts) ? mbc.parts.map((p: any) => String(p)) : [],
    objective: typeof mbc.objective === 'string' ? mbc.objective : String(mbc.objective || ''),
    behavior: typeof mbc.behavior === 'string' ? mbc.behavior : String(mbc.behavior || ''),
    method: typeof mbc.method === 'string' ? mbc.method : String(mbc.method || ''),
    mid: typeof mbc.mid === 'string' ? mbc.mid : String(mbc.mid || '')
  };
};

const formatMitreTechnique = (technique: MitreTechnique): string => {
  const parts = [];
  if (technique.tid) parts.push(technique.tid);
  if (technique.technique) parts.push(technique.technique);
  if (technique.subtechnique) parts.push(technique.subtechnique);
  return parts.length > 0 ? parts.join(' - ') : 'Unknown Technique';
};

// Modal Component for CAPA Report Details
const CapaReportModal = ({ report, reportIndex, uuid }: { report: CapaReport; reportIndex: number; uuid: string }) => {
  const router = useRouter();

  // Lock body scroll when modal is open
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/tasks/summary/${uuid}?tab=capa`, { scroll: false });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose(e);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="relative p-0 border-0 w-full max-w-4xl mx-4 my-8 shadow-2xl rounded-xl bg-gray-800 border-gray-700 max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-start">
          <div className="flex-1 mr-4">
            <h3 className="text-xl font-bold text-white mb-2">{report.name}</h3>
            {report.namespace && (
              <div className="badge bg-secondary">{report.namespace}</div>
            )}
            {report.description && (
              <p className="text-gray-300 mt-3 mb-0">{report.description}</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="btn btn-sm btn-outline-light flex-shrink-0"
            type="button"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] px-6 py-4">
          <div className="row g-4">
            {/* MITRE ATT&CK Techniques */}
            {report.mitre_techniques.length > 0 && (
              <div className="col-12">
                <h6 className="text-danger mb-3">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  MITRE ATT&CK Techniques
                </h6>
                <div className="d-flex flex-wrap gap-2">
                  {report.mitre_techniques.map((technique: MitreTechnique, techIndex: number) => (
                    <span key={techIndex} className="badge bg-danger px-3 py-2">
                      {formatMitreTechnique(technique)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Malware Behavior Catalog */}
            {report.malware_behaviour_catalogs.length > 0 && (
              <div className="col-12">
                <h6 className="text-success mb-3">
                  <i className="bi bi-bookmark me-2"></i>
                  Malware Behavior Catalog
                </h6>
                <div className="d-flex flex-column gap-2">
                  {report.malware_behaviour_catalogs.map((mbc: MalwareBehaviourCatalog, mbcIndex: number) => (
                    <div key={mbcIndex} className="p-3 rounded bg-gray-900 border border-gray-700">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-white fw-medium">{mbc.objective}</span>
                        <span className="badge bg-success">{mbc.mid}</span>
                      </div>
                      <div className="text-gray-400 small mt-1">{mbc.behavior}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* References */}
            {report.references.length > 0 && (
              <div className="col-12">
                <h6 className="text-info mb-3">
                  <i className="bi bi-link-45deg me-2"></i>
                  References
                </h6>
                <div className="bg-gray-900 p-3 rounded border border-gray-700">
                  <ul className="list-unstyled mb-0">
                    {report.references.map((ref: string, refIndex: number) => (
                      <li key={refIndex} className="text-gray-300 mb-2 last:mb-0">
                        <i className="bi bi-arrow-right me-2 text-gray-500"></i>
                        {ref.startsWith('http') ? (
                          <a href={ref} target="_blank" rel="noopener noreferrer" className="text-info text-decoration-none hover:text-info-emphasis">
                            {ref}
                          </a>
                        ) : (
                          <span className="text-gray-300">{ref}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Rule Details */}
            {report.rule && (
              <div className="col-12">
                <h6 className="text-warning mb-3">
                  <i className="bi bi-code-slash me-2"></i>
                  Detection Rule
                </h6>
                <div className="bg-gray-900 p-3 rounded border border-gray-700">
                  <pre className="text-gray-300 mb-0 small" style={{ whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>
                    {report.rule}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function TaskSummaryPage({ params }: { params: { uuid: string } }) {
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
          <div className="h1 text-white">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container-fluid px-4 py-6">
          <div className="h1 text-red-600">Error</div>
          <p className="text-gray-400 mt-2">{error}</p>
          <Link href="/" className="text-blue-500 hover:text-blue-700 mt-4 inline-block">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container-fluid px-4 py-6">
          <div className="h1 text-white">Payload Not Found</div>
          <p className="text-gray-400 mt-2">No payload data found for UUID: {params.uuid}</p>
          <Link href="/" className="text-blue-500 hover:text-blue-700 mt-4 inline-block">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Group imports by DLL
  const importsByDLL: Record<string, Import[]> = {};
  (data.imports || []).forEach((imp: Import) => {
    if (!importsByDLL[imp.libname]) importsByDLL[imp.libname] = [];
    importsByDLL[imp.libname].push(imp);
  });

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

  // Process data for visualizations
  const sectionsData: SectionDataItem[] = (data.sections || []).map((section: Section) => ({
    name: section.name,
    size: Math.round(section.size / 1024),
    vsize: Math.round(section.vsize / 1024),
    permissions: section.perm
  }));

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container-fluid px-4 py-6">
        {/* Header Section with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/" className="text-gray-400 hover:text-gray-300 text-sm mb-2 inline-block">
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Narrative Header */}
        <div className="row mb-6">
          <div className="col-12">
            <div className="card bg-gray-800 border-gray-700">
              <div className="card-body">
                <h2 className="text-white mb-3">File Analysis Report</h2>
                <div className="row">
                  <div className="col-md-8">
                    <p className="text-gray-300 mb-3">
                      This report provides a comprehensive analysis of {data.file_name || 'the file'}, 
                      including security assessments, file characteristics, and detailed technical information.
                    </p>
                    <div className="d-flex gap-3">
                      <div className="badge bg-primary px-3 py-2">
                        <i className="bi bi-clock me-1"></i>
                        {data.time_sent_str || 'Analysis Time: N/A'}
                      </div>
                      <div className="badge bg-secondary px-3 py-2">
                        <i className="bi bi-file-earmark me-1"></i>
                        {data.file_type || 'File Type: N/A'}
                      </div>
                      {data.architecture && (
                        <div className="badge bg-info px-3 py-2">
                          <i className="bi bi-cpu me-1"></i>
                          {data.architecture}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-md-4 text-end">
                    <div className="d-inline-block p-3 rounded-lg bg-gray-700">
                      <h6 className="text-gray-400 mb-2">Risk Score</h6>
                      <div className="d-flex align-items-center justify-content-end">
                        <div className={`fs-1 me-2 ${(data.entropy || 0) > 7 ? 'text-danger' : (data.entropy || 0) > 6 ? 'text-warning' : 'text-success'}`}>
                          {(data.entropy || 0).toFixed(1)}
                        </div>
                        <div className="text-start">
                          <div className="text-white fw-medium">
                            {(data.entropy || 0) > 7 ? 'High Risk' : (data.entropy || 0) > 6 ? 'Medium Risk' : 'Low Risk'}
                          </div>
                          <div className="text-gray-400 small">Based on entropy analysis</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Insights Summary */}
        <div className="row mb-6">
            <div className="col-12">
              <div className="card bg-gray-800 border-gray-700">
                <div className="card-header bg-gray-800 border-gray-700">
                  <h5 className="card-title text-white mb-0 d-flex align-items-center">
                  <i className="bi bi-lightbulb me-2"></i>
                  Key Insights
                  </h5>
                </div>
              <div className="card-body">
                <div className="row g-4">
                  <div className="col-lg-3 col-md-6">
                    <div className="p-3 rounded-lg bg-gray-700 h-100">
                      <h6 className="text-gray-400 mb-2">Security Status</h6>
                      <div className="d-flex align-items-center">
                        <i className={`bi ${(data.amsi_result || data.task?.amsiResult) === 'AMSI_RESULT_NOT_DETECTED' && (data.defender_result || data.task?.defenderResult) === 'DEFENDER_RESULT_NOT_DETECTED' ? 'bi-shield-check text-success' : 'bi-exclamation-triangle text-danger'} fs-1 me-3`}></i>
                        <div>
                          <h3 className="text-white mb-1">
                            {(data.amsi_result || data.task?.amsiResult) === 'AMSI_RESULT_NOT_DETECTED' && (data.defender_result || data.task?.defenderResult) === 'DEFENDER_RESULT_NOT_DETECTED' ? 'Clean' : 'Threat Detected'}
                          </h3>
                          <p className="text-gray-400 mb-0">Combined security analysis</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-3 col-md-6">
                    <div className="p-3 rounded-lg bg-gray-700 h-100">
                      <h6 className="text-gray-400 mb-2">EMBER Analysis</h6>
                      <div className="d-flex align-items-center">
                        <i className={`bi ${data.ember_result?.prediction === 'benign' ? 'bi-shield-check text-success' : 'bi-exclamation-triangle text-danger'} fs-1 me-3`}></i>
                        <div>
                          <h3 className={`mb-1 ${data.ember_result?.prediction === 'benign' ? 'text-success' : 'text-danger'}`}>
                            {data.ember_result?.prediction ? data.ember_result.prediction.charAt(0).toUpperCase() + data.ember_result.prediction.slice(1) : 'N/A'}
                          </h3>
                          <p className="text-gray-400 mb-0">
                            Score: {data.ember_result?.score ? data.ember_result.score.toFixed(6) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-3 col-md-6">
                    <div className="p-3 rounded-lg bg-gray-700 h-100">
                      <h6 className="text-gray-400 mb-2">File Characteristics</h6>
                      <ul className="list-unstyled mb-0">
                        <li className="text-white mb-2">
                          <i className="bi bi-check2-circle text-success me-2"></i>
                          {data.sections?.length || 0} File Sections
                        </li>
                        <li className="text-white mb-2">
                          <i className="bi bi-check2-circle text-success me-2"></i>
                          {data.imports?.length || 0} Import Libraries
                        </li>
                        <li className="text-white">
                          <i className={`bi ${data.signed ? 'bi-check2-circle text-success' : 'bi-x-circle text-danger'} me-2`}></i>
                          {data.signed ? 'Digitally Signed' : 'Not Signed'}
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="col-lg-3 col-md-6">
                    <div className="p-3 rounded-lg bg-gray-700 h-100">
                      <h6 className="text-gray-400 mb-2">Analysis Details</h6>
                      <ul className="list-unstyled mb-0">
                        <li className="text-white mb-2">
                          <i className="bi bi-check2-circle text-success me-2"></i>
                          Static Analysis: {data.enable_static_analysis ? 'Enabled' : 'Disabled'}
                        </li>
                        <li className="text-white mb-2">
                          <i className="bi bi-check2-circle text-success me-2"></i>
                          Dynamic Analysis: {data.enable_dynamic_analysis ? 'Enabled' : 'Disabled'}
                        </li>
                        <li className="text-white">
                          <i className="bi bi-check2-circle text-success me-2"></i>
                          Thorough Defender: {data.enable_thorough_defender ? 'Enabled' : 'Disabled'}
                        </li>
                      </ul>
                    </div>
                  </div>
                  {Array.isArray(data.threat_names) && data.threat_names.length > 0 && (
                    <div className="col-12 mt-3">
                      <div className="p-3 rounded-lg bg-gray-700">
                        <h6 className="text-danger mb-3">Identified Threats</h6>
                        <div className="d-flex flex-wrap gap-2">
                          {(data.threat_names as string[]).map((name: string, idx: number) => (
                            <span key={idx} className="badge bg-danger px-3 py-2">
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {data.ember_result && (
                    <div className="col-12 mt-3">
                      <div className="p-3 rounded-lg bg-gray-700">
                        <h6 className="text-info mb-3">EMBER Model Details</h6>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <div className="d-flex align-items-center mb-2">
                              <i className="bi bi-cpu text-info me-2"></i>
                              <span className="text-white">Model</span>
                            </div>
                            <div className="text-gray-400 small">
                              {data.ember_result.model_name}
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="d-flex align-items-center mb-2">
                              <i className="bi bi-bar-chart text-info me-2"></i>
                              <span className="text-white">Confidence Score</span>
                            </div>
                            <div className="text-gray-400 small">
                              {data.ember_result.score.toFixed(6)} ({(data.ember_result.score * 100).toFixed(4)}%)
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {((Array.isArray(data.compilers) && data.compilers.length > 0) || 
                    (Array.isArray(data.linkers) && data.linkers.length > 0) || 
                    (Array.isArray(data.tools) && data.tools.length > 0)) && (
                    <div className="col-12 mt-3">
                      <div className="p-3 rounded-lg bg-gray-700">
                        <h6 className="text-info mb-3">Build Information</h6>
                        <div className="row g-3">
                          {Array.isArray(data.compilers) && data.compilers.length > 0 && (
                            <div className="col-md-4">
                              <div className="d-flex align-items-center mb-2">
                                <i className="bi bi-code-square text-info me-2"></i>
                                <span className="text-white">Compiler</span>
                              </div>
                              {data.compilers.map((comp: unknown, idx: number) => {
                                const compiler = comp as Record<string, unknown>;
                                return (
                                  <div key={idx} className="text-gray-400 small">
                                    {String(compiler.name)} {String(compiler.version)}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {Array.isArray(data.linkers) && data.linkers.length > 0 && (
                            <div className="col-md-4">
                              <div className="d-flex align-items-center mb-2">
                                <i className="bi bi-link text-info me-2"></i>
                                <span className="text-white">Linker</span>
                              </div>
                              {data.linkers.map((lnk: unknown, idx: number) => {
                                const linker = lnk as Record<string, unknown>;
                                return (
                                  <div key={idx} className="text-gray-400 small">
                                    {String(linker.name)} {String(linker.version)}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {Array.isArray(data.tools) && data.tools.length > 0 && (
                            <div className="col-md-4">
                              <div className="d-flex align-items-center mb-2">
                                <i className="bi bi-tools text-info me-2"></i>
                                <span className="text-white">Tools</span>
                              </div>
                              {data.tools.map((tool: unknown, idx: number) => {
                                const toolData = tool as Record<string, unknown>;
                                return (
                                  <div key={idx} className="text-gray-400 small">
                                    {String(toolData.name)} {String(toolData.version)}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Critical Status Overview - Always First */}
        <div className="row g-4 mb-6">
          <div className="col-12">
            <div className="card bg-gray-800 border-gray-700">
              <div className="card-header bg-gray-800 border-gray-700">
                <h5 className="card-title text-white mb-0 d-flex align-items-center">
                  <i className="bi bi-shield-check me-2"></i>
                  Security Status Overview
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-4">
                  {/* AMSI Status */}
                  <div className="col-md-6">
                    <div className={`p-4 rounded-lg ${(data.amsi_result || data.task?.amsiResult) === 'AMSI_RESULT_NOT_DETECTED' ? 'bg-success bg-opacity-20' : 'bg-danger bg-opacity-20'}`}>
                      <h6 className="text-white mb-2">AMSI Analysis</h6>
                      <div className="d-flex align-items-center">
                        <i className={`bi ${(data.amsi_result || data.task?.amsiResult) === 'AMSI_RESULT_NOT_DETECTED' ? 'bi-shield-check text-success' : 'bi-exclamation-triangle text-danger'} fs-1 me-3`}></i>
                        <div>
                          <h3 className="text-white mb-1">
                            {(data.amsi_result || data.task?.amsiResult) === 'AMSI_RESULT_NOT_DETECTED' ? 'Clean' : 'Threat Detected'}
                          </h3>
                          <p className="text-gray-400 mb-0">Windows Antimalware Scan Interface</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Defender Status */}
                  <div className="col-md-6">
                    <div className={`p-4 rounded-lg ${(data.defender_result || data.task?.defenderResult) === 'DEFENDER_RESULT_NOT_DETECTED' ? 'bg-success bg-opacity-20' : 'bg-danger bg-opacity-20'}`}>
                      <h6 className="text-white mb-2">Defender Analysis</h6>
                      <div className="d-flex align-items-center">
                        <i className={`bi ${(data.defender_result || data.task?.defenderResult) === 'DEFENDER_RESULT_NOT_DETECTED' ? 'bi-shield-check text-success' : 'bi-exclamation-triangle text-danger'} fs-1 me-3`}></i>
                        <div>
                          <h3 className="text-white mb-1">
                            {(data.defender_result || data.task?.defenderResult) === 'DEFENDER_RESULT_NOT_DETECTED' ? 'Clean' : 'Threat Detected'}
                          </h3>
                          <p className="text-gray-400 mb-0">Windows Defender</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Threat Analysis - Moved from Analysis Tab */}
        {((Array.isArray(data.yara_matches) && data.yara_matches.length > 0) || 
          (Array.isArray(data.capa_reports) && data.capa_reports.length > 0)) && (
          <div className="row g-4 mb-6">
            <div className="col-12">
              <div className="card bg-gray-800 border-gray-700">
                <div className="card-header bg-gray-800 border-gray-700">
                  <h5 className="card-title text-white mb-0 d-flex align-items-center">
                    <i className="bi bi-shield-exclamation me-2"></i>
                    Threat Analysis
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row g-4">
                    {Array.isArray(data.yara_matches) && data.yara_matches.length > 0 && (
                      <div className="col-md-6">
                        <div className="p-3 rounded-lg bg-gray-700 h-100">
                          <h6 className="text-warning mb-3">YARA Matches</h6>
                          <ul className="list-unstyled mb-0">
                            {(data.yara_matches as string[]).map((match: string, idx: number) => (
                              <li key={idx} className="text-white small mb-2">
                                {match}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics Row */}
        <div className="row g-4 mb-6">
          <div className="col-xl-3 col-md-6">
            <div className="card bg-gray-800 border-gray-700 h-100">
              <div className="card-body text-center">
                <div className="text-primary mb-2">
                  <i className="bi bi-file-earmark fs-1"></i>
                </div>
                <h3 className="text-white mb-1">
                  {data.file_size ? ((data.file_size || 0) / 1024).toFixed(1) : 'N/A'} KB
                </h3>
                <p className="text-gray-400 mb-0 small">File Size</p>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-md-6">
            <div className="card bg-gray-800 border-gray-700 h-100">
              <div className="card-body text-center">
                <div className="text-info mb-2">
                  <i className="bi bi-bar-chart fs-1"></i>
                </div>
                <h3 className="text-white mb-1">
                  {(data.entropy || 0).toFixed(2)}
                </h3>
                <p className={`mb-0 small ${(data.entropy || 0) > 7 ? 'text-danger' : (data.entropy || 0) > 6 ? 'text-warning' : 'text-success'}`}>
                  {(data.entropy || 0) > 7 ? 'High Risk' : (data.entropy || 0) > 6 ? 'Medium Risk' : 'Low Risk'}
                </p>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-md-6">
            <div className="card bg-gray-800 border-gray-700 h-100">
              <div className="card-body text-center">
                <div className="text-warning mb-2">
                  <i className="bi bi-layers fs-1"></i>
                </div>
                <h3 className="text-white mb-1">
                  {data.sections?.length || 0}
                </h3>
                <p className="text-gray-400 mb-0 small">File Sections</p>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-md-6">
            <div className="card bg-gray-800 border-gray-700 h-100">
              <div className="card-body text-center">
                <div className="text-success mb-2">
                  <i className="bi bi-code-square fs-1"></i>
                </div>
                <h3 className="text-white mb-1">
                  {data.imports?.length || 0}
                </h3>
                <p className="text-gray-400 mb-0 small">Import Libraries</p>
              </div>
            </div>
          </div>
        </div>

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
                                  <div className="text-gray-400 small">
                                    <i className="bi bi-info-circle me-1"></i>
                                    Higher entropy indicates potential obfuscation or encryption
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="card-body">
                              <div className="row">
                                <div className="col-md-8">
                                  <EntropyAnalysisChart fileEntropy={data.entropy || 0} />
                                </div>
                                <div className="col-md-4">
                                  <div className="p-3 rounded-lg bg-gray-700 h-100">
                                    <h6 className="text-gray-400 mb-3">Interpretation Guide</h6>
                                    <div className="space-y-3">
                                      <div className="d-flex align-items-center">
                                        <div className="w-3 h-3 rounded-full bg-success me-2"></div>
                                        <div>
                                          <div className="text-white small">Low Risk (0-6)</div>
                                          <div className="text-gray-400 smaller">Normal file entropy</div>
                                        </div>
                                      </div>
                                      <div className="d-flex align-items-center">
                                        <div className="w-3 h-3 rounded-full bg-warning me-2"></div>
                                        <div>
                                          <div className="text-white small">Medium Risk (6-7)</div>
                                          <div className="text-gray-400 smaller">Possible obfuscation</div>
                                        </div>
                                      </div>
                                      <div className="d-flex align-items-center">
                                        <div className="w-3 h-3 rounded-full bg-danger me-2"></div>
                                        <div>
                                          <div className="text-white small">High Risk ({'>'}7)</div>
                                          <div className="text-gray-400 smaller">Likely encrypted or packed</div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Import Libraries Chart */}
                        <div className="col-12">
                          <div className="card bg-gray-800 border-gray-700">
                            <div className="card-header bg-gray-800 border-gray-700">
                              <div className="d-flex justify-content-between align-items-center">
                                <h5 className="card-title text-white mb-0">
                                  <i className="bi bi-code-square me-2"></i>
                                  Import Libraries
                                </h5>
                                <div className="text-gray-400 small">
                                  <i className="bi bi-info-circle me-1"></i>
                                  {data.imports?.length || 0} total imports across {Object.keys(importsByDLL).length} libraries
                                </div>
                              </div>
                            </div>
                            <div className="card-body">
                              <div className="row">
                                <div className="col-md-12">
                                  {data.imports && <ImportLibrariesChart imports={data.imports} />}
                                </div>
                              </div>
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
                                <p className="text-gray-400 mb-3">
                                  This scatter diagram visualizes the distance between the current file&apos;s TLSH hash and similar samples. Lower distances indicate higher similarity. Raw data is shown below the chart.
                                </p>
                                <SimilarTLSHScatterChart data={data.similar_tlsh_hashes as SimilarTLSHHash[]} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Technical Details Tab */}
                  {activeTab === "technical" && (
                    <div className="tab-pane show active" id="technical" role="tabpanel">
                      <div className="row g-4">
                        {/* File Sections */}
                        <div className="col-12">
                          <div className="card bg-gray-800 border-gray-700">
                            <div className="card-header bg-gray-800 border-gray-700">
                              <h5 className="card-title text-white mb-0">
                                <i className="bi bi-layers me-2"></i>
                                File Sections
                              </h5>
                            </div>
                            <div className="card-body">
                              {sectionsData.length > 0 ? (
                                <div
                                  className="ag-theme-alpine"
                                  style={{
                                    width: '100%',
                                    background: '#1f2937',
                                    color: '#f3f4f6',
                                    borderRadius: 8,
                                    border: '1px solid #374151',
                                    height: getGridHeight(sectionsData.length, 44, 48, true)
                                  }}
                                >
                                  <AgGridReact
                                    rowData={sectionsData}
                                    columnDefs={[
                                      { field: 'name', headerName: 'Name', flex: 1 },
                                      { field: 'size', headerName: 'Size (KB)', flex: 1 },
                                      { field: 'vsize', headerName: 'Virtual Size (KB)', flex: 1 },
                                      { field: 'permissions', headerName: 'Permissions', flex: 1 }
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
                                    pagination={sectionsData.length > 10}
                                    paginationPageSize={10}
                                    domLayout="autoHeight"
                                  />
                                </div>
                              ) : (
                                <div className="text-gray-400 text-center py-4">No file sections available.</div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Import Libraries Table */}
                        <div className="col-12">
                          <div className="card bg-gray-800 border-gray-700">
                            <div className="card-header bg-gray-800 border-gray-700">
                              <h5 className="card-title text-white mb-0">
                                <i className="bi bi-code-square me-2"></i>
                                Import Libraries
                              </h5>
                            </div>
                            <div className="card-body">
                              {Array.isArray(data.imports) && data.imports.length > 0 ? (
                                <div
                                  className="ag-theme-alpine"
                                  style={{
                                    width: '100%',
                                    background: '#1f2937',
                                    color: '#f3f4f6',
                                    borderRadius: 8,
                                    border: '1px solid #374151',
                                    height: getGridHeight((data.imports?.length || 0), 44, 48, true)
                                  }}
                                >
                                  <AgGridReact
                                    rowData={data.imports}
                                    columnDefs={[
                                      { field: 'libname', headerName: 'Library', flex: 1 },
                                      { field: 'name', headerName: 'Function', flex: 1 },
                                      { field: 'type', headerName: 'Type', flex: 1 },
                                      { field: 'ordinal', headerName: 'Ordinal', flex: 1 }
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
                                    pagination={(data.imports?.length || 0) > 10}
                                    paginationPageSize={10}
                                    domLayout="autoHeight"
                                  />
                                </div>
                              ) : (
                                <div className="text-gray-400 text-center py-4">No import libraries available.</div>
                              )}
                            </div>
                          </div>
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

                        {/* Entrypoints Table */}
                        <div className="col-12">
                          <div className="card bg-gray-800 border-gray-700">
                            <div className="card-header bg-gray-800 border-gray-700">
                              <h5 className="card-title text-white mb-0">
                                <i className="bi bi-signpost-2 me-2"></i>
                                Entrypoints
                              </h5>
                            </div>
                            <div className="card-body">
                              {Array.isArray(data.entrypoint) && data.entrypoint.length > 0 ? (
                                <div
                                  className="ag-theme-alpine"
                                  style={{
                                    width: '100%',
                                    background: '#1f2937',
                                    color: '#f3f4f6',
                                    borderRadius: 8,
                                    border: '1px solid #374151',
                                    height: getGridHeight(data.entrypoint.length, 44, 48, true)
                                  }}
                                >
                                  <AgGridReact
                                    rowData={data.entrypoint}
                                    columnDefs={[
                                      { 
                                        field: 'paddr', 
                                        headerName: 'Physical Address', 
                                        flex: 1,
                                        valueFormatter: (params: any) => 
                                          params.value !== undefined ? `0x${params.value.toString(16).toUpperCase()}` : '',
                                      },
                                      { 
                                        field: 'vaddr', 
                                        headerName: 'Virtual Address', 
                                        flex: 1,
                                        valueFormatter: (params: any) => 
                                          params.value !== undefined ? `0x${params.value.toString(16).toUpperCase()}` : '',
                                      },
                                      { 
                                        field: 'baddr', 
                                        headerName: 'Base Address', 
                                        flex: 1,
                                        valueFormatter: (params: any) => 
                                          params.value !== undefined ? `0x${params.value.toString(16).toUpperCase()}` : '',
                                      },
                                      { 
                                        field: 'laddr', 
                                        headerName: 'Load Address', 
                                        flex: 1,
                                        valueFormatter: (params: any) => 
                                          params.value !== undefined ? `0x${params.value.toString(16).toUpperCase()}` : '',
                                      },
                                      { 
                                        field: 'haddr', 
                                        headerName: 'High Address', 
                                        flex: 1,
                                        valueFormatter: (params: any) => 
                                          params.value !== undefined ? `0x${params.value.toString(16).toUpperCase()}` : '',
                                      },
                                      { field: 'type', headerName: 'Type', flex: 1 }
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
                                    pagination={data.entrypoint.length > 10}
                                    paginationPageSize={10}
                                    domLayout="autoHeight"
                                  />
                                </div>
                              ) : (
                                <div className="text-gray-400 text-center py-4">No entrypoints available.</div>
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
                                  
                                  {/* Summary Statistics */}
                                  <div className="row g-3 mb-4">
                                    <div className="col-md-3">
                                      <div className="p-3 rounded-lg bg-gray-700 text-center">
                                        <div className="text-info fs-3 mb-1">
                                          <i className="bi bi-list-check"></i>
                                        </div>
                                        <h4 className="text-white mb-1">{data.capa_reports.length}</h4>
                                        <p className="text-gray-400 mb-0 small">Total Capabilities</p>
                                      </div>
                                    </div>
                                    <div className="col-md-3">
                                      <div className="p-3 rounded-lg bg-gray-700 text-center">
                                        <div className="text-warning fs-3 mb-1">
                                          <i className="bi bi-diagram-3"></i>
                                        </div>
                                        <h4 className="text-white mb-1">
                                          {Array.from(new Set((data.capa_reports as any[]).map((report: any) => {
                                            const namespace = typeof report.namespace === 'string' ? report.namespace : String(report.namespace || '');
                                            return namespace.split('/')[0];
                                          }).filter(Boolean))).length}
                                        </h4>
                                        <p className="text-gray-400 mb-0 small">Categories</p>
                                      </div>
                                    </div>
                                    <div className="col-md-3">
                                      <div className="p-3 rounded-lg bg-gray-700 text-center">
                                        <div className="text-danger fs-3 mb-1">
                                          <i className="bi bi-exclamation-triangle"></i>
                                        </div>
                                        <h4 className="text-white mb-1">
                                          {(data.capa_reports as any[]).filter((report: any) => 
                                            Array.isArray(report.mitre_techniques) && report.mitre_techniques.length > 0
                                          ).length}
                                        </h4>
                                        <p className="text-gray-400 mb-0 small">MITRE ATT&CK</p>
                                      </div>
                                    </div>
                                    <div className="col-md-3">
                                      <div className="p-3 rounded-lg bg-gray-700 text-center">
                                        <div className="text-success fs-3 mb-1">
                                          <i className="bi bi-bookmark"></i>
                                        </div>
                                        <h4 className="text-white mb-1">
                                          {(data.capa_reports as any[]).filter((report: any) => 
                                            Array.isArray(report.malware_behaviour_catalogs) && report.malware_behaviour_catalogs.length > 0
                                          ).length}
                                        </h4>
                                        <p className="text-gray-400 mb-0 small">MBC Behaviors</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* CAPA Reports */}
                            <div className="col-12">
                              <div className="card bg-gray-800 border-gray-700">
                                <div className="card-header bg-gray-800 border-gray-700">
                                  <h5 className="card-title text-white mb-0">
                                    <i className="bi bi-table me-2"></i>
                                    Detected Capabilities
                                  </h5>
                                </div>
                                <div className="card-body">
                                  {Array.isArray(data.capa_reports) && data.capa_reports.length > 0 ? (
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
                                            references_count: report.references.length,
                                            report: report
                                          };
                                        })}
                                        columnDefs={[
                                          { 
                                            field: 'name', 
                                            headerName: 'Capability Name', 
                                            flex: 2,
                                            cellRenderer: (params: any) => (
                                              <div className="text-white fw-medium">{params.value}</div>
                                            )
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
                                            cellRenderer: (params: any) => (
                                              <div 
                                                className="text-gray-300 small" 
                                                style={{ 
                                                  lineHeight: '1.4', 
                                                  maxHeight: '40px', 
                                                  overflow: 'hidden', 
                                                  textOverflow: 'ellipsis' 
                                                }}
                                              >
                                                {params.value}
                                              </div>
                                            )
                                          },
                                          { 
                                            field: 'mitre_count', 
                                            headerName: 'MITRE', 
                                            width: 80,
                                            cellRenderer: (params: any) => (
                                              params.value > 0 
                                                ? <span className="badge bg-danger px-2 py-1">
                                                    <i className="bi bi-exclamation-triangle me-1"></i>
                                                    {params.value}
                                                  </span>
                                                : <span className="text-gray-500">0</span>
                                            )
                                          },
                                          { 
                                            field: 'mbc_count', 
                                            headerName: 'MBC', 
                                            width: 80,
                                            cellRenderer: (params: any) => (
                                              params.value > 0 
                                                ? <span className="badge bg-success px-2 py-1">
                                                    <i className="bi bi-bookmark me-1"></i>
                                                    {params.value}
                                                  </span>
                                                : <span className="text-gray-500">0</span>
                                            )
                                          },
                                          { 
                                            field: 'references_count', 
                                            headerName: 'Refs', 
                                            width: 80,
                                            cellRenderer: (params: any) => (
                                              params.value > 0 
                                                ? <span className="badge bg-info px-2 py-1">
                                                    <i className="bi bi-link-45deg me-1"></i>
                                                    {params.value}
                                                  </span>
                                                : <span className="text-gray-500">0</span>
                                            )
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
                                  ) : (
                                    <div className="text-gray-400 text-center py-4">No CAPA reports available.</div>
                                  )}
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