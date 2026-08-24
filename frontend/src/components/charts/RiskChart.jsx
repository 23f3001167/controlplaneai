import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function RiskChart({ data }) {
  return (
    <div className="bg-darkCard border border-darkBorder rounded-xl p-5 h-80 flex flex-col">
      <h4 className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-4">Risk Level Trend</h4>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#222f47" vertical={false} />
            <XAxis 
              dataKey="date" 
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
              domain={[0, 100]} 
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#151c2c', borderColor: '#222f47', color: '#e2e8f0' }} 
              labelStyle={{ color: '#94a3b8', fontSize: 10 }}
              itemStyle={{ fontSize: 12 }}
            />
            <Area 
              type="monotone" 
              dataKey="avg_risk" 
              name="Avg Risk Score" 
              stroke="#3b82f6" 
              strokeWidth={2} 
              fillOpacity={1} 
              fill="url(#riskGrad)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
