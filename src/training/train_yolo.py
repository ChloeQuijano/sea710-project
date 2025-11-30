# src/training/train_yolo.py

from pathlib import Path
from ultralytics import YOLO


# ---------------------------
# Basic config
# ---------------------------

IMG_SIZE = 640
EPOCHS = 50       
BATCH_SIZE = 8  
MODEL_WEIGHTS = "yolov8n.pt" 

RUN_NAME = "makeup-yolov8n-preprocessed-aug"  
PROJECT_NAME = "sea710_yolo_runs"            


def get_paths():
    """
    Resolve important paths relative to repo root.
    """
    # This file: src/training/train_yolo.py
    this_file = Path(__file__).resolve()
    root = this_file.parents[2] 
    data_yaml = root / "dataset" / "data_preprocessed.yaml"
    if not data_yaml.exists():
        raise FileNotFoundError(f"Could not find data yaml at: {data_yaml}")

    project_dir = root / "runs" / PROJECT_NAME
    project_dir.mkdir(parents=True, exist_ok=True)

    return root, data_yaml, project_dir


def train():
    root, data_yaml, project_dir = get_paths()

    print("=== YOLOv8 Training Config ===")
    print(f"Project root:        {root}")
    print(f"Data YAML:           {data_yaml}")
    print(f"Model weights:       {MODEL_WEIGHTS}")
    print(f"Image size:          {IMG_SIZE}")
    print(f"Epochs:              {EPOCHS}")
    print(f"Batch size:          {BATCH_SIZE}")
    print(f"Project dir (runs/): {project_dir}")
    print(f"Run name:            {RUN_NAME}")
    print("==============================")

    # Load model (COCO-pretrained)
    model = YOLO(MODEL_WEIGHTS)

    # Kick off training
    model.train(
        data=str(data_yaml),
        imgsz=IMG_SIZE,
        epochs=EPOCHS,
        batch=BATCH_SIZE,
        project=str(project_dir),
        name=RUN_NAME,
        workers=4,         
        pretrained=True,    
        exist_ok=True,   
    )


if __name__ == "__main__":
    train()