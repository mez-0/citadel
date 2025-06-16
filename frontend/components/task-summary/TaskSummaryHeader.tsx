import React from 'react';
import Link from 'next/link';

interface TaskSummaryHeaderProps {
  className?: string;
}

export const TaskSummaryHeader: React.FC<TaskSummaryHeaderProps> = ({ 
  className = "" 
}) => {
  return (
    <div className={`d-flex align-items-center justify-content-between mb-4 ${className}`}>
      <div>
        <Link href="/" className="text-gray-400 text-sm mb-2 d-inline-flex align-items-center text-decoration-none">
          <i className="bi bi-arrow-left me-2"></i>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}; 