# Image Augmentation Pipeline

This document describes the **image augmentation** steps used in the SEA710 Makeup Product Detection Project, **after preprocessing and before YOLOv8 training**.

Augmentation is applied **only to the training split** of the **preprocessed** dataset to artificially increase data diversity and improve model robustness.

---

## 1. Overview

Augmentation is handled by a dedicated script:

- **Script:** `src/training/augment_yolo_train.py`

This script:

- Loads **preprocessed** images and YOLO labels from:
  - `dataset/preprocessed/train/images`
  - `dataset/preprocessed/train/labels`
- Applies a set of realistic geometric + color augmentations using **Albumentations**
- Writes **new augmented images + labels** back into the same folders with `_augX` suffixes

Example filenames:

- Original: `photo-123.jpg`, `photo-123.txt`
- Augmented: `photo-123_aug1.jpg`, `photo-123_aug1.txt`

---
## 3. Augmentation Policy

Augmentation is **only applied to**:

- `dataset/preprocessed/train/images`
- `dataset/preprocessed/train/labels`

Validation and test sets remain **unchanged** to ensure fair evaluation.

### 3.1 Augmentation Factor

In the script:

```python
AUG_PER_IMAGE = 1
```

- For **each original training image**, the pipeline generates **1 augmented copy** (if at least one bounding box survives the transforms).
- Example:
  - If the preprocessed train set has **2715** images, augmentation aims to create up to **2715 new images**, for a total of **≈ 5430** training images.

---

## 4. Augmentation Transforms

Augmentations are implemented with **Albumentations** and operate in **YOLO format** for bounding boxes:

- Format: `(x_center, y_center, width, height)`
- Coordinates: **normalized** to `[0, 1]`

If all bounding boxes are cropped out or become too small after a transform, that particular augmented sample is skipped.

### 4.1 Transform Pipeline

The augmentation pipeline (`build_transform()`) includes:

1. **Horizontal Flip** (`p=0.5`)
   - Simulates left–right variations in object placement.
   - Appropriate because makeup products are symmetric or orientation-invariant.

2. **Random Resized Crop** (`scale=(0.9, 1.0)`, `ratio=(0.9, 1.1)`, `p=0.5`)
   - Applies a mild crop/zoom while keeping output at **640×640**.
   - Encourages robustness to small changes in framing and zoom.

3. **SafeRotate** (`limit=±15°`, `p=0.7`)
   - Rotates the image by up to ±15 degrees.
   - Models slight camera tilt while avoiding extreme rotations.

4. **Affine Shear** (`shear={"x":(-5,5), "y":(-5,5)}`, `p=0.5`)
   - Applies gentle horizontal/vertical shearing.
   - Mimics small perspective distortions.

5. **Hue / Saturation / Value Shift** (`p=0.7`)
   - `hue_shift_limit=15`
   - `sat_shift_limit=25`
   - `val_shift_limit=15`
   - Simulates different lighting conditions and slight color shifts (e.g., different room lights or cameras).

6. **Random Brightness / Contrast** (`p=0.7`)
   - `brightness_limit=0.15`
   - `contrast_limit=0.15`
   - Handles moderate under/overexposure and contrast changes.

7. **Random Gamma** (`gamma_limit=(90, 110)`, `p=0.5`)
   - Models small exposure and tone curve variations.

8. **Gaussian Blur** (`blur_limit=(1, 3)`, `p=0.3`)
   - Simulates mild blur (camera shake or slight focus issues).

9. **GaussNoise** (`var_limit=(5.0, 20.0)`, `p=0.3`)
   - Adds light sensor noise.

10. **Final Resize** (`640×640`)
    - Ensures all augmented images remain the standard YOLO input size.

Bounding boxes are managed with:

```python
bbox_params=A.BboxParams(
    format="yolo",
    label_fields=["class_labels"],
    min_visibility=0.3,
)
```

- Boxes with visibility `< 0.3` are dropped.
- This keeps annotations reasonable after cropping/zooming.

---

## 5. Running the Augmentation Script

From the project root:

```bash
python -m src.training.augment_yolo_train
```

What the script does:

1. Resolves the project root from `__file__`.
2. Locates:
   - `dataset/preprocessed/train/images`
   - `dataset/preprocessed/train/labels`
3. For each image:
   - Loads the image and its `.txt` label file.
   - Applies the Albumentations pipeline `AUG_PER_IMAGE` times.
   - Saves:
     - Augmented image as `*_augX.jpg`
     - Augmented labels as `*_augX.txt`
4. Logs progress every 50 images.
5. Skips images with:
   - Missing labels
   - Failed reads
   - Augmented samples where all bounding boxes are lost.

---

## 6. Using the Augmented Dataset for YOLOv8 Training

After augmentation, the **training images directory** contains:

- Original preprocessed images: `*.jpg`
- Augmented images: `*_aug1.jpg` (and more if `AUG_PER_IMAGE > 1`)

Training uses a YOLO data config YAML that points to the **preprocessed** dataset:

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

> **Note:**  
> This single config file is used for **both preprocessed originals and augmented images**, since they all live under `dataset/preprocessed/train/images`.

---

## 7. Summary

- The Roboflow dataset is first downloaded with `get_data.py`.
- All images are **preprocessed** (auto-orient, RGB, 640×640) into `dataset/preprocessed/…`.
- Augmentation is **only** applied to the preprocessed **train** split using Albumentations.
- The script adds up to `AUG_PER_IMAGE` new images per original while correctly transforming YOLO bounding boxes.
- YOLOv8 training then uses the combined original + augmented dataset via `data_preprocessed.yaml`.

This setup cleanly separates:

- **Preprocessing:** deterministic, one-time image cleaning and resizing  
- **Augmentation:** stochastic, training-data expansion for better generalization.
