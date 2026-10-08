/**
 * DRIFTVERSE - Central Reactive Store & LocalStorage Persistence
 */
import { initialCars } from "../data/cars.js";
import { initialVideos } from "../data/videos.js";
import { initialUsers, initialComments } from "../data/initialState.js";

const STORAGE_KEYS = {
  CARS: "driftverse_cars_v1",
  VIDEOS: "driftverse_videos_v1",
  USERS: "driftverse_users_v1",
  COMMENTS: "driftverse_comments_v1",
  CURRENT_USER: "driftverse_current_user_v1",
  THEME: "driftverse_theme_v1",
  SOUND: "driftverse_sound_v1",
  COMPARE: "driftverse_compare_v1",
  BATTLES: "driftverse_battles_v1"
};

class Store {
  constructor() {
    this.listeners = new Set();
    this.init();
  }

  init() {
    // Load or initialize Cars
    const storedCars = localStorage.getItem(STORAGE_KEYS.CARS);
    this.cars = storedCars ? JSON.parse(storedCars) : [...initialCars];

    // Load or initialize Videos
    const storedVideos = localStorage.getItem(STORAGE_KEYS.VIDEOS);
    this.videos = storedVideos ? JSON.parse(storedVideos) : [...initialVideos];

    // Load or initialize Users
    const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    this.users = storedUsers ? JSON.parse(storedUsers) : [...initialUsers];

    // Load or initialize Comments
    const storedComments = localStorage.getItem(STORAGE_KEYS.COMMENTS);
    this.comments = storedComments ? JSON.parse(storedComments) : [...initialComments];

    // Current User (default to demo user or null)
    const storedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    this.currentUser = storedUser ? JSON.parse(storedUser) : this.users[1]; // Alex Apex as default logged-in driver

    // Theme (Dark by default)
    const storedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    this.theme = storedTheme || "dark";

    // Sound FX
    const storedSound = localStorage.getItem(STORAGE_KEYS.SOUND);
    this.soundEnabled = storedSound !== null ? JSON.parse(storedSound) : true;

    // Compare car IDs (default BMW M4 + Nissan GT-R ready for battle)
    const storedCompare = localStorage.getItem(STORAGE_KEYS.COMPARE);
    this.compareList = storedCompare ? JSON.parse(storedCompare) : ["bmw-m4-competition", "nissan-gtr-r35"];

    // Battle history
    const storedBattles = localStorage.getItem(STORAGE_KEYS.BATTLES);
    this.battleHistory = storedBattles ? JSON.parse(storedBattles) : [];
  }

