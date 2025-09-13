import os
import sqlite3
import time
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import Dense
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
from tensorflow.keras.utils import to_categorical
import joblib
import smtplib
from email.mime.text import MIMEText
from datetime import datetime

# --- Config ---
DB_FILE = 'example.db'
MODEL_DIR = 'models'
TARGET_COLUMN = 'target'
CHECK_INTERVAL = 60        # seconds between checking for new data
EMAIL_ALERT = True          # True to send email notifications
EMAIL_CONFIG = {
    'smtp_server': 'smtp.gmail.com',
    'smtp_port': 587,
    'sender_email': 'youremail@gmail.com',
    'receiver_email': 'receiver@gmail.com',
    'password': 'yourpassword'  # Use app-specific password or env var
}

os.makedirs(MODEL_DIR, exist_ok=True)

# --- Database setup ---
conn = sqlite3.connect(DB_FILE)
cursor = conn.cursor()
cursor.execute('''
CREATE TABLE IF NOT EXISTS ai_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    input_data TEXT,
    target_data TEXT,
    prediction_data TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)
''')
conn.commit()

# --- Email notification ---
def send_email(subject, body):
    if not EMAIL_ALERT:
        return
    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = EMAIL_CONFIG['sender_email']
    msg['To'] = EMAIL_CONFIG['receiver_email']

    try:
        server = smtplib.SMTP(EMAIL_CONFIG['smtp_server'], EMAIL_CONFIG['smtp_port'])
        server.starttls()
        server.login(EMAIL_CONFIG['sender_email'], EMAIL_CONFIG['password'])
        server.send_message(msg)
        server.quit()
        print("✅ Notification sent.")
    except Exception as e:
        print(f"⚠️ Failed to send email: {e}")

# --- Helper functions ---
def load_dataset():
    df = pd.read_sql_query('SELECT * FROM ai_data', conn)
    if df.empty:
        return None
    df = df.drop(columns=['id', 'timestamp'])
    return df

def build_model(input_dim, output_dim, is_classification):
    output_activation = 'softmax' if is_classification else None
    loss_function = 'categorical_crossentropy' if is_classification else 'mse'
    model = Sequential([
        Dense(128, activation='relu', input_shape=(input_dim,)),
        Dense(64, activation='relu'),
        Dense(output_dim, activation=output_activation)
    ])
    model.compile(optimizer='adam', loss=loss_function, metrics=['accuracy'] if is_classification else ['mae'])
    return model

def preprocess_features(df, preprocessor=None):
    numeric_features = df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_features = df.select_dtypes(include=['object', 'category']).columns.tolist()
    if TARGET_COLUMN in numeric_features:
        numeric_features.remove(TARGET_COLUMN)
    if TARGET_COLUMN in categorical_features:
        categorical_features.remove(TARGET_COLUMN)

    if preprocessor is None:
        preprocessor = ColumnTransformer(
            transformers=[
                ('num', StandardScaler(), numeric_features),
                ('cat', OneHotEncoder(sparse=False, handle_unknown='ignore'), categorical_features)
            ]
        )
        X_processed = preprocessor.fit_transform(df.drop(columns=[TARGET_COLUMN]))
    else:
        X_processed = preprocessor.transform(df.drop(columns=[TARGET_COLUMN]))
    return X_processed, preprocessor

def preprocess_target(y, is_classification, encoder=None):
    if is_classification:
        if encoder is None:
            encoder = OneHotEncoder(sparse=False)
            y_encoded = encoder.fit_transform(y.values.reshape(-1,1))
        else:
            y_encoded = encoder.transform(y.values.reshape(-1,1))
        return y_encoded, encoder
    else:
        return y.values.reshape(-1,1), None

def log_predictions(inputs, targets, predictions):
    for inp, target_val, pred_val in zip(inputs, targets, predictions):
        cursor.execute(
            'INSERT INTO ai_data (input_data, target_data, prediction_data) VALUES (?, ?, ?)',
            (str(inp.tolist()), str(target_val.tolist()), str(pred_val.tolist()))
        )
    conn.commit()

# --- Self-updating loop with incremental retraining ---
last_row_count = 0
while True:
    df = load_dataset()
    if df is None or df.shape[0] <= last_row_count:
        print(f"[{datetime.now()}] No new data. Waiting...")
        time.sleep(CHECK_INTERVAL)
        continue

    new_rows = df.shape[0] - last_row_count
    print(f"[{datetime.now()}] Detected {new_rows} new rows.")
    last_row_count = df.shape[0]

    # Detect target type
    y = df[TARGET_COLUMN]
    is_classification = y.dtype == 'object' or y.nunique() <= 20

    # Preprocess features
    preprocessor_path = os.path.join(MODEL_DIR, 'preprocessor.pkl')
    if os.path.exists(preprocessor_path):
        preprocessor = joblib.load(preprocessor_path)
        X_processed, preprocessor = preprocess_features(df, preprocessor)
    else:
        X_processed, preprocessor = preprocess_features(df, None)
        joblib.dump(preprocessor, preprocessor_path)

    # Preprocess target
    encoder_path = os.path.join(MODEL_DIR, 'target_encoder.pkl') if is_classification else None
    if is_classification and encoder_path and os.path.exists(encoder_path):
        encoder = joblib.load(encoder_path)
        y_encoded, encoder = preprocess_target(y, is_classification, encoder)
    else:
        y_encoded, encoder = preprocess_target(y, is_classification)
        if encoder_path:
            joblib.dump(encoder, encoder_path)

    # Train/test split
    x_train, x_test, y_train, y_test = train_test_split(X_processed, y_encoded, test_size=0.2, random_state=42)

    # Build or load model
    model_path = os.path.join(MODEL_DIR, 'trained_model.h5')
    if os.path.exists(model_path):
        model = load_model(model_path)
        print(f"[{datetime.now()}] Loaded existing model.")
    else:
        model = build_model(x_train.shape[1], y_train.shape[1] if len(y_train.shape) > 1 else 1, is_classification)
        print(f"[{datetime.now()}] Created new model.")

    # Callbacks for early stopping & adaptive learning rate
    callbacks = [
        EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True),
        ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3, min_lr=1e-6)
    ]

    # Train model
    model.fit(x_train, y_train, epochs=50, batch_size=8, validation_split=0.2, callbacks=callbacks)

    # Evaluate
    eval_result = model.evaluate(x_test, y_test)
    print(f"[{datetime.now()}] Evaluation result: {eval_result}")

    # Save model with versioning
    versioned_model_path = os.path.join(MODEL_DIR, f'trained_model_v{int(time.time())}.h5')
    model.save(versioned_model_path)
    # Update main model
    model.save(model_path)

    # Log predictions
    predictions = model.predict(x_test)
    log_predictions(x_test, y_test, predictions)

    # Send notification
    send_email(
        subject="Model Updated Successfully",
        body=f"New model trained and saved at {versioned_model_path}.\nEvaluation: {eval_result}"
    )

    print(f"[{datetime.now()}] ✅ Model updated, predictions logged, notification sent.")
    time.sleep(CHECK_INTERVAL)
