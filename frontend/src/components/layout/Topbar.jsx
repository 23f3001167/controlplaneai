import React from 'react';
import { ShieldCheck, User } from 'lucide-react';

export default function Topbar() {
  return (
    <header className="h-16 bg-darkCard border-b border-darkBorder flex items-center justify-between px-8 shrink-0">
      {/* Title Placeholder */}
      <div className="flex items-center gap-2">
        <ShieldCheck size={20} className="text-blue-500" />
        <span className="text-sm font-semibold text-gray-300">Enterprise AI Security Center</span>
      </div>

      {/* User Information */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 bg-darkBg border border-darkBorder rounded-full px-3.5 py-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
          <span className="text-xs text-gray-400 font-semibold tracking-wide uppercase">synergyy</span>
        </div>


        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold border border-blue-500">
          <User size={16} />
        </div>
      </div>
    </header>
  );
}
