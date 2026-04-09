import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, Alert, TextInput, TouchableOpacity, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, Theme } from '../lib/ThemeContext';

import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import HeroSection from '../components/HeroSection';
import Card from '../components/Card';

const API_BASE_URL = 'http://172.20.10.7:5000/api';

const dict = {
  en: {
    outbreaks: "🦠 Active Disease Outbreaks",
    water: "💧 Water Quality Alerts",
    prevention: "🛡️ Prevention Campaigns",
    submitLabel: "🩺 Submit Health Report",
    offlineHead: "📡 OFFLINE MODE",
    offlineSub: "Working from cached data"
  },
  hi: {
    outbreaks: "🦠 सक्रिय रोग प्रकोप",
    water: "💧 जल गुणवत्ता अलर्ट",
    prevention: "🛡️ रोकथाम अभियान",
    submitLabel: "🩺 स्वास्थ्य रिपोर्ट जमा करें",
    offlineHead: "📡 ऑफ़लाइन मोड",
    offlineSub: "कैश्ड डेटा से काम कर रहा है"
  }
}

const IndexPage = ({ userRole, onLogout }: { userRole: string, onLogout: () => void }) => {
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const [currentScreen, setCurrentScreen] = useState('Dashboard');
  const [lang, setLang] = useState('en');
  const [data, setData] = useState<{ alerts: any[], village_risks: any, stats: any, recent_reports?: any[], sensor_readings?: any[] }>({ alerts: [], village_risks: {}, stats: {} });
  const [isOffline, setIsOffline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);

  // Form State
  const [form, setForm] = useState({ patient_name: '', age: '', gender: 'M', village: '', symptoms: '', disease_suspected: '', severity: 'Moderate' });
  const [waterForm, setWaterForm] = useState({ village: '', read_type: 'IoT Sensor Node', ph: '', turbidity: '', bacterial_test: 'Pending' });
  const [smsText, setSmsText] = useState('TYPHOID SHILLONG 3');

  const loadQueue = async () => {
     const queuedStr = await AsyncStorage.getItem('@report_queue');
     if(queuedStr) setOfflineQueueCount(JSON.parse(queuedStr).length);
  };

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/summary`);
      if (!response.ok) throw new Error("Network response was not ok");
      const json = await response.json();
      setData(json);
      setIsOffline(false);
      await AsyncStorage.setItem('@smart_health_cache', JSON.stringify(json));
    } catch (error) {
      setIsOffline(true);
      const cached = await AsyncStorage.getItem('@smart_health_cache');
      if (cached) setData(JSON.parse(cached));
    }
    await loadQueue();
  };

  useEffect(() => { 
      fetchData(); 
      const interval = setInterval(fetchData, 3000);
      return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const submitHealthReport = async () => {
    if (!form.village || !form.symptoms) return Alert.alert("Error", "Required fields missing.");
    const payload = { reporter_name: 'Mobile User', reporter_role: userRole, patient_name: form.patient_name, age: form.age, gender: form.gender, village: form.village, symptoms: form.symptoms, disease_suspected: form.disease_suspected, severity: form.severity, source: 'App' };
    
    try {
      const response = await fetch(`${API_BASE_URL}/health-reports`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error("Network offline");
      
      Alert.alert("Success", "Health report synced to central database.");
      setForm({ patient_name: '', age: '', gender: 'M', village: '', symptoms: '', disease_suspected: '', severity: 'Moderate' });
      fetchData(); // refresh UI
    } catch(err) {
      // Offline mock storage
      const queuedStr = await AsyncStorage.getItem('@report_queue');
      const queue = queuedStr ? JSON.parse(queuedStr) : [];
      queue.push(payload);
      await AsyncStorage.setItem('@report_queue', JSON.stringify(queue));
      Alert.alert("Offline Mode", `Network unavailable. Saved locally. Tasks waiting sync: ${queue.length}`);
      setForm({ patient_name: '', age: '', gender: 'M', village: '', symptoms: '', disease_suspected: '', severity: 'Moderate' });
      loadQueue();
    }
  };

  const submitWaterReport = async () => {
    if (!waterForm.village) return Alert.alert("Error", "Village required.");
    try {
      const response = await fetch(`${API_BASE_URL}/sensor-data`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(waterForm) });
      if (!response.ok) throw new Error("Offline");
      Alert.alert("Success", "Water data populated remotely.");
      setWaterForm({ village: '', read_type: 'IoT Sensor Node', ph: '', turbidity: '', bacterial_test: 'Pending' });
      fetchData();
    } catch(e) {
      Alert.alert("Offline Error", "Water reports currently require connection. Health queue bypassed.");
    }
  };

  const handleAck = async (id: string | number) => {
    try {
        await fetch(`${API_BASE_URL}/alerts/ack`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({alert_id: id})});
        fetchData();
        Alert.alert("Acknowledged Alert", "Alert dismissed remotely.");
    } catch(e) { Alert.alert("Failed connectivity"); }
  };

  const handleSms = async () => {
    try {
        await fetch(`${API_BASE_URL}/sms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({raw_text: smsText, sender: 'Mobile_App'})});
        fetchData();
        Alert.alert("SMS Simulation", "Fake cellular string successfully parsed natively over offline route!");
    } catch(e) { Alert.alert("Failed SMS Simulation."); }
  };

  const syncQueue = async () => {
     const queuedStr = await AsyncStorage.getItem('@report_queue');
     if(!queuedStr) return;
     const queue = JSON.parse(queuedStr);
     if(queue.length === 0) return;
     
     try {
         for(const payload of queue) {
             await fetch(`${API_BASE_URL}/health-reports`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
         }
         await AsyncStorage.removeItem('@report_queue');
         Alert.alert("Sync Complete", `Successfully uploaded ${queue.length} reports to the SIH backend!`);
         setOfflineQueueCount(0);
         fetchData();
     } catch(e) {
         Alert.alert("Sync Failed", "Still offline or backend unreachable.");
     }
  };

  const t = dict[lang as 'en' | 'hi'];

  return (
    <View style={styles.container}>
      <Sidebar isVisible={isSidebarVisible} onClose={() => setSidebarVisible(false)} onNavigate={(screen) => {
        setSidebarVisible(false);
        if(screen === 'Auth' || screen === 'Profile') { onLogout(); }
        else if(['Dashboard', 'Outbreaks', 'WaterQuality', 'Awareness', 'DataEntry', 'AlertCenter', 'SmsSimulator', 'SrsTraceability'].includes(screen)) {
           setCurrentScreen(screen);
        } else {
           Alert.alert("Notice", `The ${screen} module is under development.`);
        }
      }} />

      <Navbar onMenuPress={() => setSidebarVisible(true)} userName={userRole || 'User'} />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        
        {/* Language Toggle */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 10 }}>
            <TouchableOpacity onPress={() => setLang('en')} style={{marginHorizontal: 10}}><Text style={{fontWeight: lang==='en'?'bold':'normal', color: colors.text}}>English</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setLang('hi')} style={{marginHorizontal: 10}}><Text style={{fontWeight: lang==='hi'?'bold':'normal', color: colors.text}}>हिन्दी (Hindi)</Text></TouchableOpacity>
        </View>

        {isOffline && (
            <View style={{ backgroundColor: '#ffebee', padding: 10, marginHorizontal: 16, borderRadius: 8, marginTop: 10 }}>
                <Text style={{ fontWeight: 'bold', color: '#d32f2f' }}>{t.offlineHead}</Text>
                <Text style={{ fontSize: 12, color: '#d32f2f' }}>{t.offlineSub}</Text>
                
                {offlineQueueCount > 0 && (
                   <TouchableOpacity onPress={syncQueue} style={{backgroundColor: '#d32f2f', padding: 10, borderRadius: 5, marginTop: 10}}>
                       <Text style={{color: 'white', textAlign: 'center', fontWeight: 'bold'}}>SYNC NOW ({offlineQueueCount} PENDING)</Text>
                   </TouchableOpacity>
                )}
            </View>
        )}

        {currentScreen === 'DataEntry' && (
          <View>
            <View style={styles.section}>
                <View style={{ backgroundColor: colors.surface, padding: 16, borderRadius: 12, elevation: 2 }}>
                    <Text style={[styles.sectionTitle, {color: colors.primary}]}>🩺 Advanced Health Form</Text>
                    <TextInput style={styles.input} placeholderTextColor="gray" placeholder="Patient Name / ID" value={form.patient_name} onChangeText={t => setForm({...form, patient_name: t})} />
                    <View style={{flexDirection: 'row', gap: 10}}>
                        <TextInput style={[styles.input, {flex: 1}]} placeholderTextColor="gray" placeholder="Age" keyboardType="numeric" value={form.age} onChangeText={t => setForm({...form, age: t})} />
                        <TextInput style={[styles.input, {flex: 1}]} placeholderTextColor="gray" placeholder="Gender (M/F)" value={form.gender} onChangeText={t => setForm({...form, gender: t})} />
                    </View>
                    <TextInput style={styles.input} placeholderTextColor="gray" placeholder="Location (e.g. Shillong)" value={form.village} onChangeText={t => setForm({...form, village: t})} />
                    <TextInput style={styles.input} placeholderTextColor="gray" placeholder="Symptoms observed" value={form.symptoms} onChangeText={t => setForm({...form, symptoms: t})} />
                    <TextInput style={styles.input} placeholderTextColor="gray" placeholder="Suspected Disease (Optional)" value={form.disease_suspected} onChangeText={t => setForm({...form, disease_suspected: t})} />
                    <TextInput style={styles.input} placeholderTextColor="gray" placeholder="Severity (Mild, Moderate, Severe)" value={form.severity} onChangeText={t => setForm({...form, severity: t})} />
                    
                    <TouchableOpacity onPress={submitHealthReport} style={{backgroundColor: colors.primary, padding: 12, borderRadius: 8}}>
                        <Text style={{color: 'white', textAlign: 'center', fontWeight: 'bold'}}>Submit Health Data</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.section}>
                <View style={{ backgroundColor: colors.surface, padding: 16, borderRadius: 12, elevation: 2 }}>
                    <Text style={[styles.sectionTitle, {color: '#3b82f6'}]}>💧 Water Quality Injection</Text>
                    <TextInput style={styles.input} placeholderTextColor="gray" placeholder="Location / Target Body" value={waterForm.village} onChangeText={t => setWaterForm({...waterForm, village: t})} />
                    <TextInput style={styles.input} placeholderTextColor="gray" placeholder="Read Type (IoT / Manual)" value={waterForm.read_type} onChangeText={t => setWaterForm({...waterForm, read_type: t})} />
                    <View style={{flexDirection: 'row', gap: 10}}>
                        <TextInput style={[styles.input, {flex: 1}]} placeholderTextColor="gray" placeholder="pH Level" keyboardType="numeric" value={waterForm.ph} onChangeText={t => setWaterForm({...waterForm, ph: t})} />
                        <TextInput style={[styles.input, {flex: 1}]} placeholderTextColor="gray" placeholder="Turbidity (NTU)" keyboardType="numeric" value={waterForm.turbidity} onChangeText={t => setWaterForm({...waterForm, turbidity: t})} />
                    </View>
                    <TextInput style={styles.input} placeholderTextColor="gray" placeholder="Bacterial Check (Pending/Positive/Negative)" value={waterForm.bacterial_test} onChangeText={t => setWaterForm({...waterForm, bacterial_test: t})} />
                    
                    <TouchableOpacity onPress={submitWaterReport} style={{backgroundColor: '#3b82f6', padding: 12, borderRadius: 8}}>
                        <Text style={{color: 'white', textAlign: 'center', fontWeight: 'bold'}}>Simulate Water Read</Text>
                    </TouchableOpacity>
                </View>
            </View>
          </View>
        )}

        {currentScreen === 'Dashboard' && (
          <View>
            <View style={styles.section}>
                <Text style={{fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 15}}>{lang === 'en' ? 'Smart Health Surveillance Network' : 'स्मार्ट स्वास्थ्य निगरानी नेटवर्क'}</Text>
                
                <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20}}>
                     {Object.entries(data.village_risks || {}).map(([village, risk]: [string, any]) => (
                         <View key={village} style={{
                             padding: 15, borderRadius: 10, width: '47%',
                             backgroundColor: risk.riskLevel === 'High' ? '#fee2e2' : risk.riskLevel === 'Medium' ? '#fef3c7' : '#dcfce7',
                             borderWidth: 1, borderColor: risk.riskLevel === 'High' ? '#ef4444' : risk.riskLevel === 'Medium' ? '#f59e0b' : '#22c55e'
                         }}>
                             <Text style={{fontWeight: 'bold', fontSize: 16}}>{village}</Text>
                             <Text style={{fontSize: 20, fontWeight: 'bold', marginVertical: 5}}>{risk.cases} Cases</Text>
                             <Text style={{fontSize: 12, color: '#666'}}>Risk: {Math.round(risk.score)}/100</Text>
                         </View>
                     ))}
                </View>
            </View>

            {/* Dynamic Outbreaks mapping from Backend */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t.outbreaks}</Text>
              </View>
              {data.alerts?.filter(a => a.severity === 'High').map((alert, idx) => (
                <Card key={idx} onPress={() => Alert.alert("Risk Assessment Details", alert.message)} type="outbreak" severity="high" title={`Outbreak Warning in ${alert.village}`} description={alert.message} location={alert.village} date={new Date(alert.timestamp.replace(' ', 'T')).toLocaleDateString()} />
              ))}
              {data.alerts?.filter(a => a.severity === 'High').length === 0 && <Text style={{color: 'gray'}}>No active severe outbreaks detected.</Text>}
            </View>

            {/* Dynamic Water Quality from Backend */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t.water}</Text>
              </View>
              {data.alerts?.filter(a => a.severity !== 'High').map((alert, idx) => (
                <Card key={idx} onPress={() => Alert.alert("Water Hazard Details", alert.message)} type="water_quality" severity="medium" title={`Water Hazard in ${alert.village}`} description={alert.message} location={alert.village} date={new Date(alert.timestamp.replace(' ', 'T')).toLocaleDateString()} />
              ))}
              {data.alerts?.filter(a => a.severity !== 'High').length === 0 && <Text style={{color: 'gray'}}>No water hazards detected.</Text>}
            </View>
          </View>
        )}

        {currentScreen === 'AlertCenter' && (
          <View style={styles.section}>
             <Text style={styles.sectionTitle}>Official Alert Center</Text>
             {data.alerts?.length === 0 ? <Text style={{color: 'gray'}}>Systems Nominal.</Text> : (
                 data.alerts?.map(a => (
                     <View key={a.id} style={{backgroundColor: colors.surface, padding: 15, borderRadius: 10, marginBottom: 10, elevation: 2}}>
                         <Text style={{fontWeight: 'bold', color: colors.text, fontSize: 16}}>{a.village}</Text>
                         <Text style={{color: colors.textSecondary, marginTop: 4}}>{a.message}</Text>
                         <Text style={{color: a.status === 'Acknowledged' ? 'green' : 'red', fontWeight: 'bold', marginTop: 8}}>{a.status}</Text>
                         {a.status !== 'Acknowledged' && (
                             <TouchableOpacity onPress={() => handleAck(a.id)} style={{backgroundColor: colors.primary, padding: 8, borderRadius: 5, marginTop: 10}}>
                                 <Text style={{color: 'white', textAlign: 'center'}}>Ack Alert</Text>
                             </TouchableOpacity>
                         )}
                     </View>
                 ))
             )}
          </View>
        )}

        {currentScreen === 'SmsSimulator' && (
          <View style={styles.section}>
             <Text style={[styles.sectionTitle, {color: colors.text}]}>SMS Offline Simulator</Text>
             <Text style={{color: 'gray', marginBottom: 15}}>Test standard cellular packets: [DISEASE] [VILLAGE] [CASES]</Text>
             <View style={{ backgroundColor: colors.surface, padding: 16, borderRadius: 12, elevation: 2 }}>
                 <TextInput style={styles.input} value={smsText} onChangeText={t => setSmsText(t)} />
                 <TouchableOpacity onPress={handleSms} style={{backgroundColor: '#10b981', padding: 12, borderRadius: 8}}>
                      <Text style={{color: 'white', textAlign: 'center', fontWeight: 'bold'}}>Broadcast SMS Protocol</Text>
                 </TouchableOpacity>
             </View>
          </View>
        )}

        {currentScreen === 'SrsTraceability' && (
          <View style={styles.section}>
             <Text style={styles.sectionTitle}>SRS Constraints Map</Text>
             <View style={{ backgroundColor: colors.surface, padding: 16, borderRadius: 12, elevation: 2 }}>
                 {[
                    {req: "FR1", desc: "Role Auth", status: "Completed"},
                    {req: "FR3", desc: "Water Params", status: "Completed"},
                    {req: "FR4/8", desc: "Offline Async", status: "Completed"},
                    {req: "FR5/6", desc: "AI Engine", status: "Completed"},
                    {req: "FR12", desc: "Vernacular (HI)", status: "Completed"},
                 ].map((t, idx) => (
                     <View key={idx} style={{marginBottom: 10, borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 5}}>
                         <Text style={{fontWeight: 'bold', color: colors.primary}}>{t.req} <Text style={{fontWeight: 'normal', color: 'gray'}}>- {t.desc}</Text></Text>
                         <Text style={{color: 'green', fontSize: 12}}>{t.status}</Text>
                     </View>
                 ))}
             </View>
          </View>
        )}

        {currentScreen === 'Outbreaks' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{lang === 'hi' ? 'स्वास्थ्य पुरालेख' : 'Health Reports Archive'}</Text>
            {data.recent_reports?.map((rep, idx) => (
              <View key={idx} style={{backgroundColor: colors.surface, padding: 15, borderRadius: 10, marginBottom: 10, elevation: 2}}>
                  <Text style={{fontWeight: 'bold', color: colors.text, fontSize: 16}}>{rep.village}</Text>
                  <Text style={{color: colors.textSecondary, marginTop: 4}}>Symptoms: <Text style={{fontWeight: 'bold'}}>{rep.symptoms}</Text></Text>
                  {rep.disease_suspected ? <Text style={{color: colors.error, marginTop: 4}}>Suspected: {rep.disease_suspected}</Text> : null}
                  <Text style={{color: 'gray', fontSize: 12, marginTop: 8}}>{new Date(rep.timestamp.replace(' ', 'T')).toLocaleString()}</Text>
              </View>
            ))}
            {(!data.recent_reports || data.recent_reports.length === 0) && <Text style={{color: 'gray'}}>No reports found.</Text>}
          </View>
        )}

        {currentScreen === 'WaterQuality' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{lang === 'hi' ? 'सेंसर लॉग' : 'Sensor Network Logs'}</Text>
            {data.sensor_readings?.map((log, idx) => (
              <View key={idx} style={{backgroundColor: colors.surface, padding: 15, borderRadius: 10, marginBottom: 10, elevation: 2}}>
                  <Text style={{fontWeight: 'bold', color: colors.text, fontSize: 16}}>{log.sensor_id}</Text>
                  <Text style={{color: colors.textSecondary, marginTop: 4}}>Location: {log.village || 'Field Node'}</Text>
                  <View style={{flexDirection: 'row', marginTop: 8, justifyContent: 'space-between'}}>
                      <Text style={{color: colors.primary, fontWeight: 'bold'}}>pH: {log.ph}</Text>
                      <Text style={{color: colors.textSecondary}}>Turbidity: {log.turbidity} NTU</Text>
                  </View>
                  <Text style={{color: 'gray', fontSize: 12, marginTop: 8}}>{new Date(log.timestamp.replace(' ', 'T')).toLocaleString()}</Text>
              </View>
            ))}
            {(!data.sensor_readings || data.sensor_readings.length === 0) && <Text style={{color: 'gray'}}>No sensor data found.</Text>}
          </View>
        )}

        {currentScreen === 'Awareness' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, {fontSize: 22, color: colors.primary, marginBottom: 20}]}>{lang === 'hi' ? 'स्वच्छता शिक्षा' : 'Hygiene Education'}</Text>
            
            <View style={{backgroundColor: colors.surface, padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2}}>
               <Text style={{fontWeight: 'bold', color: colors.primary, fontSize: 18, marginBottom: 8}}>{lang === 'hi' ? 'सुरक्षित पेयजल' : 'Safe Drinking Water'}</Text>
               <Text style={{color: colors.textSecondary, lineHeight: 22}}>{lang === 'hi' ? 'पीने से पहले पानी हमेशा उबालें या छान लें। पानी के स्रोतों को साफ रखें।' : 'Always boil or filter water before drinking. Ensure village wells are covered and far from sanitation facilities.'}</Text>
            </View>

            <View style={{backgroundColor: colors.surface, padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2}}>
               <Text style={{fontWeight: 'bold', color: colors.success, fontSize: 18, marginBottom: 8}}>{lang === 'hi' ? 'हाथ धोना' : 'Handwashing Practices'}</Text>
               <Text style={{color: colors.textSecondary, lineHeight: 22}}>{lang === 'hi' ? 'खाना खाने से पहले और बाद में साबुन से हाथ धोएं।' : 'Wash hands with soap before meals, after using the toilet, and after handling animals.'}</Text>
            </View>
            
            <View style={{backgroundColor: colors.surface, padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2}}>
               <Text style={{fontWeight: 'bold', color: colors.error, fontSize: 18, marginBottom: 8}}>{lang === 'hi' ? 'रोग के लक्षण' : 'Recognizing Symptoms'}</Text>
               <Text style={{color: colors.textSecondary, lineHeight: 22}}>{lang === 'hi' ? 'बुखार, दस्त या पेट दर्द होने पर तुरंत ASHA कार्यकर्ता को सूचित करें।' : 'Report immediately to ASHA workers if you experience fever, diarrhea, or severe stomach pain.'}</Text>
            </View>
          </View>
        )}

        {currentScreen === 'Dashboard' && (
          <View style={styles.section}>
             <TouchableOpacity onPress={onLogout} style={{padding: 15}}><Text style={{color: colors.error, textAlign: 'center', fontWeight: 'bold'}}>Sign Out</Text></TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </View>
  );
};

const createStyles = (colors: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  section: { margin: 16, marginBottom: 24 },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  input: {
      borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, marginBottom: 10, backgroundColor: 'white', color: 'black'
  }
});

export default IndexPage;