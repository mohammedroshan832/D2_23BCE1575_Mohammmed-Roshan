const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to SQLite database.');
        
        // Expanded Reports Table
        db.run(`CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reporter_name TEXT,
            reporter_role TEXT, -- e.g., Volunteer, ASHA Worker
            patient_name TEXT,
            age INTEGER,
            gender TEXT,
            village TEXT,
            symptoms TEXT,
            disease_suspected TEXT,
            severity TEXT, -- Mild, Moderate, Severe
            notes TEXT,
            source TEXT DEFAULT 'App', -- App, SMS
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Expanded Sensor Data Table
        db.run(`CREATE TABLE IF NOT EXISTS sensor_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sensor_id TEXT,
            read_type TEXT DEFAULT 'IoT', -- IoT, Manual Kit
            ph REAL,
            turbidity REAL,
            tds REAL,
            temperature REAL,
            bacterial_test TEXT DEFAULT 'Pending', -- Positive, Negative, Pending
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Expanded Alerts Table
        db.run(`CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT, 
            message TEXT,
            village TEXT,
            severity TEXT,
            risk_score INTEGER,
            ai_explanation TEXT,
            status TEXT DEFAULT 'Generated', -- Generated, Sent, Acknowledged
            source TEXT DEFAULT 'Rule-Based',
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // SMS logs to prove ingestion
         db.run(`CREATE TABLE IF NOT EXISTS sms_inbox (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            raw_text TEXT,
            sender TEXT,
            parsed_status TEXT, -- Success, Failed
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

module.exports = db;
