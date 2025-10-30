import os
import json
import numpy as np
import pandas as pd
from pose_estimator import PoseEstimator
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import joblib

class DataPreprocessor:
    def __init__(self):
        self.pose_estimator = PoseEstimator()
        self.label_encoder = LabelEncoder()
    
    def extract_features_from_keypoints(self, keypoints):
        """
        Extrait les features des keypoints MediaPipe
        """
        if not keypoints:
            return None
        
        features = []
        
        # 1. Positions normalisées des points clés (x, y)
        for kp in keypoints:
            features.extend([kp['x'], kp['y']])
        
        # 2. Angles articulaires importants
        angles = self.calculate_all_angles(keypoints)
        features.extend(angles.values())
        
        # 3. Distances et ratios
        distances = self.calculate_distances(keypoints)
        features.extend(distances.values())
        
        return np.array(features)
    
    def calculate_all_angles(self, keypoints):
        """Calcule tous les angles articulaires"""
        angles = {}
        
        # Définition des triplets pour calcul d'angles
        angle_points = [
            ('left_elbow', [11, 13, 15]),      # Épaule, coude, poignet gauche
            ('right_elbow', [12, 14, 16]),     # Épaule, coude, poignet droit
            ('left_knee', [23, 25, 27]),       # Hanche, genou, cheville gauche
            ('right_knee', [24, 26, 28]),      # Hanche, genou, cheville droit
            ('left_hip', [11, 23, 25]),        # Épaule, hanche, genou gauche
            ('right_hip', [12, 24, 26]),       # Épaule, hanche, genou droit
            ('left_shoulder', [13, 11, 23]),   # Coude, épaule, hanche gauche
            ('right_shoulder', [14, 12, 24]),  # Coude, épaule, hanche droit
        ]
        
        for angle_name, (a, b, c) in angle_points:
            if all(idx < len(keypoints) for idx in [a, b, c]):
                angle = self.calculate_angle(keypoints[a], keypoints[b], keypoints[c])
                angles[angle_name] = angle
        
        return angles
    
    def calculate_distances(self, keypoints):
        """Calcule les distances et ratios importants"""
        distances = {}
        
        # Distances entre points symétriques (pour la symétrie)
        if len(keypoints) > 24:
            # Épaules
            shoulder_width = abs(keypoints[11]['x'] - keypoints[12]['x'])
            distances['shoulder_width'] = shoulder_width
            
            # Hanches
            hip_width = abs(keypoints[23]['x'] - keypoints[24]['x'])
            distances['hip_width'] = hip_width
            
            # Ratio épaule/hanche
            if hip_width > 0:
                distances['shoulder_hip_ratio'] = shoulder_width / hip_width
        
        return distances
    
    def calculate_angle(self, a, b, c):
        """Calcule l'angle entre trois points"""
        ba = np.array([a['x'] - b['x'], a['y'] - b['y']])
        bc = np.array([c['x'] - b['x'], c['y'] - b['y']])
        
        cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-8)
        angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
        return np.degrees(angle)
    
    def process_dataset(self, dataset_path):
        """
        Traite tout le dataset et extrait les features
        """
        features_list = []
        labels_list = []
        
        # Parcours des dossiers de postures
        for pose_name in os.listdir(dataset_path):
            pose_path = os.path.join(dataset_path, pose_name)
            
            if os.path.isdir(pose_path):
                print(f"Traitement de la posture: {pose_name}")
                
                for image_file in os.listdir(pose_path):
                    if image_file.lower().endswith(('.png', '.jpg', '.jpeg')):
                        image_path = os.path.join(pose_path, image_file)
                        
                        try:
                            # Estimation de la pose
                            pose_result = self.pose_estimator.estimate_pose(image_path)
                            
                            if pose_result['keypoints']:
                                # Extraction des features
                                features = self.extract_features_from_keypoints(pose_result['keypoints'])
                                
                                if features is not None:
                                    features_list.append(features)
                                    labels_list.append(pose_name)
                        
                        except Exception as e:
                            print(f"Erreur avec {image_path}: {e}")
        
        return np.array(features_list), np.array(labels_list)
    
    def save_dataset(self, features, labels, output_path):
        """Sauvegarde le dataset traité"""
        # CRÉATION DU DOSSIER SI IL N'EXISTE PAS
        os.makedirs(output_path, exist_ok=True)
        
        np.save(f'{output_path}/features.npy', features)
        np.save(f'{output_path}/labels.npy', labels)
        
        # Sauvegarde du label encoder
        encoded_labels = self.label_encoder.fit_transform(labels)
        joblib.dump(self.label_encoder, f'{output_path}/label_encoder.pkl')
        
        print(f"Dataset sauvegardé avec {len(features)} échantillons")
        print(f"Classes: {self.label_encoder.classes_}")

if __name__ == "__main__":
    preprocessor = DataPreprocessor()
    
    # Traitement des données d'entraînement
    print("Traitement du dataset TRAIN...")
    X_train, y_train = preprocessor.process_dataset(r'../data/DATASET/TRAIN')
    preprocessor.save_dataset(X_train, y_train, '../ml_core')
    
    # Traitement des données de test
    print("\nTraitement du dataset TEST...")
    X_test, y_test = preprocessor.process_dataset(r'../data/DATASET/TEST')
    preprocessor.save_dataset(X_test, y_test, '../ml_core')