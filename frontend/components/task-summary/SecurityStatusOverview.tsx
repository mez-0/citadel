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

  // Get threat names from data
  const threatNames = (data.threat_names || []) as string[];
  const validThreatNames = threatNames.filter((name): name is string => 
    typeof name === 'string' && name.trim() !== ''
  );
  const hasThreats = validThreatNames.length > 0;

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
              <div className={`${hasThreats ? 'col-lg-3' : 'col-lg-4'} col-md-6`}>
                <div className={`p-4 rounded-lg border ${
                  amsiClean 
                    ? 'bg-success bg-opacity-10 border-success' 
                    : 'bg-danger bg-opacity-10 border-danger'
                } h-100`}>
                  <div className="d-flex align-items-center mb-2">
                    <i className={`bi ${
                      amsiClean 
                        ? 'bi-shield-check text-success' 
                        : 'bi-exclamation-triangle text-danger'
                    } fs-3 me-2`}></i>
                    <h6 className="text-white mb-0">AMSI Analysis</h6>
                  </div>
                  <h4 className={`mb-1 ${amsiClean ? 'text-success' : 'text-danger'}`}>{amsiClean ? 'Clean' : 'Threat Detected'}</h4>
                  <p className="text-gray-400 mb-0 small">Windows Antimalware Scan Interface</p>
                </div>
              </div>
              
              {/* Defender Status */}
              <div className={`${hasThreats ? 'col-lg-3' : 'col-lg-4'} col-md-6`}>
                <div className={`p-4 rounded-lg border ${
                  defenderClean 
                    ? 'bg-success bg-opacity-10 border-success' 
                    : 'bg-danger bg-opacity-10 border-danger'
                } h-100`}>
                  <div className="d-flex align-items-center mb-2">
                    <i className={`bi ${
                      defenderClean 
                        ? 'bi-shield-check text-success' 
                        : 'bi-exclamation-triangle text-danger'
                    } fs-3 me-2`}></i>
                    <h6 className="text-white mb-0">Defender Analysis</h6>
                  </div>
                  <h4 className={`mb-1 ${defenderClean ? 'text-success' : 'text-danger'}`}>{defenderClean ? 'Clean' : 'Threat Detected'}</h4>
                  <p className="text-gray-400 mb-0 small">Windows Defender</p>
                </div>
              </div>

              {/* Ember ML Score */}
              <div className={`${hasThreats ? 'col-lg-3' : 'col-lg-4'} col-md-12`}>
                <div className={`p-4 rounded-lg border ${emberStatus.bgColor} bg-opacity-10 ${emberStatus.borderColor} h-100`}>
                  <div className="d-flex align-items-center mb-2">
                    <i className={`bi bi-cpu ${emberStatus.color} fs-3 me-2`}></i>
                    <h6 className="text-white mb-0">ML Analysis</h6>
                  </div>
                  <h4 className={`mb-1 ${emberStatus.color}`}>{emberStatus.score !== undefined ? `${(emberStatus.score * 100).toFixed(1)}%` : 'N/A'}</h4>
                  <p className="text-gray-400 mb-0 small">Ember ML Model: {emberStatus.prediction}</p>
                </div>
              </div>

              {/* Detected Threats Card - Only show if threats exist */}
              {hasThreats && (
                <div className="col-lg-3 col-md-12">
                  <div className="p-4 rounded-lg border bg-danger bg-opacity-10 border-danger h-100">
                    <div className="d-flex align-items-center mb-2">
                      <i className="bi bi-bug-fill text-danger fs-3 me-2"></i>
                      <h6 className="text-white mb-0 fw-bold">Detected Threats</h6>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {validThreatNames.map((threatName, index) => (
                        <div key={index} className="d-flex align-items-center bg-danger bg-opacity-15 border border-danger rounded px-3 py-2">
                          <i className="bi bi-virus text-white me-2"></i>
                          <span className="text-white fw-medium">{threatName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 