
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center py-4">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-blue-200"></div>
    </div>
  );
};

export default LoadingSpinner;
