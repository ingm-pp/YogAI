import React from 'react';
import { useUserProgress } from '../../hooks/useUserProgress';
import './LevelUpModal.css';

export const LevelUpModal = ({ isOpen, onClose, userStats, currentLevel }) => {
  const { updateLevel, loading } = useUserProgress();

  if (!isOpen) return null;

  const getNextLevel = () => {
    const levels = ['beginner', 'intermediate', 'advanced'];
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
  };

  const nextLevel = getNextLevel();
  const levelNames = {
    beginner: 'Débutant',
    intermediate: 'Intermédiaire',
    advanced: 'Avancé'
  };

  const handleLevelUp = async () => {
    try {
      await updateLevel(nextLevel);
      onClose();
    } catch (error) {
      console.error('Erreur lors du changement de niveau:', error);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="level-up-modal">
        <h2>🎉 Félicitations !</h2>
        <p>Vous avez débloqué le niveau <strong>{levelNames[nextLevel]}</strong> !</p>
        
        <div className="stats-summary">
          <h3>Vos progrès :</h3>
          <div className="stat-item">
            <span>Sessions complétées :</span>
            <strong>{userStats.sessionsCompleted}</strong>
          </div>
          <div className="stat-item">
            <span>Précision moyenne :</span>
            <strong>{userStats.averageAccuracy}%</strong>
          </div>
          <div className="stat-item">
            <span>Postures maîtrisées :</span>
            <strong>{userStats.posesMastered}</strong>
          </div>
        </div>

        <div className="modal-actions">
          <button 
            onClick={handleLevelUp} 
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Chargement...' : `Passer au niveau ${levelNames[nextLevel]}`}
          </button>
          <button 
            onClick={onClose} 
            className="btn-secondary"
            disabled={loading}
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
};