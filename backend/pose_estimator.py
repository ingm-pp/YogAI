import cv2
import mediapipe as mp
import numpy as np
from typing import List, Dict, Any

class PoseEstimator:
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.mp_drawing = mp.solutions.drawing_utils
        self.pose = self.mp_pose.Pose(
            static_image_mode=True,
            model_complexity=2,
            enable_segmentation=False,
            min_detection_confidence=0.5
        )
    
    def estimate_pose(self, image_path: str) -> Dict[str, Any]:
        """
        Estimate pose from image and return keypoints
        """
        # Read image
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not read image from {image_path}")
        
        # Convert BGR to RGB
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.pose.process(image_rgb)
        
        if not results.pose_landmarks:
            return {'keypoints': None, 'image_with_pose': None}
        
        # Extract keypoints
        keypoints = []
        for idx, landmark in enumerate(results.pose_landmarks.landmark):
            keypoints.append({
                'x': landmark.x,
                'y': landmark.y,
                'z': landmark.z,
                'visibility': landmark.visibility
            })
        
        # Draw pose landmarks on image
        annotated_image = image.copy()
        self.mp_drawing.draw_landmarks(
            annotated_image,
            results.pose_landmarks,
            self.mp_pose.POSE_CONNECTIONS,
            self.mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=2),
            self.mp_drawing.DrawingSpec(color=(0, 0, 255), thickness=2, circle_radius=2)
        )
        
        # Save annotated image
        output_path = image_path.replace('.jpg', '_annotated.jpg').replace('.png', '_annotated.png')
        cv2.imwrite(output_path, annotated_image)
        
        return {
            'keypoints': keypoints,
            'image_with_pose': output_path,
            'landmarks': results.pose_landmarks
        }
    
    def close(self):
        self.pose.close()