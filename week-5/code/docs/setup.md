# Smart Community Health Monitoring - Setup Guide

This guide explains how to set up, run, and demonstrate the complete **Smart Community Health Monitoring and Early Warning System** locally.

## Project Structure
```
smart-health-project/
├── backend/       # Node.js/Express API & SQLite Database
├── dashboard/     # React based web dashboard
├── mobile-app/    # React Native Expo application for field reporting
├── ml-models/     # Python Scikit-Learn scripts for anomaly detection
├── sensors/       # Python script for simulating IoT sensor data
└── docs/          # Documentation and setup guides
```

## Prerequisites
1. **Node.js** (v18+)
2. **Python** (v3.9+)
3. Git

---

## Step 1: Running the Backend API
The backend acts as the central router between the Database, Dashboard, ML Models, and Mobile App.

1. Open a new terminal.
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   node server.js
   ```
   *The server will start on `http://localhost:5000` and automatically initialize the SQLite database (`database.sqlite`).*

---

## Step 2: Running the Web Dashboard
The dashboard visualizes health reports and water quality metrics in real-time.

1. Open a **new terminal**.
2. Navigate to the dashboard directory:
   ```bash
   cd dashboard
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the React development server:
   ```bash
   npm run dev
   ```
   *Open the URL provided in the terminal (usually `http://localhost:5173`) in your browser.*

---

## Step 3: Running the IoT Sensor Simulator
This script emulates hardware hardware in the field (pH/Turbidity sensors) to generate data.

1. Open a **new terminal**.
2. Navigate to the sensors directory:
   ```bash
   cd sensors
   ```
3. Install the required python library:
   ```bash
   pip install requests
   ```
4. Run the simulator:
   ```bash
   python simulator.py
   ```
   *The script will send occasional clean data with periodic anomalous data to the backend API. Keep it running.*

---

## Step 4: Running the AI/ML Anomaly Detector
The ML script polls the backend database, analyzes recent water patterns, and fires alerts.

1. Open a **new terminal**.
2. Navigate to the ML models directory:
   ```bash
   cd ml-models
   ```
3. Install the required python libraries (Pandas and Scikit-learn):
   ```bash
   pip install pandas scikit-learn requests
   ```
4. Start the ML service:
   ```bash
   python detect_anomalies.py
   ```
   *The script runs continuously in a loop, detecting outliers and triggering critical alerts back to the backend.*

---

## Step 5: Running the Mobile Application
The mobile app is used by volunteers to report disease outbreaks.

1. Open a **new terminal**.
2. Navigate to the mobile app directory:
   ```bash
   cd mobile-app
   ```
3. Ensure expo dependencies are valid and start the server:
   ```bash
   npm install
   npx expo start
   ```
4. Download the **Expo Go** app on your iOS or Android device.
5. Scan the QR code presented in your terminal with your phone's camera to open the application.
   *(Make sure your phone and laptop are on the exact same WiFi network)*

---

## Step 6: Deploying to GitHub / Production
Once you verify all components work locally:
1. Initialize git in the root folder (if not done already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit of full project architecture"
   ```
2. Create a repository on your GitHub account.
3. Push the codebase:
   ```bash
   git remote add origin https://github.com/yourusername/Health-Drop-Full-System.git
   git branch -M main
   git push -u origin main
   ```
   *(Ensure you configure `.gitignore` files in each sub-directory so `node_modules/` and `.sqlite` files are not pushed)*.
