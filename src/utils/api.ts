import { SERVER_URL } from '../config';

const handleResponse = async (response) => {
  try {
    const text = await response.text()
    // Try to parse JSON if possible
    let data: any = null
    try { data = text ? JSON.parse(text) : null } catch (e) { data = text }

    if (response.ok) {
      return data
    }

    // Log server error details for debugging
    try { console.warn('API error response', { status: response.status, body: data }) } catch (e) { }

    if (data && data.message) throw new Error(data.message)
    throw new Error(`Server responded with status ${response.status}`)
  } catch (e: any) {
    // If parsing fails or other unexpected error
    // Keep original message for developer but return a friendly message for UI
    const msg = e?.message || 'An unexpected error occurred. Please try again.'
    throw new Error(msg)
  }
};

export const login = async (email, password) => {
  try {
    console.log('API: login request', { url: `${SERVER_URL}/api/auth/login`, email })
    const response = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const res = await handleResponse(response)
    console.log('API: login response', { url: `${SERVER_URL}/api/auth/login`, email, res })
    return res
  } catch (e: any) {
    console.error('API: login error', { email, error: e?.message || e })
    throw e
  }
};

export const register = async (userData) => {
  try {
    console.log('API: register request', { url: `${SERVER_URL}/api/auth/register`, userData: { ...userData, password: '***' } })
    const response = await fetch(`${SERVER_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const res = await handleResponse(response)
    console.log('API: register response', { url: `${SERVER_URL}/api/auth/register`, res })
    return res
  } catch (e: any) {
    console.error('API: register error', { error: e?.message || e })
    throw e
  }
};

export const getTouristData = async (touristId, token) => {
  try {
    console.log('API: getTouristData request', { url: `${SERVER_URL}/api/tourist/${touristId}`, touristId })
    const response = await fetch(`${SERVER_URL}/api/tourist/${touristId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const res = await handleResponse(response)
    console.log('API: getTouristData response', { touristId, res })
    return res
  } catch (e: any) {
    console.error('API: getTouristData error', { touristId, error: e?.message || e })
    throw e
  }
};