  notify() {
    this.save();
    this.listeners.forEach((listener) => {
      try {
        listener(this);
      } catch (err) {
        console.error("Store listener error:", err);
      }
    });
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  save() {
    localStorage.setItem(STORAGE_KEYS.CARS, JSON.stringify(this.cars));
    localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(this.videos));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(this.comments));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(this.currentUser));
    localStorage.setItem(STORAGE_KEYS.THEME, this.theme);
    localStorage.setItem(STORAGE_KEYS.SOUND, JSON.stringify(this.soundEnabled));
    localStorage.setItem(STORAGE_KEYS.COMPARE, JSON.stringify(this.compareList));
    localStorage.setItem(STORAGE_KEYS.BATTLES, JSON.stringify(this.battleHistory));
  }

  // --- THEME ---
  setTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    this.notify();
  }

  toggleTheme() {
    const nextTheme = this.theme === "dark" ? "light" : "dark";
    this.setTheme(nextTheme);
    return nextTheme;
  }

  // --- AUDIO ---
  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
    this.notify();
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    this.notify();
    return this.soundEnabled;
  }

  // --- CARS CRUD ---
  getCars() {
    return [...this.cars];
  }

  getCarById(id) {
    return this.cars.find((c) => c.id === id);
  }

  addCar(carData) {
    const newCar = {
      ...carData,
      id: carData.id || `car-${Date.now()}`,
      views: carData.views || 0,
      rating: carData.rating || 5.0,
      gallery: carData.gallery && carData.gallery.length ? carData.gallery : [carData.image]
    };
    this.cars.unshift(newCar);
    this.notify();
    return newCar;
  }

  updateCar(id, updatedFields) {
    const index = this.cars.findIndex((c) => c.id === id);
    if (index !== -1) {
      this.cars[index] = { ...this.cars[index], ...updatedFields };
      this.notify();
      return this.cars[index];
    }
    return null;
  }

  deleteCar(id) {
    this.cars = this.cars.filter((c) => c.id !== id);
    this.compareList = this.compareList.filter((cId) => cId !== id);
    if (this.currentUser && this.currentUser.garageCars) {
      this.currentUser.garageCars = this.currentUser.garageCars.filter((cId) => cId !== id);
    }
    this.notify();
  }

  // --- GARAGE / FAVORITES ---
  toggleGarage(carId) {
    if (!this.currentUser) return { error: "AUTH_REQUIRED" };
    if (!this.currentUser.garageCars) this.currentUser.garageCars = [];

    const exists = this.currentUser.garageCars.includes(carId);
    if (exists) {
      this.currentUser.garageCars = this.currentUser.garageCars.filter((id) => id !== carId);
    } else {
      this.currentUser.garageCars.push(carId);
    }

    // Sync with users array
    const uIndex = this.users.findIndex((u) => u.id === this.currentUser.id);
    if (uIndex !== -1) {
      this.users[uIndex].garageCars = [...this.currentUser.garageCars];
    }

    this.notify();
    return { success: true, inGarage: !exists };
  }

  isCarInGarage(carId) {
    if (!this.currentUser || !this.currentUser.garageCars) return false;
    return this.currentUser.garageCars.includes(carId);
  }

  // --- COMPARE LIST ---
  addToCompare(carId) {
    if (this.compareList.includes(carId)) return false;
    if (this.compareList.length >= 4) {
      this.compareList.shift(); // keep max 4
    }
    this.compareList.push(carId);
    this.notify();
    return true;
  }

  removeFromCompare(carId) {
    this.compareList = this.compareList.filter((id) => id !== carId);
    this.notify();
  }

  clearCompare() {
    this.compareList = [];
    this.notify();
  }

  isCarCompared(carId) {
    return this.compareList.includes(carId);
  }

  // --- VIDEOS CRUD ---
  getVideos() {
    return [...this.videos];
  }

  getVideoById(id) {
    if (!id) return null;
    return this.videos.find((v) => v.id == id || String(v.id) === String(id) || v.youtube_id === id);
  }

  addVideo(videoData) {
    const newVideo = {
      ...videoData,
      id: videoData.id || `vid-${Date.now()}`,
      views: videoData.views || 0,
      likes: videoData.likes || 0,
      uploadDate: new Date().toISOString().split("T")[0]
    };
    this.videos.unshift(newVideo);
    this.notify();
    return newVideo;
  }

  updateVideo(id, updatedFields) {
    const index = this.videos.findIndex((v) => v.id === id);
    if (index !== -1) {
      this.videos[index] = { ...this.videos[index], ...updatedFields };
      this.notify();
      return this.videos[index];
    }
    return null;
  }

  deleteVideo(id) {
    this.videos = this.videos.filter((v) => v.id !== id);
    this.comments = this.comments.filter((c) => c.videoId !== id);
    this.notify();
  }

  toggleLikeVideo(id) {
    if (!this.currentUser) return { error: "AUTH_REQUIRED" };
    if (!this.currentUser.likedVideos) this.currentUser.likedVideos = [];

    const video = this.getVideoById(id);
    if (!video) return null;

    const isLiked = this.currentUser.likedVideos.includes(id);
    if (isLiked) {
      this.currentUser.likedVideos = this.currentUser.likedVideos.filter((vidId) => vidId !== id);
      video.likes = Math.max(0, video.likes - 1);
    } else {
      this.currentUser.likedVideos.push(id);
      video.likes += 1;
    }

    const uIndex = this.users.findIndex((u) => u.id === this.currentUser.id);
    if (uIndex !== -1) {
      this.users[uIndex].likedVideos = [...this.currentUser.likedVideos];
    }

    this.notify();
    return { liked: !isLiked, count: video.likes };
  }

  isVideoLiked(id) {
    if (!this.currentUser || !this.currentUser.likedVideos) return false;
    return this.currentUser.likedVideos.includes(id);
  }

  // --- SMART RACE VIDEO RECOMMENDATION ---
  getSmartRaceVideos(selectedCarIds) {
    if (!selectedCarIds || selectedCarIds.length === 0) return { directMatches: [], relatedVideos: [] };

    const selectedCars = selectedCarIds.map((id) => this.getCarById(id)).filter(Boolean);
    const carNames = selectedCars.map((c) => c.model);
    const carBrands = selectedCars.map((c) => c.brand);

    const directMatches = [];
    const relatedVideos = [];

    this.videos.forEach((video) => {
      // Direct match: Video cars array contains 2 or more of the selected cars,
      // or title contains multiple car models
      const matchedCarCount = selectedCars.filter((car) => {
        const inVideoCars = video.cars && video.cars.some((vc) => vc.toLowerCase().includes(car.model.toLowerCase()) || car.model.toLowerCase().includes(vc.toLowerCase()));
        const inTitle = video.title.toLowerCase().includes(car.model.toLowerCase()) || video.title.toLowerCase().includes(car.brand.toLowerCase());
        return inVideoCars || inTitle;
      }).length;

      if (matchedCarCount >= 2) {
        directMatches.push(video);
      } else if (matchedCarCount === 1) {
        relatedVideos.push(video);
      }
    });

    return {
      directMatches,
      relatedVideos: relatedVideos.slice(0, 6)
    };
  }

  // --- COMMENTS CRUD ---
  getVideoComments(videoId) {
    return this.comments.filter((c) => c.videoId === videoId);
  }

  addComment(videoId, text) {
    if (!this.currentUser) return { error: "AUTH_REQUIRED" };
    const newComment = {
      id: `comm-${Date.now()}`,
      videoId,
      userName: this.currentUser.name,
      userAvatar: this.currentUser.avatar,
      content: text,
      timestamp: "Just now",
      likes: 0,
      reported: false
    };
    this.comments.unshift(newComment);
    this.notify();
    return { success: true, comment: newComment };
  }

  deleteComment(id) {
    this.comments = this.comments.filter((c) => c.id !== id);
    this.notify();
  }

  // --- AUTH / USER MANAGEMENT ---
  setCurrentUser(user) {
    this.currentUser = user;
    this.notify();
  }

  login(email, password) {
    const user = this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return { success: false, message: "User not found with this email" };
    }
    if (user.isBlocked) {
      return { success: false, message: "This account has been suspended by Drift Control" };
    }
    this.currentUser = user;
    this.notify();
    return { success: true, user };
  }

  register({ name, email, password }) {
    const existing = this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return { success: false, message: "Email is already registered" };
    }
    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      role: "User",
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80`,
      driverBadge: "ROOKIE RACER",
      joined: new Date().toISOString().split("T")[0],
      isBlocked: false,
      garageCars: [],
      likedVideos: []
    };
    this.users.push(newUser);
    this.currentUser = newUser;
    this.notify();
    return { success: true, user: newUser };
  }

  logout() {
    this.currentUser = null;
    this.notify();
  }

  updateUserRole(userId, newRole) {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      user.role = newRole;
      if (this.currentUser && this.currentUser.id === userId) {
        this.currentUser.role = newRole;
      }
      this.notify();
      return true;
    }
    return false;
  }

  toggleBlockUser(userId) {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      user.isBlocked = !user.isBlocked;
      if (this.currentUser && this.currentUser.id === userId && user.isBlocked) {
        this.currentUser = null;
      }
      this.notify();
      return user.isBlocked;
    }
    return null;
  }

  // --- BATTLES RECORD ---
  recordBattle(battleData) {
    const battle = {
      id: `battle-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...battleData
    };
    this.battleHistory.unshift(battle);
    if (this.battleHistory.length > 20) this.battleHistory.pop();
    this.notify();
    return battle;
  }

  // Reset to demo state
  resetAll() {
    localStorage.clear();
    this.init();
    this.notify();
  }
}

export const store = new Store();
