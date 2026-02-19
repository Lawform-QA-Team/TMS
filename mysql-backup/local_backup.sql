-- MySQL dump 10.13  Distrib 9.3.0, for macos15.2 (arm64)
--
-- Host: localhost    Database: test_management
-- ------------------------------------------------------
-- Server version	9.3.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `alembic_version`
--

DROP TABLE IF EXISTS `alembic_version`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alembic_version` (
  `version_num` varchar(32) NOT NULL,
  PRIMARY KEY (`version_num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alembic_version`
--

LOCK TABLES `alembic_version` WRITE;
/*!40000 ALTER TABLE `alembic_version` DISABLE KEYS */;
INSERT INTO `alembic_version` VALUES ('add_system_config');
/*!40000 ALTER TABLE `alembic_version` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `AutomationTestResults`
--

DROP TABLE IF EXISTS `AutomationTestResults`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `AutomationTestResults` (
  `id` int NOT NULL AUTO_INCREMENT,
  `test_id` int DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `execution_time` float DEFAULT NULL,
  `result_data` text,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `test_id` (`test_id`),
  CONSTRAINT `automationtestresults_ibfk_1` FOREIGN KEY (`test_id`) REFERENCES `AutomationTests` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `AutomationTestResults`
--

LOCK TABLES `AutomationTestResults` WRITE;
/*!40000 ALTER TABLE `AutomationTestResults` DISABLE KEYS */;
/*!40000 ALTER TABLE `AutomationTestResults` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `AutomationTests`
--

DROP TABLE IF EXISTS `AutomationTests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `AutomationTests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `description` text,
  `test_type` varchar(50) DEFAULT NULL,
  `script_path` varchar(500) DEFAULT NULL,
  `environment` varchar(100) DEFAULT NULL,
  `parameters` text,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `creator_id` int DEFAULT NULL,
  `project_id` int DEFAULT NULL,
  `assignee_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_automation_tests_creator` (`creator_id`),
  KEY `fk_automationtests_project` (`project_id`),
  KEY `idx_automationtests_assignee_id` (`assignee_id`),
  CONSTRAINT `fk_automationtests_assignee` FOREIGN KEY (`assignee_id`) REFERENCES `Users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `AutomationTests`
--

