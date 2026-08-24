import React from 'react';
import { 
  BarChart, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function IncidentChart({ data }) {
  const SEVERITY_COLORS = {
    LOW: '#10b981',
    MEDIUM: '#f59e0b',
    HIGH: '#f97316',
    CRITICAL: '#ef4444'
  };

  // Order severities logically
  const order = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const sortedData = [...(data || [])].sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));

  return (
    <div className="bg-darkCard border border-darkBorder rounded-xl p-5 h-80 flex flex-col">
      <h4 className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-4">Incidents by Severity</h4>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222f47" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#475569" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              stroke="#475569" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              allowDecimals={false}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#151c2c', borderColor: '#222f47', color: '#e2e8f0' }}
              itemStyle={{ fontSize: 12 }}
            />
            <Bar dataKey="value" name="Incidents Count" radius={[4, 4, 0, 0]}>
              {sortedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={SEVERITY_COLORS[entry.name] || '#3b82f6'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
