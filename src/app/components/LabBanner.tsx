import React from 'react';

interface LabBannerProps {
  className?: string;
}

export function LabBanner({ className = "border-b border-gray-300" }: LabBannerProps) {
  return (
    <div className={`relative h-32 overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-blue-700 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white tracking-wide">
            INVITRO AIDMED DIAGNOSTICS
          </h1>
          <p className="text-blue-100 text-sm mt-1">Professional Laboratory Services</p>
        </div>
      </div>
    </div>
  );
}
