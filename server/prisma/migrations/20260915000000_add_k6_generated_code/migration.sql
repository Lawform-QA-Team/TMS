-- GeneratedCodes: pipelineId unique 제거 → (pipelineId, framework) 복합 unique 추가
ALTER TABLE "GeneratedCodes" DROP CONSTRAINT "GeneratedCodes_pipeline_id_key";
ALTER TABLE "GeneratedCodes" ADD CONSTRAINT "GeneratedCodes_pipeline_id_framework_key" UNIQUE (pipeline_id, framework);
