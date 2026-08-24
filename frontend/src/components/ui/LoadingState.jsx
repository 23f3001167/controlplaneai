import React from 'react';

export default function LoadingState({ message = 'Loading dashboard analytics...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-3">
      <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      <span className="text-xs text-gray-400 font-semibold">{message}</span>
    </div>
  );
}
