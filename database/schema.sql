-- ====================================================================
-- VYMI Tech Internship Management System
-- Database Schema: schema.sql
-- ====================================================================

-- 1. Create Database if not exists
CREATE DATABASE IF NOT EXISTS `vymi_internship`
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE `vymi_internship`;

-- 2. Drop tables if exists (in reverse dependency order)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `tasks`;
DROP TABLE IF EXISTS `interns`;
DROP TABLE IF EXISTS `applications`;
DROP TABLE IF EXISTS `cvs`;
DROP TABLE IF EXISTS `internship_positions`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `departments`;
DROP TABLE IF EXISTS `branches`;
SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================================
-- TABLE: branches (Quản lý các cơ sở của VYMI Tech)
-- ====================================================================
CREATE TABLE `branches` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `address` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- TABLE: departments (Phòng ban trong công ty)
-- ====================================================================
CREATE TABLE `departments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `description` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- TABLE: users (Tài khoản người dùng trong hệ thống)
-- ====================================================================
CREATE TABLE `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `full_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `role` ENUM('ADMIN', 'HR', 'MENTOR', 'INTERN', 'APPLICANT') NOT NULL DEFAULT 'APPLICANT',
    `branch_id` INT NULL,
    `department_id` INT NULL,
    `avatar` VARCHAR(255) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_users_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_users_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
    INDEX `idx_users_role` (`role`),
    INDEX `idx_users_branch` (`branch_id`),
    INDEX `idx_users_role_branch_status` (`role`, `branch_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- TABLE: internship_positions (Vị trí tuyển dụng thực tập)
-- ====================================================================
CREATE TABLE `internship_positions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `branch_id` INT NOT NULL,
    `department_id` INT NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `description` TEXT NOT NULL,
    `requirements` TEXT NOT NULL,
    `benefits` TEXT NULL,
    `quantity` INT NOT NULL DEFAULT 1,
    `internship_duration` VARCHAR(50) NOT NULL DEFAULT '3 tháng',
    `deadline` DATE NOT NULL,
    `status` ENUM('OPEN', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_positions_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_positions_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE RESTRICT,
    INDEX `idx_positions_branch` (`branch_id`),
    INDEX `idx_positions_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- TABLE: cvs (Hồ sơ CV do Applicant upload)
-- ====================================================================
CREATE TABLE `cvs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `original_name` VARCHAR(255) NOT NULL,
    `stored_name` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(255) NOT NULL,
    `file_size` INT NOT NULL,
    `file_type` VARCHAR(100) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_cvs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_cvs_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- TABLE: applications (Đơn ứng tuyển vào vị trí thực tập)
-- ====================================================================
CREATE TABLE `applications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `position_id` INT NOT NULL,
    `applicant_id` INT NOT NULL,
    `cv_id` INT NOT NULL,
    `cover_letter` TEXT NULL,
    `status` ENUM('PENDING', 'REVIEWING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `hr_note` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_applications_position` FOREIGN KEY (`position_id`) REFERENCES `internship_positions` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_applications_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_applications_cv` FOREIGN KEY (`cv_id`) REFERENCES `cvs` (`id`) ON DELETE RESTRICT,
    INDEX `idx_applications_position` (`position_id`),
    INDEX `idx_applications_applicant` (`applicant_id`),
    INDEX `idx_applications_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- TABLE: interns (Thông tin kỳ thực tập của Intern)
-- ====================================================================
CREATE TABLE `interns` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL UNIQUE,
    `application_id` INT NULL UNIQUE,
    `position_id` INT NOT NULL,
    `branch_id` INT NOT NULL,
    `mentor_id` INT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `status` ENUM('UPCOMING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'UPCOMING',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_interns_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_interns_application` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_interns_position` FOREIGN KEY (`position_id`) REFERENCES `internship_positions` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_interns_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_interns_mentor` FOREIGN KEY (`mentor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    INDEX `idx_interns_branch` (`branch_id`),
    INDEX `idx_interns_mentor` (`mentor_id`),
    INDEX `idx_interns_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- TABLE: tasks (Công việc thực tập do Mentor giao cho Intern)
-- ====================================================================
CREATE TABLE `tasks` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `intern_id` INT NOT NULL,
    `mentor_id` INT NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NOT NULL,
    `deadline` DATE NOT NULL,
    `status` ENUM('TODO', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED', 'REJECTED') NOT NULL DEFAULT 'TODO',
    `submission_content` TEXT NULL,
    `feedback` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_tasks_intern` FOREIGN KEY (`intern_id`) REFERENCES `interns` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_tasks_mentor` FOREIGN KEY (`mentor_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
    INDEX `idx_tasks_intern` (`intern_id`),
    INDEX `idx_tasks_mentor` (`mentor_id`),
    INDEX `idx_tasks_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- TABLE: notifications (Thông báo hệ thống giữa các role)
-- ====================================================================
CREATE TABLE IF NOT EXISTS `notifications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `sender_id` INT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `type` VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
    `link` VARCHAR(255) NULL,
    `is_read` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_notifications_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
    INDEX `idx_notifications_user_read` (`user_id`, `is_read`),
    INDEX `idx_notifications_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

