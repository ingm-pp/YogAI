#!/usr/bin/env python3
"""
Script complet pour l'entraînement du modèle ML
"""

import sys
import os

# Ajouter le répertoire courant au chemin Python
sys.path.append(os.path.dirname(__file__))

from data_preprocessor import DataPreprocessor
from train_model import PoseTrainer

def main():
    print("\n🚀 Démarrage de l'entraînement du modèle...")
    
    # 1. Prétraitement des données
    print("\n📊 Étape 1: Prétraitement des données...")
    preprocessor = DataPreprocessor()
    
    # Chemins absolus vers les datasets
    train_path = os.path.join(os.path.dirname(__file__), '..','data', 'DATASET', 'TRAIN')
    test_path = os.path.join(os.path.dirname(__file__), '..','data', 'DATASET', 'TEST')
    models_path = os.path.join(os.path.dirname(__file__), '..','ml_core')
    
    print("Traitement des données d'entraînement...")
    X_train, y_train = preprocessor.process_dataset(train_path)
    preprocessor.save_dataset(X_train, y_train, models_path)
    print("✅ Données d'entraînement prétraitées et sauvegardées")
    
    print("Traitement des données de test...")
    X_test, y_test = preprocessor.process_dataset(test_path)
    preprocessor.save_dataset(X_test, y_test, models_path)
    print("✅ Données de test prétraitées et sauvegardées")
    
    # 2. Entraînement du modèle
    print("\n🧠 Étape 2: Entraînement du modèle...")
    trainer = PoseTrainer()
    
    # 🔥 CORRECTION : Charger les données AVANT l'entraînement
    print("Chargement des données et du label encoder...")
    X_train_loaded, y_train_loaded = trainer.load_data(models_path)
    X_test_loaded, y_test_loaded = trainer.load_data(models_path)
    
    print(f"Données chargées: {len(X_train_loaded)} échantillons d'entraînement, {len(X_test_loaded)} échantillons de test")
    print(f"Classes disponibles: {trainer.label_encoder.classes_}")
    
    # Maintenant on peut entraîner
    best_model_name, accuracy = trainer.train_models(X_train_loaded, y_train_loaded)
    test_accuracy = trainer.evaluate_model(X_test_loaded, y_test_loaded)
    
    # 3. Sauvegarde du modèle
    print("\n💾 Étape 3: Sauvegarde du modèle...")
    trainer.save_model(models_path)
    
    print(f"\n🎉 Entraînement terminé !")
    print(f"📈 Meilleur modèle: {best_model_name}")
    print(f"📊 Accuracy entraînement: {accuracy:.3f}")
    print(f"📊 Accuracy test: {test_accuracy:.3f}")

if __name__ == "__main__":
    main()