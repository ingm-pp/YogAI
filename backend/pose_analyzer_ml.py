import numpy as np
import joblib
from typing import List, Dict, Any, Tuple
from data_preprocessor import DataPreprocessor

class MLAnalyzer:
    def __init__(self, model_path='../ml_core'):
        self.preprocessor = DataPreprocessor()
        
        # Chargement du modèle entraîné
        try:
            self.model = joblib.load(f'{model_path}/pose_classifier.pkl')
            self.label_encoder = joblib.load(f'{model_path}/label_encoder.pkl')
            print("Modèle ML chargé avec succès")
        except FileNotFoundError:
            print("Modèle non trouvé. Utilisation du mode démo.")
            self.model = None
            self.label_encoder = None
    
    def analyze_pose(self, keypoints: List[Dict]) -> Dict[str, Any]:
        """
        Analyse la pose avec le modèle ML et retourne des indicateurs détaillés
        """
        if not keypoints:
            return {'error': 'No keypoints detected'}
        
        # Extraction des angles
        angles = self.preprocessor.calculate_all_angles(keypoints)
        
        if self.model is None:
            return self._demo_analysis(keypoints, angles)
        
        try:
            # Extraction des features et prédiction
            features = self.preprocessor.extract_features_from_keypoints(keypoints)
            features = features.reshape(1, -1)
            prediction = self.model.predict(features)[0]
            probability = np.max(self.model.predict_proba(features))
            
            pose_name = self.label_encoder.inverse_transform([prediction])[0]
            
            # Calcul des indicateurs de qualité
            quality_metrics = self._calculate_quality_metrics(pose_name, keypoints, angles)
            
            # Génération du feedback détaillé
            detailed_feedback = self._generate_detailed_feedback(pose_name, quality_metrics, angles)
            
            # Calcul du score global
            global_score = self._calculate_global_score(quality_metrics)
            
            # Recommandation d'exercice
            exercise_recommendation = self._recommend_exercise(pose_name, quality_metrics)
            
            return {
                'pose_name': pose_name,
                'confidence': float(probability),
                'score': float(global_score),
                'level': self._get_level(global_score),
                'angles': angles,
                'quality_metrics': quality_metrics,
                'feedback': detailed_feedback['general_feedback'],
                'strengths': detailed_feedback['strengths'],
                'improvements': detailed_feedback['improvements'],
                'priority_feedback': detailed_feedback['priority_feedback'],
                'exercise_recommendation': exercise_recommendation,
                'keypoints': keypoints,
                'model_type': 'machine_learning'
            }
            
        except Exception as e:
            print(f"❌ Erreur lors de la prédiction: {e}")
            return self._demo_analysis(keypoints, angles)
    
    def _calculate_quality_metrics(self, pose_name: str, keypoints: List[Dict], angles: Dict[str, float]) -> Dict[str, float]:
        """Calcule les indicateurs de qualité de la posture"""
        metrics = {}
        
        # 1. Indicateur d'alignement (0-100)
        metrics['alignment'] = self._calculate_alignment_score(pose_name, keypoints, angles)
        
        # 2. Indicateur de stabilité (0-100)
        metrics['stability'] = self._calculate_stability_score(pose_name, keypoints)
        
        # 3. Indicateur de symétrie (0-100)
        metrics['symmetry'] = self._calculate_symmetry_score(pose_name, keypoints, angles)
        
        # 4. Indicateur d'amplitude (0-100)
        metrics['range_of_motion'] = self._calculate_range_of_motion_score(pose_name, angles)
        
        # 5. Indicateur technique (0-100)
        metrics['technique'] = self._calculate_technique_score(pose_name, angles)
        
        return metrics
    
    def _calculate_alignment_score(self, pose_name: str, keypoints: List[Dict], angles: Dict[str, float]) -> float:
        """Calcule le score d'alignement basé sur la posture"""
        alignment_score = 80.0  # Score de base
        
        # Logique spécifique par posture
        if pose_name == 'downdog':
            # Vérifier l'alignement épaules-mains-hanches
            if 'left_shoulder' in angles and 'right_shoulder' in angles:
                shoulder_avg = (angles['left_shoulder'] + angles['right_shoulder']) / 2
                if 70 <= shoulder_avg <= 100:
                    alignment_score += 10
                elif shoulder_avg < 70:
                    alignment_score -= 15
        
        elif pose_name == 'warrior2':
            # Vérifier l'alignement genou-cheville
            if 'left_knee' in angles and 'right_knee' in angles:
                knee_angles = [angles['left_knee'], angles['right_knee']]
                optimal_knee = 90
                for angle in knee_angles:
                    if 80 <= angle <= 100:
                        alignment_score += 5
        
        return max(0, min(100, alignment_score))
    
    def _calculate_stability_score(self, pose_name: str, keypoints: List[Dict]) -> float:
        """Calcule le score de stabilité"""
        stability_score = 75.0
        
        # Analyser la répartition du poids (simplifié)
        if len(keypoints) > 25:
            left_hip = keypoints[23]
            right_hip = keypoints[24]
            
            # Calculer la différence de hauteur entre les hanches
            hip_height_diff = abs(left_hip['y'] - right_hip['y'])
            if hip_height_diff < 0.05:  # Seuil arbitraire
                stability_score += 15
            elif hip_height_diff > 0.1:
                stability_score -= 20
        
        return max(0, min(100, stability_score))
    
    def _calculate_symmetry_score(self, pose_name: str, keypoints: List[Dict], angles: Dict[str, float]) -> float:
        """Calcule le score de symétrie"""
        symmetry_score = 85.0
        
        # Comparer les angles gauche/droite
        symmetric_pairs = [
            ('left_elbow', 'right_elbow'),
            ('left_knee', 'right_knee'),
            ('left_shoulder', 'right_shoulder')
        ]
        
        for left, right in symmetric_pairs:
            if left in angles and right in angles:
                diff = abs(angles[left] - angles[right])
                if diff <= 10:  # Différence acceptable
                    symmetry_score += 3
                elif diff > 25:  # Grande asymétrie
                    symmetry_score -= 10
        
        return max(0, min(100, symmetry_score))
    
    def _calculate_range_of_motion_score(self, pose_name: str, angles: Dict[str, float]) -> float:
        """Calcule le score d'amplitude articulaire"""
        rom_score = 70.0
        
        # Valeurs cibles par posture
        target_ranges = {
            'downdog': {'left_shoulder': 90, 'right_shoulder': 90},
            'warrior2': {'left_knee': 90, 'right_knee': 90},
            'tree': {'left_hip': 45, 'right_hip': 45}
        }
        
        if pose_name in target_ranges:
            for angle_name, target in target_ranges[pose_name].items():
                if angle_name in angles:
                    current_angle = angles[angle_name]
                    ratio = min(current_angle / target, 1.0) if target > 0 else 1.0
                    rom_score += ratio * 10
        
        return max(0, min(100, rom_score))
    
    def _calculate_technique_score(self, pose_name: str, angles: Dict[str, float]) -> float:
        """Calcule le score technique global"""
        # Basé sur la cohérence des angles avec la posture idéale
        technique_score = 80.0
        
        # Logique simplifiée pour différentes postures
        if pose_name == 'plank':
            if 'left_shoulder' in angles:
                if angles['left_shoulder'] > 160:  # Bras presque droits
                    technique_score += 10
        
        return max(0, min(100, technique_score))
    
    def _calculate_global_score(self, quality_metrics: Dict[str, float]) -> float:
        """Calcule le score global pondéré"""
        weights = {
            'alignment': 0.3,
            'stability': 0.25,
            'symmetry': 0.2,
            'range_of_motion': 0.15,
            'technique': 0.1
        }
        
        global_score = 0
        for metric, score in quality_metrics.items():
            global_score += score * weights.get(metric, 0)
        
        return global_score
    
    def _get_level(self, score: float) -> str:
        """Détermine le niveau de l'utilisateur"""
        if score >= 90:
            return "Expert"
        elif score >= 80:
            return "Avancé"
        elif score >= 70:
            return "Intermédiaire"
        elif score >= 60:
            return "Intermédiaire débutant"
        else:
            return "Débutant"
    
    def _generate_detailed_feedback(self, pose_name: str, quality_metrics: Dict[str, float], angles: Dict[str, float]) -> Dict[str, Any]:
        """Génère un feedback détaillé avec points forts et axes d'amélioration"""
        feedback = {
            'general_feedback': [],
            'strengths': [],
            'improvements': [],
            'priority_feedback': []
        }
        
        # Feedback général basé sur le score
        global_score = self._calculate_global_score(quality_metrics)
        if global_score >= 85:
            feedback['general_feedback'].append("🌟 Excellente exécution ! Votre posture est très bien maîtrisée.")
        elif global_score >= 70:
            feedback['general_feedback'].append("✅ Bonne posture globale, quelques ajustements mineurs vous permettront de progresser.")
        else:
            feedback['general_feedback'].append("📝 Bon début ! Continuez à pratiquer pour améliorer votre posture.")
        
        # Identifier les points forts (scores > 80)
        for metric, score in quality_metrics.items():
            metric_name = self._get_metric_display_name(metric)
            if score >= 80:
                feedback['strengths'].append(f"🎯 {metric_name}: Excellente maîtrise ({score:.0f}%)")
            elif score >= 60:
                feedback['strengths'].append(f"✅ {metric_name}: Correct ({score:.0f}%)")
        
        # Identifier les axes d'amélioration (scores < 70)
        weakest_metric = None
        weakest_score = 100
        
        for metric, score in quality_metrics.items():
            metric_name = self._get_metric_display_name(metric)
            if score < 70:
                improvement_tip = self._get_improvement_tip(pose_name, metric)
                feedback['improvements'].append(f"📝 {metric_name}: {improvement_tip} ({score:.0f}%)")
                
                if score < weakest_score:
                    weakest_score = score
                    weakest_metric = metric
        
        # Feedback prioritaire
        if weakest_metric:
            priority_tip = self._get_priority_tip(pose_name, weakest_metric, angles)
            feedback['priority_feedback'].append(f"💡 Priorité: {priority_tip}")
        
        return feedback
    
    def _get_metric_display_name(self, metric: str) -> str:
        """Retourne le nom d'affichage pour un indicateur"""
        names = {
            'alignment': "Alignement",
            'stability': "Stabilité",
            'symmetry': "Symétrie",
            'range_of_motion': "Amplitude articulaire",
            'technique': "Technique"
        }
        return names.get(metric, metric)
    
    def _get_improvement_tip(self, pose_name: str, metric: str) -> str:
        """Retourne un conseil d'amélioration spécifique"""
        tips = {
            'alignment': {
                'downdog': "Travaillez l'alignement épaules-mains-hanches",
                'warrior2': "Alignez le genou avant avec la cheville",
                'tree': "Maintenez l'alignement hanche-genou-cheville"
            },
            'stability': {
                'default': "Renforcez votre ancrage au sol et votre équilibre"
            },
            'symmetry': {
                'default': "Travaillez la symétrie entre les côtés gauche et droit"
            }
        }
        
        return tips.get(metric, {}).get(pose_name, tips.get(metric, {}).get('default', "Pratiquez régulièrement pour améliorer cet aspect"))
    
    def _get_priority_tip(self, pose_name: str, metric: str, angles: Dict[str, float]) -> str:
        """Génère un conseil prioritaire personnalisé"""
        if metric == 'alignment' and pose_name == 'downdog':
            return "Pliez légèrement les genoux pour permettre à votre bassin de se souvier et améliorer l'alignement de votre colonne."
        
        elif metric == 'stability' and pose_name == 'tree':
            return "Fixez un point devant vous et engagez vos abdominaux pour améliorer votre stabilité."
        
        elif metric == 'symmetry':
            return "Concentrez-vous sur une répartition égale du poids entre vos deux côtés."
        
        return f"Travaillez spécifiquement votre {self._get_metric_display_name(metric).lower()} pour progresser dans cette posture."
    
    def _recommend_exercise(self, pose_name: str, quality_metrics: Dict[str, float]) -> Dict[str, Any]:
        """Recommande un exercice basé sur les faiblesses identifiées"""
        # Identifier la métrique la plus faible
        weakest_metric = min(quality_metrics.items(), key=lambda x: x[1])[0]
        
        exercises = {
            'alignment': {
                'name': "Exercice d'alignement avec mur",
                'description': "Utilisez un mur pour vous guider dans l'alignement de votre posture",
                'duration': "5 minutes",
                'benefit': "Améliore la conscience corporelle et l'alignement"
            },
            'stability': {
                'name': "Posture de la montagne avec variations",
                'description': "Travaillez l'équilibre en levant alternativement chaque jambe",
                'duration': "3 séries de 30 secondes",
                'benefit': "Renforce la stabilité et l'équilibre"
            },
            'symmetry': {
                'name': "Postures miroir",
                'description': "Pratiquez les postures des deux côtés en portant attention à la symétrie",
                'duration': "10 minutes",
                'benefit': "Développe la symétrie et l'équilibre musculaire"
            },
            'range_of_motion': {
                'name': "Étirements dynamiques",
                'description': "Augmentez progressivement l'amplitude de vos mouvements",
                'duration': "8-10 répétitions par côté",
                'benefit': "Améliore la flexibilité et l'amplitude articulaire"
            }
        }
        
        return exercises.get(weakest_metric, {
            'name': "Pratique régulière de la posture",
            'description': "Continuez à pratiquer la posture pour améliorer tous les aspects",
            'duration': "5-10 minutes par jour",
            'benefit': "Amélioration globale de la technique"
        })
    
    def _demo_analysis(self, keypoints: List[Dict], angles: Dict[str, float]) -> Dict[str, Any]:
        """Analyse de démonstration avec indicateurs simulés"""
        quality_metrics = {
            'alignment': 75.0,
            'stability': 68.0,
            'symmetry': 82.0,
            'range_of_motion': 70.0,
            'technique': 65.0
        }
        
        global_score = self._calculate_global_score(quality_metrics)
        
        return {
            'pose_name': 'demo_pose',
            'confidence': 0.7,
            'score': float(global_score),
            'level': self._get_level(global_score),
            'angles': angles,
            'quality_metrics': quality_metrics,
            'feedback': ['Mode démonstration - Entraînez le modèle ML pour de meilleurs résultats'],
            'strengths': ['🎯 Symétrie: Correct (82%)'],
            'improvements': ['📝 Stabilité: Travaillez votre équilibre (68%)'],
            'priority_feedback': ['💡 Priorité: Renforcez votre stabilité en engageant les abdominaux'],
            'exercise_recommendation': {
                'name': "Posture de la montagne",
                'description': "Exercice de base pour améliorer la stabilité",
                'duration': "3 minutes",
                'benefit': "Renforcement de l'équilibre"
            },
            'keypoints': keypoints,
            'model_type': 'demo'
        }