# CNC Predictive Maintenance System 🛠️

A modern, web-based predictive maintenance dashboard for CNC milling machines powered by machine learning.

![CNC Predictive Maintenance](https://img.shields.io/badge/Status-Active-brightgreen)
![Model Accuracy](https://img.shields.io/badge/Model%20Accuracy-99.1%25-blue)
![Python](https://img.shields.io/badge/Python-3.9%2B-blue)
![Flask](https://img.shields.io/badge/Backend-Flask-lightgrey)

---

## 🌟 Features

- **Machine Specifications Input**: Enter air temperature, process temperature, rotational speed, torque, and tool wear.
- **Real-Time ML Health Prediction**: Predicts machine operating condition (**Healthy**, **Warning**, or **Failure Risk**).
- **KPI Metrics**: Displays **Failure Probability (%)**, **Health Score (0-100)**, and **Risk Level** (`LOW RISK`, `MODERATE RISK`, `HIGH RISK`).
- **Parameter Status & Range Checking**: Compares telemetry against nominal operational thresholds with colored indicators.
- **Root-Cause Failure Mode Analysis**: Detects specific failure mechanisms:
  - **TWF**: Tool Wear Failure (> 200 min wear)
  - **HDF**: Heat Dissipation Failure ($\Delta T < 8.6\text{ K}$ and speed $< 1380\text{ rpm}$)
  - **PWF**: Power Failure (Spindle stall or motor overload)
  - **OSF**: Overstrain Failure ($ToolWear \times Torque > \text{Capacity}$)
  - **RNF**: Random Failure
- **Maintenance Recommendations**: Clear actionable instructions based on predicted condition.
- **Prediction History Log**: Stores recent analyses with **CSV export** and **1-click parameter reload**.
- **Dataset Explorer**: Browse the complete 10,000-sample AI4I dataset with search, filtering, and instant testing.
- **Dual Execution Engine**:
  - Python Flask Backend with Scikit-Learn Random Forest (**99.1% accuracy**).
  - Standalone Client-Side JavaScript inference engine (`ml_engine.js`) for instant browser execution without a server.

---

## 🚀 Quick Start Guide

### Option 1: Run with Python Backend (Recommended)

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the application**:
   ```bash
   python app.py
   ```

3. **Open in browser**:
   Navigate to [http://127.0.0.1:5000](http://127.0.0.1:5000).

---

### Option 2: Standalone In-Browser Mode (No Setup Required)

Simply open `index.html` directly in any modern web browser (Chrome, Edge, Firefox, Safari). The client-side inference engine (`ml_engine.js`) will execute all predictions instantly!

---

## 📁 Project Structure

```
cnc_predictive_maintenance/
├── app.py                 # Flask REST API backend server
├── train_model.py         # ML model training and evaluation script
├── ml_engine.js           # Client-side JavaScript ML inference engine
├── index.html             # Dashboard frontend HTML
├── style.css              # Modern responsive CSS stylesheet
├── app.js                 # Frontend application controller
├── data.csv               # 10,000-sample AI4I Predictive Maintenance dataset
├── model_data.json        # Exported model weights, statistics & decision rules
├── model_rf.pkl           # Trained Random Forest classifier
├── model_TWF.pkl          # Tool Wear Failure classifier
├── model_HDF.pkl          # Heat Dissipation Failure classifier
├── model_PWF.pkl          # Power Failure classifier
├── model_OSF.pkl          # Overstrain Failure classifier
├── model_RNF.pkl          # Random Failure classifier
├── requirements.txt       # Python package dependencies
└── README.md              # Project documentation
```

---

## 📊 Dataset & Model Performance

- **Dataset**: AI4I 2020 Predictive Maintenance Dataset (10,000 synthetic CNC milling records based on real equipment data).
- **Model**: Random Forest Classifier with balanced class weights and physical feature engineering.
- **Performance**:
  - **Accuracy**: 99.10%
  - **Precision**: 96.30%
  - **Recall**: 76.47%
  - **F1-Score**: 85.25%
  - **ROC-AUC**: 0.9732
