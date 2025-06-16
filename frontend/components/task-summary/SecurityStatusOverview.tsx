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

  const getEmberStatus = () => {
    if (!data.ember_result) return { score: 0, prediction: 'N/A', color: 'text-gray-400', bgColor: 'bg-gray-600', borderColor: 'border-gray-500' };
    
    const score = data.ember_result.score || 0;
    const prediction = data.ember_result.prediction || 'Unknown';
    
    if (prediction.toLowerCase().includes('malware') || score > 0.7) {
      return { score, prediction, color: 'text-danger', bgColor: 'bg-danger', borderColor: 'border-danger' };
    } else if (score > 0.3) {
      return { score, prediction, color: 'text-warning', bgColor: 'bg-warning', borderColor: 'border-warning' };
    } else {
      return { score, prediction, color: 'text-success', bgColor: 'bg-success', borderColor: 'border-success' };
    }
  };

  const amsiClean = getAmsiResult();
  const defenderClean = getDefenderResult();
  const emberStatus = getEmberStatus();

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
              <div className="col-lg-4 col-md-6">
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
              <div className="col-lg-4 col-md-6">
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

              {/* Ember ML Score */}
              <div className="col-lg-4 col-md-12">
                <div className={`p-4 rounded-lg border ${emberStatus.bgColor} bg-opacity-10 ${emberStatus.borderColor}`}>
                  <div className="d-flex align-items-center">
                    <div className={`p-3 rounded-circle me-3 ${emberStatus.bgColor} bg-opacity-20`}>
                      <i className={`bi bi-cpu ${emberStatus.color} fs-3`}></i>
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="text-white mb-1">ML Analysis</h6>
                      <h4 className={`mb-1 ${emberStatus.color}`}>
                        {emberStatus.score !== undefined ? `${(emberStatus.score * 100).toFixed(1)}%` : 'N/A'}
                      </h4>
                      <p className="text-gray-400 mb-0 small">
                        Ember ML Model: {emberStatus.prediction}
                      </p>
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