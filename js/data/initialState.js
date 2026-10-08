/**
 * DRIFTVERSE - Initial App State, Categories, Users & Comments
 */
export const initialUsers = [
  {
    id: "user-admin-01",
    name: "Commander Drift",
    email: "admin@driftverse.com",
    role: "Admin",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
    driverBadge: "DRIFT COMMANDER",
    joined: "2023-01-10",
    isBlocked: false,
    garageCars: ["bmw-m4-competition", "porsche-911-gt3-rs", "nissan-gtr-r35"],
    likedVideos: ["vid-m4-night-drift", "vid-gt3rs-nurburgring", "vid-m4-vs-gtr-drag"]
  },
  {
    id: "user-driver-02",
    name: "Alex Apex",
    email: "driver@driftverse.com",
    role: "User",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80",
    driverBadge: "PRO DRIFTER",
    joined: "2023-08-14",
    isBlocked: false,
    garageCars: ["toyota-supra-mk4", "mazda-rx7-fd", "nissan-silvia-s15"],
    likedVideos: ["vid-supra-mk4-sound", "vid-rx7-vs-silvia-touge", "vid-extreme-drift-compilation"]
  },
  {
    id: "user-turbo-03",
    name: "Elena Boost",
    email: "elena@driftverse.com",
    role: "User",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
    driverBadge: "APEX HUNTER",
    joined: "2024-02-19",
    isBlocked: false,
    garageCars: ["ferrari-sf90-stradale", "koenigsegg-jesko-attack"],
    likedVideos: ["vid-sf90-vs-720s-drag", "vid-jesko-track-telemetry"]
  }
];

export const initialComments = [
  {
    id: "comm-01",
    videoId: "vid-m4-night-drift",
    userName: "Alex Apex",
    userAvatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80",
    content: "The transition into third gear at 2:14 is absolute poetry. S58 torque delivery is completely unhinged!",
    timestamp: "2 hours ago",
    likes: 42,
    reported: false
  },
  {
    id: "comm-02",
    videoId: "vid-m4-vs-gtr-drag",
    userName: "Elena Boost",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
    content: "AWD launch of the GT-R still destroys anything off the line. But that top-end pull of the M4 G82 is scary.",
    timestamp: "5 hours ago",
    likes: 89,
    reported: false
  },
  {
    id: "comm-03",
    videoId: "vid-supra-mk4-sound",
    userName: "Commander Drift",
    userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
    content: "There will never be another engine sound like an open-wastegate 2JZ. Pure goosebumps every single second.",
    timestamp: "1 day ago",
    likes: 154,
    reported: false
  },
  {
    id: "comm-04",
    videoId: "vid-aventador-flames",
    userName: "Alex Apex",
    userAvatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80",
    content: "Shooting blue blowtorch flames through the Monaco tunnel! That V12 crescendo will be remembered forever.",
    timestamp: "3 days ago",
    likes: 95,
    reported: false
  }
];

export const categoriesList = [
  { id: "all", name: "All Channels", icon: "🔥" },
  { id: "Drift", name: "Drift Zone", icon: "💨" },
  { id: "Supercars", name: "Supercars", icon: "⚡" },
  { id: "Hypercars", name: "Hypercars", icon: "🚀" },
  { id: "JDM", name: "JDM Culture", icon: "🔰" },
  { id: "Racing", name: "Circuit Racing", icon: "🏁" },
  { id: "Drag Race", name: "Drag Battles", icon: "🚦" },
  { id: "Exhaust & Engine Sound", name: "Exhaust & Sound", icon: "🔊" },
  { id: "Tuning & Builds", name: "Tuning & Builds", icon: "🔧" }
];

export const carCategories = [
  "All",
  "JDM",
  "Supercar",
  "Hypercar",
  "Sports",
  "Drift",
  "Muscle",
  "Electric"
];

export const carBrands = [
  "All",
  "BMW",
  "Nissan",
  "Toyota",
  "Mazda",
  "Porsche",
  "Lamborghini",
  "Ferrari",
  "McLaren",
  "Bugatti",
  "Koenigsegg",
  "Ford",
  "Chevrolet",
  "Mercedes-Benz",
  "Audi",
  "Rimac"
];
