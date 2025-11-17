// ClearHistoryModal.jsx
import React from 'react'
import './ClearHistory.css'

export function ClearHistoryModal({ isOpen, onClose, onConfirm, loading }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="clear-history-modal">
        <div className="modal-header">
          <h3>🗑️ Effacer l'historique</h3>
        </div>
        
        <div className="modal-content">
          <div className="warning-icon">⚠️</div>
          <p><strong>Action irréversible</strong></p>
          <p>Êtes-vous sûr de vouloir supprimer définitivement tout votre historique ?</p>
          <ul>
            <li>Toutes vos sessions seront perdues</li>
            <li>Vos statistiques seront réinitialisées</li>
            <li>Cette action ne peut pas être annulée</li>
          </ul>
        </div>

        <div className="modal-actions">
          <button 
            onClick={onConfirm}
            disabled={loading}
            className="btn-danger"
          >
            {loading ? '🔄 Suppression...' : 'Oui, tout effacer'}
          </button>
          <button 
            onClick={onClose}
            disabled={loading}
            className="btn-secondary"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}