import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

export default function DecisionChart({ data }) {
  const COLORS = {
    ALLOW: '#10b981',
    MODIFY: '#f59e0b',
    HUMAN_REVIEW: '#3b82f6',
    BLOCK: '#ef4444'
  };

  const chartData = data && data.length > 0 ? data : [
    { name: 'ALLOW', value: 0 },
    { name: 'MODIFY', value: 0 },
    { name: 'HUMAN_REVIEW', value: 0 },
    { name: 'BLOCK', value: 0 }
  ];

  return (
    <div className="bg-darkCard border border-darkBorder rounded-xl p-5 h-80 flex flex-col">
      <h4 className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-4">Decision Distribution</h4>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.name] || '#64748b'} 
                />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#151c2c', borderColor: '#222f47', color: '#e2e8f0' }}
              itemStyle={{ fontSize: 12 }}
            />
            <Legend 
              verticalAlign="bottom" 
              iconSize={8} 
              iconType="circle"
              wrapperStyle={{ fontSize: 11 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
