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
            <h6 className="text-gray-400 mb-2 d-flex align-items-center">
              <i className="bi bi-filetype-txt me-2"></i>
              ASCII Hex Representation
            </h6>
            <pre 
                className="text-gray-300 mb-0 small overflow-auto border border-gray-700 rounded p-3 bg-gray-800" 
                style={{ 
                  maxHeight: '300px',
                  fontFamily: 'ui-monospace, SFMono-Regular, \"SF Mono\", Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace',
                  lineHeight: '1.5',
                  fontSize: '0.8rem'
                }}
              >
                {data.ascii_byte_representation}
              </pre>
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