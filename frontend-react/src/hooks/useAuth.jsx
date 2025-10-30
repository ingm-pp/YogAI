import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    const token = localStorage.getItem('auth_token')
    const userData = localStorage.getItem('user_data')
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (error) {
        console.error('Erreur parsing user data:', error)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('user_data', JSON.stringify(data.user))
        return data
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Login failed')
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

  const value = {
    user,
    login,
    logout,
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

// // Dans useAuth.js, ajoutez cette fonction si elle n'existe pas
// const checkAuth = async () => {
//   const token = localStorage.getItem('auth_token')
//   if (token) {
//     try {
//       // Vérifier la validité du token avec le backend
//       const response = await fetch('http://localhost:5000/api/me', {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       })
//       if (response.ok) {
//         const userData = await response.json()
//         setUser(userData)
//       } else {
//         throw new Error('Token invalide')
//       }
//     } catch (error) {
//       console.error('Erreur vérification auth:', error)
//       localStorage.removeItem('auth_token')
//       localStorage.removeItem('user_data')
//     }
//   }
//   setLoading(false)
// }