import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
})

// Interceptor to add JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

export const register = async (
  username,
  password,
  mlKemPubKey,
  mlDsaPubKey,
  encryptedPrivateKeys,
  keySalt,
  keyNonce
) => {
  const response = await api.post('/auth/register', {
    username,
    password,
    ml_kem_pub_key: mlKemPubKey,
    ml_dsa_pub_key: mlDsaPubKey,
    encrypted_private_keys: encryptedPrivateKeys,
    key_salt: keySalt,
    key_nonce: keyNonce,
  })
  return response.data
}

export const login = async (username, password) => {
  const response = await api.post('/auth/login', {
    username,
    password,
  })
  
  if (response.data.access_token) {
    localStorage.setItem('token', response.data.access_token)
    localStorage.setItem('username', username)
  }
  
  return response.data.access_token
}

export const getUserKeys = async (username) => {
  const response = await api.get(`/users/${username}/keys`)
  return response.data
}

export const uploadFile = async (receiverUsername, encryptedFileBlob, kemCiphertext, nonce, signature, filename) => {
  const formData = new FormData()
  formData.append('receiver_username', receiverUsername)
  formData.append('kem_ciphertext', kemCiphertext)
  formData.append('aes_nonce', nonce)
  formData.append('digital_signature', signature)
  formData.append('original_filename', filename)
  formData.append('encrypted_file', new Blob([encryptedFileBlob]), 'encrypted_file')
  
  const response = await api.post('/vault/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  
  return response.data
}

export const getInbox = async () => {
  const response = await api.get('/vault/inbox')
  return response.data
}

export const downloadFile = async (fileId) => {
  const response = await api.get(`/vault/download/${fileId}`)
  return response.data
}

export const getKeyBackup = async () => {
  const response = await api.get('/auth/key-backup')
  return response.data
}

export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('username')
  localStorage.removeItem('privateKeys')
}

export default api
