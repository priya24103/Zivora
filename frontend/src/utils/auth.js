/**
 * Helper to clear all Zivora authentication tokens and user data from localStorage.
 * Ensures consistent logout behavior across both regular user and admin sessions.
 */
export const clearAuthTokens = () => {
  localStorage.removeItem('zivora_token');
  localStorage.removeItem('zivora_user');
  localStorage.removeItem('zivora_admin_token');
  localStorage.removeItem('zivora_admin_user');
  window.dispatchEvent(new Event('storage'));
};
