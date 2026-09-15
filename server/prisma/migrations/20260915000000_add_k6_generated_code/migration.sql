-- GeneratedCodes: pipelineId unique 제거 → (pipelineId, framework) 복합 unique 추가
ALTER TABLE `GeneratedCodes` DROP INDEX `GeneratedCodes_pipeline_id_key`;
ALTER TABLE `GeneratedCodes` ADD UNIQUE INDEX `GeneratedCodes_pipeline_id_framework_key` (`pipeline_id`, `framework`);
