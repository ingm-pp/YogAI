from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import uuid
import base64
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
from bson import ObjectId

# Configuration pour réduire les logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
import absl.logging
absl.logging.set_verbosity(absl.logging.ERROR)

# Import des modules
from database import db
from auth import auth_manager

# 🔥 CORRECTION: Importer les modules APRÈS la création de l'app
try:
    from pose_analyzer_ml import MLAnalyzer
    
    # Initialisation des composants
    pose_analyzer = MLAnalyzer()
    
except ImportError as e:
    print(f"⚠️ Attention: {e}")
    print("⚠️ Certains modules ne sont pas disponibles, mode démo activé")
    pose_analyzer = None

app = Flask(__name__)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Créer le dossier uploads
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Configuration CORS
CORS(app, resources={
    r"/*": {
        "origins": ["http://127.0.0.1:5173","http://localhost:5173"],#"http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8000",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
        "supports_credentials": True,
        "expose_headers": ["Content-Range", "X-Total-Count"]
    }
})

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Middleware d'authentification
def get_current_user():
    """Récupère l'utilisateur courant à partir du token"""
    token = request.headers.get('Authorization')
    if not token or not token.startswith('Bearer '):
        return None
    
    try:
        token = token.split(' ')[1]
        user_id = auth_manager.verify_token(token)
        return db.find_user_by_id(user_id)
    except:
        return None

def login_required(f):
    """Décorateur pour les routes protégées"""
    from functools import wraps
    
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Authentication required'}), 401
        return f(user, *args, **kwargs)
    
    return decorated_function

# Routes de base
@app.route('/')
def hello():
    return jsonify({"message": "Yoga Pose Analysis API", "status": "running"})

@app.route('/health')
def health_check():
    return jsonify({"status": "healthy"})

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    """Serve uploaded files"""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Routes d'authentification
@app.route('/api/register', methods=['POST'])
def register():
    """Inscription d'un nouvel utilisateur"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        first_name = data.get('firstName', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        user_data = {
            'first_name': first_name,
            'level': 'beginner',
            'goals': [],
            'created_at': datetime.utcnow()
        }
        
        # ✅ APPEL SIMPLIFIÉ
        token, user_id = auth_manager.register_user(email, password, user_data)
        
        # ✅ RÉCUPÉRER L'UTILISATEUR COMPLET
        user = db.find_user_by_id(user_id)
        
        return jsonify({
            'message': 'User registered successfully',
            'token': token,
            'user': {
                'id': user_id,
                'email': user['email'],
                'profile': user.get('profile', {}),
                # ✅ first_name vient toujours de profile
                'first_name': user.get('profile', {}).get('first_name', '')
            }
        }), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Registration failed'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """Connexion d'un utilisateur"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # ✅ APPEL SIMPLIFIÉ
        token, user_id = auth_manager.login_user(email, password)
        user = db.find_user_by_id(user_id)
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': user_id,
                'email': user['email'],
                'profile': user.get('profile', {}),
                # ✅ STRUCTURE COHÉRENTE
                'first_name': user.get('profile', {}).get('first_name', '')
            }
        })
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 401
    except Exception as e:
        return jsonify({'error': 'Login failed'}), 500
    
@app.route('/api/me', methods=['GET'])
@login_required
def get_current_user_profile(user):
    """Récupère le profil de l'utilisateur connecté"""
    return jsonify({
        'user': {
            'id': str(user['_id']),
            'email': user['email'],
            'profile': user.get('profile', {}),
            'preferences': user.get('preferences', {}),
            'first_name': user.get('profile', {}).get('first_name', '') 
        }
    })

