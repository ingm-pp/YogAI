from pymongo import MongoClient
from datetime import datetime
import os
from bson import ObjectId


# Classes de démo pour quand MongoDB n'est pas disponible
class DemoUsers:
    def __init__(self):
        self.data = {}
    
    def insert_one(self, user_data):
        user_id = str(len(self.data) + 1)
        self.data[user_id] = user_data
        return type('obj', (object,), {'inserted_id': user_id})
    
    def find_one(self, query):
        if 'email' in query:
            for user_id, user_data in self.data.items():
                if user_data.get('email') == query['email']:
                    user_data['_id'] = user_id
                    return user_data
        return None
    
    def update_one(self, query, update):
        user_id = query.get('_id')
        if user_id and user_id in self.data:
            if '$set' in update:
                for key, value in update['$set'].items():
                    # Gérer les clés avec points (comme 'profile.first_name')
                    keys = key.split('.')
                    if len(keys) > 1:
                        current = self.data[user_id]
                        for k in keys[:-1]:
                            if k not in current:
                                current[k] = {}
                            current = current[k]
                        current[keys[-1]] = value
                    else:
                        self.data[user_id][key] = value
            if '$push' in update:
                for key, value in update['$push'].items():
                    if key not in self.data[user_id]:
                        self.data[user_id][key] = []
                    self.data[user_id][key].append(value)

class DemoSessions:
    def create_index(self, *args, **kwargs):
        pass


class MongoDB:
    def __init__(self):
        # Récupération de l'URI depuis les variables d'environnement
        self.connection_string = os.getenv('MONGO_URI', 'mongodb://localhost:27017/yoga_pose_analyzer')
        
        try:
            self.client = MongoClient(self.connection_string)
            # Test de la connexion
            self.client.admin.command('ping')
            print("✅ Connexion MongoDB réussie")
            
            self.db = self.client.get_database()
            self.users = self.db['users']
            self.sessions = self.db['sessions']
            
            # Création des index
            self.users.create_index('email', unique=True)
            self.sessions.create_index('user_id')
            self.sessions.create_index('created_at', expireAfterSeconds=30*24*60*60)  # 30 jours
            
        except Exception as e:
            print(f"❌ Erreur connexion MongoDB: {e}")
            print("💡 Mode démo activé - les données ne seront pas persistées")
            self.demo_mode = True
            self.users = DemoUsers()
            self.sessions = DemoSessions()

            
    
    def create_user(self, user_data):
        """Crée un nouvel utilisateur"""
        try:
            result = self.users.insert_one(user_data)
            return str(result.inserted_id)
        except Exception as e:
            raise ValueError(f"Erreur création utilisateur: {e}")
    
    def find_user_by_email(self, email):
        """Trouve un utilisateur par email"""
        return self.users.find_one({'email': email})
    
    def find_user_by_id(self, user_id):
        """Trouve un utilisateur par ID"""
        return self.users.find_one({'_id': ObjectId(user_id)})
    
    def update_user_profile(self, user_id, updates):
        """Met à jour le profil utilisateur"""
        self.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': updates}
        )
    
    def add_pose_analysis(self, user_id, analysis_data):
        """Ajoute une analyse de posture à l'historique"""
        analysis_data['date'] = datetime.utcnow()
        
        self.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$push': {'posture_history': analysis_data}}
        )
    
    def get_user_stats(self, user_id):
        """Récupère les statistiques de l'utilisateur"""
        user = self.find_user_by_id(user_id)
        if not user or 'posture_history' not in user:
            return None
            
        history = user['posture_history']
        if not history:
            return None
            
        # Calcul des statistiques
        total_sessions = len(history)
        average_score = sum(session.get('score', 0) for session in history) / total_sessions
        
        # Posture la plus pratiquée
        pose_counts = {}
        for session in history:
            pose = session.get('pose_name', 'unknown')
            pose_counts[pose] = pose_counts.get(pose, 0) + 1
        
        most_frequent_pose = max(pose_counts, key=pose_counts.get) if pose_counts else None
        
        # Meilleur score
        best_session = max(history, key=lambda x: x.get('score', 0))
        
        return {
            'total_sessions': total_sessions,
            'average_score': round(average_score, 1),
            'most_frequent_pose': most_frequent_pose,
            'best_score': best_session.get('score', 0),
            'best_pose': best_session.get('pose_name', 'unknown')
        }

    def delete_sessions_by_user(self, user_id):
        """Supprime toutes les sessions d'un utilisateur spécifique"""
        try:
            result = self.sessions.delete_many({'user_id': user_id})
            print(f"✅ {result.deleted_count} sessions supprimées pour l'utilisateur {user_id}")
            return result.deleted_count
        except Exception as e:
            print(f"❌ Erreur suppression sessions utilisateur: {e}")
            return 0

# Instance globale de la base de données
db = MongoDB()