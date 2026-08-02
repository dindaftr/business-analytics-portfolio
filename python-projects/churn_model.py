"""
Telco Customer Churn Prediction
Dataset: IBM Telco Customer Churn (7,043 customers, 21 features)

Pipeline:
1. Clean data (handle missing TotalCharges for new customers)
2. Exploratory analysis of churn drivers
3. Train Logistic Regression & Random Forest classifiers
4. Evaluate and compare model performance
5. Extract feature importance for business interpretation

Author: [Your Name]
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix, classification_report
)


def load_and_clean(path: str) -> pd.DataFrame:
    """Load raw Telco churn CSV and clean known data quality issues."""
    df = pd.read_csv(path)

    # TotalCharges is stored as string; blank values belong to brand-new
    # customers (tenure = 0) whose first bill hasn't been generated yet.
    df['TotalCharges'] = df['TotalCharges'].replace(' ', np.nan)
    df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')
    df['TotalCharges'] = df['TotalCharges'].fillna(df['MonthlyCharges'])

    df['SeniorCitizen'] = df['SeniorCitizen'].map({1: 'Yes', 0: 'No'})

    def tenure_bucket(t):
        if t <= 6: return '0-6 mo'
        elif t <= 12: return '7-12 mo'
        elif t <= 24: return '13-24 mo'
        elif t <= 48: return '25-48 mo'
        return '49-72 mo'

    df['TenureBucket'] = df['tenure'].apply(tenure_bucket)
    return df


def build_features(df: pd.DataFrame):
    """One-hot encode categoricals and split target from features."""
    y = (df['Churn'] == 'Yes').astype(int)
    X = df.drop(columns=['customerID', 'Churn', 'TenureBucket'])
    cat_cols = X.select_dtypes(include='object').columns.tolist()
    X_encoded = pd.get_dummies(X, columns=cat_cols, drop_first=True)
    return X_encoded, y


def evaluate(model, X_test, y_test, name: str) -> dict:
    pred = model.predict(X_test)
    proba = model.predict_proba(X_test)[:, 1]
    metrics = {
        'accuracy': accuracy_score(y_test, pred),
        'precision': precision_score(y_test, pred),
        'recall': recall_score(y_test, pred),
        'f1': f1_score(y_test, pred),
        'roc_auc': roc_auc_score(y_test, proba),
        'confusion_matrix': confusion_matrix(y_test, pred).tolist(),
    }
    print(f"\n=== {name} ===")
    for k, v in metrics.items():
        if k != 'confusion_matrix':
            print(f"{k:>10}: {v:.4f}")
    print("confusion matrix:", metrics['confusion_matrix'])
    return metrics


def main():
    df = load_and_clean('WA_Fn-UseC_-Telco-Customer-Churn.csv')
    X, y = build_features(df)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Logistic Regression needs scaled numeric features
    scaler = StandardScaler()
    num_cols = ['tenure', 'MonthlyCharges', 'TotalCharges']
    X_train_s, X_test_s = X_train.copy(), X_test.copy()
    X_train_s[num_cols] = scaler.fit_transform(X_train[num_cols])
    X_test_s[num_cols] = scaler.transform(X_test[num_cols])

    logreg = LogisticRegression(max_iter=2000, class_weight='balanced', random_state=42)
    logreg.fit(X_train_s, y_train)
    evaluate(logreg, X_test_s, y_test, "Logistic Regression")

    rf = RandomForestClassifier(
        n_estimators=300, max_depth=8, class_weight='balanced',
        random_state=42, n_jobs=-1
    )
    rf.fit(X_train, y_train)
    evaluate(rf, X_test, y_test, "Random Forest")

    importances = pd.Series(rf.feature_importances_, index=X_train.columns)
    print("\n=== Top 10 Churn Drivers (Random Forest) ===")
    print(importances.sort_values(ascending=False).head(10))


if __name__ == '__main__':
    main()
