import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // ✅ FONCTION POUR NORMALISER LES DONNÉES UTILISATEUR
  const normalizeUserData = (userData) => {
    return {
      id: userData.id,
      email: userData.email,
      profile: userData.profile || {},
      // ✅ FIRST_NAME TOUJOURS AU MÊME ENDROIT
      first_name: userData.first_name || userData.profile?.first_name || '',
      preferences: userData.preferences || {}
    }
  }

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('auth_token')
      const userData = localStorage.getItem('user_data')
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData)
          setUser(normalizeUserData(parsedUser))
          
          // ✅ VÉRIFICATION SILENCIEUSE AVEC LE BACKEND
          await verifyTokenWithBackend(token)
        } catch (error) {
          console.error('Erreur initialisation auth:', error)
          logout()
        }
      }
      setLoading(false)
    }

    initializeAuth()
  }, [])

  const verifyTokenWithBackend = async (token) => {
    try {
      const response = await fetch('http://localhost:5000/api/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(normalizeUserData(data.user))
        localStorage.setItem('user_data', JSON.stringify(data.user))
      } else {
        throw new Error('Token invalide')
      }
    } catch (error) {
      throw error
    }
  }

  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (response.ok) {
        const data = await response.json()
        const normalizedUser = normalizeUserData(data.user)
        
        setUser(normalizedUser)
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('user_data', JSON.stringify(normalizedUser))
        
        return data
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Login failed')
      }
    } catch (error) {
      throw error
    }
  }

  const register = async (email, password, firstName = '') => {
    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          firstName 
        })
      })

      if (response.ok) {
        const data = await response.json()
        const normalizedUser = normalizeUserData(data.user)
        
        setUser(normalizedUser)
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('user_data', JSON.stringify(normalizedUser))
        
        return data
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Registration failed')
      }
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
  }

  const refreshUser = async () => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      try {
        await verifyTokenWithBackend(token)
      } catch (error) {
        console.error('Erreur rafraîchissement utilisateur:', error)
        logout()
      }
    }
  }

  const value = {
    user,
    login,
    register, // ✅ AJOUT DE LA FONCTION REGISTER
    logout,
    refreshUser,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}






// import { createContext, useContext, useState, useEffect } from 'react'

// const AuthContext = createContext()

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null)
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     // Vérifier si l'utilisateur est déjà connecté
//     const token = localStorage.getItem('auth_token')
//     const userData = localStorage.getItem('user_data')
    
//     if (token && userData) {
//       try {
//         setUser(JSON.parse(userData))
//       } catch (error) {
//         console.error('Erreur parsing user data:', error)
//         localStorage.removeItem('auth_token')
//         localStorage.removeItem('user_data')
//       }
//     }
//     setLoading(false)
//   }, [])

//   const login = async (email, password) => {
//     try {
//       const response = await fetch('http://localhost:5000/api/login', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ email, password })
//       })

//       if (response.ok) {
//         const data = await response.json()
//         setUser(data.user)
//         localStorage.setItem('auth_token', data.token)
//         localStorage.setItem('user_data', JSON.stringify(data.user))
//         return data
//       } else {
//         const error = await response.json()
//         throw new Error(error.error || 'Login failed')
//       }
//     } catch (error) {
//       throw error
//     }
//   }

//   const logout = () => {
//     setUser(null)
//     localStorage.removeItem('auth_token')
//     localStorage.removeItem('user_data')
//   }

//   const value = {
//     user,
//     login,
//     logout,
//     loading
//   }

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   )
// }

// export function useAuth() {
//   const context = useContext(AuthContext)
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider')
//   }
//   return context
// }

