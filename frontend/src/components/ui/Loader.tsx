import React from 'react';

type LoaderSize = 'sm' | 'md' | 'lg';

interface LoaderProps {
  size?: LoaderSize;
  inline?: boolean;
}

const Loader: React.FC<LoaderProps> = ({ size = 'md', inline = false }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const spinner = (
    <div className={`${sizeClasses[size]} border-2 border-gray-300 border-t-black rounded-full animate-spin`} />
  );

  if (inline) {
    return spinner;
  }

  return (
    <div className="flex items-center justify-center p-8">
      {spinner}
    </div>
  );
};

export default Loader;


