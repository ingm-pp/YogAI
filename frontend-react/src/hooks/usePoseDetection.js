import { useState, useEffect, useRef } from 'react'
import { Pose } from '@mediapipe/pose'

export function usePoseDetection() {
  const [poseDetector, setPoseDetector] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [keypoints, setKeypoints] = useState([])
  const poseRef = useRef()

  useEffect(() => {
    const initializePose = async () => {
      try {
        console.log('🔄 Initialisation de MediaPipe Pose...')
        
        const pose = new Pose({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
          }
        })

        // CONFIGURATION IDENTIQUE À PYTHON
        pose.setOptions({
          staticImageMode: true,      // Mode image statique comme Python
          modelComplexity: 2,         // Identique à Python
          enableSegmentation: false,  // Identique à Python
          smoothLandmarks: true,      // Activé comme dans draw_landmarks
          minDetectionConfidence: 0.5, // Identique à Python
          minTrackingConfidence: 0.5   // Identique à Python
        })

        pose.onResults((results) => {
          if (results.poseLandmarks) {
            // FORMAT IDENTIQUE À PYTHON
            const formattedKeypoints = results.poseLandmarks.map((landmark, index) => ({
              x: landmark.x,
              y: landmark.y, 
              z: landmark.z,
              visibility: landmark.visibility
            }))
            
            setKeypoints(formattedKeypoints)
            console.log(`✅ ${formattedKeypoints.length} points détectés`)
            
          } else {
            setKeypoints([])
            console.log('❌ Aucune pose détectée')
          }
        })

        setPoseDetector(pose)
        poseRef.current = pose
        setIsInitialized(true)
        console.log('✅ MediaPipe initialisé')
        
      } catch (error) {
        console.error('❌ Erreur initialisation MediaPipe:', error)
        setIsInitialized(false)
      }
    }

    initializePose()

    return () => {
      if (poseRef.current) {
        poseRef.current.close()
      }
    }
  }, [])

  const processImage = async (imageElement) => {
    if (!poseRef.current) {
      console.error('MediaPipe non initialisé')
      return false
    }
    
    try {
      console.log('🎯 Traitement image (mode staticImageMode=true)')
      await poseRef.current.send({ image: imageElement })
      return true
    } catch (error) {
      console.error('Erreur traitement image:', error)
      return false
    }
  }

  return {
    poseDetector,
    isInitialized,
    keypoints,
    processImage
  }
}