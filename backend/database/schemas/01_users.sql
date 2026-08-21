-- Users Table Schema
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(32),
    role VARCHAR(32) DEFAULT 'student' CHECK (role IN ('student', 'college_authority', 'security_team', 'super_admin')),
    college_id VARCHAR(64),
    campus_id VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
