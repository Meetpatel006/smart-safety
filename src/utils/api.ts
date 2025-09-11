import { SERVER_URL } from '../config';

const handleResponse = async (response) => {
  if (response.ok) {
    return response.json();
  }

  try {
    const errorData = await response.json();
    throw new Error(errorData.message || "An error occurred on the server.");
  } catch (e) {
    throw new Error("An unexpected error occurred. Please try again.");
  }
};

export const login = async (email, password) => {
  const response = await fetch(`${SERVER_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(response);
};

export const register = async (userData) => {
  const response = await fetch(`${SERVER_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  return handleResponse(response);
};

export const getTouristData = async (touristId, token) => {
  const response = await fetch(`${SERVER_URL}/api/tourist/${touristId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(response);
};

