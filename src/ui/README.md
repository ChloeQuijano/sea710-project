# Camera Interface Example

This directory contains a simple web camera capture interface example for the project.

## Files

- `camera_interface.py` - Basic camera capture interface using OpenCV and Tkinter

## Requirements

Install the required packages:

```bash
pip install opencv-python
pip install pillow
pip install ultralytics
pip install numpy
```

Note: Tkinter comes with Python by default.

## Usage

Run the camera interface:

```bash
python src/ui/camera_interface.py
```

## Features

- **Camera Controls:**
  - Start/Stop camera capture
  - Live video feed display
  - Capture and save individual frames
  
- **YOLO Model Integration:**
  - Load YOLO models (.pt format)
  - Real-time object detection on camera feed
  - Bounding box annotation using OpenCV
  - Class labels and confidence scores displayed
  - Adjustable confidence threshold slider
  - Toggle detection on/off
  
- **Technical:**
  - Thread-safe video capture (doesn't freeze UI)
  - Status indicators
  - Detection count display

## Usage

### Basic Camera Capture

1. Start the application: `python src/ui/camera_interface.py`
2. Click "Start Camera" to begin video feed
3. Click "Capture Frame" to save current frame

### With YOLO Detection

1. **Load your trained model:**
   - Click "Load Model (.pt)" button
   - Select your YOLO model file (e.g., `models/final/best.pt`)

2. **Enable detection:**
   - Check "Enable Detection" checkbox
   - Adjust confidence threshold using the slider (0.1 to 1.0)

3. **View detections:**
   - Bounding boxes will appear around detected objects
   - Labels show class name and confidence score
   - Detection count is displayed below the video feed

## Drawing Bounding Boxes with OpenCV

The interface uses OpenCV to draw bounding boxes:

```python
# Draw rectangle for bounding box
cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

# Draw label background and text
cv2.putText(frame, label, (x1, y1 - 5), 
          cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
```

The `draw_detections()` method processes YOLO results and draws:
- Green bounding boxes around detected objects
- Class name and confidence score labels
- Filtered by confidence threshold

## Extending the Interface

You can further enhance by:
- Adding filters by facial region (eyes, lips, skin)
- Adding product selection interface
- Saving detection results
- Adding video recording with annotations
- Customizing colors per class