LOCK TABLES `AutomationTests` WRITE;
/*!40000 ALTER TABLE `AutomationTests` DISABLE KEYS */;
INSERT INTO `AutomationTests` VALUES (1,'로그인','','playwright','test-scripts/performance/login/login_to_dashboard.js','dev','','2025-08-13 05:31:04','2025-12-30 10:21:09',NULL,NULL,NULL),(2,'자동화 테스트 1','첫 번째 자동화 테스트입니다.','functional','/scripts/auto1.js','dev','browser:chrome,timeout:30','2025-08-14 09:25:11','2025-12-30 10:21:09',NULL,NULL,NULL),(3,'자동화 테스트 2','두 번째 자동화 테스트입니다.','ui','/scripts/auto2.js','staging','browser:firefox,timeout:60','2025-08-14 09:25:11','2025-12-30 10:21:09',NULL,NULL,NULL);
/*!40000 ALTER TABLE `AutomationTests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `CICDExecutions`
--

DROP TABLE IF EXISTS `CICDExecutions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CICDExecutions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `integration_id` int NOT NULL,
  `trigger_type` varchar(50) DEFAULT NULL,
  `trigger_source` varchar(100) DEFAULT NULL,
  `trigger_event` text,
  `status` varchar(20) DEFAULT NULL,
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `executed_test_cases` text,
  `test_results` text,
  `pr_number` int DEFAULT NULL,
  `pr_url` varchar(500) DEFAULT NULL,
  `pr_comment_id` varchar(100) DEFAULT NULL,
  `error_message` text,
  PRIMARY KEY (`id`),
  KEY `integration_id` (`integration_id`),
  CONSTRAINT `cicdexecutions_ibfk_1` FOREIGN KEY (`integration_id`) REFERENCES `CICDIntegrations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CICDExecutions`
--

LOCK TABLES `CICDExecutions` WRITE;
/*!40000 ALTER TABLE `CICDExecutions` DISABLE KEYS */;
/*!40000 ALTER TABLE `CICDExecutions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `CICDIntegrations`
--

DROP TABLE IF EXISTS `CICDIntegrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CICDIntegrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `integration_type` varchar(50) NOT NULL,
  `webhook_url` varchar(500) DEFAULT NULL,
  `webhook_secret` varchar(255) DEFAULT NULL,
  `config` text,
  `enabled` tinyint(1) DEFAULT NULL,
  `active` tinyint(1) DEFAULT NULL,
  `trigger_on_push` tinyint(1) DEFAULT NULL,
  `trigger_on_pr` tinyint(1) DEFAULT NULL,
  `trigger_on_tag` tinyint(1) DEFAULT NULL,
  `test_case_filter` text,
  `created_by` int NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `cicdintegrations_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `Users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CICDIntegrations`
--

LOCK TABLES `CICDIntegrations` WRITE;
/*!40000 ALTER TABLE `CICDIntegrations` DISABLE KEYS */;
/*!40000 ALTER TABLE `CICDIntegrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Comments`
--

DROP TABLE IF EXISTS `Comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` int NOT NULL,
  `content` text NOT NULL,
  `parent_comment_id` int DEFAULT NULL,
  `author_id` int NOT NULL,
  `is_edited` tinyint(1) DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `parent_comment_id` (`parent_comment_id`),
  KEY `author_id` (`author_id`),
  CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`parent_comment_id`) REFERENCES `Comments` (`id`),
  CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`author_id`) REFERENCES `Users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Comments`
--

LOCK TABLES `Comments` WRITE;
/*!40000 ALTER TABLE `Comments` DISABLE KEYS */;
INSERT INTO `Comments` VALUES (1,'test_case',65,'@admin 댓글 멘션 테스트',NULL,1,0,0,'2025-12-08 16:25:42','2025-12-08 16:25:42'),(2,'test_case',65,'@admin 댓글 멘션 테스트',NULL,1,0,0,'2025-12-08 16:25:42','2025-12-08 16:25:42'),(3,'test_case',65,'@admin 댓글 slack webhook test',NULL,1,0,0,'2025-12-09 13:14:31','2025-12-09 13:14:31'),(4,'test_case',66,'@admin slack webhook test',NULL,1,0,0,'2025-12-09 13:16:49','2025-12-09 13:16:49'),(5,'test_case',65,'@admin test',NULL,1,0,0,'2025-12-09 13:23:53','2025-12-09 13:23:53');
/*!40000 ALTER TABLE `Comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `CustomReports`
--

DROP TABLE IF EXISTS `CustomReports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CustomReports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `description` text,
  `report_type` varchar(50) DEFAULT NULL,
  `config` text NOT NULL,
  `template` text,
  `output_format` varchar(50) DEFAULT NULL,
  `schedule_enabled` tinyint(1) DEFAULT NULL,
  `schedule_expression` varchar(200) DEFAULT NULL,
  `filters` text,
  `is_public` tinyint(1) DEFAULT NULL,
  `shared_with_user_ids` text,
  `project_id` int DEFAULT NULL,
  `created_by` int NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `customreports_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  CONSTRAINT `customreports_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `Users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CustomReports`
--

LOCK TABLES `CustomReports` WRITE;
/*!40000 ALTER TABLE `CustomReports` DISABLE KEYS */;
/*!40000 ALTER TABLE `CustomReports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `DashboardSummaries`
--

DROP TABLE IF EXISTS `DashboardSummaries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `DashboardSummaries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `environment` varchar(100) DEFAULT NULL,
  `total_tests` int DEFAULT NULL,
  `passed_tests` int DEFAULT NULL,
  `failed_tests` int DEFAULT NULL,
  `skipped_tests` int DEFAULT NULL,
  `pass_rate` float DEFAULT NULL,
  `last_updated` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `DashboardSummaries`
--

LOCK TABLES `DashboardSummaries` WRITE;
/*!40000 ALTER TABLE `DashboardSummaries` DISABLE KEYS */;
INSERT INTO `DashboardSummaries` VALUES (1,'production',3,1,1,1,33.33,'2025-08-14 08:56:18'),(2,'alpha',6,1,1,3,16.67,'2025-08-14 08:56:18'),(3,'dev',54,0,0,54,0,'2025-08-14 08:56:18');
/*!40000 ALTER TABLE `DashboardSummaries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Folders`
--

DROP TABLE IF EXISTS `Folders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Folders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `folder_name` varchar(100) NOT NULL,
  `folder_type` varchar(50) DEFAULT NULL,
  `environment` varchar(50) DEFAULT NULL,
  `deployment_date` date DEFAULT NULL,
  `parent_folder_id` int DEFAULT NULL,
  `project_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `parent_folder_id` (`parent_folder_id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `folders_ibfk_1` FOREIGN KEY (`parent_folder_id`) REFERENCES `Folders` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Folders`
--

LOCK TABLES `Folders` WRITE;
/*!40000 ALTER TABLE `Folders` DISABLE KEYS */;
INSERT INTO `Folders` VALUES (1,'DEV 환경','environment','dev',NULL,NULL,2,'2025-08-14 02:45:42'),(2,'ALPHA 환경','environment','alpha',NULL,NULL,2,'2025-08-14 02:45:42'),(3,'PRODUCTION 환경','environment','production',NULL,NULL,2,'2025-08-14 02:45:42'),(4,'2024-08-01','deployment_date','dev','2025-08-13',1,2,'2025-08-14 02:45:42'),(5,'2024-08-15','deployment_date','alpha','2025-08-13',2,2,'2025-08-14 02:45:42'),(6,'2024-09-01','deployment_date','production','2025-08-13',3,2,'2025-08-14 02:45:42'),(7,'CLM','feature','dev',NULL,4,2,'2025-08-14 02:45:42'),(8,'Litigation','feature','alpha',NULL,5,2,'2025-08-14 02:45:42'),(9,'Dashboard','feature','production',NULL,6,2,'2025-08-14 02:45:42');
/*!40000 ALTER TABLE `Folders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `JiraComments`
--

DROP TABLE IF EXISTS `JiraComments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `JiraComments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `jira_issue_id` int NOT NULL,
  `body` text NOT NULL,
  `author_email` varchar(100) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `jira_issue_id` (`jira_issue_id`),
  CONSTRAINT `jiracomments_ibfk_1` FOREIGN KEY (`jira_issue_id`) REFERENCES `JiraIssues` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `JiraComments`
--

LOCK TABLES `JiraComments` WRITE;
/*!40000 ALTER TABLE `JiraComments` DISABLE KEYS */;
INSERT INTO `JiraComments` VALUES (1,1,'댓굴','admin@example.com','2025-12-08 15:29:17','2025-12-08 15:29:17'),(2,1,'@admin 맨션 기능 테스트','admin@example.com','2025-12-08 15:31:30','2025-12-08 15:31:30'),(3,1,'@admin 댓글 멘션 테스트','admin@example.com','2025-12-08 15:57:27','2025-12-08 15:57:27'),(4,1,'@admin gg','admin@example.com','2025-12-10 13:48:44','2025-12-10 13:48:44'),(5,2,'@ggpark 담당자 할당 테스트','admin@example.com','2025-12-15 13:48:17','2025-12-15 13:48:17');
/*!40000 ALTER TABLE `JiraComments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `JiraIntegrations`
--

DROP TABLE IF EXISTS `JiraIntegrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `JiraIntegrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `test_case_id` int DEFAULT NULL,
  `automation_test_id` int DEFAULT NULL,
  `performance_test_id` int DEFAULT NULL,
  `jira_issue_key` varchar(20) NOT NULL,
  `jira_issue_id` varchar(50) NOT NULL,
  `jira_project_key` varchar(20) NOT NULL,
  `issue_type` varchar(50) NOT NULL,
  `status` varchar(50) NOT NULL,
  `priority` varchar(20) DEFAULT NULL,
  `summary` text,
  `description` text,
  `assignee_account_id` varchar(100) DEFAULT NULL,
  `labels` text,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `last_sync_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `test_case_id` (`test_case_id`),
  KEY `automation_test_id` (`automation_test_id`),
  KEY `performance_test_id` (`performance_test_id`),
  CONSTRAINT `jiraintegrations_ibfk_1` FOREIGN KEY (`test_case_id`) REFERENCES `TestCases` (`id`),
  CONSTRAINT `jiraintegrations_ibfk_2` FOREIGN KEY (`automation_test_id`) REFERENCES `AutomationTests` (`id`),
  CONSTRAINT `jiraintegrations_ibfk_3` FOREIGN KEY (`performance_test_id`) REFERENCES `PerformanceTests` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `JiraIntegrations`
--

LOCK TABLES `JiraIntegrations` WRITE;
/*!40000 ALTER TABLE `JiraIntegrations` DISABLE KEYS */;
/*!40000 ALTER TABLE `JiraIntegrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `JiraIssues`
--

DROP TABLE IF EXISTS `JiraIssues`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `JiraIssues` (
  `id` int NOT NULL AUTO_INCREMENT,
  `issue_key` varchar(20) NOT NULL,
  `project_key` varchar(20) NOT NULL,
  `issue_type` varchar(50) NOT NULL,
  `status` varchar(50) NOT NULL,
  `priority` varchar(20) DEFAULT NULL,
  `summary` text NOT NULL,
  `description` text,
  `assignee_email` varchar(100) DEFAULT NULL,
  `labels` text,
  `reporter_email` varchar(100) DEFAULT NULL,
  `environment` varchar(50) DEFAULT 'dev',
  `test_case_id` int DEFAULT NULL,
  `automation_test_id` int DEFAULT NULL,
  `performance_test_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `issue_key` (`issue_key`),
  KEY `test_case_id` (`test_case_id`),
  KEY `automation_test_id` (`automation_test_id`),
  KEY `performance_test_id` (`performance_test_id`),
  CONSTRAINT `jiraissues_ibfk_1` FOREIGN KEY (`test_case_id`) REFERENCES `TestCases` (`id`),
  CONSTRAINT `jiraissues_ibfk_2` FOREIGN KEY (`automation_test_id`) REFERENCES `AutomationTests` (`id`),
  CONSTRAINT `jiraissues_ibfk_3` FOREIGN KEY (`performance_test_id`) REFERENCES `PerformanceTests` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `JiraIssues`
--

LOCK TABLES `JiraIssues` WRITE;
/*!40000 ALTER TABLE `JiraIssues` DISABLE KEYS */;
INSERT INTO `JiraIssues` VALUES (1,'TEST-1','TEST','Bug','To Do','Critical','1','1','admin@admin.com','[\"test\"]','admin@example.com','alpha',NULL,NULL,NULL,'2025-12-08 15:29:00','2025-12-29 05:01:55'),(2,'TEST-2','TEST','Bug','To Do','Medium','ㅁㄴㅇ','ㅁㄴㅇ','ggpark@amicuslex.net','[\"test2\"]','admin@example.com','alpha',65,NULL,NULL,'2025-12-09 16:51:03','2025-12-29 05:02:08');
/*!40000 ALTER TABLE `JiraIssues` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Mentions`
--

DROP TABLE IF EXISTS `Mentions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Mentions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` int NOT NULL,
  `mentioned_user_id` int NOT NULL,
  `comment_id` int DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `mentioned_user_id` (`mentioned_user_id`),
  KEY `comment_id` (`comment_id`),
  CONSTRAINT `mentions_ibfk_1` FOREIGN KEY (`mentioned_user_id`) REFERENCES `Users` (`id`),
  CONSTRAINT `mentions_ibfk_2` FOREIGN KEY (`comment_id`) REFERENCES `Comments` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Mentions`
--

LOCK TABLES `Mentions` WRITE;
/*!40000 ALTER TABLE `Mentions` DISABLE KEYS */;
INSERT INTO `Mentions` VALUES (1,'test_case',65,1,1,0,'2025-12-08 16:25:42'),(2,'test_case',65,1,2,0,'2025-12-08 16:25:42'),(3,'test_case',65,1,3,0,'2025-12-09 13:14:31'),(4,'test_case',66,1,4,0,'2025-12-09 13:16:49'),(5,'test_case',65,1,5,0,'2025-12-09 13:23:53');
/*!40000 ALTER TABLE `Mentions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Notifications`
--

DROP TABLE IF EXISTS `Notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `notification_type` varchar(50) NOT NULL,
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `related_test_case_id` int DEFAULT NULL,
  `related_automation_test_id` int DEFAULT NULL,
  `related_performance_test_id` int DEFAULT NULL,
  `related_test_result_id` int DEFAULT NULL,
  `read` tinyint(1) DEFAULT NULL,
  `read_at` datetime DEFAULT NULL,
  `priority` varchar(20) DEFAULT NULL,
  `channels` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `related_test_case_id` (`related_test_case_id`),
  KEY `related_automation_test_id` (`related_automation_test_id`),
  KEY `related_performance_test_id` (`related_performance_test_id`),
  KEY `related_test_result_id` (`related_test_result_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`),
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`related_test_case_id`) REFERENCES `TestCases` (`id`),
  CONSTRAINT `notifications_ibfk_3` FOREIGN KEY (`related_automation_test_id`) REFERENCES `AutomationTests` (`id`),
  CONSTRAINT `notifications_ibfk_4` FOREIGN KEY (`related_performance_test_id`) REFERENCES `PerformanceTests` (`id`),
  CONSTRAINT `notifications_ibfk_5` FOREIGN KEY (`related_test_result_id`) REFERENCES `TestResults` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Notifications`
--

LOCK TABLES `Notifications` WRITE;
/*!40000 ALTER TABLE `Notifications` DISABLE KEYS */;
INSERT INTO `Notifications` VALUES (1,2,'assignment','테스트 케이스 담당자 지정','\'테스트 케이스 1\' 테스트 케이스의 담당자로 지정되었습니다.',65,NULL,NULL,NULL,0,NULL,'medium','in_app','2025-12-08 15:41:33'),(2,1,'assignment','테스트 케이스 담당자 지정','\'2/2/2\' 테스트 케이스의 담당자로 지정되었습니다.',37,NULL,NULL,NULL,0,NULL,'medium','in_app','2025-12-08 15:44:21'),(3,1,'assignment','테스트 케이스 담당자 지정','\'기능 테스트/UI 테스트/버튼 클릭\' 테스트 케이스의 담당자로 지정되었습니다.',64,NULL,NULL,NULL,0,NULL,'medium','in_app','2025-12-08 15:44:37'),(4,1,'assignment','테스트 케이스 담당자 지정','\'테스트 케이스 1\' 테스트 케이스의 담당자로 지정되었습니다.',65,NULL,NULL,NULL,0,NULL,'medium','in_app','2025-12-08 15:45:01'),(5,1,'assignment','테스트 케이스 담당자 지정','\'2/2/2\' 테스트 케이스의 담당자로 지정되었습니다.',57,NULL,NULL,NULL,0,NULL,'medium','in_app','2025-12-08 15:49:31'),(6,1,'assignment','테스트 케이스 담당자 지정','\'테스트 케이스 1\' 테스트 케이스의 담당자로 지정되었습니다.',65,NULL,NULL,NULL,0,NULL,'medium','in_app','2025-12-08 15:49:47'),(7,1,'mention','멘션 알림','댓글에서 멘션되었습니다: @admin 댓글 멘션 테스트...',65,NULL,NULL,NULL,0,NULL,'medium','in_app','2025-12-08 16:25:42'),(8,1,'mention','멘션 알림','댓글에서 멘션되었습니다: @admin 댓글 멘션 테스트...',65,NULL,NULL,NULL,0,NULL,'medium','in_app','2025-12-08 16:25:42'),(9,1,'assignment','테스트 케이스 담당자 지정','\'로그인/페이지 진입/text 입력\' 테스트 케이스의 담당자로 지정되었습니다.',40,NULL,NULL,NULL,0,NULL,'medium','in_app','2025-12-09 13:10:27'),(10,1,'mention','멘션 알림','댓글에서 멘션되었습니다: @admin 댓글 slack webhook test...',65,NULL,NULL,NULL,0,NULL,'medium','in_app','2025-12-09 13:14:31'),(11,1,'mention','멘션 알림','댓글에서 멘션되었습니다: @admin slack webhook test...',66,NULL,NULL,NULL,0,NULL,'medium','in_app','2025-12-09 13:16:49'),(12,1,'mention','멘션 알림','댓글에서 멘션되었습니다: @admin test...',65,NULL,NULL,NULL,0,NULL,'medium','in_app','2025-12-09 13:23:53'),(13,1,'mention','JIRA 이슈 멘션 알림','JIRA 이슈 \'TEST-1\' 댓글에서 멘션되었습니다: @admin gg...',NULL,NULL,NULL,NULL,0,NULL,'medium','in_app','2025-12-10 13:48:44'),(14,3,'mention','JIRA 이슈 멘션 알림','JIRA 이슈 \'TEST-2\' 댓글에서 멘션되었습니다: @ggpark 담당자 할당 테스트...',NULL,NULL,NULL,NULL,0,NULL,'medium','in_app','2025-12-15 13:48:17'),(15,3,'assignment','테스트 케이스 담당자 지정','\'테스트 케이스 1\' 테스트 케이스의 담당자로 지정되었습니다.',65,NULL,NULL,NULL,0,NULL,'medium','in_app','2025-12-15 13:51:31'),(16,1,'test_status_changed','테스트 케이스 상태 변경: 테스트 케이스 1','테스트 케이스 \'테스트 케이스 1\'의 상태가 \'통과\'에서 \'실패\'로 변경되었습니다.\n변경자: admin',65,NULL,NULL,NULL,0,NULL,'high','all','2025-12-15 13:58:13'),(17,3,'test_status_changed','테스트 케이스 상태 변경: 테스트 케이스 1','테스트 케이스 \'테스트 케이스 1\'의 상태가 \'통과\'에서 \'실패\'로 변경되었습니다.\n변경자: admin',65,NULL,NULL,NULL,0,NULL,'high','all','2025-12-15 13:58:13'),(18,1,'test_status_changed','테스트 케이스 상태 변경: 테스트 케이스 2','테스트 케이스 \'테스트 케이스 2\'의 상태가 \'N/T\'에서 \'Pass\'로 변경되었습니다.\n변경자: admin',66,NULL,NULL,NULL,0,NULL,'medium','all','2025-12-15 14:04:03'),(19,3,'assignment','테스트 케이스 담당자 지정','\'테스트 케이스 2\' 테스트 케이스의 담당자로 지정되었습니다.',66,NULL,NULL,NULL,0,NULL,'medium','in_app','2025-12-15 14:04:21'),(20,1,'test_status_changed','테스트 케이스 상태 변경: 테스트 케이스 1','테스트 케이스 \'테스트 케이스 1\'의 상태가 \'Fail\'에서 \'Pass\'로 변경되었습니다.\n변경자: ggpark',65,NULL,NULL,NULL,0,NULL,'medium','all','2026-02-03 16:11:02'),(21,3,'test_status_changed','테스트 케이스 상태 변경: 테스트 케이스 1','테스트 케이스 \'테스트 케이스 1\'의 상태가 \'Fail\'에서 \'Pass\'로 변경되었습니다.\n변경자: ggpark',65,NULL,NULL,NULL,0,NULL,'medium','all','2026-02-03 16:11:02'),(22,3,'assignment','테스트 케이스 담당자 지정','\'2/2/2\' 테스트 케이스의 담당자로 지정되었습니다.',17,NULL,NULL,NULL,0,NULL,'medium','in_app','2026-02-05 10:33:33'),(23,3,'assignment','테스트 케이스 담당자 지정','\'2/2/2\' 테스트 케이스의 담당자로 지정되었습니다.',37,NULL,NULL,NULL,0,NULL,'medium','in_app','2026-02-11 09:34:47'),(24,3,'assignment','테스트 케이스 담당자 지정','\'2/2/2\' 테스트 케이스의 담당자로 지정되었습니다.',57,NULL,NULL,NULL,0,NULL,'medium','in_app','2026-02-11 09:35:15'),(25,3,'assignment','테스트 케이스 담당자 지정','\'로그인/페이지 진입/-\' 테스트 케이스의 담당자로 지정되었습니다.',38,NULL,NULL,NULL,0,NULL,'medium','in_app','2026-02-11 09:35:58'),(26,1,'test_status_changed','테스트 케이스 상태 변경: 2/2/2','테스트 케이스 \'2/2/2\'의 상태가 \'N/T\'에서 \'Pass\'로 변경되었습니다.\n변경자: ggpark',17,NULL,NULL,NULL,0,NULL,'medium','all','2026-02-11 09:36:18'),(27,3,'test_status_changed','테스트 케이스 상태 변경: 2/2/2','테스트 케이스 \'2/2/2\'의 상태가 \'N/T\'에서 \'Pass\'로 변경되었습니다.\n변경자: ggpark',17,NULL,NULL,NULL,0,NULL,'medium','all','2026-02-11 09:36:19');
/*!40000 ALTER TABLE `Notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `NotificationSettings`
--

DROP TABLE IF EXISTS `NotificationSettings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `NotificationSettings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `settings` text,
  `email_enabled` tinyint(1) DEFAULT NULL,
  `slack_enabled` tinyint(1) DEFAULT NULL,
  `in_app_enabled` tinyint(1) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `slack_webhook_url` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `notificationsettings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `NotificationSettings`
--

LOCK TABLES `NotificationSettings` WRITE;
/*!40000 ALTER TABLE `NotificationSettings` DISABLE KEYS */;
INSERT INTO `NotificationSettings` VALUES (1,3,'{\"mention\": {\"in_app\": true, \"email\": false, \"slack\": true}, \"assignment\": {\"in_app\": true, \"email\": false, \"slack\": true}, \"test_status_changed\": {\"in_app\": true, \"email\": false, \"slack\": false}}',0,1,1,'2026-02-11 14:47:55','https://hooks.slack.com/services/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');
/*!40000 ALTER TABLE `NotificationSettings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `PerformanceTestResults`
--

DROP TABLE IF EXISTS `PerformanceTestResults`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `PerformanceTestResults` (
  `id` int NOT NULL AUTO_INCREMENT,
  `test_id` int DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `execution_time` float DEFAULT NULL,
  `result_data` text,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `test_id` (`test_id`),
  CONSTRAINT `performancetestresults_ibfk_1` FOREIGN KEY (`test_id`) REFERENCES `PerformanceTests` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `PerformanceTestResults`
--

LOCK TABLES `PerformanceTestResults` WRITE;
/*!40000 ALTER TABLE `PerformanceTestResults` DISABLE KEYS */;
/*!40000 ALTER TABLE `PerformanceTestResults` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `PerformanceTests`
--

DROP TABLE IF EXISTS `PerformanceTests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `PerformanceTests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `description` text,
  `script_path` varchar(500) DEFAULT NULL,
  `environment` varchar(100) DEFAULT NULL,
  `parameters` text,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `creator_id` int DEFAULT NULL,
  `test_type` varchar(50) DEFAULT 'load',
  `project_id` int DEFAULT NULL,
  `assignee_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_performance_tests_creator` (`creator_id`),
  KEY `fk_performancetests_project` (`project_id`),
  KEY `idx_performancetests_assignee_id` (`assignee_id`),
  CONSTRAINT `fk_performancetests_assignee` FOREIGN KEY (`assignee_id`) REFERENCES `Users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `PerformanceTests`
--

LOCK TABLES `PerformanceTests` WRITE;
/*!40000 ALTER TABLE `PerformanceTests` DISABLE KEYS */;
INSERT INTO `PerformanceTests` VALUES (1,'CLM 계약서 생성 테스트','LFBZ CLM 시스템 계약서 생성 성능 테스트','clm_draft.js','prod','\"{\\\"DRAFT_TYPE\\\": \\\"new\\\", \\\"SECURITY_TYPE\\\": \\\"all\\\", \\\"REVIEW_TYPE\\\": \\\"use\\\"}\"','2025-08-03 11:23:03','2025-12-30 10:21:09',NULL,'load',NULL,NULL),(2,'CLM 계약서 생성 테스트','Description: LFBZ CLM 시스템 계약서 생성 성능 테스트','clm_draft.js','prod','{}','2025-08-03 14:28:33','2025-12-30 10:21:09',NULL,'load',NULL,NULL),(3,'로그인 테스트','LFBZ 로그인 테스트',NULL,'dev','{}','2025-08-13 06:01:14','2025-12-30 10:21:09',NULL,'load',NULL,NULL);
/*!40000 ALTER TABLE `PerformanceTests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES (2,'블루개러지','','2025-12-30 10:13:39','2025-12-30 10:13:39'),(3,'다이닝브랜즈그룹','','2025-12-30 10:21:40','2025-12-30 10:21:40'),(4,'대주산업','','2025-12-30 10:21:48','2025-12-30 10:21:48'),(5,'이닛엔터','','2025-12-30 10:21:56','2025-12-30 10:21:56'),(6,'KMR','','2025-12-30 10:22:03','2025-12-30 10:22:03'),(7,'하림','','2025-12-30 10:22:11','2025-12-30 10:22:11'),(8,'데이원','','2025-12-30 10:22:16','2025-12-30 10:22:16'),(9,'메가스터디','','2025-12-30 10:22:21','2025-12-30 10:22:21'),(10,'IGAW','','2025-12-30 10:22:28','2025-12-30 10:22:28'),(11,'삼성전자','','2025-12-30 10:22:37','2025-12-30 10:22:37');
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ReportExecutions`
--

DROP TABLE IF EXISTS `ReportExecutions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ReportExecutions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `report_id` int NOT NULL,
  `status` varchar(20) DEFAULT NULL,
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `result_file_path` varchar(500) DEFAULT NULL,
  `execution_params` text,
  `error_message` text,
  `executed_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `report_id` (`report_id`),
  KEY `executed_by` (`executed_by`),
  CONSTRAINT `reportexecutions_ibfk_1` FOREIGN KEY (`report_id`) REFERENCES `CustomReports` (`id`),
  CONSTRAINT `reportexecutions_ibfk_2` FOREIGN KEY (`executed_by`) REFERENCES `Users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ReportExecutions`
--

LOCK TABLES `ReportExecutions` WRITE;
/*!40000 ALTER TABLE `ReportExecutions` DISABLE KEYS */;
/*!40000 ALTER TABLE `ReportExecutions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Screenshots`
--

DROP TABLE IF EXISTS `Screenshots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Screenshots` (
  `id` int NOT NULL AUTO_INCREMENT,
  `test_result_id` int DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `test_result_id` (`test_result_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Screenshots`
--

LOCK TABLES `Screenshots` WRITE;
/*!40000 ALTER TABLE `Screenshots` DISABLE KEYS */;
/*!40000 ALTER TABLE `Screenshots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `SystemConfig`
--

DROP TABLE IF EXISTS `SystemConfig`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SystemConfig` (
  `id` int NOT NULL AUTO_INCREMENT,
  `key` varchar(100) NOT NULL,
  `value` text,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SystemConfig`
--

LOCK TABLES `SystemConfig` WRITE;
/*!40000 ALTER TABLE `SystemConfig` DISABLE KEYS */;
/*!40000 ALTER TABLE `SystemConfig` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `test_case_history`
--

DROP TABLE IF EXISTS `test_case_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_case_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `test_case_id` int NOT NULL,
  `field_name` varchar(100) NOT NULL,
  `old_value` text,
  `new_value` text,
  `changed_by` int NOT NULL,
  `changed_at` datetime NOT NULL,
  `change_type` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `test_case_id` (`test_case_id`),
  KEY `changed_by` (`changed_by`),
  CONSTRAINT `test_case_history_ibfk_1` FOREIGN KEY (`test_case_id`) REFERENCES `TestCases` (`id`),
  CONSTRAINT `test_case_history_ibfk_2` FOREIGN KEY (`changed_by`) REFERENCES `Users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `test_case_history`
--

LOCK TABLES `test_case_history` WRITE;
/*!40000 ALTER TABLE `test_case_history` DISABLE KEYS */;
INSERT INTO `test_case_history` VALUES (1,67,'name',NULL,'test - test - test',1,'2025-12-08 06:41:57','create'),(2,67,'main_category',NULL,'test',1,'2025-12-08 06:41:57','create'),(3,67,'sub_category',NULL,'test',1,'2025-12-08 06:41:57','create'),(4,67,'detail_category',NULL,'test',1,'2025-12-08 06:41:57','create'),(5,67,'pre_condition',NULL,'Test',1,'2025-12-08 06:41:57','create'),(6,67,'expected_result',NULL,'TEst',1,'2025-12-08 06:41:57','create'),(7,67,'result_status',NULL,'N/T',1,'2025-12-08 06:41:57','create'),(8,67,'remark',NULL,'test',1,'2025-12-08 06:41:57','create'),(9,67,'automation_code_type',NULL,'playwright',1,'2025-12-08 06:41:57','create'),(10,67,'assignee_id',NULL,'1',1,'2025-12-08 06:41:57','create');
/*!40000 ALTER TABLE `test_case_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `test_case_templates`
--

DROP TABLE IF EXISTS `test_case_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_case_templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `description` text,
  `main_category` varchar(100) DEFAULT NULL,
  `sub_category` varchar(100) DEFAULT NULL,
  `detail_category` varchar(100) DEFAULT NULL,
  `pre_condition` text,
  `expected_result` text,
  `test_steps` text,
  `automation_code_path` varchar(500) DEFAULT NULL,
  `automation_code_type` varchar(50) DEFAULT NULL,
  `tags` text,
  `created_by` int NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT NULL,
  `usage_count` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `test_case_templates_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `Users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `test_case_templates`
--

LOCK TABLES `test_case_templates` WRITE;
/*!40000 ALTER TABLE `test_case_templates` DISABLE KEYS */;
/*!40000 ALTER TABLE `test_case_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `test_plan_test_cases`
--

DROP TABLE IF EXISTS `test_plan_test_cases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_plan_test_cases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `test_plan_id` int NOT NULL,
  `test_case_id` int NOT NULL,
  `execution_order` int DEFAULT NULL,
  `estimated_duration` int DEFAULT NULL,
  `assigned_to` int DEFAULT NULL,
  `notes` text,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `test_plan_id` (`test_plan_id`),
  KEY `test_case_id` (`test_case_id`),
  KEY `assigned_to` (`assigned_to`),
  CONSTRAINT `test_plan_test_cases_ibfk_1` FOREIGN KEY (`test_plan_id`) REFERENCES `test_plans` (`id`),
  CONSTRAINT `test_plan_test_cases_ibfk_2` FOREIGN KEY (`test_case_id`) REFERENCES `TestCases` (`id`),
  CONSTRAINT `test_plan_test_cases_ibfk_3` FOREIGN KEY (`assigned_to`) REFERENCES `Users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `test_plan_test_cases`
--

LOCK TABLES `test_plan_test_cases` WRITE;
/*!40000 ALTER TABLE `test_plan_test_cases` DISABLE KEYS */;
/*!40000 ALTER TABLE `test_plan_test_cases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `test_plans`
--

DROP TABLE IF EXISTS `test_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_plans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `description` text,
  `version` varchar(50) DEFAULT NULL,
  `environment` varchar(50) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `priority` varchar(20) DEFAULT NULL,
  `created_by` int NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `test_plans_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `Users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `test_plans`
--

LOCK TABLES `test_plans` WRITE;
/*!40000 ALTER TABLE `test_plans` DISABLE KEYS */;
/*!40000 ALTER TABLE `test_plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `TestCaseDataMappings`
--

DROP TABLE IF EXISTS `TestCaseDataMappings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `TestCaseDataMappings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `test_case_id` int NOT NULL,
  `data_set_id` int NOT NULL,
  `field_mapping` text,
  `priority` int DEFAULT NULL,
  `enabled` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `test_case_id` (`test_case_id`),
  KEY `data_set_id` (`data_set_id`),
  CONSTRAINT `testcasedatamappings_ibfk_1` FOREIGN KEY (`test_case_id`) REFERENCES `TestCases` (`id`),
  CONSTRAINT `testcasedatamappings_ibfk_2` FOREIGN KEY (`data_set_id`) REFERENCES `TestDataSets` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `TestCaseDataMappings`
--

LOCK TABLES `TestCaseDataMappings` WRITE;
/*!40000 ALTER TABLE `TestCaseDataMappings` DISABLE KEYS */;
/*!40000 ALTER TABLE `TestCaseDataMappings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `TestCases`
--

DROP TABLE IF EXISTS `TestCases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `TestCases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `description` text,
  `test_type` varchar(50) DEFAULT NULL,
  `script_path` varchar(500) DEFAULT NULL,
  `folder_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `main_category` varchar(100) DEFAULT NULL,
  `sub_category` varchar(100) DEFAULT NULL,
  `detail_category` varchar(100) DEFAULT NULL,
  `pre_condition` text,
  `expected_result` text,
  `remark` text,
  `automation_code_path` varchar(500) DEFAULT NULL,
  `environment` varchar(50) DEFAULT NULL,
  `creator_id` int DEFAULT NULL,
  `priority` varchar(20) DEFAULT 'medium',
  `status` varchar(20) DEFAULT 'draft',
  `project_id` int DEFAULT NULL,
  `result_status` varchar(20) DEFAULT 'pending',
  `automation_code_type` varchar(50) DEFAULT NULL,
  `assignee_id` int DEFAULT NULL,
  `test_steps` text,
  PRIMARY KEY (`id`),
  KEY `folder_id` (`folder_id`),
  KEY `fk_test_cases_creator` (`creator_id`),
  KEY `fk_testcases_project` (`project_id`),
  KEY `idx_testcases_environment` (`environment`),
  KEY `idx_testcases_result_status` (`result_status`),
  KEY `idx_testcases_folder_id` (`folder_id`),
  KEY `idx_testcases_creator_id` (`creator_id`),
  KEY `idx_testcases_assignee_id` (`assignee_id`),
  CONSTRAINT `fk_testcases_assignee` FOREIGN KEY (`assignee_id`) REFERENCES `Users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=68 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `TestCases`
--

LOCK TABLES `TestCases` WRITE;
/*!40000 ALTER TABLE `TestCases` DISABLE KEYS */;
INSERT INTO `TestCases` VALUES (1,'CLM/Draft/기안 작성','로그인 완료','CLM 기안 작성 기능 테스트','test-scripts/clm/draft.js',7,'2025-08-03 11:23:01','2025-12-30 10:21:09','CLM','Draft','기안 작성','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/clm/draft.js','dev',1,'medium','draft',NULL,'Pass',NULL,NULL,NULL),(2,'CLM/Review/검토','기안 작성 완료','CLM 검토 기능 테스트','test-scripts/clm/review.js',8,'2025-08-03 11:23:01','2025-12-30 10:21:09','CLM','Review','검토','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/clm/review.js','alpha',1,'medium','draft',NULL,'Pass',NULL,2,NULL),(3,'CLM/Sign/전자서명','검토 완료','CLM 전자서명 기능 테스트','test-scripts/clm/sign.js',9,'2025-08-03 11:23:01','2025-12-30 10:21:09','CLM','Sign','전자서명','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/clm/sign.js','production',1,'medium','draft',NULL,'Pass',NULL,NULL,NULL),(4,'CLM/Financial/재무 검토','ALPHA 환경 접속','CLM 재무 검토 기능 테스트','test-scripts/performance/login/simple_test.js',7,'2025-08-03 11:23:01','2025-12-30 10:21:09','CLM','Financial','재무 검토','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/performance/login/simple_test.js','dev',1,'medium','draft',NULL,'Pass',NULL,NULL,NULL),(5,'CLM/Legal/법무 검토','ALPHA 환경 접속','CLM 법무 검토 기능 테스트','test-scripts/clm/legal.js',7,'2025-08-03 11:23:01','2025-12-30 10:21:09','CLM','Legal','법무 검토','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/clm/legal.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(6,'CLM/Final/최종 승인','PRODUCTION 환경 접속','CLM 최종 승인 기능 테스트','test-scripts/clm/final.js',7,'2025-08-03 11:23:01','2025-12-30 10:21:09','CLM','Final','최종 승인','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/clm/final.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(7,'CLM/Seal/도장 찍기','PRODUCTION 환경 접속','CLM 도장 찍기 기능 테스트','test-scripts/clm/seal.js',7,'2025-08-03 11:23:01','2025-12-30 10:21:09','CLM','Seal','도장 찍기','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/clm/seal.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(8,'CLM/Draft/기안 작성','로그인 완료','CLM 기안 작성 기능 테스트','test-scripts/performance/clm/nomerl/clm_draft.js',7,'2025-08-03 13:22:05','2025-12-30 10:21:09','CLM','Draft','기안 작성','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/performance/clm/nomerl/clm_draft.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(9,'CLM/Review/검토','기안 작성 완료','CLM 검토 기능 테스트','test-scripts/clm/review.js',8,'2025-08-03 13:22:05','2025-12-30 10:21:09','CLM','Review','검토','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/clm/review.js','alpha',1,'medium','draft',NULL,'Fail',NULL,NULL,NULL),(11,'CLM/Financial/재무 검토','ALPHA 환경 접속','CLM 재무 검토 기능 테스트','test-scripts/clm/financial.js',7,'2025-08-03 13:22:05','2025-12-30 10:21:09','CLM','Financial','재무 검토','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/clm/financial.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(12,'CLM/Legal/법무 검토','ALPHA 환경 접속','CLM 법무 검토 기능 테스트','test-scripts/clm/legal.js',7,'2025-08-03 13:22:05','2025-12-30 10:21:09','CLM','Legal','법무 검토','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/clm/legal.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(13,'CLM/Final/최종 승인','PRODUCTION 환경 접속','CLM 최종 승인 기능 테스트','test-scripts/clm/final.js',7,'2025-08-03 13:22:05','2025-12-30 10:21:09','CLM','Final','최종 승인','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/clm/final.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(14,'CLM/Seal/도장 찍기','PRODUCTION 환경 접속','CLM 도장 찍기 기능 테스트','test-scripts/clm/seal.js',7,'2025-08-03 13:22:05','2025-12-30 10:21:09','CLM','Seal','도장 찍기','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/clm/seal.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(17,'2/2/2','2','2','test-scripts/playwright/sample-login.spec.js',4,'2025-08-05 04:43:40','2026-02-11 09:36:18','2','2','2','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/playwright/sample-login.spec.js','dev',1,'medium','draft',NULL,'Pass',NULL,3,NULL),(18,'CLM 시스템/기안 작성/기본 기안 작성','사용자가 로그인되어 있음','기안이 성공적으로 작성됨','test-scripts/playwright/clm_draft.js',7,'2025-08-05 05:38:09','2025-12-30 10:21:09','CLM 시스템','기안 작성','기본 기안 작성','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/playwright/clm_draft.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(19,'CLM 시스템/검토/법무 검토','기안이 작성되어 있음','법무 검토가 완료됨','test-scripts/playwright/clm_lagel.js',7,'2025-08-05 05:38:09','2025-12-30 10:21:09','CLM 시스템','검토','법무 검토','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/playwright/clm_lagel.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(20,'CLM 시스템/재무 검토/재무 검토','기안이 작성되어 있음','재무 검토가 완료됨','test-scripts/playwright/clm_financial.js',7,'2025-08-05 05:38:09','2025-12-30 10:21:09','CLM 시스템','재무 검토','재무 검토','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/playwright/clm_financial.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(21,'CLM 시스템/기안 작성/기본 기안 작성','사용자가 로그인되어 있음','기안이 성공적으로 작성됨','test-scripts/playwright/clm_draft.js',7,'2025-08-05 05:43:37','2025-12-30 10:21:09','CLM 시스템','기안 작성','기본 기안 작성','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/playwright/clm_draft.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(22,'CLM 시스템/검토/법무 검토','기안이 작성되어 있음','법무 검토가 완료됨','test-scripts/playwright/clm_lagel.js',7,'2025-08-05 05:43:37','2025-12-30 10:21:09','CLM 시스템','검토','법무 검토','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/playwright/clm_lagel.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(23,'CLM 시스템/재무 검토/재무 검토','기안이 작성되어 있음','재무 검토가 완료됨','test-scripts/playwright/clm_financial.js',7,'2025-08-05 05:43:37','2025-12-30 10:21:09','CLM 시스템','재무 검토','재무 검토','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/playwright/clm_financial.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(24,'CLM/Review/검토','기안 작성 완료','CLM 검토 기능 테스트','test-scripts/clm/review.js',8,'2025-08-05 05:46:35','2025-12-30 10:21:09','CLM','Review','검토','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/clm/review.js','alpha',1,'medium','draft',NULL,'N/A',NULL,NULL,NULL),(25,'CLM/Draft/기안 작성','로그인 완료','CLM 기안 작성 기능 테스트','test-scripts/performance/clm/nomerl/clm_draft.js',7,'2025-08-05 05:46:35','2025-12-30 10:21:09','CLM','Draft','기안 작성','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/performance/clm/nomerl/clm_draft.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(26,'CLM/Financial/재무 검토','ALPHA 환경 접속','CLM 재무 검토 기능 테스트','test-scripts/performance/login/simple_test.js',7,'2025-08-05 05:46:35','2025-12-30 10:21:09','CLM','Financial','재무 검토','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/performance/login/simple_test.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(27,'CLM/Draft/기안 작성','로그인 완료','CLM 기안 작성 기능 테스트','test-scripts/clm/draft.js',7,'2025-08-05 05:46:35','2025-12-30 10:21:09','CLM','Draft','기안 작성','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/clm/draft.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(28,'CLM/Sign/전자서명','검토 완료','CLM 전자서명 기능 테스트','test-scripts/clm/sign.js',9,'2025-08-05 05:46:35','2025-12-30 10:21:09','CLM','Sign','전자서명','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/clm/sign.js','production',1,'medium','draft',NULL,'Fail',NULL,NULL,NULL),(29,'CLM/Review/검토','기안 작성 완료','CLM 검토 기능 테스트','test-scripts/clm/review.js',8,'2025-08-05 05:46:35','2025-12-30 10:21:09','CLM','Review','검토','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/clm/review.js','alpha',1,'medium','draft',NULL,'Block',NULL,NULL,NULL),(30,'CLM/Legal/법무 검토','ALPHA 환경 접속','CLM 법무 검토 기능 테스트','test-scripts/clm/legal.js',7,'2025-08-05 05:46:35','2025-12-30 10:21:09','CLM','Legal','법무 검토','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/clm/legal.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(31,'CLM/Final/최종 승인','PRODUCTION 환경 접속','CLM 최종 승인 기능 테스트','test-scripts/clm/final.js',7,'2025-08-05 05:46:35','2025-12-30 10:21:09','CLM','Final','최종 승인','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/clm/final.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(32,'CLM/Seal/도장 찍기','PRODUCTION 환경 접속','CLM 도장 찍기 기능 테스트','test-scripts/clm/seal.js',7,'2025-08-05 05:46:35','2025-12-30 10:21:09','CLM','Seal','도장 찍기','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/clm/seal.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(33,'CLM/Financial/재무 검토','ALPHA 환경 접속','CLM 재무 검토 기능 테스트','test-scripts/clm/financial.js',7,'2025-08-05 05:46:35','2025-12-30 10:21:09','CLM','Financial','재무 검토','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/clm/financial.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(34,'CLM/Legal/법무 검토','ALPHA 환경 접속','CLM 법무 검토 기능 테스트','test-scripts/clm/legal.js',7,'2025-08-05 05:46:35','2025-12-30 10:21:09','CLM','Legal','법무 검토','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/clm/legal.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(35,'CLM/Seal/도장 찍기','PRODUCTION 환경 접속','CLM 도장 찍기 기능 테스트','test-scripts/clm/seal.js',7,'2025-08-05 05:46:35','2025-12-30 10:21:09','CLM','Seal','도장 찍기','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/clm/seal.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(36,'CLM/Final/최종 승인','PRODUCTION 환경 접속','CLM 최종 승인 기능 테스트','test-scripts/clm/final.js',7,'2025-08-05 05:46:35','2025-12-30 10:21:09','CLM','Final','최종 승인','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/clm/final.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(37,'2/2/2','2','2','test-scripts/playwright/sample-login.spec.js',4,'2025-08-05 05:46:35','2026-02-11 09:34:47','2','2','2','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/playwright/sample-login.spec.js','dev',1,'medium','draft',NULL,'N/T',NULL,3,NULL),(38,'로그인/페이지 진입/-','-','로그인 페이지 진입이 가능한지 확인','test-scripts/playwright/sample-login.spec.js',4,'2025-08-05 05:46:35','2026-02-11 09:35:58','로그인','페이지 진입','-','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/playwright/sample-login.spec.js','dev',1,'medium','draft',NULL,'N/T',NULL,3,NULL),(39,'로그인/페이지 진입/text 입력','-','이메일 입력이 가능한지 확인','test-scripts/playwright/sample-login.spec.js',4,'2025-08-05 05:46:35','2025-12-30 10:21:09','로그인','페이지 진입','text 입력','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/playwright/sample-login.spec.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(40,'로그인/페이지 진입/text 입력','-','Password 입력이 가능한지 확인','test-scripts/playwright/sample-login.spec.js',4,'2025-08-05 05:46:35','2025-12-30 10:21:09','로그인','페이지 진입','text 입력','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/playwright/sample-login.spec.js','dev',1,'medium','draft',NULL,'N/T',NULL,1,NULL),(41,'로그인/페이지 진입/btn 동작','-','[로그인] 버튼 클릭이 가능한지 확인','test-scripts/playwright/sample-login.spec.js',4,'2025-08-05 05:46:35','2025-12-30 10:21:09','로그인','페이지 진입','btn 동작','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/playwright/sample-login.spec.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(42,'로그인/페이지 진입/정상 값 입력','-','로그인이 진행되는 지 확인','test-scripts/playwright/sample-login.spec.js',4,'2025-08-05 05:46:35','2025-12-30 10:21:09','로그인','페이지 진입','정상 값 입력','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/playwright/sample-login.spec.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(43,'로그인/페이지 진입/비정상 값 입력','-','로그인이 실패하는 지 확인','test-scripts/playwright/sample-login.spec.js',4,'2025-08-05 05:46:35','2025-12-30 10:21:09','로그인','페이지 진입','비정상 값 입력','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/playwright/sample-login.spec.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(44,'CLM/Review/검토','기안 작성 완료','CLM 검토 기능 테스트','test-scripts/clm/review.js',8,'2025-08-05 05:47:06','2025-12-30 10:21:09','CLM','Review','검토','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/clm/review.js','alpha',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(45,'CLM/Draft/기안 작성','로그인 완료','CLM 기안 작성 기능 테스트','test-scripts/performance/clm/nomerl/clm_draft.js',7,'2025-08-05 05:47:06','2025-12-30 10:21:09','CLM','Draft','기안 작성','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/performance/clm/nomerl/clm_draft.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(46,'CLM/Financial/재무 검토','ALPHA 환경 접속','CLM 재무 검토 기능 테스트','test-scripts/performance/login/simple_test.js',7,'2025-08-05 05:47:06','2025-12-30 10:21:09','CLM','Financial','재무 검토','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/performance/login/simple_test.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(47,'CLM/Draft/기안 작성','로그인 완료','CLM 기안 작성 기능 테스트','test-scripts/clm/draft.js',7,'2025-08-05 05:47:06','2025-12-30 10:21:09','CLM','Draft','기안 작성','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/clm/draft.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(48,'CLM/Sign/전자서명','검토 완료','CLM 전자서명 기능 테스트','test-scripts/clm/sign.js',9,'2025-08-05 05:47:06','2025-12-30 10:21:09','CLM','Sign','전자서명','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/clm/sign.js','production',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(49,'CLM/Review/검토','기안 작성 완료','CLM 검토 기능 테스트','test-scripts/clm/review.js',8,'2025-08-05 05:47:06','2025-12-30 10:21:09','CLM','Review','검토','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/clm/review.js','alpha',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(50,'CLM/Legal/법무 검토','ALPHA 환경 접속','CLM 법무 검토 기능 테스트','test-scripts/clm/legal.js',7,'2025-08-05 05:47:06','2025-12-30 10:21:09','CLM','Legal','법무 검토','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/clm/legal.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(51,'CLM/Final/최종 승인','PRODUCTION 환경 접속','CLM 최종 승인 기능 테스트','test-scripts/clm/final.js',7,'2025-08-05 05:47:06','2025-12-30 10:21:09','CLM','Final','최종 승인','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/clm/final.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(52,'CLM/Seal/도장 찍기','PRODUCTION 환경 접속','CLM 도장 찍기 기능 테스트','test-scripts/clm/seal.js',7,'2025-08-05 05:47:06','2025-12-30 10:21:09','CLM','Seal','도장 찍기','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/clm/seal.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(53,'CLM/Financial/재무 검토','ALPHA 환경 접속','CLM 재무 검토 기능 테스트','test-scripts/clm/financial.js',7,'2025-08-05 05:47:06','2025-12-30 10:21:09','CLM','Financial','재무 검토','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/clm/financial.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(54,'CLM/Legal/법무 검토','ALPHA 환경 접속','CLM 법무 검토 기능 테스트','test-scripts/clm/legal.js',7,'2025-08-05 05:47:06','2025-12-30 10:21:09','CLM','Legal','법무 검토','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/clm/legal.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(55,'CLM/Seal/도장 찍기','PRODUCTION 환경 접속','CLM 도장 찍기 기능 테스트','test-scripts/clm/seal.js',7,'2025-08-05 05:47:06','2025-12-30 10:21:09','CLM','Seal','도장 찍기','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/clm/seal.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(56,'CLM/Final/최종 승인','PRODUCTION 환경 접속','CLM 최종 승인 기능 테스트','test-scripts/clm/final.js',7,'2025-08-05 05:47:06','2025-12-30 10:21:09','CLM','Final','최종 승인','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/clm/final.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(57,'2/2/2','2','2','test-scripts/playwright/sample-login.spec.js',4,'2025-08-05 05:47:06','2026-02-11 09:35:15','2','2','2','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/playwright/sample-login.spec.js','dev',1,'medium','draft',NULL,'N/T',NULL,3,NULL),(58,'로그인/페이지 진입/-','-','로그인 페이지 진입이 가능한지 확인','test-scripts/playwright/sample-login.spec.js',4,'2025-08-05 05:47:06','2025-12-30 10:21:09','로그인','페이지 진입','-','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/playwright/sample-login.spec.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(59,'로그인/페이지 진입/text 입력','-','이메일 입력이 가능한지 확인','test-scripts/playwright/sample-login.spec.js',4,'2025-08-05 05:47:06','2025-12-30 10:21:09','로그인','페이지 진입','text 입력','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/playwright/sample-login.spec.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(60,'로그인/페이지 진입/text 입력','-','Password 입력이 가능한지 확인','test-scripts/playwright/sample-login.spec.js',4,'2025-08-05 05:47:06','2025-12-30 10:21:09','로그인','페이지 진입','text 입력','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/playwright/sample-login.spec.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(61,'로그인/페이지 진입/btn 동작','-','[로그인] 버튼 클릭이 가능한지 확인','test-scripts/playwright/sample-login.spec.js',4,'2025-08-05 05:47:06','2025-12-30 10:21:09','로그인','페이지 진입','btn 동작','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/playwright/sample-login.spec.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(62,'로그인/페이지 진입/정상 값 입력','-','로그인이 진행되는 지 확인','test-scripts/playwright/sample-login.spec.js',4,'2025-08-05 05:47:06','2025-12-30 10:21:09','로그인','페이지 진입','정상 값 입력','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/playwright/sample-login.spec.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(63,'로그인/페이지 진입/비정상 값 입력','-','로그인이 실패하는 지 확인','test-scripts/playwright/sample-login.spec.js',4,'2025-08-05 05:47:06','2025-12-30 10:21:09','로그인','페이지 진입','비정상 값 입력','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','test-scripts/playwright/sample-login.spec.js','dev',1,'medium','draft',NULL,'N/T',NULL,NULL,NULL),(64,'기능 테스트/UI 테스트/버튼 클릭','로그인 상태','버튼 클릭 후 페이지 이동','',4,'2025-08-05 05:55:02','2025-12-30 10:21:09','기능 테스트','UI 테스트','버튼 클릭','테스트 실행을 위한 사전 조건','테스트가 성공적으로 완료되어야 함','자동화 테스트 가능','','dev',1,'medium','draft',NULL,'N/T',NULL,1,NULL),(65,'테스트 케이스 1','첫 번째 테스트 케이스입니다.','functional',NULL,4,'2025-08-14 09:24:46','2026-02-03 16:11:02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'dev',1,'high','active',NULL,'Pass',NULL,3,NULL),(66,'테스트 케이스 2','두 번째 테스트 케이스입니다.','performance',NULL,4,'2025-08-14 09:24:46','2025-12-30 10:21:09',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'dev',1,'medium','draft',NULL,'Pass',NULL,3,NULL),(67,'test - test - test',NULL,NULL,NULL,4,'2025-12-08 15:41:57','2025-12-30 10:21:09','test','test','test','Test','TEst','test','','dev',1,NULL,'draft',NULL,'N/T','playwright',1,NULL);
/*!40000 ALTER TABLE `TestCases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `TestDataSets`
--

DROP TABLE IF EXISTS `TestDataSets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `TestDataSets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `description` text,
  `data` text NOT NULL,
  `data_type` varchar(50) DEFAULT NULL,
  `data_schema` text,
  `environment` varchar(50) DEFAULT NULL,
  `version` varchar(50) DEFAULT NULL,
  `parent_version_id` int DEFAULT NULL,
  `masking_enabled` tinyint(1) DEFAULT NULL,
  `masking_rules` text,
  `tags` text,
  `usage_count` int DEFAULT NULL,
  `last_used_at` datetime DEFAULT NULL,
  `created_by` int NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `parent_version_id` (`parent_version_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `testdatasets_ibfk_1` FOREIGN KEY (`parent_version_id`) REFERENCES `TestDataSets` (`id`),
  CONSTRAINT `testdatasets_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `Users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `TestDataSets`
--

LOCK TABLES `TestDataSets` WRITE;
/*!40000 ALTER TABLE `TestDataSets` DISABLE KEYS */;
/*!40000 ALTER TABLE `TestDataSets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `TestDependencies`
--

DROP TABLE IF EXISTS `TestDependencies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `TestDependencies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `test_case_id` int NOT NULL,
  `depends_on_test_case_id` int NOT NULL,
  `dependency_type` varchar(50) DEFAULT NULL,
  `condition` text,
  `priority` int DEFAULT NULL,
  `enabled` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `test_case_id` (`test_case_id`),
  KEY `depends_on_test_case_id` (`depends_on_test_case_id`),
  CONSTRAINT `testdependencies_ibfk_1` FOREIGN KEY (`test_case_id`) REFERENCES `TestCases` (`id`),
  CONSTRAINT `testdependencies_ibfk_2` FOREIGN KEY (`depends_on_test_case_id`) REFERENCES `TestCases` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `TestDependencies`
--

LOCK TABLES `TestDependencies` WRITE;
/*!40000 ALTER TABLE `TestDependencies` DISABLE KEYS */;
/*!40000 ALTER TABLE `TestDependencies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `TestExecutions`
--

DROP TABLE IF EXISTS `TestExecutions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `TestExecutions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `test_case_id` int DEFAULT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `execution_time` float DEFAULT NULL,
  `result_data` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `test_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `automation_test_id` int DEFAULT NULL,
  `performance_test_id` int DEFAULT NULL,
  `environment` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `executed_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `started_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT NULL,
  `result_summary` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `test_case_id` (`test_case_id`),
  KEY `fk_execution_automation_test` (`automation_test_id`),
  KEY `fk_execution_performance_test` (`performance_test_id`),
  CONSTRAINT `fk_execution_automation_test` FOREIGN KEY (`automation_test_id`) REFERENCES `AutomationTests` (`id`),
  CONSTRAINT `fk_execution_performance_test` FOREIGN KEY (`performance_test_id`) REFERENCES `PerformanceTests` (`id`),
  CONSTRAINT `testexecutions_ibfk_1` FOREIGN KEY (`test_case_id`) REFERENCES `TestCases` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `TestExecutions`
--

LOCK TABLES `TestExecutions` WRITE;
/*!40000 ALTER TABLE `TestExecutions` DISABLE KEYS */;
INSERT INTO `TestExecutions` VALUES (1,NULL,'Error',NULL,NULL,'2025-08-13 15:04:23','performance',NULL,1,NULL,NULL,'2025-08-13 06:04:24',NULL,'{\"status\": \"Error\", \"error\": \"\\uc2a4\\ud06c\\ub9bd\\ud2b8 \\ud30c\\uc77c\\uc744 \\ucc3e\\uc744 \\uc218 \\uc5c6\\uc2b5\\ub2c8\\ub2e4: /Users/ggpark/Desktop/Team_Git/integrated-test-platform/backend/engines/../../clm_draft.js\"}'),(2,NULL,'Error',NULL,NULL,'2025-08-13 15:04:41','performance',NULL,3,NULL,NULL,'2025-08-13 06:04:42',NULL,'{\"status\": \"Error\", \"error\": \"expected str, bytes or os.PathLike object, not NoneType\"}'),(3,NULL,'Error',NULL,NULL,'2025-08-13 15:04:42','performance',NULL,3,NULL,NULL,'2025-08-13 06:04:43',NULL,'{\"status\": \"Error\", \"error\": \"expected str, bytes or os.PathLike object, not NoneType\"}'),(4,NULL,'Error',NULL,NULL,'2025-08-13 15:05:01','performance',NULL,3,NULL,NULL,'2025-08-13 06:05:02',NULL,'{\"status\": \"Error\", \"error\": \"expected str, bytes or os.PathLike object, not NoneType\"}'),(5,NULL,'Error',NULL,NULL,'2025-08-19 14:49:34','performance',NULL,1,NULL,NULL,'2025-08-19 05:49:35',NULL,'{\"status\": \"Error\", \"error\": \"\\uc2a4\\ud06c\\ub9bd\\ud2b8 \\ud30c\\uc77c\\uc744 \\ucc3e\\uc744 \\uc218 \\uc5c6\\uc2b5\\ub2c8\\ub2e4: /Users/ggpark/Desktop/Team_Git/integrated-test-platform/backend/engines/../../clm_draft.js\"}'),(6,NULL,'Error',NULL,NULL,'2025-08-19 14:53:36','performance',NULL,1,NULL,NULL,'2025-08-19 05:53:36',NULL,'{\"status\": \"Error\", \"error\": \"\\uc2a4\\ud06c\\ub9bd\\ud2b8 \\ud30c\\uc77c\\uc744 \\ucc3e\\uc744 \\uc218 \\uc5c6\\uc2b5\\ub2c8\\ub2e4: /Users/ggpark/Desktop/Team_Git/integrated-test-platform/backend/engines/../../clm_draft.js\"}'),(7,NULL,'Error',NULL,NULL,'2025-08-19 14:56:51','performance',NULL,1,NULL,NULL,'2025-08-19 05:56:51',NULL,'{\"status\": \"Error\", \"error\": \"\\uc2a4\\ud06c\\ub9bd\\ud2b8 \\ud30c\\uc77c\\uc744 \\ucc3e\\uc744 \\uc218 \\uc5c6\\uc2b5\\ub2c8\\ub2e4: /Users/ggpark/Desktop/Team_Git/integrated-test-platform/backend/engines/../../clm_draft.js\"}'),(8,NULL,'Error',NULL,NULL,'2025-08-19 15:04:00','performance',NULL,1,NULL,NULL,'2025-08-19 06:04:00',NULL,'{\"status\": \"Error\", \"error\": \"\\uc2a4\\ud06c\\ub9bd\\ud2b8 \\ud30c\\uc77c\\uc744 \\ucc3e\\uc744 \\uc218 \\uc5c6\\uc2b5\\ub2c8\\ub2e4: /Users/ggpark/Desktop/Team_Git/integrated-test-platform/backend/engines/../../clm_draft.js\"}');
/*!40000 ALTER TABLE `TestExecutions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `TestResults`
--

DROP TABLE IF EXISTS `TestResults`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `TestResults` (
  `id` int NOT NULL AUTO_INCREMENT,
  `test_case_id` int DEFAULT NULL,
  `result` varchar(20) DEFAULT NULL,
  `execution_time` float DEFAULT NULL,
  `environment` varchar(50) DEFAULT NULL,
  `executed_by` varchar(100) DEFAULT NULL,
  `executed_at` datetime DEFAULT NULL,
  `notes` text,
  `automation_test_id` int DEFAULT NULL,
  `performance_test_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `test_case_id` (`test_case_id`),
  KEY `fk_automation_test` (`automation_test_id`),
  KEY `fk_performance_test` (`performance_test_id`),
  KEY `idx_testresults_executed_at` (`executed_at`),
  KEY `idx_testresults_environment` (`environment`),
  KEY `idx_testresults_result` (`result`),
  CONSTRAINT `fk_automation_test` FOREIGN KEY (`automation_test_id`) REFERENCES `AutomationTests` (`id`),
  CONSTRAINT `fk_performance_test` FOREIGN KEY (`performance_test_id`) REFERENCES `PerformanceTests` (`id`),
  CONSTRAINT `testresults_ibfk_1` FOREIGN KEY (`test_case_id`) REFERENCES `TestCases` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `TestResults`
--

LOCK TABLES `TestResults` WRITE;
/*!40000 ALTER TABLE `TestResults` DISABLE KEYS */;
INSERT INTO `TestResults` VALUES (1,NULL,'Pass',2.00188,'dev','system','2025-08-13 05:51:50','테스트 \'로그인\' 실행 완료',1,NULL),(2,NULL,'Pass',2.00095,'dev','system','2025-08-13 05:52:34','테스트 \'로그인\' 실행 완료',1,NULL);
/*!40000 ALTER TABLE `TestResults` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `TestSchedules`
--

DROP TABLE IF EXISTS `TestSchedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `TestSchedules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `test_case_id` int NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text,
  `schedule_type` varchar(50) NOT NULL,
  `schedule_expression` varchar(200) DEFAULT NULL,
  `enabled` tinyint(1) DEFAULT NULL,
  `active` tinyint(1) DEFAULT NULL,
  `next_run_at` datetime DEFAULT NULL,
  `last_run_at` datetime DEFAULT NULL,
  `last_run_status` varchar(20) DEFAULT NULL,
  `last_run_result_id` int DEFAULT NULL,
  `environment` varchar(50) DEFAULT NULL,
  `execution_parameters` text,
  `created_by` int NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `test_case_id` (`test_case_id`),
  KEY `last_run_result_id` (`last_run_result_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `testschedules_ibfk_1` FOREIGN KEY (`test_case_id`) REFERENCES `TestCases` (`id`),
  CONSTRAINT `testschedules_ibfk_2` FOREIGN KEY (`last_run_result_id`) REFERENCES `TestResults` (`id`),
  CONSTRAINT `testschedules_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `Users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `TestSchedules`
--

LOCK TABLES `TestSchedules` WRITE;
/*!40000 ALTER TABLE `TestSchedules` DISABLE KEYS */;
/*!40000 ALTER TABLE `TestSchedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Users`
--

DROP TABLE IF EXISTS `Users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(80) NOT NULL,
  `email` varchar(120) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `role` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Users`
--

LOCK TABLES `Users` WRITE;
/*!40000 ALTER TABLE `Users` DISABLE KEYS */;
INSERT INTO `Users` VALUES (1,'admin','admin@example.com','scrypt:32768:8:1$pIBrF9FxYTQ4dgFU$f7d8451d2365fc33302c2482aceeb13141f9e543398311ec8dc7b99ead7b9910248a21eb56962f270ea00132b5fa4bfac9e890509d63bc1dc188aaba5a7e262e','Admin','User','admin',1,'2025-12-18 11:47:24','2025-08-14 02:45:41','2025-12-18 11:47:24'),(2,'testuser','test@example.com','scrypt:32768:8:1$ng66OPMcYZ3eolJ6$93380805687414a0e0fb4ddba65b10642f9cc472943b004df8cf1c018039348064bca9eeccb60f0cfc4a39ea2cb2957d588face494c82fd585cc5f52e09b4297','Test','User','user',1,NULL,'2025-08-14 02:45:42','2025-08-14 02:45:42'),(3,'ggpark','ggpark@amicuslex.net','scrypt:32768:8:1$EOI950VsCA1wH4Eg$b61dc258a368502accc0a2c59407a34dff71a2a01da7d16032697027edad972c95d87a4f3a3b3819dfb71f76434363860612d3523cc1961198fe365c0eca0f09','경공','박','admin',1,'2026-02-19 14:01:05','2025-12-15 13:46:03','2026-02-19 14:01:05');
/*!40000 ALTER TABLE `Users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `UserSessions`
--

DROP TABLE IF EXISTS `UserSessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserSessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `session_token` varchar(255) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `is_active` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_token` (`session_token`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `UserSessions`
--

LOCK TABLES `UserSessions` WRITE;
/*!40000 ALTER TABLE `UserSessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `UserSessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Workflows`
--

DROP TABLE IF EXISTS `Workflows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Workflows` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `description` text,
  `workflow_type` varchar(50) DEFAULT NULL,
  `initial_status` varchar(50) NOT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `project_id` int DEFAULT NULL,
  `created_by` int NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `workflows_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  CONSTRAINT `workflows_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `Users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Workflows`
--

LOCK TABLES `Workflows` WRITE;
/*!40000 ALTER TABLE `Workflows` DISABLE KEYS */;
/*!40000 ALTER TABLE `Workflows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `WorkflowStates`
--

DROP TABLE IF EXISTS `WorkflowStates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `WorkflowStates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` int NOT NULL,
  `workflow_id` int NOT NULL,
  `current_step_id` int DEFAULT NULL,
  `current_status` varchar(50) NOT NULL,
  `previous_status` varchar(50) DEFAULT NULL,
  `changed_by` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `workflow_id` (`workflow_id`),
  KEY `current_step_id` (`current_step_id`),
  KEY `changed_by` (`changed_by`),
  CONSTRAINT `workflowstates_ibfk_1` FOREIGN KEY (`workflow_id`) REFERENCES `Workflows` (`id`),
  CONSTRAINT `workflowstates_ibfk_2` FOREIGN KEY (`current_step_id`) REFERENCES `WorkflowSteps` (`id`),
  CONSTRAINT `workflowstates_ibfk_3` FOREIGN KEY (`changed_by`) REFERENCES `Users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `WorkflowStates`
--

LOCK TABLES `WorkflowStates` WRITE;
/*!40000 ALTER TABLE `WorkflowStates` DISABLE KEYS */;
/*!40000 ALTER TABLE `WorkflowStates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `WorkflowSteps`
--

DROP TABLE IF EXISTS `WorkflowSteps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `WorkflowSteps` (
  `id` int NOT NULL AUTO_INCREMENT,
  `workflow_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `display_name` varchar(200) NOT NULL,
  `description` text,
  `order` int NOT NULL,
  `allowed_roles` text,
  `allowed_user_ids` text,
  `next_steps` text,
  `auto_transition_condition` text,
  PRIMARY KEY (`id`),
  KEY `workflow_id` (`workflow_id`),
  CONSTRAINT `workflowsteps_ibfk_1` FOREIGN KEY (`workflow_id`) REFERENCES `Workflows` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `WorkflowSteps`
--

LOCK TABLES `WorkflowSteps` WRITE;
/*!40000 ALTER TABLE `WorkflowSteps` DISABLE KEYS */;
/*!40000 ALTER TABLE `WorkflowSteps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'test_management'
--

--
-- Dumping routines for database 'test_management'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-19 14:42:42
