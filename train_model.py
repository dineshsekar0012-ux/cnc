import pandas as pd
import numpy as np
import json
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import classification_report, roc_auc_score, accuracy_score, precision_score, recall_score, f1_score
from sklearn.preprocessing import StandardScaler

def train_and_export():
    print("Loading data.csv...")
    df = pd.read_csv("data.csv")
    
    # Feature Engineering
    df['temp_diff'] = df['Process_Temperature_K'] - df['Air_Temperature_K']
    df['power_W'] = df['Torque_Nm'] * df['Rotational_Speed_RPM'] * (2 * np.pi / 60)
    df['overstrain'] = df['Tool_Wear_Min'] * df['Torque_Nm']
    
    type_map = {'L': 0, 'M': 1, 'H': 2}
    df['type_num'] = df['Machine_Type'].map(type_map).fillna(0)
    
    feature_cols = [
        'type_num',
        'Air_Temperature_K',
        'Process_Temperature_K',
        'Rotational_Speed_RPM',
        'Torque_Nm',
        'Tool_Wear_Min',
        'temp_diff',
        'power_W',
        'overstrain'
    ]
    
    X = df[feature_cols]
    y = df['Machine_Failure']
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Main failure model: Random Forest with calibrated trees
    print("Training Random Forest Classifier for Overall Machine Failure...")
    rf = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42, class_weight='balanced')
    rf.fit(X_train, y_train)
    
    y_pred = rf.predict(X_test)
    y_prob = rf.predict_proba(X_test)[:, 1]
    
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_prob)
    
    print(f"Random Forest Performance:")
    print(f"Accuracy:  {acc*100:.2f}%")
    print(f"Precision: {prec*100:.2f}%")
    print(f"Recall:    {rec*100:.2f}%")
    print(f"F1-Score:  {f1*100:.2f}%")
    print(f"ROC-AUC:   {auc:.4f}")
    
    # Train specialized models for each failure mode if available in dataset
    failure_modes = ['TWF', 'HDF', 'PWF', 'OSF', 'RNF']
    mode_models = {}
    
    for mode in failure_modes:
        if mode in df.columns:
            y_mode = df[mode]
            rf_mode = RandomForestClassifier(n_estimators=50, max_depth=8, random_state=42, class_weight='balanced')
            rf_mode.fit(X, y_mode)
            mode_models[mode] = rf_mode
            
    # Save scikit-learn models
    joblib.dump(rf, 'model_rf.pkl')
    for mode, m in mode_models.items():
        joblib.dump(m, f'model_{mode}.pkl')
    print("Saved scikit-learn model pickles.")
    
    # Compute feature statistics for normalization & boundaries
    stats = {}
    for col in feature_cols:
        stats[col] = {
            'min': float(df[col].min()),
            'max': float(df[col].max()),
            'mean': float(df[col].mean()),
            'std': float(df[col].std()),
            'p25': float(df[col].quantile(0.25)),
            'p75': float(df[col].quantile(0.75))
        }
        
    # Feature importances
    importances = dict(zip(feature_cols, [float(x) for x in rf.feature_importances_]))
    
    # Export trees for zero-latency client-side JS implementation
    # Export first 10 representative decision trees as JSON
    exported_trees = []
    for tree in rf.estimators_[:12]:
        tree_dict = {
            'children_left': tree.tree_.children_left.tolist(),
            'children_right': tree.tree_.children_right.tolist(),
            'feature': tree.tree_.feature.tolist(),
            'threshold': [float(t) for t in tree.tree_.threshold],
            'value': tree.tree_.value.tolist()
        }
        exported_trees.append(tree_dict)
        
    model_metadata = {
        'feature_cols': feature_cols,
        'type_map': type_map,
        'metrics': {
            'accuracy': float(acc),
            'precision': float(prec),
            'recall': float(rec),
            'f1_score': float(f1),
            'roc_auc': float(auc)
        },
        'feature_importances': importances,
        'stats': stats,
        'trees': exported_trees,
        'dataset_summary': {
            'total_samples': len(df),
            'healthy_samples': int((df['Machine_Failure'] == 0).sum()),
            'failed_samples': int((df['Machine_Failure'] == 1).sum()),
            'twf_count': int(df['TWF'].sum()) if 'TWF' in df else 0,
            'hdf_count': int(df['HDF'].sum()) if 'HDF' in df else 0,
            'pwf_count': int(df['PWF'].sum()) if 'PWF' in df else 0,
            'osf_count': int(df['OSF'].sum()) if 'OSF' in df else 0,
            'rnf_count': int(df['RNF'].sum()) if 'RNF' in df else 0
        }
    }
    
    with open('model_data.json', 'w') as f:
        json.dump(model_metadata, f, indent=2)
        
    print("Exported model_data.json successfully!")
    return model_metadata

if __name__ == '__main__':
    train_and_export()
