
import React from 'react';

interface TerminalWindowProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const TerminalWindow: React.FC<TerminalWindowProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`border-2 border-green-500/50 bg-black/30 ${className}`}>
      <div className="w-full bg-green-500/50 text-black px-2 py-0.5">
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      <div className="p-2">
        {children}
      </div>
    </div>
  );
};

export default TerminalWindow;
