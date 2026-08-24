import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function ErrorState({ title = 'Connection Error', message = 'Could not fetch data from the remote governance engine.', onRetry }) {
  return (
    <div className="bg-rose-950/20 border border-rose-900/40 rounded-xl p-8 max-w-lg mx-auto my-8 text-center">
      <AlertCircle size={32} className="text-rose-500 mx-auto mb-3" />
      <h4 className="text-rose-400 font-bold text-sm mb-1">{title}</h4>
      <p className="text-gray-400 text-xs mb-4">{message}</p>
      {onRetry && (
        <button 
          onClick={onRetry} 
          className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs py-1.5 px-4 rounded-lg transition"
        >
          Retry Connection
        </button>
      )}
    </div>
  );
}
