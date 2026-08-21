-- Incidents Table Schema
CREATE TABLE IF NOT EXISTS incidents (
    id VARCHAR(64) PRIMARY KEY,
    type VARCHAR(128) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status VARCHAR(32) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Verified', 'Resolved', 'Rejected')),
    workflow_stage VARCHAR(32) DEFAULT 'Submitted' CHECK (workflow_stage IN ('Submitted', 'Under Review', 'Verified', 'Action Taken', 'Resolved', 'Rejected')),
    college_id VARCHAR(64),
    campus_id VARCHAR(64),
    is_anonymous BOOLEAN DEFAULT TRUE,
    reporter_encrypted_id VARCHAR(255),
    assigned_security_squad VARCHAR(128),
    response_status VARCHAR(32) DEFAULT 'Not Started',
    response_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
