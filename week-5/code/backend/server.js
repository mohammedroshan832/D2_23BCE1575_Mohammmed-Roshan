const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();
const PORT = 5000;

// --- CRASH GUARDS ---
process.on('uncaughtException', (err) => {
    console.error(`[CRITICAL] Uncaught Exception: ${err.message}`);
    console.error(err.stack);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error(`[CRITICAL] Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

app.use(cors());
app.use(bodyParser.json());

// Helper DB routines
function queryDB(query, params = []) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}
function runDB(query, params = []) {
    return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

// ==========================================
// 1. HEALTH REPORTS
// ==========================================
app.post('/api/health-reports', async (req, res) => {
    const { 
        reporter_name = 'Anonymous', reporter_role = 'Staff', patient_name = 'Unknown', 
        age = 0, gender = 'U', village = 'Unknown', symptoms = '', disease_suspected = '', 
        severity = 'Moderate', notes = '', source = 'App' 
    } = req.body;
    
    try {
        const result = await runDB(
            `INSERT INTO reports (reporter_name, reporter_role, patient_name, age, gender, village, symptoms, disease_suspected, severity, notes, source) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [reporter_name, reporter_role, patient_name, age, gender, village, symptoms, disease_suspected, severity, notes, source]
        );
        res.json({ id: result.lastID, message: 'Report submitted successfully.' });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 2. SENSOR & WATER LOGS
// ==========================================
app.post('/api/sensor-data', async (req, res) => {
    const { village, sensor_id, read_type = 'IoT', ph = 7.0, turbidity = 1.0, bacterial_test = 'Pending' } = req.body;
    const resolved_sensor = sensor_id ? sensor_id : `SENSOR_${(village || 'UNKNOWN').toUpperCase().replace(' ', '_')}`;
    
    try {
        const result = await runDB(
            `INSERT INTO sensor_logs (sensor_id, read_type, ph, turbidity, bacterial_test) VALUES (?, ?, ?, ?, ?)`,
            [resolved_sensor, read_type, ph, turbidity, bacterial_test]
        );
        res.json({ id: result.lastID, message: 'Water quality data logged.' });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 3. ALERTS ENDPOINTS
// ==========================================
app.post('/api/alerts', async (req, res) => {
    const { type, message, village, severity, risk_score = 99, source = "Rule-Based" } = req.body;
    try {
        await runDB(
            `INSERT INTO alerts (type, message, village, severity, risk_score, ai_explanation, source) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
            [type, message, village, severity, risk_score, "Rule-based flag", source]
        );
        res.json({ message: 'Alert registered successfully' });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/alerts/ack', async (req, res) => {
    const { alert_id } = req.body;
    if(!alert_id) return res.status(400).json({error: 'No ID'});
    try {
        await runDB(`UPDATE alerts SET status = 'Acknowledged' WHERE id = ?`, [alert_id]);
        res.json({ message: 'Alert acknowledged' });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 5. AI ENGINE & DASHBOARD SUMMARY
// ==========================================
app.get('/api/dashboard/summary', async (req, res) => {
    try {
        const summary = { recent_reports: [], sensor_readings: [], alerts: [], village_risks: {} };

        const reports = await queryDB(`SELECT * FROM reports ORDER BY timestamp DESC LIMIT 200`);
        const sensors = await queryDB(`SELECT * FROM sensor_logs ORDER BY timestamp DESC LIMIT 50`);
        const existingAlerts = await queryDB(`SELECT * FROM alerts ORDER BY timestamp DESC LIMIT 50`);
        summary.recent_reports = reports;
        summary.sensor_readings = sensors;
        summary.alerts = existingAlerts;

        // --- BASIC RULE-BASED LOGIC ---
        const villageStats = {};
        
        reports.forEach(r => {
            const v = r.village || 'Unknown';
            if (!villageStats[v]) villageStats[v] = { cases: 0, severe_cases: 0, badWater: false, bacterial: false };
            villageStats[v].cases += 1;
            if (r.severity === 'Severe') villageStats[v].severe_cases += 1;
        });

        sensors.forEach(s => {
            let vName = s.sensor_id.replace('SENSOR_', '').replace(/_/g, ' ');
            reports.forEach(r => { if(s.sensor_id.includes((r.village||'').toUpperCase().replace(' ', '_'))) { vName = r.village; } });

            if (!villageStats[vName]) villageStats[vName] = { cases: 0, severe_cases: 0, badWater: false, bacterial: false };
            if (s.ph < 6.5 || s.ph > 8.5 || s.turbidity > 5.0) villageStats[vName].badWater = true;
            if (s.bacterial_test === 'Positive') villageStats[vName].bacterial = true;
        });

        const newAlertsToGenerate = [];

        for (const [village, stats] of Object.entries(villageStats)) {
            let riskLevel = 'Low';
            let color = 'Green';
            let score = 10;
            let explanation = 'No significant risk factors detected.';

            // ML/Rule Risk Factor Weights
            score += stats.cases * 8;
            score += stats.severe_cases * 15;
            if (stats.badWater) score += 20;
            if (stats.bacterial) score += 40;
            
            score = Math.min(score, 100);

            if (score >= 70) {
                riskLevel = 'High'; color = 'Red';
                explanation = `High Threat [Score: ${score}/100]: ${stats.cases} total cases (${stats.severe_cases} severe). ${stats.badWater ? "Poor water pH/Turbidity." : ""} ${stats.bacterial ? "BACTERIAL CONTAMINATION CONFIRMED." : ""}`;
            } else if (score >= 40) {
                riskLevel = 'Medium'; color = 'Yellow';
                explanation = `Moderate Threat [Score: ${score}/100]: ${stats.cases} cases clustered. ${stats.badWater ? "Warning: Water metrics suboptimal." : ""}`;
            } else {
                explanation = `Safe [Score: ${score}/100]: Insufficient clustering. ${stats.cases} isolated cases.`;
            }

            // AVOID SPAMMING ALERTS (Deduplication)
            const hasRecentAlert = existingAlerts.some(a => a.village === village && a.severity === riskLevel);
            if (!hasRecentAlert && riskLevel !== 'Low') {
                newAlertsToGenerate.push([`AI Output Warning`, explanation, village, riskLevel, score, explanation, 'Rule-Based']);
            }

            summary.village_risks[village] = { cases: stats.cases, score, riskLevel, colorCode: color, explanation };
        }

        // Insert new generated alerts
        for (const alert of newAlertsToGenerate) {
            await runDB(`INSERT INTO alerts (type, message, village, severity, risk_score, ai_explanation, source) VALUES (?, ?, ?, ?, ?, ?, ?)`, alert);
        }
        
        // Refresh alerts if new ones inserted
        if (newAlertsToGenerate.length > 0) {
            summary.alerts = await queryDB(`SELECT * FROM alerts ORDER BY timestamp DESC LIMIT 50`);
        }

        res.json(summary);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 6. DEMO SEED REALISTIC NORTHEAST INDIA DATA
// ==========================================
app.post('/api/reset-demo', async (req, res) => {
    try {
        await runDB(`DELETE FROM reports`);
        await runDB(`DELETE FROM sensor_logs`);
        await runDB(`DELETE FROM alerts`);
        await runDB(`DELETE FROM sms_inbox`);
        
        // Seed NE India Data
        const seedReports = [
            ['ASHA Pema', 'ASHA Worker', 'Arun', 22, 'M', 'Imphal', 'Fever, Vomiting', 'Typhoid', 'Severe', 'Patient dehydrated', 'App'],
            ['Clinician Zuala', 'Clinic Staff', 'Remsangi', 35, 'F', 'Aizawl', 'Diarrhea', 'Cholera', 'Moderate', 'Administered ORS', 'App'],
            ['Volunteer', 'Community Volunteer', 'Unknown', 0, 'U', 'Shillong', 'Fever', '', 'Mild', 'SMS Injected Data', 'SMS'],
            ['Volunteer', 'Community Volunteer', 'Unknown', 0, 'U', 'Shillong', 'Fever', '', 'Mild', 'SMS Injected Data', 'SMS'],
            ['Volunteer', 'Community Volunteer', 'Unknown', 0, 'U', 'Shillong', 'Fever', '', 'Mild', 'SMS Injected Data', 'SMS'],
            ['ASHA Rita', 'ASHA Worker', 'Das', 41, 'M', 'Guwahati', 'Stomach pain', '', 'Mild', 'Observation required', 'App']
        ];
        for (const r of seedReports) {
            await runDB(`INSERT INTO reports (reporter_name, reporter_role, patient_name, age, gender, village, symptoms, disease_suspected, severity, notes, source) VALUES (?,?,?,?,?,?,?,?,?,?,?)`, r);
        }

        const seedSensors = [
            ['SENSOR_SHILLONG_HUB', 'IoT', 5.2, 8.5, 'Negative'], // Bad ph/turbidity
            ['SENSOR_AIZAWL', 'IoT', 7.1, 1.2, 'Negative'],     // Safe
            ['MANUAL_IMPHAL', 'Manual Kit', 7.4, 2.0, 'Positive']  // Bacterial presence!
        ];
        for (const s of seedSensors) {
            await runDB(`INSERT INTO sensor_logs (sensor_id, read_type, ph, turbidity, bacterial_test) VALUES (?,?,?,?,?)`, s);
        }

        res.json({ message: 'Northeast India Demo environment seeded successfully.' });
    } catch (e) {
         res.status(500).json({ error: e.message });
    }
});

app.listen(PORT, '0.0.0.0', () => { 
    console.log(`Server is running on http://0.0.0.0:${PORT}`); 
});
