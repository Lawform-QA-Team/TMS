-- CreateTable: Pipeline 관련 테이블 추가

CREATE TABLE "CollectedTickets" (
    "id" SERIAL NOT NULL,
    "pipeline_id" VARCHAR(36) NOT NULL,
    "ticket_key" VARCHAR(50) NOT NULL,
    "project_key" VARCHAR(20) NOT NULL,
    "issue_type" VARCHAR(50) NOT NULL,
    "priority" VARCHAR(20) NOT NULL,
    "summary" VARCHAR(500) NOT NULL,
    "description_raw" TEXT,
    "description_text" TEXT,
    "labels" TEXT,
    "source_type" VARCHAR(20) NOT NULL DEFAULT 'webhook',
    "pipeline_status" VARCHAR(30) NOT NULL DEFAULT 'collected',
    "error_message" TEXT,
    "collected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectedTickets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QAPlans" (
    "id" SERIAL NOT NULL,
    "pipeline_id" VARCHAR(36) NOT NULL,
    "collected_ticket_id" INTEGER NOT NULL,
    "plan_content" TEXT,
    "approval_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QAPlans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AutoQaTestCases" (
    "id" SERIAL NOT NULL,
    "qa_plan_id" INTEGER NOT NULL,
    "pipeline_id" VARCHAR(36) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "case_type" VARCHAR(20) NOT NULL DEFAULT 'happyPath',
    "priority" VARCHAR(10) NOT NULL DEFAULT 'P2',
    "preconditions" TEXT,
    "steps" TEXT,
    "expected_result" TEXT,
    "tags" TEXT,
    "gherkin" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoQaTestCases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PageAnalyses" (
    "id" SERIAL NOT NULL,
    "pipeline_id" VARCHAR(36) NOT NULL,
    "page_name" VARCHAR(200) NOT NULL,
    "url_pattern" VARCHAR(500),
    "elements" TEXT,
    "flows" TEXT,
    "raw_analysis" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageAnalyses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GeneratedCodes" (
    "id" SERIAL NOT NULL,
    "pipeline_id" VARCHAR(36) NOT NULL,
    "language" VARCHAR(20) NOT NULL DEFAULT 'typescript',
    "framework" VARCHAR(20) NOT NULL DEFAULT 'playwright',
    "file_name" VARCHAR(200),
    "code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedCodes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TestRunResults" (
    "id" SERIAL NOT NULL,
    "pipeline_id" VARCHAR(36) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "total_tests" INTEGER NOT NULL DEFAULT 0,
    "passed" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "duration_ms" INTEGER,
    "results" TEXT,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestRunResults_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PipelineReports" (
    "id" SERIAL NOT NULL,
    "pipeline_id" VARCHAR(36) NOT NULL,
    "summary" TEXT,
    "content" TEXT,
    "pass_rate" DOUBLE PRECISION,
    "risk_level" VARCHAR(20),
    "quality_score" INTEGER,
    "ready_for_release" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PipelineReports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PipelineBugs" (
    "id" SERIAL NOT NULL,
    "pipeline_id" VARCHAR(36) NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "severity" VARCHAR(20) NOT NULL DEFAULT 'medium',
    "status" VARCHAR(20) NOT NULL DEFAULT 'open',
    "tc_title" VARCHAR(500),
    "jira_issue_key" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PipelineBugs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlaywrightRuns" (
    "id" SERIAL NOT NULL,
    "run_id" VARCHAR(36) NOT NULL,
    "project" VARCHAR(50) NOT NULL,
    "branch" VARCHAR(100),
    "environment" VARCHAR(20) NOT NULL DEFAULT 'staging',
    "total_tests" INTEGER NOT NULL,
    "passed" INTEGER NOT NULL,
    "failed" INTEGER NOT NULL,
    "skipped" INTEGER NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaywrightRuns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlaywrightTestResults" (
    "id" SERIAL NOT NULL,
    "run_id" INTEGER NOT NULL,
    "suite_name" VARCHAR(200) NOT NULL,
    "test_name" VARCHAR(300) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "browser" VARCHAR(30),
    "retries" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,

    CONSTRAINT "PlaywrightTestResults_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "K6Runs" (
    "id" SERIAL NOT NULL,
    "run_id" VARCHAR(36) NOT NULL,
    "scenario" VARCHAR(100) NOT NULL,
    "environment" VARCHAR(20) NOT NULL DEFAULT 'staging',
    "virtual_users" INTEGER NOT NULL,
    "duration_seconds" INTEGER NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "K6Runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "K6Metrics" (
    "id" SERIAL NOT NULL,
    "run_id" INTEGER NOT NULL,
    "total_requests" INTEGER NOT NULL,
    "failed_requests" INTEGER NOT NULL,
    "error_rate" DOUBLE PRECISION NOT NULL,
    "avg_response_ms" DOUBLE PRECISION NOT NULL,
    "p95_response_ms" DOUBLE PRECISION NOT NULL,
    "p99_response_ms" DOUBLE PRECISION NOT NULL,
    "lcp" DOUBLE PRECISION,
    "fcp" DOUBLE PRECISION,
    "ttfb" DOUBLE PRECISION,
    "cls" DOUBLE PRECISION,
    "fid" DOUBLE PRECISION,
    "inp" DOUBLE PRECISION,

    CONSTRAINT "K6Metrics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "K6Timeseries" (
    "id" SERIAL NOT NULL,
    "run_id" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "request_rate" DOUBLE PRECISION NOT NULL,
    "response_ms" DOUBLE PRECISION NOT NULL,
    "error_rate" DOUBLE PRECISION NOT NULL,
    "active_vus" INTEGER NOT NULL,
    "data_sent_bytes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "data_received_bytes" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "K6Timeseries_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX "CollectedTickets_pipeline_id_key" ON "CollectedTickets"("pipeline_id");
CREATE UNIQUE INDEX "CollectedTickets_ticket_key_key" ON "CollectedTickets"("ticket_key");
CREATE UNIQUE INDEX "QAPlans_pipeline_id_key" ON "QAPlans"("pipeline_id");
CREATE UNIQUE INDEX "QAPlans_collected_ticket_id_key" ON "QAPlans"("collected_ticket_id");
CREATE UNIQUE INDEX "GeneratedCodes_pipeline_id_key" ON "GeneratedCodes"("pipeline_id");
CREATE UNIQUE INDEX "TestRunResults_pipeline_id_key" ON "TestRunResults"("pipeline_id");
CREATE UNIQUE INDEX "PipelineReports_pipeline_id_key" ON "PipelineReports"("pipeline_id");
CREATE UNIQUE INDEX "PlaywrightRuns_run_id_key" ON "PlaywrightRuns"("run_id");
CREATE UNIQUE INDEX "K6Runs_run_id_key" ON "K6Runs"("run_id");
CREATE UNIQUE INDEX "K6Metrics_run_id_key" ON "K6Metrics"("run_id");

-- Indexes
CREATE INDEX "CollectedTickets_pipeline_status_idx" ON "CollectedTickets"("pipeline_status");
CREATE INDEX "CollectedTickets_project_key_idx" ON "CollectedTickets"("project_key");
CREATE INDEX "CollectedTickets_collected_at_idx" ON "CollectedTickets"("collected_at");
CREATE INDEX "AutoQaTestCases_qa_plan_id_idx" ON "AutoQaTestCases"("qa_plan_id");
CREATE INDEX "AutoQaTestCases_pipeline_id_idx" ON "AutoQaTestCases"("pipeline_id");
CREATE INDEX "PageAnalyses_pipeline_id_idx" ON "PageAnalyses"("pipeline_id");
CREATE INDEX "PipelineBugs_pipeline_id_idx" ON "PipelineBugs"("pipeline_id");
CREATE INDEX "PlaywrightRuns_project_idx" ON "PlaywrightRuns"("project");
CREATE INDEX "PlaywrightRuns_started_at_idx" ON "PlaywrightRuns"("started_at");
CREATE INDEX "PlaywrightTestResults_run_id_idx" ON "PlaywrightTestResults"("run_id");
CREATE INDEX "PlaywrightTestResults_status_idx" ON "PlaywrightTestResults"("status");
CREATE INDEX "K6Runs_scenario_idx" ON "K6Runs"("scenario");
CREATE INDEX "K6Runs_started_at_idx" ON "K6Runs"("started_at");
CREATE INDEX "K6Timeseries_run_id_idx" ON "K6Timeseries"("run_id");
CREATE INDEX "K6Timeseries_timestamp_idx" ON "K6Timeseries"("timestamp");

-- Foreign keys
ALTER TABLE "QAPlans" ADD CONSTRAINT "QAPlans_collected_ticket_id_fkey"
    FOREIGN KEY ("collected_ticket_id") REFERENCES "CollectedTickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AutoQaTestCases" ADD CONSTRAINT "AutoQaTestCases_qa_plan_id_fkey"
    FOREIGN KEY ("qa_plan_id") REFERENCES "QAPlans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PlaywrightTestResults" ADD CONSTRAINT "PlaywrightTestResults_run_id_fkey"
    FOREIGN KEY ("run_id") REFERENCES "PlaywrightRuns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "K6Metrics" ADD CONSTRAINT "K6Metrics_run_id_fkey"
    FOREIGN KEY ("run_id") REFERENCES "K6Runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "K6Timeseries" ADD CONSTRAINT "K6Timeseries_run_id_fkey"
    FOREIGN KEY ("run_id") REFERENCES "K6Runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
