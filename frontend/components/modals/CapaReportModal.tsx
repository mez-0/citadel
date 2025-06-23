import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CapaReport, MitreTechnique, MalwareBehaviourCatalog } from '@/lib/types';

interface CapaReportModalProps {
  report: CapaReport;
  reportIndex: number;
  uuid: string;
}

const formatMitreTechnique = (technique: MitreTechnique): string => {
  const parts = [];
  if (technique.tid) parts.push(technique.tid);
  if (technique.technique) parts.push(technique.technique);
  if (technique.subtechnique) parts.push(technique.subtechnique);
  return parts.length > 0 ? parts.join(' - ') : 'Unknown Technique';
};

export const CapaReportModal: React.FC<CapaReportModalProps> = ({ 
  report, 
  reportIndex, 
  uuid 
}) => {
  const router = useRouter();

  // Lock body scroll when modal is open
  useEffect(() => {
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
      className="fixed-top w-100 h-100 d-flex align-items-center justify-content-center"
      style={{
        backgroundColor: 'rgba(17, 24, 39, 0.98)', // Tailwind gray-900 with high opacity
        backdropFilter: 'blur(4px)',
        zIndex: 1050,
        // Fallback for any light backgrounds
        background: 'rgba(17, 24, 39, 0.98) !important',
      }}
      onClick={handleBackdropClick}
    >
      <div className="position-relative border-0 shadow-lg rounded-lg bg-gray-800 border-gray-700 mx-4 my-4" style={{ maxWidth: '900px', width: '100%', maxHeight: '90vh', backgroundColor: '#1f2937' }}>
        {/* Modal Header */}
        <div className="sticky-top bg-gray-800 border-bottom border-gray-700 px-4 py-3 rounded-top">
          <div className="d-flex justify-content-between align-items-start">
            <div className="flex-grow-1 me-3">
              <h4 className="text-white mb-2 d-flex align-items-center">
                <i className="bi bi-shield-check me-2 text-primary"></i>
                {report.name}
              </h4>
              {report.namespace && (
                <span className="badge bg-secondary px-3 py-2 mb-2">
                  {report.namespace}
                </span>
              )}
              {report.description && (
                <p className="text-gray-300 mb-0 small">{report.description}</p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="btn btn-outline-light btn-sm d-flex align-items-center"
              type="button"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-auto p-4" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          <div className="row g-4">
            {/* MITRE ATT&CK Techniques */}
            {report.mitre_techniques.length > 0 && (
              <div className="col-12">
                <div className="card bg-gray-800 border-gray-700">
                  <div className="card-header bg-gray-800 border-gray-700">
                    <h6 className="card-title text-white mb-0 d-flex align-items-center">
                      <i className="bi bi-exclamation-triangle me-2 text-danger"></i>
                      MITRE ATT&CK Techniques
                      <span className="badge bg-danger ms-2">
                        {report.mitre_techniques.length}
                      </span>
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="d-flex flex-wrap gap-2">
                      {report.mitre_techniques.map((technique: MitreTechnique, techIndex: number) => (
                        <div key={techIndex} className="p-3 rounded-lg bg-gray-800 border border-gray-600 flex-grow-1" style={{ minWidth: '250px' }}>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="badge bg-danger px-2 py-1">
                              {technique.tid}
                            </span>
                            <span className="text-gray-400 small">
                              {technique.tactic}
                            </span>
                          </div>
                          <h6 className="text-white mb-1">{technique.technique}</h6>
                          {technique.subtechnique && (
                            <p className="text-gray-300 mb-0 small">
                              {technique.subtechnique}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Malware Behavior Catalog */}
            {report.malware_behaviour_catalogs.length > 0 && (
              <div className="col-12">
                <div className="card bg-gray-800 border-gray-700">
                  <div className="card-header bg-gray-800 border-gray-700">
                    <h6 className="card-title text-white mb-0 d-flex align-items-center">
                      <i className="bi bi-bookmark me-2 text-success"></i>
                      Malware Behavior Catalog
                      <span className="badge bg-success ms-2">
                        {report.malware_behaviour_catalogs.length}
                      </span>
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="d-flex flex-column gap-3">
                      {report.malware_behaviour_catalogs.map((mbc: MalwareBehaviourCatalog, mbcIndex: number) => (
                        <div key={mbcIndex} className="p-3 rounded-lg bg-gray-800 border border-gray-600">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="text-white mb-0">{mbc.objective}</h6>
                            <span className="badge bg-success">{mbc.mid}</span>
                          </div>
                          <p className="text-gray-300 mb-1">{mbc.behavior}</p>
                          {mbc.method && (
                            <p className="text-gray-400 mb-0 small">
                              Method: {mbc.method}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* References */}
            {report.references.length > 0 && (
              <div className="col-12">
                <div className="card bg-gray-800 border-gray-700">
                  <div className="card-header bg-gray-800 border-gray-700">
                    <h6 className="card-title text-white mb-0 d-flex align-items-center">
                      <i className="bi bi-link-45deg me-2 text-info"></i>
                      References
                      <span className="badge bg-info ms-2">
                        {report.references.length}
                      </span>
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="list-group list-group-flush">
                      {report.references.map((ref: string, refIndex: number) => (
                        <div key={refIndex} className="list-group-item bg-transparent border-gray-600 text-gray-300 d-flex align-items-center">
                          <i className="bi bi-arrow-right me-2 text-gray-500"></i>
                          {ref.startsWith('http') ? (
                            <a 
                              href={ref} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-info text-decoration-none hover:text-info-emphasis"
                            >
                              {ref}
                            </a>
                          ) : (
                            <span className="text-gray-300">{ref}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Rule Details */}
            {report.rule && (
              <div className="col-12">
                <div className="card bg-gray-800 border-gray-700">
                  <div className="card-header bg-gray-800 border-gray-700">
                    <h6 className="card-title text-white mb-0 d-flex align-items-center">
                      <i className="bi bi-code-slash me-2 text-warning"></i>
                      Detection Rule
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="position-relative">
                      <button 
                        className="btn btn-sm btn-outline-secondary position-absolute top-0 end-0 mt-2 me-2"
                        onClick={() => navigator.clipboard.writeText(report.rule)}
                        style={{ zIndex: 10 }}
                      >
                        <i className="bi bi-clipboard me-1"></i>
                        Copy
                      </button>
                      <pre 
                        className="text-gray-300 bg-gray-800 p-3 rounded border border-gray-600 overflow-auto"
                        style={{ 
                          maxHeight: '300px',
                          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                          fontSize: '0.875rem',
                          lineHeight: '1.4'
                        }}
                      >
                        {report.rule}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 