export const getToken = () => localStorage.getItem('token')

export const getUser = () => {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}

export const setAuth = (token, user) => {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
}

export const removeAuth = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export const isAuthenticated = () => !!getToken()

export const isAdmin = () => {
  const user = getUser()
  return user?.role === 'admin'
}

export const isManager = () => {
  const user = getUser()
  return user?.role === 'manager'
}

export const isHR = () => {
  const user = getUser()
  return user?.role === 'hr'
}