# Ledger & Vault — Loan Approval System

A small Flask web app that predicts loan approval from applicant financials,
using a Random Forest model trained on `loan_approval_dataset.csv`
(98.2% test accuracy).

```
loan-approval-system/
├── app.py                    # Flask server + /predict API
├── train_model.py            # Retrain the model from the CSV
├── loan_approval_dataset.csv # Training data
├── requirements.txt
├── Procfile                  # For gunicorn-based hosting
├── model/
│   └── loan_model.pkl        # Trained model + encoders (already built)
├── templates/
│   └── index.html
└── static/
    ├── style.css
    └── script.js
```

## 1. Run it locally

You need Python 3.9+ installed.

```bash
cd loan-approval-system

# create a virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# install dependencies
pip install -r requirements.txt

# run the app
python app.py
```

Open **http://localhost:5000** in your browser. That's it — the model is
already trained and saved at `model/loan_model.pkl`, so it loads instantly.

If you ever want to retrain (e.g. with a different dataset), run:

```bash
python train_model.py
```

This regenerates `model/loan_model.pkl`.

## 2. Host it online

The app is a standard Flask app, so any Python host works. Three easy, free-tier-friendly options:

### Option A — Render.com (recommended, easiest)

1. Push this folder to a GitHub repository.
2. Go to [render.com](https://render.com) → **New +** → **Web Service** → connect your repo.
3. Set:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`
4. Click **Create Web Service**. Render gives you a live URL
   (`https://your-app.onrender.com`) in a couple of minutes.

### Option B — Railway.app

1. Push the folder to GitHub.
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
3. Railway auto-detects Python and the `Procfile` and deploys automatically.
4. Generate a public domain from the project's **Settings → Networking** tab.

### Option C — PythonAnywhere (no credit card, good for quick demos)

1. Sign up at [pythonanywhere.com](https://www.pythonanywhere.com) (free tier).
2. Upload the project folder (via the **Files** tab or `git clone`).
3. Open a **Bash console** and run `pip install --user -r requirements.txt`.
4. Go to the **Web** tab → **Add a new web app** → **Flask** → point it at `app.py`.
5. Reload the app — it's live at `https://yourusername.pythonanywhere.com`.

### Notes for any host
- The app reads the `PORT` environment variable already (`app.py`), so it works with hosts that assign a dynamic port.
- `gunicorn` (already in `requirements.txt`) should serve the app in production instead of the Flask dev server — the `Procfile` handles this for you on Render/Railway.
- `model/loan_model.pkl` must be included in whatever you deploy (don't `.gitignore` it) — it's the trained model.

## 3. How the prediction works

- **Model:** Random Forest classifier (300 trees), trained on 11 applicant features.
- **Top predictors:** CIBIL (credit) score dominates at ~83% importance, followed by loan term and loan amount.
- **`/predict` endpoint:** accepts JSON with the 11 fields (see `script.js` for the exact keys), returns:
  ```json
  {
    "status": "ok",
    "decision": "Approved",
    "approved_probability": 95.5,
    "top_factors": ["cibil_score", "loan_term", "loan_amount", "income_annum"]
  }
  ```

This is a demonstration model trained on a public/sample dataset — not a real credit decisioning system.
