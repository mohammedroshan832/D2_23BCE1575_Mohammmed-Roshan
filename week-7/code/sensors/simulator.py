import requests
import random
import time

BACKEND_URL = "http://localhost:5000/api/sensor-data"

def simulate_sensor(sensor_id):
    # Normal water parameters
    ph = round(random.uniform(6.5, 8.5), 2)
    turbidity = round(random.uniform(0.5, 4.0), 2) # NTU
    tds = round(random.uniform(100, 300), 1) # ppm
    temp = round(random.uniform(20.0, 30.0), 1) # Celsius

    # Simulate an occasional spike (contamination event)
    if random.random() < 0.1:  # 10% chance to report anomaly
        ph = round(random.uniform(4.0, 6.0), 2) # Acidic
        turbidity = round(random.uniform(6.0, 15.0), 2) # High turbidity (muddy)
        print(f"⚠️ Injecting anomalous data for {sensor_id}!")

    payload = {
        "sensor_id": sensor_id,
        "ph": ph,
        "turbidity": turbidity,
        "tds": tds,
        "temperature": temp
    }

    try:
        response = requests.post(BACKEND_URL, json=payload)
        if response.status_code == 200:
            print(f"[{sensor_id}] Data sent successfully: {payload}")
        else:
            print(f"[{sensor_id}] Failed to send data: HTTP {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"[{sensor_id}] Connection error: {e}")

if __name__ == "__main__":
    sensors = ["SENSOR_VILLAGE_A", "SENSOR_VILLAGE_B", "SENSOR_RIVER_NODE_1"]
    
    print("Starting IoT Sensor Simulator...")
    print("Press Ctrl+C to stop.")
    
    try:
        while True:
            for sensor in sensors:
                simulate_sensor(sensor)
            # Send data every 10 seconds
            time.sleep(10)
    except KeyboardInterrupt:
        print("\nSimulator stopped.")
