"""
Train a loan-approval prediction model from loan_approval_dataset.csv
and save it (along with the encoders) as model/loan_model.pkl
"""

import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report

# ---- 1. Load & clean ----
df = pd.read_csv("loan_approval_dataset.csv")
df.columns = [c.strip() for c in df.columns]

for col in df.select_dtypes(include="object").columns:
    df[col] = df[col].str.strip()

df.drop(columns=["loan_id"], inplace=True)

# ---- 2. Encode categoricals ----
encoders = {}
for col in ["education", "self_employed", "loan_status"]:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col])
    encoders[col] = le

# ---- 3. Split ----
X = df.drop(columns=["loan_status"])
y = df["loan_status"]
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# ---- 4. Train ----
model = RandomForestClassifier(n_estimators=300, max_depth=10, random_state=42)
model.fit(X_train, y_train)

# ---- 5. Evaluate ----
preds = model.predict(X_test)
acc = accuracy_score(y_test, preds)
print(f"Test accuracy: {acc:.4f}")
print(classification_report(y_test, preds, target_names=encoders["loan_status"].classes_))

# ---- 6. Feature importance (for reference) ----
importances = sorted(
    zip(X.columns, model.feature_importances_), key=lambda x: -x[1]
)
print("\nFeature importances:")
for name, val in importances:
    print(f"  {name}: {val:.3f}")

# ---- 7. Save model + encoders + feature order ----
joblib.dump(
    {
        "model": model,
        "encoders": encoders,
        "feature_order": list(X.columns),
    },
    "model/loan_model.pkl",
)
print("\nSaved model to model/loan_model.pkl")
