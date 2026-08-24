import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = 'blue' }) {
  const colorMap = {
    blue: 'border-l-blue-500 text-blue-400 bg-blue-500/5',
    emerald: 'border-l-emerald-500 text-emerald-400 bg-emerald-500/5',
    amber: 'border-l-amber-500 text-amber-400 bg-amber-500/5',
    rose: 'border-l-rose-500 text-rose-400 bg-rose-500/5',
    indigo: 'border-l-indigo-500 text-indigo-400 bg-indigo-500/5'
  };

  const accentColor = colorMap[color] || colorMap.blue;

  return (
    <div className={`bg-darkCard border-l-4 ${accentColor} border-y border-r border-darkBorder/40 rounded-r-xl p-5 shadow-lg flex items-center justify-between`}>
      <div className="space-y-1">
        <span className="text-xs text-gray-400 font-semibold tracking-wider uppercase block">{title}</span>
        <span className="text-2xl font-bold text-gray-100">{value}</span>
      </div>
      <div className={`p-3 rounded-lg ${accentColor.split(' ')[2]} border border-darkBorder/60`}>
        {Icon && <Icon size={22} />}
      </div>
    </div>
  );
}
