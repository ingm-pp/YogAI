import React from 'react'
import { MediaDisplay } from '../MediaDisplay/MediaDisplay'
import './AnalysisResults.css'

export function AnalysisResults({ 
  result, 
  onNewAnalysis, 
  keypoints, 
  mediaSource, 
  mediaType,
  POSE_CONNECTIONS // ← IMPORTANT : récupérer les connexions
}) {
  if (!result) return null

  // [Garder toutes les fonctions utilitaires existantes...]
  const formatPoseName = (poseName) => {
    if (!poseName) return 'Posture Inconnue'
    return poseName
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getLevelClass = (level) => {
    const levelMap = {
      'débutant': 'level-beginner',
      'beginner': 'level-beginner',
      'intermédiaire': 'level-intermediate', 
      'intermediate': 'level-intermediate',
      'avancé': 'level-advanced',
      'advanced': 'level-advanced',
      'expert': 'level-expert'
    }
    return levelMap[level?.toLowerCase()] || 'level-beginner'
  }

  const getMetricDisplayName = (metric) => {
    const names = {
      'alignment': 'Alignement',
      'stability': 'Stabilité', 
      'symmetry': 'Symétrie',
      'range_of_motion': 'Amplitude',
      'technique': 'Technique'
    }
    return names[metric] || metric
  }

  const getMetricIcon = (metric) => {
    const icons = {
      'alignment': '📍',
      'stability': '⚖️',
      'symmetry': '🔄', 
      'range_of_motion': '📏',
      'technique': '🎯'
    }
    return icons[metric] || '📊'
  }

  const getScoreRange = (score) => {
    if (score >= 90) return '90-100'
    if (score >= 80) return '80-89'
    if (score >= 70) return '70-79' 
    if (score >= 60) return '60-69'
    return '0-59'
  }

  const getJointDisplayName = (joint) => {
    const names = {
      'left_elbow': 'Coude gauche',
      'right_elbow': 'Coude droit',
      'left_knee': 'Genou gauche', 
      'right_knee': 'Genou droit',
      'left_hip': 'Hanche gauche',
      'right_hip': 'Hanche droite',
      'left_shoulder': 'Épaule gauche',
      'right_shoulder': 'Épaule droite'
    }
    return names[joint] || joint
  }

  const visiblePoints = keypoints ? keypoints.filter(kp => kp.visibility > 0.5).length : 0

  return (
    <div className="analysis-results">
      {/* En-tête avec image et score */}
      <div className="result-header-with-image">
        <div className="image-section">
          <h3>📷 Votre Posture Analysée</h3>
          <div className="pose-visualization">
            {/* CORRECTION : Utiliser MediaDisplay avec les keypoints */}
            <MediaDisplay 
              mediaSource={mediaSource}
              mediaType={mediaType}
              keypoints={keypoints} // ← ENVOYER les keypoints
              POSE_CONNECTIONS={POSE_CONNECTIONS} // ← ENVOYER les connexions
            />
            {keypoints && keypoints.length > 0 && (
              <div className="landmarks-info">
                ✅ {visiblePoints} points détectés sur {keypoints.length}
              </div>
            )}
          </div>
        </div>

        <div className="score-section">
          <h3>score d'éxécution: </h3>
          <div className="score-circle" style={{ '--score-percent': `${result.score || 0}%` }}>
            <div className="score-inner">
              {Math.round(result.score || 0)}%
            </div>
          </div>
          <h2 className="pose-name">
            {formatPoseName(result.pose_name)}
            <span className={`level-badge ${getLevelClass(result.level)}`}>
              Niveau: {result.level || 'Débutant'}
            </span>
          </h2>
          <p className="confidence">
            Confiance: {((result.confidence || 0) * 100).toFixed(1)}%
          </p>
          
          {keypoints && keypoints.length > 0 && (
            <div className="detection-summary">
              <div className="detection-stats">
                <strong>Détection MediaPipe:</strong><br/>
                • {visiblePoints} points visibles<br/>
                • Score de confiance: {Math.round((result.confidence || 0) * 100)}%
              </div>
            </div>
          )}
        </div>
      </div>

      {result.quality_metrics && (
        <div className="quality-metrics">
          <h3>📊 Analyse Détaillée de la Posture</h3>
          <div className="metrics-grid-horizontal">
            {Object.entries(result.quality_metrics).map(([metric, score]) => (
              <div key={metric} className="metric-card">
                <div className="metric-card-header">
                  <span className="metric-icon">
                    {getMetricIcon(metric)}
                  </span>
                  <div className="metric-name">
                    {getMetricDisplayName(metric)}
                  </div>
                </div>
                <div 
                  className="metric-score" 
                  data-score-range={getScoreRange(score)}
                >
                  {Math.round(score)}%
                </div>
                <div className="metric-bar">
                  <div 
                    className="metric-fill" 
                    style={{ width: `${score}%` }}
                  ></div>
                </div>
                <div className="metric-description">
                  {score >= 90 && "Excellente maîtrise !"}
                  {score >= 75 && score < 90 && "Très bon résultat"}
                  {score >= 60 && score < 75 && "Bon, peut être amélioré"}
                  {score < 60 && "À travailler"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Points forts et améliorations */}
      <div className="feedback-section">
        <div className="strengths">
          <h4>✅ Points Forts</h4>
          {result.strengths && result.strengths.length > 0 ? (
            result.strengths.map((strength, index) => (
              <div key={index} className="feedback-item strength-item">
                {strength}
              </div>
            ))
          ) : (
            <div className="feedback-item strength-item">
              Continuez à pratiquer pour développer vos points forts
            </div>
          )}
        </div>

        <div className="improvements">
          <h4>📝 Axes d'Amélioration</h4>
          {result.improvements && result.improvements.length > 0 ? (
            result.improvements.map((improvement, index) => (
              <div key={index} className="feedback-item improvement-item">
                {improvement}
              </div>
            ))
          ) : (
            <div className="feedback-item improvement-item">
              Posture globalement bien exécutée
            </div>
          )}
        </div>
      </div>

      {/* Feedback prioritaire */}
      {result.priority_feedback && result.priority_feedback.length > 0 && (
        <div className="priority-feedback">
          <h4>💡 Recommandation Prioritaire</h4>
          <div className="priority-content">
            {result.priority_feedback.map((feedback, index) => (
              <p key={index}>{feedback}</p>
            ))}
          </div>
        </div>
      )}

      {/* Angles détectés */}
      {result.angles && Object.keys(result.angles).length > 0 && (
        <div className="angles-section">
          <h4>📐 Angles Articulaires Calculés</h4>
          <div className="angles-grid">
            {Object.entries(result.angles).slice(0, 6).map(([joint, angle]) => (
              <div key={joint} className="angle-item">
                <span className="angle-name">
                  {getJointDisplayName(joint)}:
                </span>
                <span className="angle-value">
                  {Math.round(angle)}°
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommandation d'exercice */}
      {result.exercise_recommendation && (
        <div className="exercise-recommendation">
          <h4>💪 Exercice Recommandé</h4>
          <div className="exercise-card">
            <h5>{result.exercise_recommendation.name}</h5>
            <p>{result.exercise_recommendation.description}</p>
            <div className="exercise-details">
              <span className="exercise-duration">
                ⏱️ {result.exercise_recommendation.duration}
              </span>
              <span className="exercise-benefit">
                ✅ {result.exercise_recommendation.benefit}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Bouton nouvelle analyse */}
      <div className="result-actions">
        <button onClick={onNewAnalysis} className="btn-primary">
          🧘 Nouvelle Analyse
        </button>
      </div>
    </div>
  )
}

export default AnalysisResults