-- CreateTable
CREATE TABLE "Users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(80) NOT NULL,
    "email" VARCHAR(120) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(50),
    "last_name" VARCHAR(50),
    "role" VARCHAR(20) NOT NULL DEFAULT 'user',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSessions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "session_token" VARCHAR(255) NOT NULL,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Folders" (
    "id" SERIAL NOT NULL,
    "folder_name" VARCHAR(100) NOT NULL,
    "folder_type" VARCHAR(50) NOT NULL DEFAULT 'environment',
    "environment" VARCHAR(50) NOT NULL DEFAULT 'dev',
    "deployment_date" DATE,
    "parent_folder_id" INTEGER,
    "project_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestCases" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "test_type" VARCHAR(50),
    "priority" VARCHAR(20),
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "environment" VARCHAR(50),
    "script_path" VARCHAR(500),
    "folder_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "creator_id" INTEGER,
    "assignee_id" INTEGER,
    "project_id" INTEGER,
    "main_category" VARCHAR(100),
    "sub_category" VARCHAR(100),
    "detail_category" VARCHAR(100),
    "pre_condition" TEXT,
    "expected_result" TEXT,
    "remark" TEXT,
    "test_steps" TEXT,
    "automation_code_path" VARCHAR(500),
    "automation_code_type" VARCHAR(50),
    "result_status" VARCHAR(20) NOT NULL DEFAULT 'pending',

    CONSTRAINT "TestCases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_case_history" (
    "id" SERIAL NOT NULL,
    "test_case_id" INTEGER NOT NULL,
    "field_name" VARCHAR(100) NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "changed_by" INTEGER NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "change_type" VARCHAR(50) NOT NULL,

    CONSTRAINT "test_case_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationTests" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "test_type" VARCHAR(50),
    "script_path" VARCHAR(255),
    "environment" VARCHAR(50),
    "parameters" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "creator_id" INTEGER,
    "assignee_id" INTEGER,
    "project_id" INTEGER,

    CONSTRAINT "AutomationTests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceTests" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "test_type" VARCHAR(50),
    "script_path" VARCHAR(255),
    "environment" VARCHAR(50),
    "parameters" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "creator_id" INTEGER,
    "assignee_id" INTEGER,
    "project_id" INTEGER,

    CONSTRAINT "PerformanceTests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestResults" (
    "id" SERIAL NOT NULL,
    "test_case_id" INTEGER,
    "result" VARCHAR(20),
    "execution_time" DOUBLE PRECISION,
    "execution_duration" DOUBLE PRECISION,
    "environment" VARCHAR(50),
    "executed_by" VARCHAR(100),
    "executed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "error_message" TEXT,
    "automation_test_id" INTEGER,
    "performance_test_id" INTEGER,

    CONSTRAINT "TestResults_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestExecutions" (
    "id" SERIAL NOT NULL,
    "test_type" VARCHAR(50),
    "test_case_id" INTEGER,
    "automation_test_id" INTEGER,
    "performance_test_id" INTEGER,
    "environment" VARCHAR(50),
    "executed_by" VARCHAR(100),
    "status" VARCHAR(20),
    "result_summary" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "TestExecutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Screenshots" (
    "id" SERIAL NOT NULL,
    "test_result_id" INTEGER NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Screenshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardSummaries" (
    "id" SERIAL NOT NULL,
    "environment" VARCHAR(50) NOT NULL,
    "total_tests" INTEGER NOT NULL DEFAULT 0,
    "passed_tests" INTEGER NOT NULL DEFAULT 0,
    "failed_tests" INTEGER NOT NULL DEFAULT 0,
    "skipped_tests" INTEGER NOT NULL DEFAULT 0,
    "pass_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DashboardSummaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_case_templates" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "main_category" VARCHAR(100),
    "sub_category" VARCHAR(100),
    "detail_category" VARCHAR(100),
    "pre_condition" TEXT,
    "expected_result" TEXT,
    "test_steps" TEXT,
    "automation_code_path" VARCHAR(500),
    "automation_code_type" VARCHAR(50) NOT NULL DEFAULT 'playwright',
    "tags" TEXT,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "usage_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "test_case_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_plans" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "version" VARCHAR(50),
    "environment" VARCHAR(50),
    "start_date" DATE,
    "end_date" DATE,
    "status" VARCHAR(50) NOT NULL DEFAULT 'draft',
    "priority" VARCHAR(20) NOT NULL DEFAULT 'medium',
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_plan_test_cases" (
    "id" SERIAL NOT NULL,
    "test_plan_id" INTEGER NOT NULL,
    "test_case_id" INTEGER NOT NULL,
    "execution_order" INTEGER NOT NULL DEFAULT 0,
    "estimated_duration" INTEGER,
    "assigned_to" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_plan_test_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JiraIssues" (
    "id" SERIAL NOT NULL,
    "issue_key" VARCHAR(20) NOT NULL,
    "project_key" VARCHAR(20) NOT NULL DEFAULT 'TEST',
    "issue_type" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'To Do',
    "priority" VARCHAR(20) NOT NULL DEFAULT 'Medium',
    "summary" TEXT NOT NULL,
    "description" TEXT,
    "assignee_email" VARCHAR(100),
    "labels" TEXT,
    "reporter_email" VARCHAR(100) NOT NULL DEFAULT 'admin@example.com',
    "environment" VARCHAR(50) NOT NULL DEFAULT 'dev',
    "test_case_id" INTEGER,
    "automation_test_id" INTEGER,
    "performance_test_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JiraIssues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JiraComments" (
    "id" SERIAL NOT NULL,
    "jira_issue_id" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "author_email" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JiraComments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JiraIntegrations" (
    "id" SERIAL NOT NULL,
    "test_case_id" INTEGER,
    "automation_test_id" INTEGER,
    "performance_test_id" INTEGER,
    "jira_issue_key" VARCHAR(20) NOT NULL,
    "jira_issue_id" VARCHAR(50) NOT NULL,
    "jira_project_key" VARCHAR(20) NOT NULL,
    "issue_type" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "priority" VARCHAR(20) NOT NULL DEFAULT 'Medium',
    "summary" TEXT,
    "description" TEXT,
    "assignee_account_id" VARCHAR(100),
    "labels" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_sync_at" TIMESTAMP(3),

    CONSTRAINT "JiraIntegrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestSchedules" (
    "id" SERIAL NOT NULL,
    "test_case_id" INTEGER NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "schedule_type" VARCHAR(50) NOT NULL DEFAULT 'daily',
    "schedule_expression" VARCHAR(200),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "next_run_at" TIMESTAMP(3),
    "last_run_at" TIMESTAMP(3),
    "last_run_status" VARCHAR(20),
    "last_run_result_id" INTEGER,
    "environment" VARCHAR(50) NOT NULL DEFAULT 'dev',
    "execution_parameters" TEXT,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestSchedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "notification_type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "related_test_case_id" INTEGER,
    "related_automation_test_id" INTEGER,
    "related_performance_test_id" INTEGER,
    "related_test_result_id" INTEGER,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "priority" VARCHAR(20) NOT NULL DEFAULT 'medium',
    "channels" VARCHAR(100) NOT NULL DEFAULT 'in_app',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationSettings" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "settings" TEXT NOT NULL DEFAULT '{}',
    "email_enabled" BOOLEAN NOT NULL DEFAULT true,
    "slack_enabled" BOOLEAN NOT NULL DEFAULT false,
    "slack_webhook_url" VARCHAR(500),
    "in_app_enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CICDIntegrations" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "integration_type" VARCHAR(50) NOT NULL,
    "webhook_url" VARCHAR(500),
    "webhook_secret" VARCHAR(255),
    "config" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "trigger_on_push" BOOLEAN NOT NULL DEFAULT true,
    "trigger_on_pr" BOOLEAN NOT NULL DEFAULT true,
    "trigger_on_tag" BOOLEAN NOT NULL DEFAULT false,
    "test_case_filter" TEXT,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CICDIntegrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CICDExecutions" (
    "id" SERIAL NOT NULL,
    "integration_id" INTEGER NOT NULL,
    "trigger_type" VARCHAR(50),
    "trigger_source" VARCHAR(100),
    "trigger_event" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'running',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "executed_test_cases" TEXT,
    "test_results" TEXT,
    "pr_number" INTEGER,
    "pr_url" VARCHAR(500),
    "pr_comment_id" VARCHAR(100),
    "error_message" TEXT,

    CONSTRAINT "CICDExecutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestDataSets" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "data" TEXT NOT NULL,
    "data_type" VARCHAR(50) NOT NULL DEFAULT 'json',
    "data_schema" TEXT,
    "environment" VARCHAR(50) NOT NULL DEFAULT 'dev',
    "version" VARCHAR(50) NOT NULL DEFAULT '1.0',
    "parent_version_id" INTEGER,
    "masking_enabled" BOOLEAN NOT NULL DEFAULT false,
    "masking_rules" TEXT,
    "tags" TEXT,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "last_used_at" TIMESTAMP(3),
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestDataSets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestCaseDataMappings" (
    "id" SERIAL NOT NULL,
    "test_case_id" INTEGER NOT NULL,
    "data_set_id" INTEGER NOT NULL,
    "field_mapping" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestCaseDataMappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comments" (
    "id" SERIAL NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "parent_comment_id" INTEGER,
    "author_id" INTEGER NOT NULL,
    "is_edited" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mentions" (
    "id" SERIAL NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "mentioned_user_id" INTEGER NOT NULL,
    "comment_id" INTEGER,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workflows" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "workflow_type" VARCHAR(50) NOT NULL DEFAULT 'test_case',
    "initial_status" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "project_id" INTEGER,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowSteps" (
    "id" SERIAL NOT NULL,
    "workflow_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "display_name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "allowed_roles" TEXT,
    "allowed_user_ids" TEXT,
    "next_steps" TEXT,
    "auto_transition_condition" TEXT,

    CONSTRAINT "WorkflowSteps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStates" (
    "id" SERIAL NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "workflow_id" INTEGER NOT NULL,
    "current_step_id" INTEGER,
    "current_status" VARCHAR(50) NOT NULL,
    "previous_status" VARCHAR(50),
    "changed_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowStates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestDependencies" (
    "id" SERIAL NOT NULL,
    "test_case_id" INTEGER NOT NULL,
    "depends_on_test_case_id" INTEGER NOT NULL,
    "dependency_type" VARCHAR(50) NOT NULL DEFAULT 'required',
    "condition" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestDependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomReports" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "report_type" VARCHAR(50) NOT NULL DEFAULT 'test_execution',
    "config" TEXT NOT NULL,
    "template" TEXT,
    "output_format" VARCHAR(50) NOT NULL DEFAULT 'html',
    "schedule_enabled" BOOLEAN NOT NULL DEFAULT false,
    "schedule_expression" VARCHAR(200),
    "filters" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "shared_with_user_ids" TEXT,
    "project_id" INTEGER,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomReports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportExecutions" (
    "id" SERIAL NOT NULL,
    "report_id" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'running',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "result_file_path" VARCHAR(500),
    "execution_params" TEXT,
    "error_message" TEXT,
    "executed_by" INTEGER,

    CONSTRAINT "ReportExecutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_username_key" ON "Users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserSessions_session_token_key" ON "UserSessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "JiraIssues_issue_key_key" ON "JiraIssues"("issue_key");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSettings_user_id_key" ON "NotificationSettings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");

-- AddForeignKey
ALTER TABLE "UserSessions" ADD CONSTRAINT "UserSessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folders" ADD CONSTRAINT "Folders_parent_folder_id_fkey" FOREIGN KEY ("parent_folder_id") REFERENCES "Folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folders" ADD CONSTRAINT "Folders_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCases" ADD CONSTRAINT "TestCases_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "Folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCases" ADD CONSTRAINT "TestCases_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCases" ADD CONSTRAINT "TestCases_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCases" ADD CONSTRAINT "TestCases_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_case_history" ADD CONSTRAINT "test_case_history_test_case_id_fkey" FOREIGN KEY ("test_case_id") REFERENCES "TestCases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_case_history" ADD CONSTRAINT "test_case_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationTests" ADD CONSTRAINT "AutomationTests_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationTests" ADD CONSTRAINT "AutomationTests_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceTests" ADD CONSTRAINT "PerformanceTests_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceTests" ADD CONSTRAINT "PerformanceTests_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceTests" ADD CONSTRAINT "PerformanceTests_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResults" ADD CONSTRAINT "TestResults_test_case_id_fkey" FOREIGN KEY ("test_case_id") REFERENCES "TestCases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResults" ADD CONSTRAINT "TestResults_automation_test_id_fkey" FOREIGN KEY ("automation_test_id") REFERENCES "AutomationTests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResults" ADD CONSTRAINT "TestResults_performance_test_id_fkey" FOREIGN KEY ("performance_test_id") REFERENCES "PerformanceTests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestExecutions" ADD CONSTRAINT "TestExecutions_test_case_id_fkey" FOREIGN KEY ("test_case_id") REFERENCES "TestCases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestExecutions" ADD CONSTRAINT "TestExecutions_automation_test_id_fkey" FOREIGN KEY ("automation_test_id") REFERENCES "AutomationTests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestExecutions" ADD CONSTRAINT "TestExecutions_performance_test_id_fkey" FOREIGN KEY ("performance_test_id") REFERENCES "PerformanceTests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Screenshots" ADD CONSTRAINT "Screenshots_test_result_id_fkey" FOREIGN KEY ("test_result_id") REFERENCES "TestResults"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_case_templates" ADD CONSTRAINT "test_case_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_plans" ADD CONSTRAINT "test_plans_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_plan_test_cases" ADD CONSTRAINT "test_plan_test_cases_test_plan_id_fkey" FOREIGN KEY ("test_plan_id") REFERENCES "test_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_plan_test_cases" ADD CONSTRAINT "test_plan_test_cases_test_case_id_fkey" FOREIGN KEY ("test_case_id") REFERENCES "TestCases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_plan_test_cases" ADD CONSTRAINT "test_plan_test_cases_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JiraIssues" ADD CONSTRAINT "JiraIssues_test_case_id_fkey" FOREIGN KEY ("test_case_id") REFERENCES "TestCases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JiraIssues" ADD CONSTRAINT "JiraIssues_automation_test_id_fkey" FOREIGN KEY ("automation_test_id") REFERENCES "AutomationTests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JiraIssues" ADD CONSTRAINT "JiraIssues_performance_test_id_fkey" FOREIGN KEY ("performance_test_id") REFERENCES "PerformanceTests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JiraComments" ADD CONSTRAINT "JiraComments_jira_issue_id_fkey" FOREIGN KEY ("jira_issue_id") REFERENCES "JiraIssues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JiraIntegrations" ADD CONSTRAINT "JiraIntegrations_test_case_id_fkey" FOREIGN KEY ("test_case_id") REFERENCES "TestCases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JiraIntegrations" ADD CONSTRAINT "JiraIntegrations_automation_test_id_fkey" FOREIGN KEY ("automation_test_id") REFERENCES "AutomationTests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JiraIntegrations" ADD CONSTRAINT "JiraIntegrations_performance_test_id_fkey" FOREIGN KEY ("performance_test_id") REFERENCES "PerformanceTests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSchedules" ADD CONSTRAINT "TestSchedules_test_case_id_fkey" FOREIGN KEY ("test_case_id") REFERENCES "TestCases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSchedules" ADD CONSTRAINT "TestSchedules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSchedules" ADD CONSTRAINT "TestSchedules_last_run_result_id_fkey" FOREIGN KEY ("last_run_result_id") REFERENCES "TestResults"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_related_test_case_id_fkey" FOREIGN KEY ("related_test_case_id") REFERENCES "TestCases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_related_automation_test_id_fkey" FOREIGN KEY ("related_automation_test_id") REFERENCES "AutomationTests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_related_performance_test_id_fkey" FOREIGN KEY ("related_performance_test_id") REFERENCES "PerformanceTests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_related_test_result_id_fkey" FOREIGN KEY ("related_test_result_id") REFERENCES "TestResults"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationSettings" ADD CONSTRAINT "NotificationSettings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CICDIntegrations" ADD CONSTRAINT "CICDIntegrations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CICDExecutions" ADD CONSTRAINT "CICDExecutions_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "CICDIntegrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestDataSets" ADD CONSTRAINT "TestDataSets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestDataSets" ADD CONSTRAINT "TestDataSets_parent_version_id_fkey" FOREIGN KEY ("parent_version_id") REFERENCES "TestDataSets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCaseDataMappings" ADD CONSTRAINT "TestCaseDataMappings_test_case_id_fkey" FOREIGN KEY ("test_case_id") REFERENCES "TestCases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestCaseDataMappings" ADD CONSTRAINT "TestCaseDataMappings_data_set_id_fkey" FOREIGN KEY ("data_set_id") REFERENCES "TestDataSets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comments" ADD CONSTRAINT "Comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comments" ADD CONSTRAINT "Comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "Comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mentions" ADD CONSTRAINT "Mentions_mentioned_user_id_fkey" FOREIGN KEY ("mentioned_user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mentions" ADD CONSTRAINT "Mentions_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "Comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workflows" ADD CONSTRAINT "Workflows_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workflows" ADD CONSTRAINT "Workflows_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowSteps" ADD CONSTRAINT "WorkflowSteps_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "Workflows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStates" ADD CONSTRAINT "WorkflowStates_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "Workflows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStates" ADD CONSTRAINT "WorkflowStates_current_step_id_fkey" FOREIGN KEY ("current_step_id") REFERENCES "WorkflowSteps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStates" ADD CONSTRAINT "WorkflowStates_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestDependencies" ADD CONSTRAINT "TestDependencies_test_case_id_fkey" FOREIGN KEY ("test_case_id") REFERENCES "TestCases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestDependencies" ADD CONSTRAINT "TestDependencies_depends_on_test_case_id_fkey" FOREIGN KEY ("depends_on_test_case_id") REFERENCES "TestCases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomReports" ADD CONSTRAINT "CustomReports_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomReports" ADD CONSTRAINT "CustomReports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportExecutions" ADD CONSTRAINT "ReportExecutions_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "CustomReports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportExecutions" ADD CONSTRAINT "ReportExecutions_executed_by_fkey" FOREIGN KEY ("executed_by") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
