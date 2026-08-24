import React from 'react';
import { Database } from 'lucide-react';

export default function EmptyState({ title = 'No records found', description = 'Try adjusting your search filters or add a new record to get started.' }) {
  return (
    <div className="bg-darkCard/30 border border-dashed border-darkBorder rounded-xl p-12 text-center max-w-lg mx-auto my-8">
      <div className="w-12 h-12 bg-darkCard border border-darkBorder rounded-xl flex items-center justify-center mx-auto mb-4 text-gray-500">
        <Database size={20} />
      </div>
      <h4 className="text-gray-300 font-semibold mb-1 text-sm">{title}</h4>
      <p className="text-gray-500 text-xs leading-relaxed">{description}</p>
    </div>
  );
}
