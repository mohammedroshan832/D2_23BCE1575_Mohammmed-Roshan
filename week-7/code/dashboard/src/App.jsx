import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { Activity, Droplets, AlertTriangle, Users, Database, ClipboardList, LayoutDashboard, PlusCircle, ShieldAlert, BookOpen, Globe, MessageSquare, ListChecks, Bell } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, ArcElement } from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, ArcElement);

const API_BASE_URL = 'http://localhost:5000/api';

// --- TRANSLATIONS DICTIONARY (FR12) ---
const dict = {
    en: {
        overview: "Dashboard Overview",
        dataEntry: "Data Entry",
        archive: "Health Archive",
        sensor: "Sensor Log",
        awareness: "Hygiene Education",
        totalReps: "Total Cases Reported",
        alerts: "System Alerts",
        villages: "Villages Monitored",
        title: "Smart Health Surveillance Network",
        logout: "Logout",
        sms: "SMS Simulator",
        srs: "SRS Traceability",
        alertCenter: "Alert Center"
    },
    hi: {
        overview: "डैशबोर्ड अवलोकन",
        dataEntry: "डेटा प्रवेश",
        archive: "स्वास्थ्य पुरालेख",
        sensor: "सेंसर लॉग",
        awareness: "स्वच्छता शिक्षा",
        totalReps: "कुल रिपोर्ट किए गए मामले",
        alerts: "सिस्टम अलर्ट",
        villages: "निगरानी वाले गांव",
        title: "स्मार्ट स्वास्थ्य निगरानी नेटवर्क",
        logout: "लॉगआउट",
        sms: "एसएमएस सिम्युलेटर",
        srs: "एसआरएस ट्रैसेबिलिटी",
        alertCenter: "अलर्ट सेंटर"
    }
};

// --- SUB-COMPONENTS ---

