export const API_URL = 'https://api.unrevealed.tech/graphql';

export const APP_URL = 'https://app.unrevealed.tech';

export const LOGIN_SERVER_PORT = 9789;
export const LOGIN_SERVER_HOST = 'http://127.0.0.1';
export const LOGIN_REDIRECT_URI = `${LOGIN_SERVER_HOST}:${LOGIN_SERVER_PORT}`;
export const AUTH_URL = `${APP_URL}/cli/auth/token?redirect_uri=${encodeURIComponent(
  LOGIN_REDIRECT_URI,
)}`;
export const LOGIN_SUCCESS_URL = `${APP_URL}/cli/auth/success`;
