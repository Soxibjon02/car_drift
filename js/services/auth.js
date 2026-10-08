/**
 * DRIFTVERSE - Authentication & JWT Architecture Service
 * Prepares the platform for future ASP.NET Core Web API + PostgreSQL integration
 */
import { store } from "./store.js";

class AuthService {
  constructor() {
    this.tokenKey = "driftverse_jwt_token";
  }

  // Simulated JWT Generator with header, payload and signature
  generateSimulatedJWT(user) {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(
      JSON.stringify({
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600 * 24 * 7 // 7 days
      })
    );
    const signature = btoa("driftverse_secret_signature_hash_" + user.id);
    return `${header}.${payload}.${signature}`;
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token) {
    localStorage.setItem(this.tokenKey, token);
  }

  removeToken() {
    localStorage.removeItem(this.tokenKey);
  }

  getCurrentUser() {
    return store.currentUser;
  }

  isAuthenticated() {
    return !!store.currentUser;
  }

  isAdmin() {
    return store.currentUser && store.currentUser.role === "Admin";
  }

  isUser() {
    return store.currentUser && (store.currentUser.role === "User" || store.currentUser.role === "Admin");
  }

  login(email, password) {
    const res = store.login(email, password);
    if (res.success) {
      const token = this.generateSimulatedJWT(res.user);
      this.setToken(token);
    }
    return res;
  }

  register(userData) {
    const res = store.register(userData);
    if (res.success) {
      const token = this.generateSimulatedJWT(res.user);
      this.setToken(token);
    }
    return res;
  }

  logout() {
    this.removeToken();
    store.logout();
  }

  // Quick switch role helper for demonstration & QA testing
  demoSwitchRole(role) {
    const targetUser = store.users.find((u) => u.role === role);
    if (targetUser) {
      store.setCurrentUser(targetUser);
      this.setToken(this.generateSimulatedJWT(targetUser));
      return targetUser;
    }
    return null;
  }
}

export const authService = new AuthService();
