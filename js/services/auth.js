/**
 * DRIFTVERSE - Authentication Service (Integrated with Neon DB Backend)
 */
import { api } from "./api.js";
import { store } from "./store.js";

class AuthService {
  constructor() {}

  getToken() {
    return api.getToken();
  }

  getCurrentUser() {
    return api.getStoredUser() || store.currentUser;
  }

  isAuthenticated() {
    return api.isAuthenticated();
  }

  isAdmin() {
    return api.isAdmin();
  }

  isUser() {
    return this.isAuthenticated();
  }

  async login(login, password) {
    try {
      const res = await api.login(login, password);
      store.setCurrentUser(res.user);
      window.dispatchEvent(new CustomEvent("driftverse:auth-changed", { detail: { user: res.user } }));
      return { success: true, user: res.user };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  async register(username, email, password) {
    try {
      const res = await api.register(username, email, password);
      store.setCurrentUser(res.user);
      window.dispatchEvent(new CustomEvent("driftverse:auth-changed", { detail: { user: res.user } }));
      return { success: true, user: res.user };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  async adminLogin(password) {
    try {
      const res = await api.adminLogin(password);
      store.setCurrentUser(res.user);
      window.dispatchEvent(new CustomEvent("driftverse:auth-changed", { detail: { user: res.user } }));
      return { success: true, user: res.user };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  logout() {
    api.logout();
    store.logout();
  }
}

export const authService = new AuthService();
