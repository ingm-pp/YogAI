import React, { useRef, useState, useCallback, useEffect } from 'react'
import { usePoseDetection } from '../../hooks/usePoseDetection'
import { FileUpload } from '../FileUpload/FileUpload'
import { MediaDisplay } from '../MediaDisplay/MediaDisplay'
import { AnalysisResults } from '../AnalysisResults/AnalysisResults'
import './PoseAnalyzer.css'

export function PoseAnalyzer() {
  const [mediaSource, setMediaSource] = useState(null)
  const [mediaType, setMediaType] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [detectionError, setDetectionError] = useState('')
  
  const {
    isInitialized,
    keypoints,
    processImage,
    imageToBase64,
    POSE_CONNECTIONS // ← Récupérer les connexions
  } = usePoseDetection()

  const handleFileSelect = useCallback(async (file, type) => {
    console.log('📁 Fichier sélectionné:', file.name)
    setMediaSource(file)
    setMediaType(type)
    setAnalysisResult(null)
    setDetectionError('')
    
    if (type === 'image') {
      const img = new Image()
      img.onload = async () => {
        console.log('🖼️ Image chargée, envoi à MediaPipe...')
        const success = await processImage(img)
        if (!success) {
          setDetectionError('Erreur lors de la détection MediaPipe')
        }
      }
      img.src = URL.createObjectURL(file)
    }
  }, [processImage])

  const handleAnalyze = async () => {
    if (!keypoints || keypoints.length === 0) {
      setDetectionError('Aucune pose détectée pour analyse')
      return
    }
    
    setIsAnalyzing(true)
    setDetectionError('')
    
    try {
      const img = new Image()
      img.src = URL.createObjectURL(mediaSource)
      await new Promise((resolve) => { img.onload = resolve })
      
      const imageBase64 = imageToBase64(img)

      const payload = {
        keypoints: keypoints,
        image: imageBase64
      }

      console.log('📤 Envoi au backend pour analyse ML...')
      const response = await fetch('http://localhost:5000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const result = await response.json()
        setAnalysisResult(result)
      } else {
        throw new Error('Erreur serveur lors de l\'analyse')
      }
    } catch (error) {
      setDetectionError('Erreur: ' + error.message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleReset = () => {
    setMediaSource(null)
    setMediaType(null)
    setAnalysisResult(null)
    setDetectionError('')
  }

  const visiblePoints = keypoints ? keypoints.filter(kp => kp.visibility > 0.5).length : 0

  return (
    <div className="pose-analyzer">
      {!mediaSource && (
        <FileUpload onFileSelect={handleFileSelect} />
      )}
      
      {mediaSource && !analysisResult && (
        <div className="media-section">
          {/* Passer POSE_CONNECTIONS à MediaDisplay */}
          <MediaDisplay 
            mediaSource={mediaSource}
            mediaType={mediaType}
            keypoints={keypoints}
            POSE_CONNECTIONS={POSE_CONNECTIONS}
          />
          
          {keypoints && keypoints.length > 0 && !detectionError && (
            <div className="detection-status good">
              ✅ {visiblePoints} points détectés - Prêt pour l'analyse
            </div>
          )}

          {detectionError && (
            <div className="detection-error">
              ❌ {detectionError}
            </div>
          )}

          <div className="analysis-controls">
            <button 
              onClick={handleAnalyze}
              disabled={!keypoints || keypoints.length === 0 || isAnalyzing || detectionError}
              className="btn-primary analyze-btn"
            >
              {isAnalyzing ? '🔄 Analyse en cours...' : '📊 Analyser la posture'}
            </button>
            <button onClick={handleReset} className="btn-secondary">
              🗑️ Nouvelle image
            </button>
          </div>
        </div>
      )}

      {analysisResult && (
        <AnalysisResults 
          result={analysisResult} 
          onNewAnalysis={handleReset}
          keypoints={keypoints}
          mediaSource={mediaSource}
          mediaType={mediaType}
          POSE_CONNECTIONS={POSE_CONNECTIONS}
        />
      )}
    </div>
  )
}

