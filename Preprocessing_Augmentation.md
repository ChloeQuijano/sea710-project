# Data Preprocessing & Augmentation

This document describes all **preprocessing** and **data augmentation** steps used for the SEA710 Makeup Product Detection project.

We use:

- **Roboflow** for initial preprocessing and dataset export.  
- A custom **Python augmentation pipeline** (`src/utils/augment_yolo_train.py`) using **Albumentations** for offline data augmentation.

---

## 1. Preprocessing (Roboflow)

All images were first uploaded to **Roboflow** for cleaning and normalization before training.

### 1.1. Dataset Source

- Base dataset: **`makeup products detection`** (Roboflow Universe)  
- Custom additions: extra images collected for underrepresented classes (e.g., setting spray, eyelash curler, primer, etc.).  
- Export format: **YOLOv8 (images + labels)**

### 1.2. Roboflow Preprocessing Settings

In Roboflow, we enabled the following **preprocessing** steps:

- **Auto-Orient** (Highly Recommended)  
  - Automatically corrects image orientation based on EXIF metadata.  
  - Ensures all images are upright and consistent before training.

- **Resize** (Highly Recommended)  
  - Resize all images to a fixed resolution compatible with YOLO.  
  - Target size in this project: **640 × 640 pixels**.  
  - This standardizes input dimensions and simplifies training.

> Note: Because Roboflow’s YOLOv8 export includes updated bounding boxes, all labels remain valid after these preprocessing steps.

The resulting preprocessed dataset is exported and stored in:

```text
dataset/
  ├── train/
  │   ├── images/
  │   └── labels/
  ├── val/
  │   ├── images/
  │   └── labels/
  └── test/
      ├── images/
      └── labels/
```

---

## 2. Offline Data Augmentation (Python)

To improve generalization and handle real-world variations in lighting, pose, and appearance, we apply **offline data augmentation** to the **training set only**.

### 2.1. Script Location

Augmentation is implemented in:

```text
src/utils/augment_yolo_train.py
```

It uses the **Albumentations** library, which supports **YOLO-format bounding boxes** and automatically updates them when images are transformed.

### 2.2. Environment Setup

Install dependencies (in your virtual environment):

```bash
pip install albumentations opencv-python
```

### 2.3. Augmentation Target

- **Input:** `dataset/train/images` + `dataset/train/labels`  
- **Output:** New augmented images and labels saved **in the same folders** with suffixes like:
  - `image123_aug1.jpg`, `image123_aug2.jpg`, …  
  - `image123_aug1.txt`, `image123_aug2.txt`, …

- **Validation (val)** and **Test (test)** sets are **not augmented**, so evaluation remains unbiased.

### 2.4. Per-Image Augmentation Strategy

For each original training image, we generate **4 augmented variants**:

```python
AUG_PER_IMAGE = 4
```

With 1,474 original training images, this produces roughly:

- **Original train images:** 1,474  
- **Augmented images:** 1,474 × 4 = 5,896  
- **Total train images after augmentation:** ≈ **7,370**

This significantly increases the diversity of the training data while keeping training time manageable.

### 2.5. Augmentation Operations

The augmentation pipeline randomly applies **combinations** of the following transforms (implemented with Albumentations):

#### Geometric Transforms

- **Flip: Horizontal, Vertical**
  - `A.HorizontalFlip(p=0.5)`
  - `A.VerticalFlip(p=0.5)`
  - Helps the model become invariant to left/right and up/down orientation.

- **90° Rotations**
  - `A.RandomRotate90(p=0.5)`
  - Random 90° clockwise or counter-clockwise rotation.

- **Crop / Zoom (0–20% Zoom)**
  - `A.RandomResizedCrop(height=640, width=640, scale=(0.8, 1.0), ratio=(0.9, 1.1), p=0.5)`
  - Random zoom-in and slight cropping, up to ~20%.

- **Small Rotation: [-15°, +15°]**
  - `A.SafeRotate(limit=15, border_mode=cv2.BORDER_REFLECT_101, p=0.7)`
  - Simulates the product being held at slight angles.

- **Shear: ±10° Horizontal / Vertical**
  - `A.Affine(shear={"x": (-10, 10), "y": (-10, 10)}, mode=cv2.BORDER_REFLECT_101, p=0.7)`
  - Models perspective distortions and slanted views.

#### Color & Intensity Transforms

- **Grayscale (15% of images)**
  - `A.ToGray(p=0.15)`
  - Applied to ~15% of augmented samples to simulate low-color environments or monochrome lighting.

- **Hue Shift: [-15°, +15°]**  
- **Saturation Shift: [-25%, +25%]**  
- **Brightness Shift: [-15%, +15%]**
  - Implemented via:
    ```python
    A.HueSaturationValue(
        hue_shift_limit=15,
        sat_shift_limit=25,
        val_shift_limit=15,
        p=0.7
    )
    ```
  - Models different lighting conditions and color casts.

- **Exposure: ±10% via Gamma**
  - `A.RandomGamma(gamma_limit=(90, 110), p=0.5)`
  - Brightens or darkens the image slightly (~±10%).

#### Blur & Noise

- **Blur: up to ~3 px**
  - `A.GaussianBlur(blur_limit=(1, 3), p=0.3)`
  - Simulates motion blur or slight camera focus issues.

- **Noise**
  - `A.GaussNoise(var_limit=(5.0, 20.0), p=0.3)`
  - Simulates sensor noise and low-light artifacts.

#### Final Resize

- **Ensure final size is 640 × 640**
  - `A.Resize(640, 640)`
  - Guarantees augmented images remain at the YOLO input size.

### 2.6. Bounding Box Handling

- Bounding boxes are expected in **YOLO format**:  
  `(class_id, x_center, y_center, width, height)`, all **normalized** to [0, 1].

- Albumentations is configured with:

  ```python
  bbox_params=A.BboxParams(
      format="yolo",
      label_fields=["class_labels"],
      min_visibility=0.3,
  )
  ```

- For every geometric transform (flip, rotate, crop, shear, etc.), Albumentations:
  - Updates bounding box positions and sizes accordingly.
  - Drops boxes that become too small or invisible (visibility < 30%).

This ensures that **augmented labels remain correct and consistent** with the transformed images.

### 2.7. How to Run Augmentation

From the project root:

```bash
python -m src.utils.augment_yolo_train
```

> ⚠️ Note:  
> The script is designed to ignore filenames containing `_aug` so it doesn’t continually re-augment already augmented images.  
> You should run it **once per clean dataset version**.

---

## 3. Training After Augmentation

The augmented dataset is then used by the training script:

```bash
python -m src.training.train_detector
```

- The script reads `dataset/data.yaml` (or a preprocessed variant if configured).  
- YOLO (v8 or v11) is trained on the **augmented training set**.  
- Validation and test sets remain **unaugmented**, providing a fair estimate of real-world performance.

---

## 4. Summary

- **Preprocessing (Roboflow):**
  - Auto-Orient  
  - Resize to 640×640  

- **Offline Augmentation (Python + Albumentations, train only):**
  - Flips (horizontal & vertical)  
  - 90° rotations  
  - Random crop / zoom (0–20%)  
  - Small rotations (±15°)  
  - Shear (±10° horizontal & vertical)  
  - Grayscale (~15% of samples)  
  - Hue / saturation / brightness / exposure changes  
  - Gaussian blur (up to ~3 px)  
  - Gaussian noise  

This pipeline significantly increases the diversity of the training data and helps the model generalize better to real-world camera input while keeping validation and test metrics honest.
