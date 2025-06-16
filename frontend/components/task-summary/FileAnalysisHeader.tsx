import React from 'react';
import { PayloadData } from '@/lib/types';

interface FileAnalysisHeaderProps {
  data: PayloadData;
  className?: string;
}

export const FileAnalysisHeader: React.FC<FileAnalysisHeaderProps> = ({ 
  data, 
  className = "" 
}) => {
  const getRiskLevel = (entropy: number) => {
    if (entropy > 7) return { level: 'High Risk', color: 'text-danger' };
    if (entropy > 6) return { level: 'Medium Risk', color: 'text-warning' };
    return { level: 'Low Risk', color: 'text-success' };
  };

  const risk = getRiskLevel(data.entropy || 0);

  return (
    <div className={`row mb-4 ${className}`}>
      <div className="col-12">
        <div className="card bg-gray-800 border-gray-700">
          <div className="card-body">
            <h2 className="text-white mb-3 d-flex align-items-center">
              <i className="bi bi-file-earmark-text me-2"></i>
              File Analysis Report
            </h2>
            <div className="row">
              <div className="col-md-8">
                <p className="text-gray-300 mb-3">
                  This report provides a comprehensive analysis of <strong>{data.file_name || 'the file'}</strong>, 
                  including security assessments, file characteristics, and detailed technical information.
                </p>
                <div className="d-flex flex-wrap gap-3">
                  <div className="badge bg-primary px-3 py-2 d-flex align-items-center">
                    <i className="bi bi-clock me-2"></i>
                    {data.time_sent_str || 'Analysis Time: N/A'}
                  </div>
                  <div className="badge bg-secondary px-3 py-2 d-flex align-items-center">
                    <i className="bi bi-file-earmark me-2"></i>
                    {data.file_type || 'File Type: N/A'}
                  </div>
                  {data.architecture && (
                    <div className="badge bg-info px-3 py-2 d-flex align-items-center">
                      <i className="bi bi-cpu me-2"></i>
                      {data.architecture}
                    </div>
                  )}
                </div>
              </div>
              <div className="col-md-4 text-end">
                <div className="d-inline-block p-4 rounded-lg bg-gray-700 border border-gray-600">
                  <h6 className="text-gray-400 mb-3 text-center">Risk Assessment</h6>
                  <div className="d-flex align-items-center justify-content-center">
                    <div className={`fs-1 me-3 fw-bold ${risk.color}`}>
                      {(data.entropy || 0).toFixed(1)}
                    </div>
                    <div className="text-start">
                      <div className={`text-white fw-medium ${risk.color}`}>
                        {risk.level}
                      </div>
                      <div className="text-gray-400 small">Entropy Analysis</div>
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <div className="progress" style={{ height: '6px' }}>
                      <div 
                        className={`progress-bar ${risk.color.replace('text-', 'bg-')}`}
                        role="progressbar" 
                        style={{ width: `${Math.min((data.entropy || 0) / 8 * 100, 100)}%` }}
                        aria-valuenow={data.entropy || 0}
                        aria-valuemin={0}
                        aria-valuemax={8}
                      ></div>
                    </div>
                    <div className="text-gray-400 small mt-1">
                      Scale: 0 (Low) - 8 (High)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 