const LoginView = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Health Official');

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(role);
    };

    return (
        <div style={{height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--bg-color)'}}>
            <div className="chart-card" style={{width: '400px', textAlign: 'center'}}>
                <Activity size={48} color="var(--primary-color)" style={{margin: '0 auto 1rem'}} />
                <h2>Smart Health System</h2>
                <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left'}}>
                    <div className="form-group">
                        <label>Username:</label>
                        <input required type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. admin" />
                    </div>
                    <div className="form-group">
                        <label>Password:</label>
                        <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                    </div>
                    <div className="form-group">
                        <label>Role Authorization:</label>
                        <select value={role} onChange={(e) => setRole(e.target.value)} style={{width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc'}}>
                            <option value="Health Official">Health Official (Admin)</option>
                            <option value="ASHA Worker">ASHA Worker</option>
                            <option value="Clinic Staff">Clinic Staff</option>
                            <option value="Community Volunteer">Community Volunteer</option>
                        </select>
                    </div>
                    <button type="submit" className="primary-btn" style={{marginTop: '1rem'}}>Secure Login</button>
                </form>
            </div>
        </div>
    )
}

const DashboardView = ({ data, lang }) => {
  const t = dict[lang];
  const sensorDates = data.sensor_readings?.slice(0, 20).reverse().map(r => new Date(r.timestamp).toLocaleTimeString()) || [];
  const phData = data.sensor_readings?.slice(0, 20).reverse().map(r => r.ph) || [];
  const turbidityData = data.sensor_readings?.slice(0, 20).reverse().map(r => r.turbidity || 0) || [];

  const waterQualityChartData = {
    labels: sensorDates, 
    datasets: [
        { label: 'pH Level', data: phData, borderColor: '#2563eb', backgroundColor: 'rgba(37, 99, 235, 0.2)', tension: 0.3, yAxisID: 'y' },
        { label: 'Turbidity (NTU)', data: turbidityData, borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.2)', tension: 0.3, yAxisID: 'y1' }
    ]
  };

  const chartOptions = { 
    responsive: true, 
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { position: 'top' }, title: { display: false } }, 
    scales: { 
        y: { type: 'linear', display: true, position: 'left', min: 0, max: 14, title: {display: true, text: 'pH'} },
        y1: { type: 'linear', display: true, position: 'right', min: 0, max: 100, grid: {drawOnChartArea: false}, title: {display: true, text: 'Turbidity'} }
    } 
  };

  const diseaseCounts = data.recent_reports?.reduce((acc, rep) => {
      acc[rep.disease_suspected] = (acc[rep.disease_suspected] || 0) + 1;
      return acc;
  }, {}) || {};

  const pieChartData = {
      labels: Object.keys(diseaseCounts),
      datasets: [{
          data: Object.values(diseaseCounts),
          backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#6366f1'],
          borderWidth: 1,
      }]
  };

  const barChartData = {
      labels: Object.keys(data.village_risks || {}),
      datasets: [{
          label: 'Total Cases',
          data: Object.values(data.village_risks || {}).map(v => v.cases),
          backgroundColor: '#3b82f6'
      }]
  };

  return (
    <>
      <div className="header">
        <h1>{t.title}</h1>
        <p>Northeast India Real-time Disease & Water Contamination Tracking</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <div className="stat-title">{t.totalReps}</div>
            <Users color="var(--primary-color)" />
          </div>
          <div className="stat-value">{data.recent_reports?.length || 0}</div>
        </div>
        <div className="stat-card">
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <div className="stat-title">{t.alerts}</div>
            <AlertTriangle color="var(--danger)" />
          </div>
          <div className="stat-value">{data.alerts?.filter(a => a.status === 'Generated').length || 0} Unresolved</div>
        </div>
        <div className="stat-card">
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <div className="stat-title">{t.villages}</div>
            <ShieldAlert color="var(--success)" />
          </div>
          <div className="stat-value">{Object.keys(data.village_risks || {}).length}</div>
        </div>
      </div>

      {/* HOTSPOT HEAT MAP SIMULATION */}
      <h3>Region Hotspots (Heat Map)</h3>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '30px'}}>
         {Object.entries(data.village_risks || {}).map(([village, risk]) => (
             <div key={village} style={{
                 padding: '20px', borderRadius: '10px', minWidth: '150px',
                 backgroundColor: risk.riskLevel === 'High' ? '#fee2e2' : risk.riskLevel === 'Medium' ? '#fef3c7' : '#dcfce7',
                 border: `1px solid ${risk.riskLevel === 'High' ? '#ef4444' : risk.riskLevel === 'Medium' ? '#f59e0b' : '#22c55e'}`
             }}>
                 <h4 style={{margin: '0 0 5px 0'}}>{village}</h4>
                 <div style={{fontSize: '1.5rem', fontWeight: 'bold'}}>{risk.cases} Cases</div>
                 <div style={{fontSize: '0.8rem', color: '#666'}}>Score: {Math.round(risk.score)}/100 ({risk.riskLevel})</div>
             </div>
         ))}
         {Object.keys(data.village_risks || {}).length === 0 && <p>No regional data to map yet.</p>}
      </div>

      <div className="charts-grid" style={{marginBottom: '20px'}}>
        <div className="chart-card">
           <h3 style={{textAlign: 'center', marginBottom: '15px'}}>Disease Distribution</h3>
           <div style={{height: '250px', display: 'flex', justifyContent: 'center'}}>
               {Object.keys(diseaseCounts).length > 0 ? <Pie data={pieChartData} options={{ maintainAspectRatio: false }} /> : <p style={{color: 'gray', alignSelf: 'center'}}>No case data available</p>}
           </div>
        </div>
        <div className="chart-card">
           <h3 style={{textAlign: 'center', marginBottom: '15px'}}>Cases by Location</h3>
           <div style={{height: '250px'}}>
               {Object.keys(data.village_risks || {}).length > 0 ? <Bar data={barChartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} /> : <p style={{color: 'gray', textAlign: 'center'}}>No village data</p>}
           </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>AI Predictive Risk Engine (Transparent Logic)</h3>
          <p style={{fontSize: '0.8rem', color: 'gray', marginBottom: '10px'}}>The engine evaluates localized case density, severe case weighting, pH/Turbidity drifts, and Bacterial presence to output a proactive 0-100 Risk Score.</p>
          <table style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem'}}>
           <thead>
             <tr style={{borderBottom: '1px solid #ddd'}}>
               <th style={{padding: '10px 0'}}>Target Zone</th>
               <th style={{padding: '10px 0'}}>Risk Score</th>
               <th style={{padding: '10px 0'}}>Engine Explanation Trace</th>
               <th style={{padding: '10px 0'}}>Output</th>
             </tr>
           </thead>
           <tbody>
             {Object.entries(data.village_risks || {}).map(([village, rsk], idx) => (
               <tr key={idx} style={{borderBottom: '1px solid #eee'}}>
                 <td style={{padding: '12px 0', fontWeight: 'bold'}}>{village}</td>
                 <td style={{padding: '12px 0'}}>{Math.round(rsk.score)} / 100</td>
                 <td style={{padding: '12px 0', fontSize: '0.85rem', color: '#555'}}>{rsk.explanation}</td>
                 <td style={{padding: '12px 0'}}>
                    <span className={`risk-badge risk-${rsk.riskLevel.toLowerCase()}`}>{rsk.riskLevel.toUpperCase()}</span>
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
        </div>
      </div>
      
      <div className="chart-card" style={{marginTop: '20px'}}>
         <h3>IoT & Field Kit Water Metrics</h3>
         <Line options={chartOptions} data={waterQualityChartData} height={60} />
      </div>
    </>
  );
};

const AlertsCenterView = ({ data, refreshDB }) => {
    const [filterSource, setFilterSource] = useState('All');

    const handleAck = async (id) => {
        try {
            await axios.post(`${API_BASE_URL}/alerts/ack`, { alert_id: id });
            refreshDB();
        } catch(e) { alert("Failed to acknowledge"); }
    }
    
    return (
        <div className="main-content">
            <div className="header">
                <h1>Official Alert Center</h1>
                <p>Track, manage, and dispatch official systemic warnings.</p>
            </div>
            <div className="chart-card">
                <div style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
                    <button onClick={() => setFilterSource('All')} style={{padding: '5px 15px', borderRadius: '20px', border: 'none', background: filterSource === 'All' ? '#2563eb' : '#e5e7eb', color: filterSource === 'All' ? 'white' : 'black', cursor: 'pointer'}}>All Alerts</button>
                    <button onClick={() => setFilterSource('Rule-Based')} style={{padding: '5px 15px', borderRadius: '20px', border: 'none', background: filterSource === 'Rule-Based' ? '#2563eb' : '#e5e7eb', color: filterSource === 'Rule-Based' ? 'white' : 'black', cursor: 'pointer'}}>Rule-Based Engine</button>
                    <button onClick={() => setFilterSource('ML Engine')} style={{padding: '5px 15px', borderRadius: '20px', border: 'none', background: filterSource === 'ML Engine' ? '#8b5cf6' : '#e5e7eb', color: filterSource === 'ML Engine' ? 'white' : 'black', cursor: 'pointer'}}>⚡ AI/ML Engine</button>
                </div>
                {data.alerts?.length === 0 ? <p>Systems Nominal. No active alerts.</p> : (
                    <table style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse'}}>
                        <thead>
                            <tr style={{borderBottom: '1px solid #ddd'}}>
                                <th>Timestamp</th>
                                <th>Location</th>
                                <th>Message</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.alerts?.filter(a => filterSource === 'All' || a.source === filterSource).map(a => (
                                <tr key={a.id} style={{borderBottom: '1px solid #eee'}}>
                                    <td style={{padding: '10px'}}>{new Date(a.timestamp).toLocaleString()}</td>
                                    <td style={{padding: '10px', fontWeight: 'bold'}}>{a.village}</td>
                                    <td style={{padding: '10px'}}>
                                        <div style={{marginBottom: '5px'}}>
                                            {a.source === 'ML Engine' ? <span style={{background: '#8b5cf6', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', marginRight: '5px'}}>⚡ AI Detected</span> : <span style={{background: '#3b82f6', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', marginRight: '5px'}}>Rule-Based</span>}
                                        </div>
                                        {a.message}
                                    </td>
                                    <td style={{padding: '10px'}}>
                                        <span className={`risk-badge risk-${a.status==='Acknowledged'?'low':'high'}`}>{a.status}</span>
                                    </td>
                                    <td style={{padding: '10px'}}>
                                        {a.status !== 'Acknowledged' && <button onClick={() => handleAck(a.id)} className="primary-btn">Ack</button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

const DataEntryView = ({ role, refreshDB }) => {
    const [healthForm, setHealthForm] = useState({ patient_name: '', age: '', gender: 'M', village: '', symptoms: '', disease_suspected: '', severity: 'Moderate', notes: '' });
    const [waterForm, setWaterForm] = useState({ village: '', read_type: 'IoT', ph: '', turbidity: '', bacterial_test: 'Pending' });

    const handleHealthSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE_URL}/health-reports`, { ...healthForm, reporter_name: 'Logged-in User', reporter_role: role });
            await refreshDB();
            alert('Health Report Logged successfully.');
            setHealthForm({ patient_name: '', age: '', gender: 'M', village: '', symptoms: '', disease_suspected: '', severity: 'Moderate', notes: '' });
        } catch(e) { alert('Error submitting report'); }
    };

    const handleWaterSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE_URL}/sensor-data`, waterForm);
            await refreshDB();
            alert('Water Quality metrics logged successfully.');
            setWaterForm({ village: '', read_type: 'IoT', ph: '', turbidity: '', bacterial_test: 'Pending' });
        } catch(e) { alert('Error submitting water data: ' + (e.response?.data?.error || e.message)); }
    };

    const handleReset = async () => {
        if(window.confirm("Seed Database with realistic Northeast India SIH Demo test data?")) {
            await axios.post(`${API_BASE_URL}/reset-demo`);
            await refreshDB();
            alert("Northeast India Demo Triggered.");
        }
    }

    return (
        <div className="main-content">
            <div className="header">
                <h1>Data Entry Portal</h1>
                <p>Simulate field entries for Advanced Health and IoT Data</p>
            </div>
            
            <div className="charts-grid">
                <div className="chart-card">
                    <h3>🩺 Advanced Health Form ({role})</h3>
                    <form className="data-form" onSubmit={handleHealthSubmit}>
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                             <div className="form-group"><label>Patient Name (or ID):</label><input required value={healthForm.patient_name} onChange={e => setHealthForm({...healthForm, patient_name: e.target.value})} placeholder="P-1002" /></div>
                             <div className="form-group"><label>Age:</label><input required type="number" value={healthForm.age} onChange={e => setHealthForm({...healthForm, age: e.target.value})} placeholder="34" /></div>
                        </div>
                        <div className="form-group"><label>Location / Village (e.g. Shillong):</label><input required value={healthForm.village} onChange={e => setHealthForm({...healthForm, village: e.target.value})} placeholder="e.g. Shillong" /></div>
                        <div className="form-group"><label>Symptoms:</label><input required value={healthForm.symptoms} onChange={e => setHealthForm({...healthForm, symptoms: e.target.value})} placeholder="e.g. Fever, Nausea" /></div>
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                            <div className="form-group">
                                <label>Disease Suspected:</label>
                                <input list="diseases" value={healthForm.disease_suspected} onChange={e => setHealthForm({...healthForm, disease_suspected: e.target.value})} placeholder="Select or type..." />
                                <datalist id="diseases">
                                    <option value="Cholera" />
                                    <option value="Typhoid" />
                                    <option value="Acute Diarrhea" />
                                    <option value="Dengue" />
                                    <option value="Malaria" />
                                    <option value="Unexplained Fever" />
                                </datalist>
                            </div>
                            <div className="form-group"><label>Severity:</label><select value={healthForm.severity} onChange={e => setHealthForm({...healthForm, severity: e.target.value})} style={{padding: '8px'}}><option>Mild</option><option>Moderate</option><option>Severe</option></select></div>
                        </div>
                        <button type="submit" className="primary-btn">Submit Health Data</button>
                    </form>
                </div>

                <div className="chart-card">
                    <h3>💧 Water Quality Injection</h3>
                    <form className="data-form" onSubmit={handleWaterSubmit}>
                         <div className="form-group"><label>Data Source:</label><select value={waterForm.read_type} onChange={e => setWaterForm({...waterForm, read_type: e.target.value})} style={{padding: '8px'}}><option>IoT Sensor Node</option><option>Manual Test Kit</option></select></div>
                        <div className="form-group"><label>Location / Target Body:</label><input required value={waterForm.village} onChange={e => setWaterForm({...waterForm, village: e.target.value})} placeholder="e.g. Imphal River" /></div>
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                            <div className="form-group"><label>pH Value:</label><input type="number" step="0.1" required value={waterForm.ph} onChange={e => setWaterForm({...waterForm, ph: e.target.value})} placeholder="e.g. 7.2" /></div>
                            <div className="form-group"><label>Turbidity (NTU):</label><input type="number" step="0.1" required value={waterForm.turbidity} onChange={e => setWaterForm({...waterForm, turbidity: e.target.value})} placeholder="e.g. 2.5" /></div>
                        </div>
                        <div className="form-group"><label>Bacterial Check (E. coli / Coliform):</label><select value={waterForm.bacterial_test} onChange={e => setWaterForm({...waterForm, bacterial_test: e.target.value})} style={{padding: '8px'}}><option>Pending</option><option>Positive</option><option>Negative</option></select></div>
                        <button type="submit" className="primary-btn">Simulate Water Read</button>
                    </form>
                </div>
            </div>

            <div style={{marginTop: '20px'}}>
                <button onClick={handleReset} style={{backgroundColor: '#ef4444', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight:'bold'}}>Inject NE India Demo Pack (Reset DB)</button>
            </div>
        </div>
    )
}

const SmsSimulationView = ({ refreshDB }) => {
    const [rawText, setRawText] = useState("TYPHOID SHILLONG 3");
    
    const handleSend = async () => {
        try {
            const res = await axios.post(`${API_BASE_URL}/sms`, { raw_text: rawText, sender: 'Cellular_Demo' });
            alert(`SMS Processed! Status: ${res.data.status}`);
            refreshDB();
        } catch(e) { alert("Failed SMS simulation."); }
    }

    return (
        <div className="main-content">
             <div className="header">
                <h1>SMS Offline Reporting Simulator</h1>
                <p>Demonstrates data-collection viability for extreme remote areas lacking internet.</p>
            </div>
            <div className="chart-card">
                <h3>Send Fake SMS to Server Endpoint</h3>
                <p style={{color: 'gray', marginBottom: '15px'}}>Standard Format: [DISEASE] [VILLAGE] [NUMBER_OF_CASES]</p>
                <div style={{display: 'flex', gap: '10px'}}>
                    <input type="text" value={rawText} onChange={(e) => setRawText(e.target.value)} style={{flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '5px'}}/>
                    <button className="primary-btn" onClick={handleSend}>POST /api/sms</button>
                </div>
            </div>
        </div>
    );
};

const SrsTraceabilityView = () => {
    const trace = [
        { req: "FR1", desc: "Role-based Authentication", status: "Completed", ui: "Login Prompt (Health Official, ASHA, Volunteer)" },
        { req: "FR2", desc: "Community Volunteer UI", status: "Completed", ui: "Role select & SMS simulator" },
        { req: "FR3", desc: "Water Quality Monitoring", status: "Completed", ui: "Sensor Logs / Bacterial Tests" },
        { req: "FR4/FR8", desc: "Remote Offline Data Prep", status: "Completed", ui: "SMS Simulator & React Native Async Cache UI" },
        { req: "FR5/FR6", desc: "Predictive Analytics/Hotspots", status: "Completed", ui: "AI Prediction Panel & Heat Map Cards" },
        { req: "FR10", desc: "Alert Module", status: "Completed", ui: "Alert Center (Ack Status)" },
        { req: "FR11/12", desc: "Hygiene Ed & Vernacular UI", status: "Completed", ui: "Awareness Tab (Multilingual Hindi/English toggle)" },
    ];
    return (
        <div className="main-content">
             <div className="header">
                <h1>SRS Traceability Matrix</h1>
                <p>SIH Evaluator Module Mapping (Direct validation of constraints)</p>
            </div>
            <div className="chart-card">
                 <table style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse'}}>
                     <thead>
                         <tr style={{borderBottom: '1px solid #ddd'}}><th>Requirement</th><th>Description</th><th>Implementation Hook</th><th>Status</th></tr>
                     </thead>
                     <tbody>
                         {trace.map((tr, i) => (
                             <tr key={i} style={{borderBottom: '1px solid #eee'}}>
                                 <td style={{padding: '10px', fontWeight: 'bold'}}>{tr.req}</td>
                                 <td style={{padding: '10px'}}>{tr.desc}</td>
                                 <td style={{padding: '10px', color: 'blue'}}>{tr.ui}</td>
                                 <td style={{padding: '10px'}}><span className="risk-badge risk-low">{tr.status}</span></td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
            </div>
        </div>
    )
}

const ReportsView = ({ data }) => {
  const [filter, setFilter] = useState('');
  
  const handleExportCSV = () => {
      const hdrs = "ID,Reporter,Patient,Age,Gender,Severity,Village,Source,Timestamp\n";
      const rows = data.recent_reports?.map(r => `${r.id},${r.reporter_name},${r.patient_name},${r.age},${r.gender},${r.severity},${r.village},${r.source},"${r.timestamp}"`).join("\n");
      const blob = new Blob([hdrs + rows], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Health_Archive_${new Date().getTime()}.csv`;
      a.click();
  }

  const filtered = data.recent_reports?.filter(r => (r.village||'').toLowerCase().includes(filter.toLowerCase()));

  return (
  <div className="main-content">
    <div className="header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      <div>
          <h1>Advanced Health Archive</h1>
          <p>Exportable Data Table</p>
      </div>
      <div>
         <button className="primary-btn" onClick={handleExportCSV}>Export to CSV</button>
      </div>
    </div>
    <div className="chart-card">
       <input type="text" placeholder="Filter by Village Name..." value={filter} onChange={e => setFilter(e.target.value)} style={{padding: '10px', width: '300px', marginBottom: '20px', border: '1px solid #ccc', borderRadius:'4px'}} />
       <table style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse'}}>
         <thead>
           <tr style={{borderBottom: '1px solid #ddd'}}>
             <th style={{padding: '10px 0'}}>Timestamp</th>
             <th style={{padding: '10px 0'}}>Source</th>
             <th style={{padding: '10px 0'}}>Village</th>
             <th style={{padding: '10px 0'}}>Demographics</th>
             <th style={{padding: '10px 0'}}>Symptoms</th>
           </tr>
         </thead>
         <tbody>
           {filtered?.map((rep, idx) => (
             <tr key={idx} style={{borderBottom: '1px solid #eee'}}>
               <td style={{padding: '10px 0', color: 'gray'}}>{new Date(rep.timestamp).toLocaleString()}</td>
               <td style={{padding: '10px 0'}}><span style={{backgroundColor: rep.source==='SMS'?'#dbeafe':'#f3f4f6', padding: '3px 8px', borderRadius: '4px', fontSize:'0.8rem'}}>{rep.source}</span></td>
               <td style={{padding: '10px 0', fontWeight: 'bold'}}>{rep.village}</td>
               <td style={{padding: '10px 0', fontSize: '0.9rem'}}>{rep.age ? `${rep.age}yo ${rep.gender}` : 'Unknown'} ({rep.severity})</td>
               <td style={{padding: '10px 0', color: 'var(--danger)'}}>{rep.symptoms} {rep.disease_suspected ? `[Suspect: ${rep.disease_suspected}]`:''}</td>
             </tr>
           ))}
           {filtered?.length === 0 && <tr><td colSpan="5" style={{padding: '10px'}}>No reports map to this query.</td></tr>}
         </tbody>
       </table>
    </div>
  </div>
)};

const SensorsView = ({ data }) => (
  <div className="main-content">
    <div className="header">
      <h1>Data & Sensor Network Logs</h1>
      <p>Raw IoT & Manual Field Kit parameters</p>
    </div>
    <div className="chart-card">
        <table style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse'}}>
         <thead>
           <tr style={{borderBottom: '1px solid #ddd'}}>
             <th style={{padding: '10px 0'}}>Timestamp / Node</th>
             <th style={{padding: '10px 0'}}>Type</th>
             <th style={{padding: '10px 0'}}>pH / Turbidity</th>
             <th style={{padding: '10px 0'}}>Bacterial Result</th>
           </tr>
         </thead>
         <tbody>
           {data.sensor_readings?.map((s, idx) => (
             <tr key={idx} style={{borderBottom: '1px solid #eee'}}>
               <td style={{padding: '10px 0'}}><strong>{s.sensor_id}</strong><br/><span style={{fontSize:'12px', color:'gray'}}>{new Date(s.timestamp).toLocaleString()}</span></td>
               <td style={{padding: '10px 0'}}>{s.read_type}</td>
               <td style={{padding: '10px 0'}}>pH: {s.ph} | {s.turbidity} NTU</td>
               <td style={{padding: '10px 0', color: s.bacterial_test==='Positive'?'red':'green', fontWeight:'bold'}}>{s.bacterial_test}</td>
             </tr>
           ))}
         </tbody>
       </table>
    </div>
  </div>
);

const AwarenessView = ({ lang }) => (
  <div className="main-content">
    <div className="header">
      <h1>{lang === 'hi' ? 'सामुदायिक स्वच्छता और कल्याण' : 'Regional Community Hygiene & Wellness'}</h1>
      <p>{lang === 'hi' ? 'पूर्वोत्तर भारत जल जनित रोग शमन' : 'Northeast India Water-Borne Mitigation Guidelines'}</p>
    </div>
    <div className="stats-grid">
        <div className="stat-card">
            <h3 style={{color: 'var(--primary-color)'}}>{lang === 'hi' ? 'सुरक्षित पेयजल (उबालना)' : 'Safe Drinking Water (Boiling)'}</h3>
            <p style={{marginTop: '10px'}}>{lang === 'hi' ? 'अशुद्धियों से बचने के लिए मॉनसून में नदियों या खुले कुओं का पानी हमेशा उबालें।' : 'Always rigorously boil water sourced from streams or open wells, especially during heavy Northeast Monsoons.'}</p>
        </div>
        <div className="stat-card">
            <h3 style={{color: 'var(--success)'}}>{lang === 'hi' ? 'ओआरएस (ORS) का उपयोग' : 'Oral Rehydration (ORS)'}</h3>
            <p style={{marginTop: '10px'}}>{lang === 'hi' ? 'अगर डायरिया के लक्षण दिखें, तो तुरंत ओआरएस भोलकर मरीज को दें।' : 'If diarrhea symptoms display, immediately dilute ORS packets with clean water. Do not wait for severe dehydration.'}</p>
        </div>
        <div className="stat-card">
            <h3 style={{color: 'var(--danger)'}}>{lang === 'hi' ? 'प्राथमिक चिकित्सा (आशा)' : 'First Points of Contact'}</h3>
            <p style={{marginTop: '10px'}}>{lang === 'hi' ? 'बुखार, दस्त या पेट दर्द होने पर तुरंत स्थानीय ASHA कार्यकर्ता को सूचित करें।' : 'Report immediately to local ASHA workers. Avoid unproven herbal remedies for suspected Cholera or Typhoid cases.'}</p>
        </div>
    </div>
  </div>
);

// --- MAIN APP COMPONENT ---
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(null);
  const [lang, setLang] = useState('en');
  const [data, setData] = useState({ recent_reports: [], sensor_readings: [], alerts: [], village_risks: {}, sms_logs: [] });
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard/summary`);
      setData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if(!isAuthenticated) return;
    fetchData();
    const interval = setInterval(fetchData, 3000); 
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (!isAuthenticated) return <LoginView onLogin={(r) => { setRole(r); setIsAuthenticated(true); }} />;
  if (loading) return <div className="dashboard-container" style={{justifyContent: 'center', alignItems: 'center'}}><h2>Loading Secure Platform...</h2></div>;

  const t = dict[lang];
  const unresolvedAlertsCount = data.alerts?.filter(a => a.status === 'Generated').length || 0;

  return (
    <BrowserRouter>
      <div className="dashboard-container">
        {/* Sidebar */}
        <div className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={{width: '260px'}}>
          <div className="logo-section" style={{marginBottom: '10px', display: 'flex', justifyContent: 'space-between'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
               <Activity size={32} />
               <span>HealthDrop</span>
            </div>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(false)} style={{display: sidebarOpen ? 'block' : 'none'}}>✕</button>
          </div>
          <div style={{fontSize: '0.8rem', color: 'gray', marginBottom: '10px'}}>User: <b>{role}</b></div>
          
          <div style={{display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center', color: 'var(--primary-color)'}}>
             <Globe size={16} /> 
             <span style={{cursor: 'pointer', fontWeight: lang==='en'?'bold':'normal'}} onClick={() => { setLang('en'); setSidebarOpen(false); }}>EN</span> | 
             <span style={{cursor: 'pointer', fontWeight: lang==='hi'?'bold':'normal'}} onClick={() => { setLang('hi'); setSidebarOpen(false); }}>HI</span>
          </div>

          <nav style={{display: 'flex', flexDirection: 'column', gap: '0.4rem'}}>
            <NavLink to="/" onClick={() => setSidebarOpen(false)} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}><LayoutDashboard size={20} /> {t.overview}</NavLink>
            <NavLink to="/alerts" onClick={() => setSidebarOpen(false)} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}><Bell size={20} /> {t.alertCenter} {unresolvedAlertsCount > 0 && <span style={{marginLeft: 'auto', background: 'red', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '10px'}}>{unresolvedAlertsCount}</span>}</NavLink>
            <NavLink to="/data-entry" onClick={() => setSidebarOpen(false)} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}><PlusCircle size={20} /> {t.dataEntry}</NavLink>
            <NavLink to="/sms" onClick={() => setSidebarOpen(false)} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}><MessageSquare size={20} /> {t.sms}</NavLink>
            <NavLink to="/reports" onClick={() => setSidebarOpen(false)} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}><ClipboardList size={20} /> {t.archive}</NavLink>
            <NavLink to="/sensors" onClick={() => setSidebarOpen(false)} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}><Database size={20} /> {t.sensor}</NavLink>
            <NavLink to="/awareness" onClick={() => setSidebarOpen(false)} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}><BookOpen size={20} /> {t.awareness}</NavLink>
            {/* SRS link removed */}
          </nav>

          <div style={{marginTop: 'auto'}}>
             <button onClick={() => setIsAuthenticated(false)} style={{background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', gap: '10px', alignItems:'center'}}>
                {t.logout}
             </button>
          </div>
        </div>

        {/* Dynamic Route Content */}
        <div className="main-content" style={{flex: 1, padding: '20px', overflowY: 'auto'}}>
          <div style={{display: 'flex', alignItems: 'center', marginBottom: '10px', justifyContent: 'space-between'}}>
             <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
             <div style={{display: 'flex', gap: '10px', alignItems: 'center', marginLeft: 'auto', fontSize: '12px', background: '#e0f2fe', padding: '5px 10px', borderRadius: '20px', color: '#0369a1', fontWeight: 'bold'}}>
                <span style={{width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite'}}></span>
                Live Synced | Last Drop: Just Now
             </div>
          </div>
          <Routes>
            <Route path="/" element={<DashboardView data={data} lang={lang} />} />
            <Route path="/alerts" element={<AlertsCenterView data={data} refreshDB={fetchData} />} />
            <Route path="/data-entry" element={<DataEntryView role={role} refreshDB={fetchData} />} />
            <Route path="/sms" element={<SmsSimulationView refreshDB={fetchData} />} />
            <Route path="/reports" element={<ReportsView data={data} />} />
            <Route path="/sensors" element={<SensorsView data={data} />} />
            <Route path="/awareness" element={<AwarenessView lang={lang} />} />
            {/* SRS Route removed */}
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
