import React, { useEffect, useRef } from 'react'
import './MediaDisplay.css'

export function MediaDisplay({ 
  mediaSource, 
  mediaType, 
  keypoints, 
  POSE_CONNECTIONS 
}) {
  const canvasRef = useRef()

  useEffect(() => {
    if (!mediaSource || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const drawPose = () => {
      if (!keypoints || keypoints.length === 0) return

      // Dessiner les connexions du squelette
      drawPoseConnections(ctx, keypoints, canvas.width, canvas.height)
      
      // Dessiner les landmarks
      drawPoseLandmarks(ctx, keypoints, canvas.width, canvas.height)
    }

    const drawPoseConnections = (ctx, keypoints, width, height) => {
      ctx.strokeStyle = '#00FF00'
      ctx.lineWidth = 3
      ctx.lineCap = 'round'

      POSE_CONNECTIONS.forEach(([start, end]) => {
        if (isConnectionVisible(keypoints, start, end)) {
          const startX = keypoints[start].x * width
          const startY = keypoints[start].y * height
          const endX = keypoints[end].x * width
          const endY = keypoints[end].y * height
          
          ctx.beginPath()
          ctx.moveTo(startX, startY)
          ctx.lineTo(endX, endY)
          ctx.stroke()
        }
      })
    }

    const drawPoseLandmarks = (ctx, keypoints, width, height) => {
      keypoints.forEach((kp, index) => {
        if (kp.visibility > 0.1) {
          const x = kp.x * width
          const y = kp.y * height
          
          // Point intérieur rouge
          ctx.beginPath()
          ctx.arc(x, y, 4, 0, 2 * Math.PI)
          ctx.fillStyle = '#FF0000'
          ctx.fill()
          
          // Bordure blanche
          ctx.strokeStyle = '#FFFFFF'
          ctx.lineWidth = 1
          ctx.stroke()
        }
      })
    }

    const isConnectionVisible = (keypoints, startIdx, endIdx) => {
      return keypoints[startIdx] && 
             keypoints[endIdx] && 
             keypoints[startIdx].visibility > 0.1 && 
             keypoints[endIdx].visibility > 0.1
    }

    if (mediaType === 'image') {
      const img = new Image()
      img.onload = () => {
        // Ajuster la taille pour l'affichage
        const maxWidth = 600
        const maxHeight = 600
        const ratio = Math.min(maxWidth / img.width, maxHeight / img.height)
        
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio
        
        // Dessiner l'image originale
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        // Dessiner la pose par dessus
        drawPose()
      }
      img.src = URL.createObjectURL(mediaSource)
    }
  }, [mediaSource, mediaType, keypoints, POSE_CONNECTIONS])

  return (
    <div className="media-display">
      <canvas 
        ref={canvasRef}
        className="media-canvas"
      />
      {keypoints && keypoints.length > 0 && (
        <div className="keypoints-info">
          ✅ {keypoints.filter(kp => kp.visibility > 0.5).length} points détectés
        </div>
      )}
    </div>
  )
}