
import React, { useState } from 'react';
import { Activity, CrmTask, Lead } from '../../types';
import CrmPipeline, { CrmActions } from './CrmPipeline';

type CrmView = 'pipeline';

interface CrmProps extends CrmActions {
  leads: Lead[];
  activities: Activity[];
  tasks: CrmTask[];
}

const Crm: React.FC<CrmProps> = props => {
  const [view, setView] = useState<CrmView>('pipeline');
  const views: { id: CrmView; label: string }[] = [{ id: 'pipeline', label: 'Prospects' }];

  return (
    <div className="space-y-6">
      <div className="inline-flex gap-1 border-b border-gray-200 w-full">
        {views.map(v => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`px-4 py-2 text-sm font-bold border-b-2 -mb-px ${
              view === v.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>
      {view === 'pipeline' && <CrmPipeline {...props} />}
    </div>
  );
};

export default Crm;
