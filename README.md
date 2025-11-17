# YogAI
Application de coaching automatique de yoga basée sur l'estimation de posture


## Contaxte et Intérêt du projet

Ce projet vise à créer une application de coaching automatisé capable d'analyser la posture d'un utilisateur via une image ou une vidéo. Elle évaluera la qualité d'éxécution grâce à des algorithmes d'estimation de posture et fournira des retours incluant une analyse de la qualité de la pose, des corrections précides et des exercices personnalisés. 

### Architecture du Backend

Framework : Flask
Base de données : MongoDB (avec mode démo intégré)
Authentification : JWT + bcrypt
ML : Scikit-learn, MediaPipe, OpenCV
CORS : Configuré pour le frontend

Structure des fichiers:

backend/  
├── app.py              # Application principale Flask  
├── auth.py             # Gestion de l'authentification  
├── database.py         # Abstraction MongoDB  
├── pose_estimator.py   # Détection de poses avec MediaPipe  
├── data_preprocessor.py # Prétraitement des données ML  
├── pose_analyzer_ml.py # Analyse et évaluation des postures  
├── train_model.py      # Entraînement des modèles ML  
├── train_full.py       # Script d'entraînement complet  
├── check_database.py   # Utilitaire de vérification DB  
└── requirements.txt    # Dépendances  

🎯 Fonctionnalités Principales
1. Authentification & Utilisateurs
Inscription/Connexion sécurisée
Tokens JWT (30 jours)
Profils utilisateurs avec préférences
Middleware de protection des routes

2. Analyse des Postures
Détection des points clés avec MediaPipe
Classification ML (Random Forest, SVM, MLP)
Analyse de qualité avec 5 métriques: Alignement, Stabilité, Symétrie, Amplitude articulaire, Technique
Feedback personnalisé avec conseils

3. Gestion des Données
Historique des analyses
Statistiques détaillées
Tendances de progression
Recommandations d'exercices

4. Postures Supportées
Downward Dog, Warrior II, Tree Pose, Goddess Pose, Plank
Chaque posture avec : cibles d'angles, bénéfices, difficulté