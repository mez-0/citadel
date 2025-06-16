import React from 'react';
import { PayloadData } from '@/lib/types';

interface SecurityStatusOverviewProps {
  data: PayloadData;
  className?: string;
}

export const SecurityStatusOverview: React.FC<SecurityStatusOverviewProps> = ({ 
  data, 
  className = "" 
}) => {
  const getAmsiResult = () => {
    const result = data.amsi_result || data.task?.amsiResult;
    return result === 'AMSI_RESULT_NOT_DETECTED';
  };

  const getDefenderResult = () => {
    const result = data.defender_result || data.task?.defenderResult;
    return result === 'DEFENDER_RESULT_NOT_DETECTED';
  };

  const amsiClean = getAmsiResult();
  const defenderClean = getDefenderResult();

  return (
    <div className={`row g-4 mb-4 ${className}`}>
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
                <div className={`p-4 rounded-lg border ${
                  amsiClean 
                    ? 'bg-success bg-opacity-10 border-success' 
                    : 'bg-danger bg-opacity-10 border-danger'
                }`}>
                  <div className="d-flex align-items-center">
                    <div className={`p-3 rounded-circle me-3 ${
                      amsiClean ? 'bg-success bg-opacity-20' : 'bg-danger bg-opacity-20'
                    }`}>
                      <i className={`bi ${
                        amsiClean 
                          ? 'bi-shield-check text-success' 
                          : 'bi-exclamation-triangle text-danger'
                      } fs-3`}></i>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="text-white mb-1">AMSI Analysis</h6>
                      <h4 className={`mb-1 ${amsiClean ? 'text-success' : 'text-danger'}`}>
                        {amsiClean ? 'Clean' : 'Threat Detected'}
                      </h4>
                      <p className="text-gray-400 mb-0 small">
                        Windows Antimalware Scan Interface
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Defender Status */}
              <div className="col-md-6">
                <div className={`p-4 rounded-lg border ${
                  defenderClean 
                    ? 'bg-success bg-opacity-10 border-success' 
                    : 'bg-danger bg-opacity-10 border-danger'
                }`}>
                  <div className="d-flex align-items-center">
                    <div className={`p-3 rounded-circle me-3 ${
                      defenderClean ? 'bg-success bg-opacity-20' : 'bg-danger bg-opacity-20'
                    }`}>
                      <i className={`bi ${
                        defenderClean 
                          ? 'bi-shield-check text-success' 
                          : 'bi-exclamation-triangle text-danger'
                      } fs-3`}></i>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="text-white mb-1">Defender Analysis</h6>
                      <h4 className={`mb-1 ${defenderClean ? 'text-success' : 'text-danger'}`}>
                        {defenderClean ? 'Clean' : 'Threat Detected'}
                      </h4>
                      <p className="text-gray-400 mb-0 small">
                        Windows Defender
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Overall Status */}
            <div className="mt-4 p-3 rounded-lg bg-gray-700 border border-gray-600">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <i className={`bi ${
                    amsiClean && defenderClean 
                      ? 'bi-check-circle-fill text-success' 
                      : 'bi-exclamation-triangle-fill text-danger'
                  } fs-4 me-3`}></i>
                  <div>
                    <h6 className="text-white mb-0">Overall Security Assessment</h6>
                    <p className="text-gray-400 mb-0 small">
                      Based on AMSI and Windows Defender analysis
                    </p>
                  </div>
                </div>
                <div className={`badge px-3 py-2 ${
                  amsiClean && defenderClean ? 'bg-success' : 'bg-danger'
                }`}>
                  {amsiClean && defenderClean ? 'CLEAN' : 'THREATS DETECTED'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 