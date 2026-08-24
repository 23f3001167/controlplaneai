import React from 'react';

export default function RiskBadge({ level }) {
  const normalized = String(level).toUpperCase();
  const styles = {
    LOW: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40',
    MEDIUM: 'bg-amber-950/40 text-amber-400 border-amber-800/40',
    HIGH: 'bg-orange-950/40 text-orange-400 border-orange-800/40',
    CRITICAL: 'bg-rose-950/40 text-rose-400 border-rose-800/40'
  };

  const activeStyle = styles[normalized] || 'bg-gray-800 text-gray-400 border-gray-700';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold border rounded-full ${activeStyle}`}>
      {normalized}
    </span>
  );
}
