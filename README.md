# SEA710 - Makeup Product Detection Project

Computer Vision Project for detecting and classifying makeup products from camera input using object detection.

## Problem Description and Objectives

Finding and identifying makeup products automatically in images and video streams is challenging due to variations in lighting, packaging, colour, and brand designs. Many beauty platforms and AR applications require precise product recognition before recommending or applying virtual looks.

### Main Goals

Develop an object detection model that can:
- Detect and classify the type of makeup product being held (eyeliner, eyeshadow, lipstick, eyebrow pencil, blush, foundation, mascara)
- Optionally identify its brand or product name using logo or text recognition
- Run efficiently on a standard laptop without GPU dependency
- Provide a simple user interface for live detection and product selection per facial region (eyes, lips, skin)

## Final Deliverable

- A trained object detection model capable of identifying makeup product type and optionally brand from a webcam
- A desktop application with a simple interface for product detection and selection by facial area
- A labeled dataset of makeup product images annotated for object detection
- Documentation and final report for project submission

## Project Structure

```
sea710-project/
├── data/                    # Raw collected images
│   ├── raw/                # Original unprocessed images
│   └── processed/          # Preprocessed images
├── dataset/                # Annotated dataset (YOLOv8 format)
│   ├── train/              # Training set (downloaded + custom)
│   │   ├── images/         # Training images
│   │   └── labels/         # Training labels (.txt files)
│   ├── val/                # Validation set (downloaded + custom)
│   │   ├── images/         # Validation images
│   │   └── labels/         # Validation labels (.txt files)
│   ├── test/               # Test set (downloaded + custom)
│   │   ├── images/         # Test images
│   │   └── labels/         # Test labels (.txt files)
│   └── data.yaml           # Dataset configuration file
├── models/                 # Trained model files
│   ├── checkpoints/        # Training checkpoints
│   └── final/              # Final trained models
├── src/                    # Source code
│   ├── training/           # Training scripts
│   ├── inference/          # Inference scripts
│   ├── utils/              # Utility functions
│   └── ui/                 # Desktop application code
├── notebooks/              # Jupyter notebooks for experimentation
├── results/                # Outputs and evaluation results
│   ├── predictions/        # Prediction outputs
│   └── evaluation/         # Evaluation metrics and plots
├── docs/                   # Documentation
├── tests/                  # Test files
└── README.md               # This file
```

## Project Tasks

### Phase 1: Dataset Collection and Preparation
- [ ] Collect 100-200 images per product class across 7 product types:
  - [ ] Lipstick
  - [ ] Eyeshadow
  - [ ] Eyeliner
  - [ ] Mascara
  - [ ] Blush
  - [ ] Foundation
  - [ ] Eyebrow pencil
- [ ] Source images from:
  - [ ] Self-captured photos of real products
  - [ ] Web scraping from makeup retailer websites (Sephora, Ulta, brand sites)
  - [ ] Screenshots from tutorial videos
- [ ] Include 10-15 popular brands across all product types
- [ ] Organize raw images in `data/raw/` directory by product type
- [ ] Pre-process images (resize, normalize, format conversion)

### Phase 2: Dataset Annotation
- [ ] Set up Roboflow account and workspace
- [ ] Upload collected images to Roboflow
- [ ] Annotate images with bounding boxes for each product class
- [ ] Apply data augmentation (rotation, brightness, contrast adjustments)
- [ ] Split dataset into train/validation/test sets (70/20/10 recommended)
- [ ] Export annotated dataset in yolov8 format
- [ ] Backup annotation files to `dataset/annotations/`
- [ ] Document annotation guidelines and class mapping

### Phase 3: Model Development and Training
- [ ] Set up development environment (Python 3.8+, dependencies)
- [ ] Download pre-trained yolov8 model weights (yolov8v8 recommended)
- [ ] Configure yolov8 training parameters for custom dataset
- [ ] Train initial model on training set
- [ ] Validate model performance on validation set
- [ ] Tune hyperparameters (learning rate, batch size, epochs)
- [ ] Implement early stopping and model checkpointing
- [ ] Train final model and save to `models/`
- [ ] Document training process and results

### Phase 4: Model Evaluation and Optimization
- [ ] Evaluate model on test set
- [ ] Calculate metrics (mAP, precision, recall per class)
- [ ] Analyze confusion matrix
- [ ] Test inference speed on CPU
- [ ] Optimize model for CPU inference if needed (quantization, pruning)
- [ ] Test on diverse real-world images
- [ ] Document performance benchmarks

### Phase 5: Desktop Application Development
- [ ] Set up UI framework (Tkinter/PyQt/Gradio)
- [ ] Implement webcam capture functionality
- [ ] Integrate trained model for real-time inference
- [ ] Design UI layout:
  - [ ] Live video feed display
  - [ ] Detection results overlay
  - [ ] Product selection interface by facial region (eyes, lips, skin)
  - [ ] Confidence score display
- [ ] Add product filtering by category
- [ ] Implement brand/logo recognition (optional)
- [ ] Test application usability
- [ ] Create user documentation

### Phase 6: Testing and Refinement
- [ ] Unit tests for core functions
- [ ] Integration tests for full pipeline
- [ ] User acceptance testing
- [ ] Bug fixes and performance improvements
- [ ] Error handling and edge case management
- [ ] Optimize UI responsiveness

### Phase 7: Documentation and Submission
- [ ] Write comprehensive project report
- [ ] Document dataset sources and ethical considerations
- [ ] Create user guide for application
- [ ] Document code with docstrings
- [ ] Prepare presentation materials
- [ ] Final code review and cleanup
- [ ] Package final deliverable

## References

**Dataset Source:** first work. (2024). *makeup products detection Dataset* [Open Source Dataset]. Roboflow Universe. https://universe.roboflow.com/first-work-nnlbg/makeup-products-detection (visited on 2025-11-29)

## Build and Run Instructions

### Setup Virtual Environment

It's recommended to use a virtual environment to manage dependencies:

**Windows:**
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate
```

**macOS/Linux:**
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate
```

### Install Dependencies

Once your virtual environment is activated, install required packages:

```bash
# Core dependencies


# For camera interface
pip install opencv-python pillow
```

Or install from a requirements file (if created):
```bash
pip install -r requirements.txt
```

### Run Camera Interface

To test the camera interface:

```bash
python src/ui/camera_interface.py
```

### Deactivate Virtual Environment

When you're done working:

```bash
deactivate
```