"""
MediaPipe Face Mesh Detection
Handles face detection and mesh landmark extraction using MediaPipe
"""
import cv2
import numpy as np
import mediapipe as mp
from typing import List, Tuple, Optional

# Initialize MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

class FaceMeshDetector:
    """Face mesh detector using MediaPipe"""
    
    def __init__(self):
        self.face_mesh = mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
    
    def detect_face_mesh(self, image: np.ndarray) -> Optional[dict]:
        """
        Detect face mesh landmarks in an image
        
        Args:
            image: Input image as numpy array (BGR format from OpenCV)
        
        Returns:
            Dictionary with face mesh data or None if no face detected
        """
        # Convert BGR to RGB for MediaPipe
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Process the image
        results = self.face_mesh.process(rgb_image)
        
        if not results.multi_face_landmarks:
            return None
        
        # Get the first face (we only support one face)
        face_landmarks = results.multi_face_landmarks[0]
        
        # Extract landmark coordinates
        h, w = image.shape[:2]
        landmarks = []
        
        for landmark in face_landmarks.landmark:
            landmarks.append({
                'x': float(landmark.x * w),
                'y': float(landmark.y * h),
                'z': float(landmark.z * w),  # z is relative to image width
            })
        
        # Get face bounding box from landmarks
        x_coords = [lm['x'] for lm in landmarks]
        y_coords = [lm['y'] for lm in landmarks]
        
        bbox = {
            'x': float(min(x_coords)),
            'y': float(min(y_coords)),
            'width': float(max(x_coords) - min(x_coords)),
            'height': float(max(y_coords) - min(y_coords)),
        }
        
        return {
            'landmarks': landmarks,
            'bbox': bbox,
            'num_landmarks': len(landmarks),
        }
    
    def draw_face_mesh(self, image: np.ndarray, face_data: dict) -> np.ndarray:
        """
        Draw face mesh on image
        
        Args:
            image: Input image
            face_data: Face mesh data from detect_face_mesh
        
        Returns:
            Image with face mesh drawn
        """
        # Convert to RGB for drawing
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        annotated_image = rgb_image.copy()
        
        # Draw landmarks as small points
        for landmark in face_data['landmarks']:
            x, y = int(landmark['x']), int(landmark['y'])
            cv2.circle(annotated_image, (x, y), 2, (0, 255, 0), -1)
        
        # Draw bounding box
        bbox = face_data['bbox']
        cv2.rectangle(
            annotated_image,
            (int(bbox['x']), int(bbox['y'])),
            (int(bbox['x'] + bbox['width']), int(bbox['y'] + bbox['height'])),
            (0, 255, 0),
            2
        )
        
        # Convert back to BGR
        return cv2.cvtColor(annotated_image, cv2.COLOR_RGB2BGR)
    
    def get_facial_regions(self, face_data: dict) -> dict:
        """
        Extract specific facial regions from landmarks
        Useful for makeup application (lips, eyes, cheeks, etc.)
        
        MediaPipe Face Mesh has 468 landmarks with specific indices for facial features.
        This function extracts key regions for makeup application.
        
        Args:
            face_data: Face mesh data from detect_face_mesh
        
        Returns:
            Dictionary with facial region landmarks
        """
        landmarks = face_data['landmarks']
        
        # MediaPipe Face Mesh landmark indices (468 total landmarks)
        # These are approximate and may need adjustment based on MediaPipe version
        
        # Lips region (indices 61-68, 78-96)
        upper_lip_indices = list(range(61, 68)) + list(range(78, 84))
        lower_lip_indices = list(range(84, 96))
        
        # Left eye (indices 33-42)
        left_eye_indices = list(range(33, 42))
        
        # Right eye (indices 263-272)
        right_eye_indices = list(range(263, 272))
        
        # Face contour/oval (indices 10-15, 234-250)
        face_oval_indices = list(range(10, 15)) + list(range(234, 250))
        
        # Filter valid indices
        def get_landmarks(indices):
            return [landmarks[i] for i in indices if 0 <= i < len(landmarks)]
        
        return {
            'upper_lip': get_landmarks(upper_lip_indices),
            'lower_lip': get_landmarks(lower_lip_indices),
            'left_eye': get_landmarks(left_eye_indices),
            'right_eye': get_landmarks(right_eye_indices),
            'face_oval': get_landmarks(face_oval_indices),
        }

# Global face mesh detector instance
face_mesh_detector: Optional[FaceMeshDetector] = None

def get_face_mesh_detector() -> FaceMeshDetector:
    """Get or create face mesh detector instance"""
    global face_mesh_detector
    if face_mesh_detector is None:
        face_mesh_detector = FaceMeshDetector()
    return face_mesh_detector

