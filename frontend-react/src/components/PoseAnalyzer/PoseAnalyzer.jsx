import React, { useRef, useState, useCallback } from 'react'
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
    processImage
  } = usePoseDetection()

  const canvasRef = useRef()

  const handleFileSelect = useCallback(async (file, type) => {
    console.log('Fichier sélectionné:', file.name, 'Type:', type)
    setMediaSource(file)
    setMediaType(type)
    setAnalysisResult(null)
    setDetectionError('')
    
    if (type === 'image') {
      const img = new Image()
      img.onload = async () => {
        console.log('📷 Traitement MediaPipe...')
        const success = await processImage(img)
        
        if (!success) {
          setDetectionError('Erreur lors de la détection')
        } else if (!keypoints || keypoints.length === 0) {
          setDetectionError('Aucune pose détectée - Essayez une autre image')
        }
      }
      img.src = URL.createObjectURL(file)
    }
  }, [processImage, keypoints])

  const handleAnalyze = async () => {
    // VALIDATION SIMPLE COMME PYTHON
    if (!keypoints || keypoints.length === 0) {
      setDetectionError('Aucune pose détectée pour analyse')
      return
    }
    
    setIsAnalyzing(true)
    setDetectionError('')
    
    try {
      const formData = new FormData()
      formData.append('file', mediaSource)

      console.log('📤 Envoi au backend Python...')
      const response = await fetch('http://localhost:5000/analyze', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Analyse Python terminée')
        setAnalysisResult(result)
      } else {
        const errorText = await response.text()
        throw new Error(errorText || 'Erreur serveur')
      }
    } catch (error) {
      console.error('❌ Erreur analyse:', error)
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

  // Compteur de points visibles
  const visiblePoints = keypoints ? keypoints.filter(kp => kp.visibility > 0.5).length : 0

  return (
    <div className="pose-analyzer">
      {!mediaSource && (
        <FileUpload onFileSelect={handleFileSelect} />
      )}
      
      {mediaSource && !analysisResult && (
        <div className="media-section">
          <MediaDisplay 
            mediaSource={mediaSource}
            mediaType={mediaType}
            keypoints={keypoints}
            canvasRef={canvasRef}
          />
          
          {/* Statut de détection SIMPLE */}
          {keypoints && keypoints.length > 0 && (
            <div className="detection-status good">
              ✅ MediaPipe: {visiblePoints} points détectés
            </div>
          )}

          {/* Message d'erreur */}
          {detectionError && (
            <div className="detection-error">
              ❌ {detectionError}
            </div>
          )}

          <div className="analysis-controls">
            <button 
              onClick={handleAnalyze}
              disabled={!keypoints || keypoints.length === 0 || isAnalyzing}
              className="btn-primary analyze-btn"
            >
              {isAnalyzing ? '🔄 Analyse en cours...' : '📊 Analyser avec Python'}
            </button>
            <button 
              onClick={handleReset}
              className="btn-secondary"
            >
              🗑️ Nouvelle image
            </button>
          </div>

          {/* Info debug */}
          {keypoints && keypoints.length > 0 && (
            <div className="debug-info">
              <small>
                Mode: StaticImageMode=true | Points: {keypoints.length} | 
                Visibles: {visiblePoints} | Config: model_complexity=2
              </small>
            </div>
          )}
        </div>
      )}

      {analysisResult && (
        <AnalysisResults 
          result={analysisResult} 
          onNewAnalysis={handleReset}
        />
      )}

      {!isInitialized && (
        <div className="initializing">
          🔄 Initialisation MediaPipe...
        </div>
      )}
    </div>
  )
}

export default PoseAnalyzer