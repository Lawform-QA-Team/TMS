-- CreateTable: ApiEndpoints
CREATE TABLE IF NOT EXISTS "ApiEndpoints" (
    "id" SERIAL NOT NULL,
    "method" VARCHAR(10) NOT NULL,
    "path" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "tags" TEXT[],
    "request_body" JSONB,
    "response_schema" JSONB,
    "auth_required" BOOLEAN NOT NULL DEFAULT true,
    "project_key" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiEndpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SelectorRegistry
CREATE TABLE IF NOT EXISTS "SelectorRegistry" (
    "id" SERIAL NOT NULL,
    "page_name" VARCHAR(200) NOT NULL,
    "element_name" VARCHAR(200) NOT NULL,
    "data_tid" VARCHAR(200) NOT NULL,
    "selector" VARCHAR(300) NOT NULL,
    "element_type" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "project_key" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SelectorRegistry_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ActionRegistry
CREATE TABLE IF NOT EXISTS "ActionRegistry" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100) NOT NULL,
    "code" TEXT NOT NULL,
    "parameters" TEXT,
    "selector_ids" TEXT,
    "project_key" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionRegistry_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ScenarioRegistry
CREATE TABLE IF NOT EXISTS "ScenarioRegistry" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100) NOT NULL,
    "steps" TEXT NOT NULL,
    "project_key" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScenarioRegistry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ApiEndpoints_project_key_idx" ON "ApiEndpoints"("project_key");
CREATE INDEX IF NOT EXISTS "SelectorRegistry_project_key_idx" ON "SelectorRegistry"("project_key");
CREATE INDEX IF NOT EXISTS "ActionRegistry_project_key_idx" ON "ActionRegistry"("project_key");
CREATE INDEX IF NOT EXISTS "ActionRegistry_category_idx" ON "ActionRegistry"("category");
CREATE INDEX IF NOT EXISTS "ScenarioRegistry_project_key_idx" ON "ScenarioRegistry"("project_key");
CREATE INDEX IF NOT EXISTS "ScenarioRegistry_category_idx" ON "ScenarioRegistry"("category");