# Routes pour les postures
@app.route('/api/postures/available', methods=['GET'])
@login_required
def get_available_postures(user):
    """Retourne la liste des postures que l'IA peut détecter"""
    postures = [
        {
            'id': 'downdog',
            'name': 'Downward Dog',
            'icon': '🐕',
            'description': 'Posture de chien tête en bas, excellente pour l\'étirement complet',
            'benefits': 'Étire les ischio-jambiers, renforce les bras et les épaules',
            'difficulty': 'beginner',
            'musclesWorked': ['Épaules', 'Ischio-jambiers', 'Mollets'],
            'breathingTips': '5-10 respirations profondes',
            'targetAngles': {
                'left_shoulder': 90,
                'right_shoulder': 90,
                'left_hip': 90,
                'right_hip': 90
            }
        },
        {
            'id': 'warrior2',
            'name': 'Warrior II',
            'icon': '⚔️',
            'description': 'Posture de guerrier pour la force et la stabilité',
            'benefits': 'Renforce les jambes, améliore l\'équilibre',
            'difficulty': 'beginner',
            'musclesWorked': ['Cuisses', 'Fessiers', 'Épaules'],
            'breathingTips': '5-8 respirations par côté',
            'targetAngles': {
                'left_knee': 90,
                'right_knee': 90,
                'left_hip': 45,
                'right_hip': 45
            }
        },
        {
            'id': 'tree',
            'name': 'Tree Pose',
            'icon': '🌳',
            'description': 'Posture de l\'arbre pour l\'enracinement et l\'équilibre',
            'benefits': 'Améliore l\'équilibre, concentration',
            'difficulty': 'beginner',
            'musclesWorked': ['Jambes', 'Abdominaux', 'Dos'],
            'breathingTips': '5-10 respirations profondes',
            'targetAngles': {
                'left_hip': 45,
                'right_hip': 45
            }
        },
        {
            'id': 'goddess',
            'name': 'Goddess Pose',
            'icon': '👸',
            'description': 'Posture de la déesse pour la puissance et l\'ouverture',
            'benefits': 'Renforce les cuisses, ouverture des hanches',
            'difficulty': 'intermediate',
            'musclesWorked': ['Cuisses', 'Hanches', 'Épaules'],
            'breathingTips': '5-8 respirations profondes',
            'targetAngles': {
                'left_knee': 90,
                'right_knee': 90,
                'left_hip': 45,
                'right_hip': 45
            }
        },
        {
            'id': 'plank',
            'name': 'Plank',
            'icon': '💪',
            'description': 'Posture de la planche pour la force centrale',
            'benefits': 'Renforce le core, bras et épaules',
            'difficulty': 'beginner',
            'musclesWorked': ['Abdominaux', 'Épaules', 'Bras'],
            'breathingTips': '3-5 respirations profondes',
            'targetAngles': {
                'left_shoulder': 180,
                'right_shoulder': 180,
                'left_hip': 180,
                'right_hip': 180
            }
        }
    ]
    
    return jsonify(postures)

