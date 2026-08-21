-- Colleges & Campuses Schema
CREATE TABLE IF NOT EXISTS colleges (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(32) NOT NULL,
    city VARCHAR(128) NOT NULL,
    state VARCHAR(128) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campuses (
    id VARCHAR(64) PRIMARY KEY,
    college_id VARCHAR(64) REFERENCES colleges(id),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    radius INT DEFAULT 800
);
