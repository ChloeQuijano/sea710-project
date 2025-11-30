# Image Preprocessing Pipeline

This document describes the **image preprocessing** steps used in the SEA710 Makeup Product Detection Project **before training and augmentation**.

Preprocessing is performed locally in Python. The goal is to standardize all images so they are clean, consistent, and ready for YOLO-based object detection.

---

## 1. Overview

Preprocessing is handled by a dedicated script:

- **Script:** `src/utils/preprocess_yolo.py`

This script:

- Reads images from the project dataset folders
- Applies:
  - Auto-orient (based on EXIF metadata)
  - Color normalization (convert to RGB)
  - Resize to a fixed resolution (640×640)
- Saves the processed images to the final YOLO dataset structure while preserving YOLO bounding box labels.

---

## 2. Input and Output Folders

### Input

Images and labels are expected under the main dataset directory:

```text
dataset/
  train/
    images/   # original training images
    labels/   # corresponding YOLO .txt files
  val/
    images/
    labels/
  test/
    images/
    labels/
```

Each label file contains YOLO-formatted annotations:

```text
<class_id> <x_center> <y_center> <width> <height>
```

(all coordinates normalized to [0, 1]).

### Output

The preprocessing script creates (or overwrites) a **preprocessed dataset** structure, for example:

```text
dataset/preprocessed/
  train/
    images/   # preprocessed training images (640×640)
    labels/   # same YOLO labels, copied directly
  val/
    images/
    labels/
  test/
    images/
    labels/
```

Because YOLO uses **normalized** coordinates, uniform resizing does **not** require label modification—labels can be copied one-to-one.

---

## 3. Preprocessing Steps

For each image, the following operations are applied:

### 3.1 Auto-Orient

Many images, especially from phones, store orientation in EXIF metadata instead of actually rotating pixels. To ensure the model sees images in their true orientation, we:

- Read the EXIF orientation flag
- Rotate/flip the image accordingly
- Save the corrected image

In code, this is done using Pillow:

```python
from PIL import Image, ImageOps

img = Image.open(in_path)
img = ImageOps.exif_transpose(img)
```

This matches the behavior of Roboflow’s **“Auto-Orient (Highly Recommended)”** step, but is done locally in Python.

---

### 3.2 Convert to RGB

To ensure consistent color format and avoid issues with grayscale or images with alpha channels:

- All images are converted to **RGB** (`3` channels).

```python
img = img.convert("RGB")
```

This guarantees a consistent input format for YOLO and OpenCV.

---

### 3.3 Resize to 640×640

YOLO models typically train on square images with a fixed resolution. In this project, we standardize all images to:

- **640 × 640 pixels**

Using Pillow:

```python
IMG_SIZE = 640
img = img.resize((IMG_SIZE, IMG_SIZE))
```

Because YOLO labels are normalized `(x_center, y_center, width, height)` with respect to original image size, this uniform resize **does not change the numeric values** in the label files:

- The relative positions and sizes remain valid.

Therefore, after resizing, we simply copy the corresponding `.txt` label files:

```python
shutil.copy2(src_label, dst_label)
```

---

## 3.4. Example: Original vs Preprocessed Image

As a concrete example, the following pair shows one image before and after preprocessing:

- **Original image (raw, arbitrary size):**  
!["original image"](../dataset/train/images/photo-1764463786337_jpg.rf.177f77556df01ceec843a40ca044a903.jpg)
  `dataset/train/images/photo-1764463786337_jpg.rf.177f77556df01ceec843a40ca044a903.jpg`

- **Preprocessed image (auto-oriented + RGB + 640×640):** 
!["pre processed image](../dataset/preprocessed/train/images/photo-1764463786337_jpg.rf.177f77556df01ceec843a40ca044a903.jpg) 
  `dataset/preprocessed/train/images/photo-1764463786337_jpg.rf.177f77556df01ceec843a40ca044a903.jpg`

The filename is preserved, but the preprocessed version is:

- Correctly oriented
- Converted to RGB
- Resized to 640×640

This makes it easy to trace any single example from raw → preprocessed → model prediction.

---

## 4. Running the Preprocessing Script

From the project root:

```bash
python -m src.utils.preprocess_yolo_basic
```

What the script does:

1. Locates the `dataset/` directory.
2. For each split (`train`, `val`, `test`):
   - Reads images from `dataset/<split>/images/`
   - Applies:
     - Auto-orient
     - Convert to RGB
     - Resize to 640×640
   - Saves processed images to:
     - `dataset/preprocessed_basic/<split>/images/`
   - Copies matching label files from:
     - `dataset/<split>/labels/` → `dataset/preprocessed_basic/<split>/labels/`
3. Prints simple progress logs and counts.

---

## 5. Using the Preprocessed Dataset for Training

After preprocessing, training is pointed to the **preprocessed dataset** via a custom YOLO data config YAML, for example:

```yaml
# dataset/data_preprocessed.yaml

path: ../dataset/preprocessed

train: train/images
val: val/images
test: test/images

names:
  0: beauty_blender
  1: blush
  2: bronzer
  3: brush
  4: concealer
  5: eye_liner
  6: eye_shadow
  7: eyelash_curler
  8: foundation
  9: highlighter
  10: lip_balm
  11: lip_gloss
  12: lip_liner
  13: lip_stick
  14: mascara
  15: nail_polish
  16: powder
  17: primer
  18: setting_spray
```

Then, the augmentation script (`src/training/augment_yolo_train.py`) can use:

```python
data_yaml = root / "dataset" / "data_preprocessed.yaml"
```

This clearly separates:

- **Preprocessing (this file):** Auto-orient + RGB + resize  
- **Augmentation:** Handled separately (e.g., `augment_yolo_train.py`), applied only to the training split.

---

## 6. Summary

The preprocessing pipeline:

1. Ensures all images are correctly oriented.
2. Standardizes all images to RGB format.
3. Resizes every image to 640×640 pixels.
4. Preserves YOLO labels by copying normalized annotation files.
5. Produces a clean, consistent dataset under `dataset/preprocessed` ready for:
   - Offline augmentation
   - YOLO model training
   - Reproducible experiments.

By implementing preprocessing in code, the project remains fully reproducible and does not depend on external UI settings in Roboflow.
