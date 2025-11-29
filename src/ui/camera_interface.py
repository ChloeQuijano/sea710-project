import cv2
import tkinter as tk
from tkinter import ttk
from PIL import Image, ImageTk
import threading


class CameraInterface:
    def __init__(self, root):
        self.root = root
        self.root.title("Camera")
        self.root.geometry("800x600")
        
        # Camera setup
        self.cap = None
        self.is_running = False
        self.current_frame = None
        
        # Setup UI
        self.setup_ui()
        
    def setup_ui(self):
        """Create the user interface components"""
        
        # Main container
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Video display label
        self.video_label = ttk.Label(main_frame, text="Camera feed will appear here", 
                                     background="black", foreground="white")
        self.video_label.grid(row=0, column=0, columnspan=2, pady=10, sticky=(tk.W, tk.E))
        self.video_label.configure(width=80)
        
        # Control buttons frame
        button_frame = ttk.Frame(main_frame)
        button_frame.grid(row=1, column=0, columnspan=2, pady=10)
        
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
        self.status_label.grid(row=2, column=0, columnspan=2, pady=5)
        
        # Configure grid weights for resizing
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(0, weight=1)
        
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
    
    def update_frame(self):
        """Continuously update video frames from camera"""
        while self.is_running:
            if self.cap is not None and self.cap.isOpened():
                ret, frame = self.cap.read()
                
                if ret:
                    self.current_frame = frame.copy()
                    
                    # Convert BGR to RGB for display
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    
                    # Resize frame to fit display (optional)
                    height, width = frame_rgb.shape[:2]
                    max_width = 760
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

