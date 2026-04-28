import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const PageContainer: React.FC<PageContainerProps> = ({ children, title, description }) => (
  <div className="max-w-4xl mx-auto px-6 py-8">
    {title && (
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">{title}</h1>
        {description && <p className="text-gray-600">{description}</p>}
      </div>
    )}
    {children}
  </div>
);

export default PageContainer;


