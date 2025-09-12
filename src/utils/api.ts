import { SERVER_URL } from '../config';
import { GEO_MODEL_URL } from '../config';
import { WEATHER_MODEL_URL } from '../config';

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

export const getTouristData = async (token, method = 'GET', data = null) => {
  try {
    console.log('API: getTouristData request', { url: `${SERVER_URL}/api/tourist/me`, method })
    const config: any = {
      method,
      headers: { Authorization: `Bearer ${token}` },
    };
    
    if (data && (method === 'PATCH' || method === 'PUT' || method === 'POST')) {
      config.headers['Content-Type'] = 'application/json';
      config.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${SERVER_URL}/api/tourist/me`, config);
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

// Fetch geo model prediction by lat/lon
export const getGeoPrediction = async (latitude: number, longitude: number) => {
  try {
    console.log('API: getGeoPrediction request', { url: GEO_MODEL_URL, latitude, longitude })
    const response = await fetch(GEO_MODEL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude, longitude }),
    })

    // Try to parse JSON response
    const text = await response.text()
    let data: any = null
    try { data = text ? JSON.parse(text) : null } catch (e) { data = text }

    if (!response.ok) {
      console.warn('API: getGeoPrediction response not ok', { status: response.status, body: data })
      throw new Error((data && data.message) ? data.message : `Model responded with status ${response.status}`)
    }

    console.log('API: getGeoPrediction response', { data })
    return data
  } catch (e: any) {
    console.error('API: getGeoPrediction error', { error: e?.message || e })
    throw e
  }
}

// Fetch weather model prediction given weather features
export const getWeatherPrediction = async (features: {
  temperature: number,
  humidity: number,
  wind_speed: number,
  wind_bearing: number,
  visibility: number,
  cloud_cover: number,
  pressure: number,
  summary_clear?: number,
}) => {
  try {
    console.log('API: getWeatherPrediction request', { url: WEATHER_MODEL_URL, features })
    const response = await fetch(WEATHER_MODEL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(features),
    })

    const text = await response.text()
    let data: any = null
    try { data = text ? JSON.parse(text) : null } catch (e) { data = text }

    if (!response.ok) {
      console.warn('API: getWeatherPrediction response not ok', { status: response.status, body: data })
      throw new Error((data && data.message) ? data.message : `Model responded with status ${response.status}`)
    }

    console.log('API: getWeatherPrediction response', { data })
    return data
  } catch (e: any) {
    console.error('API: getWeatherPrediction error', { error: e?.message || e })
    throw e
  }
}

export const getAlerts = async (token) => {
  try {
    console.log('API: getAlerts request', { url: `${SERVER_URL}/api/authority/alerts`, hasToken: !!token });

    // if (!token) {
    //   throw new Error('No authentication token provided');
    // }

    const headers = {
      // 'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('API: getAlerts headers', {
      // authorization: headers.Authorization ? 'Bearer token present' : 'No token',
      contentType: headers['Content-Type']
    });

    const response = await fetch(`${SERVER_URL}/api/authority/alerts`, {
      method: 'GET',
      headers: headers,
    });

    const res = await handleResponse(response);
    console.log('API: getAlerts response', { res });

    // Ensure alerts is an array
    if (res && res.alerts && Array.isArray(res.alerts)) {
      return res;
    } else {
      console.warn('API: getAlerts - Invalid response format', res);
      throw new Error('Invalid response format from server');
    }
  } catch (e) {
    console.error('API: getAlerts error', { error: e?.message || e });
    throw e;
  }
};

// Utility functions for trip/itinerary conversion
export const tripsToItinerary = (trips: { id: string; title: string; date: string; notes?: string }[]): string[] => {
  return trips.map(trip => {
    if (trip.date && trip.notes) {
      return `${trip.title} (${trip.date}) - ${trip.notes}`
    } else if (trip.date) {
      return `${trip.title} (${trip.date})`
    } else {
      return trip.title
    }
  })
}

export const itineraryToTrips = (itinerary: any[]): { id: string; title: string; date: string; notes?: string }[] => {
  const baseTs = Date.now()
  return itinerary.map((item: any, index: number) => {
    if (typeof item === 'string') {
      // Parse string format: "Title (Date) - Notes" or "Title (Date)" or "Title"
      const match = item.match(/^(.+?)(?:\s*\(([^)]+)\))?(?:\s*-\s*(.+))?$/)
      if (match) {
        const [, title, date, notes] = match
        return { id: `t${baseTs}_${index}`, title: title.trim(), date: date || "", notes: notes || "" }
      }
      return { id: `t${baseTs}_${index}`, title: item, date: "" }
    }
    if (item && typeof item === 'object') {
      const title = item.title || item.name || item.locationName || JSON.stringify(item)
      const date = item.date || item.dateTime || item.when || ""
      const notes = item.notes || item.extra || ''
      return { id: `t${baseTs}_${index}`, title, date, notes }
    }
    return { id: `t${baseTs}_${index}`, title: String(item), date: "" }
  })
}

