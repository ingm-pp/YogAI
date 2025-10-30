import React, { useEffect, useRef } from 'react'
import './MediaDisplay.css'

// Export NAMED (important pour l'import)
export function MediaDisplay({ mediaSource, mediaType, keypoints, canvasRef }) {
  const containerRef = useRef()

  useEffect(() => {
    if (!mediaSource || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (mediaType === 'image') {
      const img = new Image()
      img.onload = () => {
        // Conserver les proportions originales comme OpenCV
        const maxWidth = 800
        const maxHeight = 800
        let { width, height } = calculateAspectRatio(img.width, img.height, maxWidth, maxHeight)
        
        canvas.width = width
        canvas.height = height
        
        // Dessiner l'image
        ctx.drawImage(img, 0, 0, width, height)
        
        // Dessiner la pose SI des points sont détectés
        if (keypoints && keypoints.length > 0) {
          drawPoseLikePython(ctx, keypoints, width, height)
        }
      }
      img.src = URL.createObjectURL(mediaSource)
    }

  }, [mediaSource, mediaType, keypoints])

  const calculateAspectRatio = (imgWidth, imgHeight, maxWidth, maxHeight) => {
    const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight)
    return {
      width: imgWidth * ratio,
      height: imgHeight * ratio
    }
  }

  const drawPoseLikePython = (ctx, keypoints, width, height) => {
    if (!keypoints || keypoints.length === 0) return

    drawPoseConnections(ctx, keypoints, width, height)
    drawPoseLandmarks(ctx, keypoints, width, height)
  }

  const drawPoseConnections = (ctx, keypoints, width, height) => {
    const POSE_CONNECTIONS = [
      [10, 9], [9, 8], [8, 6], [6, 5], [5, 4], [4, 0], [0, 1], [1, 2], [2, 3], [3, 7],
      [12, 11], [11, 23], [23, 24], [24, 12], 
      [11, 13], [13, 15],
      [12, 14], [14, 16],
      [15, 17], [17, 19], [19, 15], [15, 21],
      [16, 18], [18, 20], [20, 16], [16, 22],
      [23, 25], [25, 27], [27, 29], [29, 31], [27, 31],
      [24, 26], [26, 28], [28, 30], [30, 32], [28, 32],
      [0, 4], [1, 2], [5, 6], [11, 12]
    ]

    ctx.strokeStyle = '#00FF00'
    ctx.lineWidth = 2
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
    keypoints.forEach((kp) => {
      if (kp.visibility > 0.1) {
        const x = kp.x * width
        const y = kp.y * height
        
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, 2 * Math.PI)
        ctx.fillStyle = '#FF0000'
        ctx.fill()
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

  return (
    <div className="media-display" ref={containerRef}>
      <canvas 
        ref={canvasRef}
        className="media-canvas"
      />
      {keypoints && keypoints.length > 0 && (
        <div className="keypoints-info">
          ✅ Pose détectée - {keypoints.filter(kp => kp.visibility > 0.5).length} points visibles
        </div>
      )}
    </div>
  )
}

// Export par défaut aussi pour être sûr
export default MediaDisplay