# Routes pour l'analyse
@app.route('/analyze', methods=['POST'])
@login_required
def analyze_pose(user):
    """Analyse les keypoints MediaPipe envoyés du frontend"""
    try:
        data = request.get_json()
        
        # Récupérer les keypoints du frontend
        keypoints = data.get('keypoints')
        if not keypoints:
            return jsonify({'error': 'No keypoints provided'}), 400
        
        # Sauvegarder l'image si fournie (optionnel)
        image_url = None
        if 'image' in data:
            # Générer un nom de fichier unique
            filename = f"{uuid.uuid4()}.jpg"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            
            # Décoder et sauvegarder l'image base64
            image_data = data['image'].split(',')[1]  # Enlever le header base64
            with open(filepath, 'wb') as f:
                f.write(base64.b64decode(image_data))
            image_url = f"/uploads/{filename}"
        
        # Analyse des keypoints avec le modèle ML
        analysis_result = pose_analyzer.analyze_pose(keypoints)
        
        # Ajouter l'URL de l'image si sauvegardée
        if image_url:
            analysis_result['image_url'] = image_url
        
        # Sauvegarde dans l'historique utilisateur
        analysis_record = {
            'pose_name': analysis_result['pose_name'],
            'score': analysis_result['score'],
            'confidence': analysis_result['confidence'],
            'level': analysis_result.get('level', 'beginner'),
            'angles': analysis_result.get('angles', {}),
            'quality_metrics': analysis_result.get('quality_metrics', {}),
            'feedback': analysis_result.get('feedback', []),
            'strengths': analysis_result.get('strengths', []),
            'improvements': analysis_result.get('improvements', []),
            'priority_feedback': analysis_result.get('priority_feedback', []),
            'exercise_recommendation': analysis_result.get('exercise_recommendation', {}),
            'image_url': image_url,
            'date': datetime.utcnow()
        }
        
        db.add_pose_analysis(str(user['_id']), analysis_record)
        analysis_result['saved_to_history'] = True
        
        return jsonify(analysis_result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Routes pour l'historique et statistiques
@app.route('/api/user/history', methods=['GET'])
@login_required
def get_user_history(user):
    """Récupère l'historique des analyses"""
    user_data = db.find_user_by_id(str(user['_id']))
    history = user_data.get('posture_history', [])
    
    # Trier par date décroissante
    history.sort(key=lambda x: x.get('date', datetime.min), reverse=True)
    
    return jsonify(history)

@app.route('/api/user/stats', methods=['GET'])
@login_required
def get_user_stats(user):
    """Récupère les statistiques de l'utilisateur"""
    stats = db.get_user_stats(str(user['_id']))
    return jsonify(stats or {})

@app.route('/api/user/detailed-stats', methods=['GET'])
@login_required
def get_detailed_stats(user):
    """Retourne des statistiques détaillées pour le dashboard"""
    try:
        user_data = db.find_user_by_id(str(user['_id']))
        history = user_data.get('posture_history', [])
        
        if not history:
            return jsonify({
                'total_sessions': 0,
                'average_score': 0,
                'progress_trend': 'stable',
                'level_distribution': {},
                'weekly_activity': [],
                'favorite_pose': None,
                'recent_improvements': []
            })
        
        # Calcul des statistiques de base
        total_sessions = len(history)
        average_score = sum(session.get('score', 0) for session in history) / total_sessions
        
        # Distribution des niveaux
        level_distribution = {}
        for session in history:
            level = session.get('level', 'beginner')
            level_distribution[level] = level_distribution.get(level, 0) + 1
        
        # Activité hebdomadaire (4 dernières semaines)
        weekly_activity = calculate_weekly_activity(history)
        
        # Posture favorite
        pose_counts = {}
        for session in history:
            pose = session.get('pose_name', 'unknown')
            pose_counts[pose] = pose_counts.get(pose, 0) + 1
        favorite_pose = max(pose_counts, key=pose_counts.get) if pose_counts else None
        
        # Tendances de progression
        recent_improvements = calculate_recent_improvements(history)
        
        return jsonify({
            'total_sessions': total_sessions,
            'average_score': round(average_score, 1),
            'progress_trend': calculate_progress_trend(history),
            'level_distribution': level_distribution,
            'weekly_activity': weekly_activity,
            'favorite_pose': favorite_pose,
            'recent_improvements': recent_improvements,
            'best_session': get_best_session(history),
            'current_streak': calculate_current_streak(history)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Routes pour la gestion du profil
@app.route('/api/user/profile', methods=['PUT'])
@login_required
def update_profile(user):
    """Met à jour le profil utilisateur"""
    try:
        data = request.get_json()
        updates = {}
        
        if 'firstName' in data:
            updates['profile.first_name'] = data['firstName']
        if 'level' in data:
            updates['profile.level'] = data['level']
        if 'goals' in data:
            updates['profile.goals'] = data['goals']
        
        if updates:
            db.update_user_profile(str(user['_id']), updates)
        
        return jsonify({'message': 'Profile updated successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Fonctions utilitaires pour les statistiques
def calculate_weekly_activity(history):
    """Calcule l'activité hebdomadaire des 4 dernières semaines"""
    weekly_activity = []
    today = datetime.utcnow()
    
    for i in range(4):
        week_start = today - timedelta(days=(today.weekday() + 7*i))
        week_end = week_start + timedelta(days=6)
        
        week_sessions = [session for session in history 
                        if week_start <= session.get('date', datetime.min) <= week_end]
        
        weekly_activity.append({
            'week': week_start.strftime('%Y-%m-%d'),
            'sessions': len(week_sessions),
            'average_score': sum(session.get('score', 0) for session in week_sessions) / len(week_sessions) if week_sessions else 0
        })
    
    return weekly_activity

def calculate_recent_improvements(history):
    """Identifie les améliorations récentes"""
    if len(history) < 2:
        return []
    
    recent_sessions = history[:5]  # 5 dernières sessions
    improvements = []
    
    for i in range(1, len(recent_sessions)):
        current = recent_sessions[i-1]
        previous = recent_sessions[i]
        
        current_score = current.get('score', 0)
        previous_score = previous.get('score', 0)
        
        if current_score > previous_score + 5:  # Amélioration de plus de 5%
            improvements.append({
                'pose': current.get('pose_name'),
                'improvement': round(current_score - previous_score, 1),
                'date': current.get('date')
            })
    
    return improvements

def calculate_progress_trend(history):
    """Calcule la tendance de progression"""
    if len(history) < 3:
        return 'stable'
    
    recent_scores = [session.get('score', 0) for session in history[:10]]
    
    if len(recent_scores) < 2:
        return 'stable'
    
    # Calculer la pente de régression linéaire simple
    x = list(range(len(recent_scores)))
    y = recent_scores
    
    n = len(x)
    sum_x = sum(x)
    sum_y = sum(y)
    sum_xy = sum(x[i] * y[i] for i in range(n))
    sum_x2 = sum(x_i * x_i for x_i in x)
    
    slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x)
    
    if slope > 0.5:
        return 'improving'
    elif slope < -0.5:
        return 'declining'
    else:
        return 'stable'

def get_best_session(history):
    """Retourne la meilleure session"""
    if not history:
        return None
    
    best_session = max(history, key=lambda x: x.get('score', 0))
    return {
        'pose_name': best_session.get('pose_name'),
        'score': best_session.get('score', 0),
        'date': best_session.get('date'),
        'level': best_session.get('level', 'beginner')
    }

def calculate_current_streak(history):
    """Calcule la série actuelle de jours consécutifs avec pratique"""
    if not history:
        return 0
    
    sorted_history = sorted(history, key=lambda x: x.get('date', datetime.min), reverse=True)
    
    streak = 0
    current_date = datetime.utcnow().date()
    
    for session in sorted_history:
        session_date = session.get('date', datetime.min).date()
        
        if session_date == current_date:
            streak += 1
            current_date -= timedelta(days=1)
        else:
            break
    
    return streak

@app.route('/api/user/history', methods=['DELETE'])
@login_required
def clear_user_history(user):
    """Supprime tout l'historique de l'utilisateur"""
    try:
        user_id = str(user['_id'])
        
        # Mettre à jour l'utilisateur pour vider l'historique
        db.users.update_one(
            # {'_id': ObjectId(user_id)},
            {'_id': ObjectId(user_id)},  
            {'$set': {'posture_history': []}}
        )
        
        return jsonify({
            'message': 'Historique supprimé avec succès',
            'deleted_count': len(user.get('posture_history', []))
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Démarrage de l'application Yoga Pose Analyzer...")
    
    # Vérifier l'état du modèle
    if pose_analyzer and hasattr(pose_analyzer, 'model') and pose_analyzer.model is not None:
        print("🤖 Mode: Machine Learning (modèle chargé)")
    else:
        print("🎭 Mode: Démonstration (modèle non entraîné)")
        print("💡 Pour entraîner le modèle: POST /train")
    
    app.run(debug=True, host='0.0.0.0', port=5000)