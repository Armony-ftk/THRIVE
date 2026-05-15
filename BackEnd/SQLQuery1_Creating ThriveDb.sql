CREATE DATABASE ThriveDb;

USE ThriveDb;
GO
-- USERS
CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    email NVARCHAR(150) UNIQUE NOT NULL,
    password NVARCHAR(255) NOT NULL,
    role NVARCHAR(50) CHECK (role IN ('user', 'admin', 'super_admin')) NOT NULL,
    created_at DATETIME DEFAULT GETDATE()
);

-- GOALS
CREATE TABLE Goals (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    title NVARCHAR(200) NOT NULL,
    category NVARCHAR(100),
    duration INT,
    duration_unit NVARCHAR(20) CHECK (duration_unit IN ('days','weeks','months')),
    deadline DATETIME,
    created_at DATETIME DEFAULT GETDATE(),
    status NVARCHAR(50) CHECK (status IN ('pending','active','at_risk','completed','cancelled')) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- TASKS
CREATE TABLE Tasks (
    id INT IDENTITY(1,1) PRIMARY KEY,
    goal_id INT NOT NULL,
    title NVARCHAR(200) NOT NULL,
    deadline DATETIME,
    position INT,
    status NVARCHAR(50) CHECK (status IN ('pending','in_progress','completed','overdue')) NOT NULL,
    FOREIGN KEY (goal_id) REFERENCES Goals(id) ON DELETE CASCADE
);

-- PROGRESS
CREATE TABLE Progress (
    id INT IDENTITY(1,1) PRIMARY KEY,
    task_id INT NOT NULL,
    completion_date DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (task_id) REFERENCES Tasks(id) ON DELETE CASCADE
);


