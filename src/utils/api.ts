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

export const getTouristData = async (token) => {
  try {
    console.log('API: getTouristData request', { url: `${SERVER_URL}/api/tourist/me` })
    const response = await fetch(`${SERVER_URL}/api/tourist/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const res = await handleResponse(response)
    console.log('API: getTouristData response', { res })
    return res
  } catch (e: any) {
    console.error('API: getTouristData error', { error: e?.message || e })
    throw e
  }
};

export const triggerSOS = async (token, sosData) => {
  try {
    console.log('API: triggerSOS request', { url: `${SERVER_URL}/api/sos/trigger`, sosData });
    const response = await fetch(`${SERVER_URL}/api/sos/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(sosData),
    });
    const res = await handleResponse(response);
    console.log('API: triggerSOS response', { res });
    return res;
  } catch (e) {
    console.error('API: triggerSOS error', { error: e?.message || e });
    throw e;
  }
};

export const getAlerts = async (token) => {
  try {
    console.log('API: getAlerts request', { url: `${SERVER_URL}/api/authority/alerts` });
    const response = await fetch(`${SERVER_URL}/api/authority/alerts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const res = await handleResponse(response);
    console.log('API: getAlerts response', { res });
    return res;
  } catch (e) {
    console.error('API: getAlerts error', { error: e?.message || e });
    throw e;
  }
};

