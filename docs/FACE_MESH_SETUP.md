# MediaPipe Face Mesh Setup Guide

## Backend Setup

### 1. Install MediaPipe

```bash
pip install mediapipe
```

Or add to `requirements.txt` (already added):
```
mediapipe
```

### 2. Restart Backend Server

After installing MediaPipe, restart your backend server:

```bash
python -m src.api.main
```

### 3. Test Face Mesh Endpoint

You can test the face mesh endpoint using:

```bash
curl -X POST "http://localhost:8000/detect-face-mesh?draw_mesh=false" \
  -F "image=@path/to/face_image.jpg"
```

Or use the Swagger UI at http://localhost:8000/docs

## Mobile App Integration

The mobile app will automatically:
1. Capture frames from the front-facing camera every 500ms
2. Send frames to the backend `/detect-face-mesh` endpoint
3. Display face mesh landmarks as an overlay when a face is detected

## API Endpoint

### POST `/detect-face-mesh`

**Parameters:**
- `image`: Image file (multipart/form-data)
- `draw_mesh`: Boolean (optional, default: false) - If true, returns annotated image

**Response:**
```json
{
  "status": "success",
  "face_detected": true,
  "landmarks": [
    {"x": 100.0, "y": 150.0, "z": 0.0},
    ...
  ],
  "bbox": {
    "x": 50.0,
    "y": 100.0,
    "width": 200.0,
    "height": 250.0
  },
  "num_landmarks": 468,
  "facial_regions": {
    "upper_lip": [...],
    "lower_lip": [...],
    "left_eye": [...],
    "right_eye": [...],
    "face_oval": [...]
  }
}
```

## Features

- **468 Face Landmarks**: Full face mesh detection
- **Facial Regions**: Extracted regions for lips, eyes, face contour
- **Real-time Detection**: Optimized for mobile camera frames
- **Bounding Box**: Face detection bounding box
- **Facial Regions**: Pre-extracted regions for makeup application

## Troubleshooting

### MediaPipe Installation Issues

If you encounter installation errors:
```bash
# Try upgrading pip first
pip install --upgrade pip

# Then install mediapipe
pip install mediapipe
```

### Face Not Detected

- Ensure good lighting
- Face should be clearly visible
- Check camera permissions
- Verify backend is running and MediaPipe is installed

### Performance Issues

- The detection runs every 500ms by default
- Adjust `FACE_DETECTION_INTERVAL` in `FaceCameraScreen.js` if needed
- Reduce image quality in `takePictureAsync` if performance is slow

