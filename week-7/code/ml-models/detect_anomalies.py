import sqlite3
import pandas as pd
from sklearn.ensemble import IsolationForest
import requests
import time
import os

DB_PATH = "../backend/database.sqlite"
API_URL = "http://localhost:5000/api/alerts"

def fetch_data():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}. Backend might not be running yet.")
        return pd.DataFrame()
        
    conn = sqlite3.connect(DB_PATH)
    query = "SELECT * FROM sensor_logs ORDER BY timestamp DESC LIMIT 100"
    df = pd.read_sql_query(query, conn)
    conn.close()
    return df

def detect_anomalies(df):
    if df.empty or len(df) < 5:
        return pd.DataFrame()

    # Features for anomaly detection - using only what we consistently have
    features = ['ph', 'turbidity']
    X = df[features].copy()

    # Fill NaNs with 0 if any column is entirely empty, otherwise use mean
    for col in features:
        if X[col].isnull().all():
            X[col] = 0.0
    X.fillna(X.mean(), inplace=True)
    X.fillna(0, inplace=True) # Final fallback

    try:
        # Scikit-Learn Isolation Forest
        clf = IsolationForest(contamination=0.1, random_state=42)
        preds = clf.fit_predict(X)
        df['anomaly'] = preds
        return df[df['anomaly'] == -1]
    except Exception as e:
        print(f"ML Processing Error: {e}", flush=True)
        return pd.DataFrame()

def post_alert(row):
    try:
        payload = {
            "type": "Water Contamination ML Alert",
            "message": f"ML detected anomaly at {row['sensor_id']} (pH: {row['ph']}, Turbidity: {row['turbidity']})",
            "village": row['sensor_id'], # In realistic scenarios, map sensor_id to village
            "severity": "Critical",
            "source": "ML Engine"
        }
        res = requests.post(API_URL, json=payload)
        if res.status_code == 200:
            print(f"SUCCESS: Alert posted to Dashboard: {payload['message']}", flush=True)
    except Exception as e:
        print(f"FAILED to post alert: {e}", flush=True)

if __name__ == "__main__":
    print("STARTING AI/ML Water Contamination Detector...", flush=True)
    known_anomaly_ids = set()

    while True:
        print("Checking for anomalies...", flush=True)
        data = fetch_data()
        
        if not data.empty:
            anomalies = detect_anomalies(data)
            
            for index, row in anomalies.iterrows():
                # Avoid alerting for the same row multiple times
                if row['id'] not in known_anomaly_ids:
                    print(f"WARNING: ANOMALY DETECTED: {row['sensor_id']} at {row['timestamp']}", flush=True)
                    post_alert(row)
                    known_anomaly_ids.add(row['id'])
        else:
            print("Not enough data to run ML model yet.", flush=True)
            
        # Run detection every 30 seconds
        time.sleep(30)
