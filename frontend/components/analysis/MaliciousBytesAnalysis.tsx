import React from 'react';
import { MaliciousBytes } from '@/lib/types';

interface MaliciousBytesAnalysisProps {
  zeroXMaliciousBytes?: MaliciousBytes;
  xYMaliciousBytes?: MaliciousBytes;
  className?: string;
}

interface MaliciousBytesCardProps {
  title: string;
  icon: string;
  data: MaliciousBytes;
}

const MaliciousBytesCard: React.FC<MaliciousBytesCardProps> = ({ 
  title, 
  icon, 
  data 
}) => {
  const getRiskLevel = (entropy: number) => {
    if (entropy > 7) return { color: 'text-danger', level: 'High Randomness' };
    if (entropy > 6) return { color: 'text-warning', level: 'Medium Randomness' };
    return { color: 'text-success', level: 'Low Randomness' };
  };

  const risk = getRiskLevel(data.entropy);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.ascii_byte_representation);
      // You might want to add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="card bg-gray-700 border-gray-600">
      <div className="card-header bg-gray-700 border-gray-600">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="text-white mb-0 d-flex align-items-center">
            <i className={`${icon} me-2 text-danger`}></i>
            {title}
          </h6>
          <div className="badge bg-warning px-3 py-2">
            Entropy: {data.entropy.toFixed(6)}
          </div>
        </div>
      </div>
      <div className="card-body">
        <div className="row g-4">
          {/* ASCII Hex Representation */}
          <div className="col-12">
            <h6 className="text-gray-400 mb-3 d-flex align-items-center">
              <i className="bi bi-filetype-txt me-2"></i>
              ASCII Hex Representation
            </h6>
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-600 position-relative">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-gray-400 small fw-medium">
                  Hexadecimal View with ASCII
                </span>
                <button 
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center"
                  onClick={handleCopy}
                >
                  <i className="bi bi-clipboard me-1"></i>
                  Copy
                </button>
              </div>
              <pre 
                className="text-gray-300 mb-0 small overflow-auto border border-gray-700 rounded p-3 bg-gray-800" 
                style={{ 
                  maxHeight: '300px',
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  lineHeight: '1.5',
                  fontSize: '0.8rem'
                }}
              >
                {data.ascii_byte_representation}
              </pre>
            </div>
          </div>

          {/* Entropy Analysis */}
          <div className="col-12">
            <div className="p-4 rounded-lg bg-gray-900 border border-gray-600">
              <h6 className="text-gray-400 mb-3 d-flex align-items-center">
                <i className="bi bi-bar-chart me-2"></i>
                Byte Pattern Analysis
              </h6>
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="text-center p-3 rounded bg-gray-800 border border-gray-700">
                    <div className={`fs-2 mb-2 fw-bold ${risk.color}`}>
                      {data.entropy.toFixed(3)}
                    </div>
                    <div className="text-white fw-medium mb-1">Entropy Score</div>
                    <div className="text-gray-400 small">
                      {risk.level}
                    </div>
                    <div className="mt-2">
                      <div className="progress" style={{ height: '6px' }}>
                        <div 
                          className={`progress-bar ${risk.color.replace('text-', 'bg-')}`}
                          role="progressbar" 
                          style={{ width: `${Math.min(data.entropy / 8 * 100, 100)}%` }}
                          aria-valuenow={data.entropy}
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
                <div className="col-md-6">
                  <div className="text-center p-3 rounded bg-gray-800 border border-gray-700">
                    <div className="text-warning fs-2 mb-2">
                      <i className="bi bi-exclamation-triangle"></i>
                    </div>
                    <div className="text-white fw-medium mb-1">Risk Assessment</div>
                    <div className="text-gray-400 small mb-2">Malicious Pattern Detected</div>
                    <div className="badge bg-danger px-3 py-2">
                      <i className="bi bi-shield-exclamation me-1"></i>
                      MALICIOUS
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

export const MaliciousBytesAnalysis: React.FC<MaliciousBytesAnalysisProps> = ({ 
  zeroXMaliciousBytes, 
  xYMaliciousBytes, 
  className = "" 
}) => {
  if (!zeroXMaliciousBytes && !xYMaliciousBytes) {
    return null;
  }

  return (
    <div className={`${className}`}>
      <div className="card bg-gray-800 border-gray-700">
        <div className="card-header bg-gray-800 border-gray-700">
          <h5 className="card-title text-white mb-0 d-flex align-items-center">
            <i className="bi bi-exclamation-diamond me-2 text-danger"></i>
            Malicious Bytes Analysis
          </h5>
        </div>
        <div className="card-body">
          <div className="alert alert-warning border border-warning bg-warning bg-opacity-10 mb-4">
            <div className="d-flex align-items-start">
              <i className="bi bi-exclamation-triangle text-warning me-2 mt-1"></i>
              <div className="text-warning">
                <strong>Security Alert: </strong>
                This section displays detected malicious byte patterns and their characteristics. 
                These patterns have been identified as potentially harmful or suspicious.
              </div>
            </div>
          </div>
          
          <div className="row g-4">
            {/* Zero-X Malicious Bytes */}
            {zeroXMaliciousBytes && (
              <div className="col-12">
                <MaliciousBytesCard
                  title="Zero-X Malicious Bytes"
                  icon="bi bi-file-binary"
                  data={zeroXMaliciousBytes}
                />
              </div>
            )}

            {/* X-Y Malicious Bytes */}
            {xYMaliciousBytes && (
              <div className="col-12">
                <MaliciousBytesCard
                  title="X-Y Malicious Bytes"
                  icon="bi bi-file-binary"
                  data={xYMaliciousBytes}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 