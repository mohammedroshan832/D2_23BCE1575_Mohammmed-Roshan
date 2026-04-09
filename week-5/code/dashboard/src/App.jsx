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
        sms: "SMS Simulator",
        srs: "SRS Traceability",
        alertCenter: "Alert Center"
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
            <div className="stat-title">{t.villages}</div>
            <ShieldAlert color="var(--success)" />
          </div>
          <div className="stat-value">{Object.keys(data.village_risks || {}).length}</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Basic Rule-Based Risk Engine</h3>
          <p style={{fontSize: '0.8rem', color: 'gray', marginBottom: '10px'}}>Basic condition-based evaluation of pH and Turbidity.</p>
          <table style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem'}}>
           <thead>
             <tr style={{borderBottom: '1px solid #ddd'}}>
               <th style={{padding: '10px 0'}}>Target Zone</th>
               <th style={{padding: '10px 0'}}>Score</th>
               <th style={{padding: '10px 0'}}>Output</th>
             </tr>
           </thead>
           <tbody>
             {Object.entries(data.village_risks || {}).map(([village, rsk], idx) => (
               <tr key={idx} style={{borderBottom: '1px solid #eee'}}>
                 <td style={{padding: '12px 0', fontWeight: 'bold'}}>{village}</td>
                 <td style={{padding: '12px 0'}}>{Math.round(rsk.score)} / 100</td>
                 <td style={{padding: '12px 0'}}>
                    <span className={`risk-badge risk-${rsk.riskLevel.toLowerCase()}`}>{rsk.riskLevel.toUpperCase()}</span>
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
        </div>
      </div>
    </>
  );
};



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

// Optional components removed for 50 percent milestone.

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
            <NavLink to="/data-entry" onClick={() => setSidebarOpen(false)} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}><PlusCircle size={20} /> {t.dataEntry}</NavLink>
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
            <Route path="/data-entry" element={<DataEntryView role={role} refreshDB={fetchData} />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
