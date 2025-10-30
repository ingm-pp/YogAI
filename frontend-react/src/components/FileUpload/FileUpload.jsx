import React, { useRef } from 'react'
import './FileUpload.css'

export function FileUpload({ onFileSelect }) {
  const fileInputRef = useRef()

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const fileType = file.type.startsWith('image/') ? 'image' : 
                    file.type.startsWith('video/') ? 'video' : null
    
    if (fileType) {
      onFileSelect(file, fileType)
    } else {
      alert('Veuillez sélectionner une image ou une vidéo')
    }
  }

  const handleDrop = (event) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      const fileType = file.type.startsWith('image/') ? 'image' : 
                      file.type.startsWith('video/') ? 'video' : null
      if (fileType) {
        onFileSelect(file, fileType)
      } else {
        alert('Veuillez déposer une image ou une vidéo')
      }
    }
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    event.currentTarget.classList.add('dragover')
  }

  const handleDragLeave = (event) => {
    event.preventDefault()
    event.currentTarget.classList.remove('dragover')
  }

  return (
    <div 
      className="file-upload"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      
      <div className="upload-content">
        <div className="upload-icon">📤</div>
        <h3>Upload Your Pose Photo</h3>
        <p>Drag & drop or click to select an image</p>
        <div className="file-types">
          <span>Supports: JPEG, PNG, GIF</span>
        </div>
        <button className="btn-primary" style={{ marginTop: '20px' }}>
          Choose File
        </button>
      </div>
    </div>
  )
}

export default FileUpload