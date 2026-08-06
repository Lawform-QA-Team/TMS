import React, { useState } from 'react';
import PipelineStats from './PipelineStats';
import PipelineList from './PipelineList';
import PipelineDetail from './PipelineDetail';
import './Pipeline.css';

export default function PipelineManager() {
  const [selectedPipelineId, setSelectedPipelineId] = useState(null);

  return (
    <div className="pipeline-manager">
      <div className="pipeline-manager-header">QA 파이프라인</div>
      <PipelineStats />
      <div className="pipeline-manager-body">
        <div className="pipeline-manager-main">
          <PipelineList onSelect={setSelectedPipelineId} />
        </div>
        {selectedPipelineId && (
          <div className="pipeline-manager-side">
            <PipelineDetail
              pipelineId={selectedPipelineId}
              onClose={() => setSelectedPipelineId(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
