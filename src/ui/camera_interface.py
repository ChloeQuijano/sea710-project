import cv2
import tkinter as tk
from tkinter import ttk, filedialog
from PIL import Image, ImageTk
import threading
from ultralytics import YOLO
import numpy as np


class CameraInterface:
    def __init__(self, root):
        self.root = root
        self.root.title("Makeup Recognition Camera Interface")
        self.root.geometry("900x700")
        
        # Camera setup
        self.cap = None
        self.is_running = False
        self.current_frame = None
        
        # YOLO model setup
        self.model = None
        self.model_path = None
        self.confidence_threshold = 0.25
        self.enable_detection = False
        
        # Setup UI
        self.setup_ui()
        
    def setup_ui(self):
        """Create the user interface components"""
        
        # Main container
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Model loading frame
        model_frame = ttk.LabelFrame(main_frame, text="YOLO Model", padding="5")
        model_frame.grid(row=0, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=5)
        
        self.model_status_label = ttk.Label(model_frame, text="No model loaded", 
                                            foreground="red")
        self.model_status_label.grid(row=0, column=0, padx=5)
        
        self.load_model_btn = ttk.Button(model_frame, text="Load Model (.pt)", 
                                         command=self.load_model)
        self.load_model_btn.grid(row=0, column=1, padx=5)
        
        # Detection controls frame
        detection_frame = ttk.LabelFrame(main_frame, text="Detection Controls", padding="5")
        detection_frame.grid(row=1, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=5)
        
        self.detection_toggle = ttk.Checkbutton(detection_frame, text="Enable Detection", 
                                                command=self.toggle_detection)
        self.detection_toggle.grid(row=0, column=0, padx=5)
        
        ttk.Label(detection_frame, text="Confidence:").grid(row=0, column=1, padx=5)
        self.confidence_var = tk.DoubleVar(value=self.confidence_threshold)
        confidence_scale = ttk.Scale(detection_frame, from_=0.1, to=1.0, 
                                    orient=tk.HORIZONTAL, variable=self.confidence_var,
                                    command=self.update_confidence)
        confidence_scale.grid(row=0, column=2, padx=5)
        self.confidence_label = ttk.Label(detection_frame, text=f"{self.confidence_threshold:.2f}")
        self.confidence_label.grid(row=0, column=3, padx=5)
        
        # Video display label
        self.video_label = ttk.Label(main_frame, text="Camera feed will appear here", 
                                     background="black", foreground="white")
        self.video_label.grid(row=2, column=0, columnspan=2, pady=10, sticky=(tk.W, tk.E))
        self.video_label.configure(width=80)
        
        # Control buttons frame
        button_frame = ttk.Frame(main_frame)
        button_frame.grid(row=3, column=0, columnspan=2, pady=10)
        
        # Start camera button
        self.start_btn = ttk.Button(button_frame, text="Start Camera", 
                                    command=self.start_camera)
        self.start_btn.grid(row=0, column=0, padx=5)
        
        # Stop camera button
        self.stop_btn = ttk.Button(button_frame, text="Stop Camera", 
                                   command=self.stop_camera, state="disabled")
        self.stop_btn.grid(row=0, column=1, padx=5)
        
        # Capture frame button
        self.capture_btn = ttk.Button(button_frame, text="Capture Frame", 
                                      command=self.capture_frame, state="disabled")
        self.capture_btn.grid(row=0, column=2, padx=5)
        
        # Status label
        self.status_label = ttk.Label(main_frame, text="Camera: Stopped", 
                                      foreground="red")
        self.status_label.grid(row=4, column=0, columnspan=2, pady=5)
        
        # Detection info label
        self.detection_info_label = ttk.Label(main_frame, text="", foreground="blue")
        self.detection_info_label.grid(row=5, column=0, columnspan=2, pady=5)
        
        # Configure grid weights for resizing
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(0, weight=1)
        model_frame.columnconfigure(0, weight=1)
        detection_frame.columnconfigure(0, weight=1)
        
    def start_camera(self):
        """Initialize and start camera capture"""
        try:
            self.cap = cv2.VideoCapture(0)  # 0 for default webcam
            
            if not self.cap.isOpened():
                self.status_label.config(text="Error: Could not open camera", 
                                        foreground="red")
                return
            
            self.is_running = True
            self.start_btn.config(state="disabled")
            self.stop_btn.config(state="normal")
            self.capture_btn.config(state="normal")
            self.status_label.config(text="Camera: Running", foreground="green")
            
            # Start video capture in a separate thread
            self.video_thread = threading.Thread(target=self.update_frame, daemon=True)
            self.video_thread.start()
            
        except Exception as e:
            self.status_label.config(text=f"Error: {str(e)}", foreground="red")
    
    def stop_camera(self):
        """Stop camera capture"""
        self.is_running = False
        
        if self.cap is not None:
            self.cap.release()
            self.cap = None
        
        self.video_label.config(image='', text="Camera feed stopped")
        self.start_btn.config(state="normal")
        self.stop_btn.config(state="disabled")
        self.capture_btn.config(state="disabled")
        self.status_label.config(text="Camera: Stopped", foreground="red")
    
    def load_model(self):
        model_path = None
        """TODO: Load YOLO model from .pt file
        model_path = filedialog.askopenfilename(
            title="Select YOLO Model",
            filetypes=[("PyTorch models", "*.pt"), ("All files", "*.*")]
        )
        """
        
        if model_path:
            try:
                self.model = YOLO(model_path)
                self.model_path = model_path
                model_name = model_path.split("/")[-1].split("\\")[-1]
                self.model_status_label.config(text=f"Model: {model_name}", 
                                              foreground="green")
                self.status_label.config(text="Model loaded successfully", 
                                        foreground="green")
            except Exception as e:
                self.model_status_label.config(text="Error loading model", 
                                              foreground="red")
                self.status_label.config(text=f"Error: {str(e)}", foreground="red")
    
    def toggle_detection(self):
        """Toggle object detection on/off"""
        self.enable_detection = not self.enable_detection
    
    def update_confidence(self, value):
        """Update confidence threshold"""
        self.confidence_threshold = float(value)
        self.confidence_label.config(text=f"{self.confidence_threshold:.2f}")
    
    def draw_detections(self, frame, results):
        """Draw bounding boxes and labels on frame using OpenCV"""
        detection_count = 0
        
        # Process results
        for result in results:
            boxes = result.boxes
            for box in boxes:
                # Get box coordinates
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
                
                # Get class and confidence
                confidence = float(box.conf[0].cpu().numpy())
                class_id = int(box.cls[0].cpu().numpy())
                
                # Filter by confidence threshold
                if confidence >= self.confidence_threshold:
                    detection_count += 1
                    
                    # Get class name (if available)
                    class_name = result.names[class_id] if hasattr(result, 'names') else f"Class {class_id}"
                    
                    # Draw bounding box
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    
                    # Prepare label text
                    label = f"{class_name}: {confidence:.2f}"
                    
                    # Get text size for background
                    (text_width, text_height), baseline = cv2.getTextSize(
                        label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1
                    )
                    
                    # Draw label background
                    cv2.rectangle(frame, (x1, y1 - text_height - 10), 
                                (x1 + text_width, y1), (0, 255, 0), -1)
                    
                    # Draw label text
                    cv2.putText(frame, label, (x1, y1 - 5), 
                              cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
        
        return frame, detection_count
    
    def update_frame(self):
        """Continuously update video frames from camera with YOLO detection"""
        while self.is_running:
            if self.cap is not None and self.cap.isOpened():
                ret, frame = self.cap.read()
                
                if ret:
                    # Perform detection if enabled and model is loaded
                    if self.enable_detection and self.model is not None:
                        # Run YOLO inference
                        results = self.model(frame, conf=self.confidence_threshold, verbose=False)
                        
                        # Draw detections on frame
                        frame, detection_count = self.draw_detections(frame.copy(), results)
                        
                        # Update detection info
                        self.detection_info_label.config(
                            text=f"Detections: {detection_count}"
                        )
                    else:
                        self.detection_info_label.config(text="")
                    
                    self.current_frame = frame.copy()
                    
                    # Convert BGR to RGB for display
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    
                    # Resize frame to fit display (optional)
                    height, width = frame_rgb.shape[:2]
                    max_width = 860
                    if width > max_width:
                        scale = max_width / width
                        new_width = int(width * scale)
                        new_height = int(height * scale)
                        frame_rgb = cv2.resize(frame_rgb, (new_width, new_height))
                    
                    # Convert to PhotoImage for Tkinter
                    image = Image.fromarray(frame_rgb)
                    photo = ImageTk.PhotoImage(image=image)
                    
                    # Update label with new frame
                    self.video_label.config(image=photo, text="")
                    self.video_label.image = photo  # Keep a reference
                
        # Release camera when stopping
        if self.cap is not None:
            self.cap.release()
    
    def capture_frame(self):
        """Save current frame to file"""
        if self.current_frame is not None:
            filename = f"captured_frame_{cv2.getTickCount()}.jpg"
            cv2.imwrite(filename, self.current_frame)
            self.status_label.config(text=f"Frame saved: {filename}", 
                                    foreground="blue")
    
    def __del__(self):
        """Cleanup when closing"""
        if self.cap is not None:
            self.cap.release()


def main():
    """Main function to run the application"""
    root = tk.Tk()
    app = CameraInterface(root)
    
    # Handle window closing
    def on_closing():
        app.stop_camera()
        root.destroy()
    
    root.protocol("WM_DELETE_WINDOW", on_closing)
    root.mainloop()


if __name__ == "__main__":
    main()

