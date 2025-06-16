import React from 'react';
import { PayloadData } from '@/lib/types';

interface KeyMetricsProps {
  data: PayloadData;
  className?: string;
}

interface MetricCard {
  icon: string;
  value: string;
  label: string;
  color: string;
  description?: string;
}

export const KeyMetrics: React.FC<KeyMetricsProps> = ({ 
  data, 
  className = "" 
}) => {
  const getEntropyStatus = (entropy: number) => {
    if (entropy > 7) return { color: 'text-danger', description: 'High Risk' };
    if (entropy > 6) return { color: 'text-warning', description: 'Medium Risk' };
    return { color: 'text-success', description: 'Low Risk' };
  };

  const entropyStatus = getEntropyStatus(data.entropy || 0);

  const metrics: MetricCard[] = [
    {
      icon: 'bi-file-earmark',
      value: data.file_size ? `${((data.file_size || 0) / 1024).toFixed(1)} KB` : 'N/A',
      label: 'File Size',
      color: 'text-primary'
    },
    {
      icon: 'bi-bar-chart',
      value: (data.entropy || 0).toFixed(2),
      label: 'Entropy Score',
      color: entropyStatus.color,
      description: entropyStatus.description
    },
    {
      icon: 'bi-layers',
      value: (data.sections?.length || 0).toString(),
      label: 'File Sections',
      color: 'text-warning'
    },
    {
      icon: 'bi-code-square',
      value: (data.imports?.length || 0).toString(),
      label: 'Import Libraries',
      color: 'text-success'
    }
  ];

  return (
    <div className={`row g-4 mb-4 ${className}`}>
      {metrics.map((metric, index) => (
        <div key={index} className="col-xl-3 col-md-6">
          <div className="card bg-gray-800 border-gray-700 h-100 hover-lift transition-all">
            <div className="card-body text-center p-4">
              <div className={`mb-3 ${metric.color}`}>
                <i className={`${metric.icon} fs-1`}></i>
              </div>
              <h3 className="text-white mb-2 fw-bold">
                {metric.value}
              </h3>
              <p className="text-gray-400 mb-1 small fw-medium">
                {metric.label}
              </p>
              {metric.description && (
                <p className={`mb-0 small ${metric.color}`}>
                  {metric.description}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}; 