-- GeneratedCodes: pipelineId unique 제거 → (pipelineId, framework) 복합 unique 추가
DO $$ BEGIN
  ALTER TABLE "GeneratedCodes" DROP CONSTRAINT IF EXISTS "GeneratedCodes_pipeline_id_key";
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "GeneratedCodes" ADD CONSTRAINT "GeneratedCodes_pipeline_id_framework_key" UNIQUE (pipeline_id, framework);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
