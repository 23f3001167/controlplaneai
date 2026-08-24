import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children }) {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-darkBg/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="bg-darkCard border border-darkBorder rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col z-10 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="h-14 px-6 border-b border-darkBorder flex items-center justify-between shrink-0">
          <h3 className="text-base font-semibold text-gray-200">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto min-h-0 text-sm text-gray-300">
          {children}
        </div>
      </div>
    </div>
  );
}
