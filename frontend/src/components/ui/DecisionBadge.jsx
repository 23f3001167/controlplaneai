import React from 'react';

export default function DecisionBadge({ action }) {
  const normalized = String(action).toUpperCase();
  const styles = {
    ALLOW: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40',
    MODIFY: 'bg-amber-950/40 text-amber-400 border-amber-800/40',
    HUMAN_REVIEW: 'bg-blue-950/40 text-blue-400 border-blue-800/40',
    BLOCK: 'bg-rose-950/40 text-rose-400 border-rose-800/40'
  };

  const activeStyle = styles[normalized] || 'bg-gray-800 text-gray-400 border-gray-700';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold border rounded-full ${activeStyle}`}>
      {normalized}
    </span>
  );
}
