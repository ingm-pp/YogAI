import { useState, useEffect, useRef } from 'react'
import { Pose } from '@mediapipe/pose'

export function usePoseDetection() {
  const [poseDetector, setPoseDetector] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [keypoints, setKeypoints] = useState([])
  const poseRef = useRef()

  // Connexions pour le squelette
  const POSE_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
    [9, 10], [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21],
    [17, 19], [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
    [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [27, 29], [29, 31],
    [31, 27], [24, 26], [26, 28], [28, 30], [30, 32], [32, 28]
  ]

  useEffect(() => {
    const initializePose = async () => {
      try {
        console.log('🔄 Initialisation de MediaPipe Pose...')
        
        const pose = new Pose({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
          }
        })

        pose.setOptions({
          staticImageMode: true,
          modelComplexity: 1,
          enableSegmentation: false,
          smoothLandmarks: false,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.7
        })

        pose.onResults((results) => {
          if (results.poseLandmarks) {
            const formattedKeypoints = results.poseLandmarks.map((landmark, index) => ({
              x: landmark.x,
              y: landmark.y, 
              z: landmark.z,
              visibility: landmark.visibility
            }))
            
            setKeypoints(formattedKeypoints)
            console.log('✅ Keypoints détectés:', formattedKeypoints.length)
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
      console.log('🎯 Traitement image par MediaPipe...')
      await poseRef.current.send({ image: imageElement })
      return true
    } catch (error) {
      console.error('Erreur traitement image:', error)
      return false
    }
  }

  const imageToBase64 = (imageElement) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    canvas.width = imageElement.width
    canvas.height = imageElement.height
    ctx.drawImage(imageElement, 0, 0)
    
    return canvas.toDataURL('image/jpeg')
  }

  return {
    poseDetector,
    isInitialized,
    keypoints,
    processImage, 
    imageToBase64,
    POSE_CONNECTIONS // ← Export pour MediaDisplay
  }
}