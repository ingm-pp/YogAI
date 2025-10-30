import jwt
import bcrypt
from datetime import datetime, timedelta
import os
from database import db

class AuthManager:
    def __init__(self):
        self.secret_key = os.getenv('JWT_SECRET', 'votre_cle_secrete_tres_securisee')
        self.algorithm = 'HS256'
    
    def hash_password(self, password):
        """Hash un mot de passe avec bcrypt"""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def verify_password(self, password, hashed_password):
        """Vérifie un mot de passe contre son hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    
    def create_token(self, user_id):
        """Crée un JWT token"""
        payload = {
            'user_id': user_id,
            'exp': datetime.utcnow() + timedelta(days=30),
            'iat': datetime.utcnow()
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def verify_token(self, token):
        """Vérifie et décode un JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload['user_id']
        except jwt.ExpiredSignatureError:
            raise ValueError("Token expiré")
        except jwt.InvalidTokenError:
            raise ValueError("Token invalide")
    
    def register_user(self, email, password, user_data=None):
        """Inscrit un nouvel utilisateur"""
        # Vérifier si l'utilisateur existe déjà
        if db.find_user_by_email(email):
            raise ValueError("Un utilisateur avec cet email existe déjà")
        
        # Valider le mot de passe
        if len(password) < 6:
            raise ValueError("Le mot de passe doit contenir au moins 6 caractères")
        
        # Créer l'utilisateur
        user = {
            'email': email,
            'hashed_password': self.hash_password(password),
            'profile': user_data or {
                'first_name': '',
                'level': 'beginner',
                'goals': [],
                'created_at': datetime.utcnow()
            },
            'posture_history': [],
            'preferences': {
                'language': 'fr',
                'notifications': True
            }
        }
        
        user_id = db.create_user(user)
        token = self.create_token(user_id)
        
        return token, user_id
    
    def login_user(self, email, password):
        """Connecte un utilisateur"""
        user = db.find_user_by_email(email)
        if not user:
            raise ValueError("Email ou mot de passe incorrect")
        
        if not self.verify_password(password, user['hashed_password']):
            raise ValueError("Email ou mot de passe incorrect")
        
        token = self.create_token(str(user['_id']))
        return token, str(user['_id'])

# Instance globale d'authentification
auth_manager = AuthManager()