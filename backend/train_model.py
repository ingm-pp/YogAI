import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import cross_val_score
import os

class PoseTrainer:
    def __init__(self):
        self.models = {
            'random_forest': RandomForestClassifier(n_estimators=100, random_state=42),
            'svm': SVC(probability=True, random_state=42),
            'mlp': MLPClassifier(hidden_layer_sizes=(100, 50), max_iter=1000, random_state=42)
        }
        self.best_model = None
        self.label_encoder = None
    
    def load_data(self, data_path):
        """Charge les données préparées"""
        X = np.load(f'{data_path}/features.npy')
        y = np.load(f'{data_path}/labels.npy')
        self.label_encoder = joblib.load(f'{data_path}/label_encoder.pkl')
        
        return X, y
    
    def train_models(self, X_train, y_train):
        """Entraîne plusieurs modèles et sélectionne le meilleur"""
        y_encoded = self.label_encoder.transform(y_train)
        best_score = 0
        best_model_name = None
        
        for name, model in self.models.items():
            print(f"Entraînement du modèle: {name}")
            
            # Validation croisée
            scores = cross_val_score(model, X_train, y_encoded, cv=5)
            mean_score = np.mean(scores)
            print(f"  Score CV: {mean_score:.3f} (+/- {np.std(scores):.3f})")
            
            if mean_score > best_score:
                best_score = mean_score
                best_model_name = name
                self.best_model = model
        
        # Entraînement final du meilleur modèle
        print(f"\nMeilleur modèle: {best_model_name}")
        self.best_model.fit(X_train, y_encoded)
        
        return best_model_name, best_score
    
    def evaluate_model(self, X_test, y_test):
        """Évalue le modèle sur les données de test"""
        y_pred = self.best_model.predict(X_test)
        y_test_encoded = self.label_encoder.transform(y_test)
        
        accuracy = accuracy_score(y_test_encoded, y_pred)
        print(f"\nAccuracy sur le test set: {accuracy:.3f}")
        print("\nRapport de classification:")
        print(classification_report(y_test_encoded, y_pred, 
                                  target_names=self.label_encoder.classes_))
        
        return accuracy
    
    def save_model(self, output_path):
        """Sauvegarde le modèle entraîné"""
        if not os.path.exists(output_path):
            os.makedirs(output_path)
        
        joblib.dump(self.best_model, f'{output_path}/pose_classifier.pkl')
        print(f"Modèle sauvegardé dans {output_path}/pose_classifier.pkl")

if __name__ == "__main__":
    trainer = PoseTrainer()
    
    # Chargement des données
    X_train, y_train = trainer.load_data('../ml_core')
    X_test, y_test = trainer.load_data('../ml_core')
    
    # Entraînement
    best_model_name, best_score = trainer.train_models(X_train, y_train)
    
    # Évaluation
    trainer.evaluate_model(X_test, y_test)
    
    # Sauvegarde
    trainer.save_model('../ml_core')