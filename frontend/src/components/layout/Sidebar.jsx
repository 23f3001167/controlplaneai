import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Cpu, 
  ShieldAlert, 
  BookOpen, 
  PlayCircle, 
  History, 
  ClipboardList 
} from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'AI Systems', path: '/ai-systems', icon: Cpu },
    { name: 'Policies', path: '/policies', icon: BookOpen },
    { name: 'Evaluation Sandbox', path: '/evaluation', icon: PlayCircle },
    { name: 'Incidents', path: '/incidents', icon: ShieldAlert },
    { name: 'Interactions History', path: '/interactions', icon: History },
    { name: 'Audit Logs', path: '/audit-logs', icon: ClipboardList }
  ];

  return (
    <aside className="w-64 bg-darkCard border-r border-darkBorder flex flex-col h-full shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-darkBorder gap-2.5">
        <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent tracking-tight">
          ControlPlane.ai
        </span>
        <span className="text-[10px] uppercase font-semibold tracking-wider text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 rounded px-1.5 py-0.5">
          v1.0
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive 
                    ? 'bg-blue-600/15 border border-blue-500/30 text-blue-400 font-semibold' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/40 border border-transparent'
                }`
              }
            >
              <Icon size={18} />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-4 border-t border-darkBorder bg-darkBg/30">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs text-gray-400 font-medium">Governance Engine Online</span>
        </div>
      </div>
    </aside>
  );
}
