/**
 * DRIFTVERSE - Neon PostgreSQL API Client Service
 * Handles live communication with the Express backend & Neon DB
 */

const API_BASE = "/api";

class ApiService {
  constructor() {
    this.tokenKey = "driftverse_token";
    this.adminTokenKey = "driftverse_admin_token";
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token) {
    localStorage.setItem(this.tokenKey, token);
  }

  getAdminToken() {
    return localStorage.getItem(this.adminTokenKey);
  }

  setAdminToken(token) {
    localStorage.setItem(this.adminTokenKey, token);
  }

  removeTokens() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.adminTokenKey);
    localStorage.removeItem("driftverse_user");
  }

  getStoredUser() {
    try {
      const data = localStorage.getItem("driftverse_user");
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  setStoredUser(user) {
    localStorage.setItem("driftverse_user", JSON.stringify(user));
  }

  async request(endpoint, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };

    // Use admin token if available for admin endpoints, otherwise user token
    const token = options.useAdminToken ? this.getAdminToken() : (this.getToken() || this.getAdminToken());
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `Server xatosi: ${response.status}`);
    }

    return data;
  }

  // --- AUTH METHODS ---
  async login(login, password) {
    const res = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ login, password })
    });
    if (res.token) {
      this.setToken(res.token);
      this.setStoredUser(res.user);
    }
    return res;
  }

  async register(username, email, password) {
    const res = await this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password })
    });
    if (res.token) {
      this.setToken(res.token);
      this.setStoredUser(res.user);
    }
    return res;
  }

  async adminLogin(password) {
    const res = await this.request("/auth/admin-login", {
      method: "POST",
      body: JSON.stringify({ password })
    });
    if (res.token) {
      this.setAdminToken(res.token);
      this.setToken(res.token);
      this.setStoredUser(res.user);
    }
    return res;
  }

  async getCurrentUser() {
    try {
      const res = await this.request("/auth/me");
      if (res.user) this.setStoredUser(res.user);
      return res.user;
    } catch {
      return this.getStoredUser();
    }
  }

  logout() {
    this.removeTokens();
    window.dispatchEvent(new CustomEvent("driftverse:auth-changed", { detail: { user: null } }));
  }

  isAuthenticated() {
    return !!this.getToken() && !!this.getStoredUser();
  }

  isAdmin() {
    const user = this.getStoredUser();
    return (!!this.getAdminToken() || (user && user.role === "admin"));
  }

  // --- VIDEOS METHODS (YOUTUBE INTEGRATION) ---
  async getVideos() {
    const res = await this.request("/videos");
    return res.videos || [];
  }

  async getVideoById(id) {
    return await this.request(`/videos/${id}`);
  }

  async addVideo(videoData) {
    return await this.request("/videos", {
      method: "POST",
      useAdminToken: true,
      body: JSON.stringify(videoData)
    });
  }

  async deleteVideo(id) {
    return await this.request(`/videos/${id}`, {
      method: "DELETE",
      useAdminToken: true
    });
  }

  async toggleLikeVideo(id) {
    return await this.request(`/videos/${id}/like`, {
      method: "POST"
    });
  }

  async addComment(videoId, content) {
    return await this.request(`/videos/${videoId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content })
    });
  }

  async deleteComment(commentId) {
    return await this.request(`/comments/${commentId}`, {
      method: "DELETE"
    });
  }

  async recordView(videoId) {
    try {
      await this.request(`/videos/${videoId}/view`, { method: "POST" });
    } catch {}
  }

  // --- ADMIN STATS ---
  async getAdminStats() {
    return await this.request("/admin/stats", {
      useAdminToken: true
    });
  }

  async checkHealth() {
    return await this.request("/health");
  }
}

export const api = new ApiService();
