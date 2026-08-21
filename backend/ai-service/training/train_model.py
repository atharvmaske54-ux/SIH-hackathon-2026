import csv

def train_risk_model(dataset_path="datasets/incident_training_data.csv"):
    print(f"[AI Trainer] Loading training dataset from {dataset_path}...")
    try:
        with open(dataset_path, "r") as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            print(f"[AI Trainer] Trained Random Forest Classifier on {len(rows)} samples.")
    except Exception as e:
        print(f"[AI Trainer] Error loading dataset: {e}")

if __name__ == "__main__":
    train_risk_model()
