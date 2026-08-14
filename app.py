from flask import Flask, render_template, request, jsonify
import joblib
import pandas as pd
import os

app = Flask(__name__)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "loan_model.pkl")
bundle = joblib.load(MODEL_PATH)
model = bundle["model"]
encoders = bundle["encoders"]
feature_order = bundle["feature_order"]


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        education = encoders["education"].transform([data["education"]])[0]
        self_employed = encoders["self_employed"].transform([data["self_employed"]])[0]

        row = {
            "no_of_dependents": int(data["no_of_dependents"]),
            "education": education,
            "self_employed": self_employed,
            "income_annum": float(data["income_annum"]),
            "loan_amount": float(data["loan_amount"]),
            "loan_term": int(data["loan_term"]),
            "cibil_score": int(data["cibil_score"]),
            "residential_assets_value": float(data["residential_assets_value"]),
            "commercial_assets_value": float(data["commercial_assets_value"]),
            "luxury_assets_value": float(data["luxury_assets_value"]),
            "bank_asset_value": float(data["bank_asset_value"]),
        }

        X = pd.DataFrame([row])[feature_order]

        pred = model.predict(X)[0]
        proba = model.predict_proba(X)[0]
        label = encoders["loan_status"].inverse_transform([pred])[0]

        approved_idx = list(encoders["loan_status"].classes_).index("Approved")
        confidence = round(float(proba[approved_idx]) * 100, 1)

        top_features = sorted(
            zip(feature_order, model.feature_importances_), key=lambda x: -x[1]
        )[:4]

        return jsonify(
            {
                "status": "ok",
                "decision": label,
                "approved_probability": confidence,
                "top_factors": [f[0] for f in top_features],
            }
        )
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
