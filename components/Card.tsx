import React from 'react';

interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden ${className}`}>
      <h2 className="text-lg sm:text-xl font-semibold text-cyan-300 p-4 border-b border-gray-700 bg-gray-800/50">
        {title}
      </h2>
      <div className="p-4 md:p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;
