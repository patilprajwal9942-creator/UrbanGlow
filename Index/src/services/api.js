import axios from "axios";

// ==========================================
// AXIOS INSTANCE
// ==========================================

const api = axios.create({
 baseURL: import.meta.env.VITE_API_URL,

  headers: {
    "Content-Type": "application/json",
  },

  withCredentials: true,
});

// ==========================================
// NORMAL USER AUTH API
// ==========================================

export const authAPI = {
  register: (data) =>
    api.post("/auth/register", data),

  login: (data) =>
    api.post("/auth/login", data),

  googleLogin: (data) =>
    api.post("/auth/google", data),

  logout: () =>
    api.post("/auth/logout"),

  getMe: () =>
    api.get("/auth/me"),

  updatePassword: (data) =>
    api.put("/auth/update-password", data),

  sendOTP: (data) =>
    api.post("/auth/send-otp", data),

  verifyOTP: (data) =>
    api.post("/auth/verify-otp", data),

  resendOTP: (data) =>
    api.post("/auth/resend-otp", data),

  verifyPhone: (data) =>
    api.post("/auth/verify-phone", data),

  resetPassword: (data) =>
    api.post("/auth/reset-password", data),
};

// ==========================================
// ADMIN AUTH API
// ==========================================

export const adminAuthAPI = {
  login: (data) =>
    api.post("/admin/auth/login", data),

  logout: () =>
    api.post("/admin/auth/logout"),

  getMe: () =>
    api.get("/admin/auth/me"),
};

// ==========================================
// SALON API
// ==========================================

export const salonAPI = {

  // Get All Salons
  getAll: (params) =>
    api.get("/salons", { params }),

  // Get Salon By ID
  getById: (id) =>
    api.get(`/salons/${id}`),

  // Create Salon
  create: (data) =>
    api.post("/salons", data),

  // Update Salon
  update: (id, data) =>
    api.put(`/salons/${id}`, data),

  // Delete Salon
  delete: (id) =>
    api.delete(`/salons/${id}`),

  // Get Logged In Salon Owner's Salon
  getMySalon: () =>
    api.get("/salons/my-salon"),

  // Get Nearby Salons
  getNearby: (
    latitude,
    longitude,
    maxDistance
  ) =>
    api.get("/salons/nearby", {
      params: {
        latitude,
        longitude,
        maxDistance,
      },
    }),

  // Update Salon Location
  updateMyLocation: (
    latitude,
    longitude
  ) =>
    api.put(
      "/salons/my-salon/location",
      {
        latitude,
        longitude,
      }
    ),

  // Update Salon Working Hours
  updateWorkingHours: (data) =>
    api.put(
      "/salons/my-salon/working-hours",
      data
    ),
};

// ==========================================
// SERVICE API
// ==========================================

export const serviceAPI = {

  getAll: (params) =>
    api.get("/services", { params }),

  getById: (id) =>
    api.get(`/services/${id}`),

  create: (data) =>
    api.post("/services", data),

  update: (id, data) =>
    api.put(`/services/${id}`, data),

  delete: (id) =>
    api.delete(`/services/${id}`),

  getBySalon: (salonId) =>
    api.get(`/services/salon/${salonId}`),
};

// ==========================================
// SLOT API
// ==========================================

export const slotAPI = {

  getAll: (params) =>
    api.get("/slots", { params }),

  getById: (id) =>
    api.get(`/slots/${id}`),

  create: (data) =>
    api.post("/slots", data),

  update: (id, data) =>
    api.put(`/slots/${id}`, data),

  delete: (id) =>
    api.delete(`/slots/${id}`),

  getBySalon: (
    salonId,
    params
  ) =>
    api.get(
      `/slots/salon/${salonId}`,
      { params }
    ),

  getAvailableDates: (salonId) =>
    api.get(
      `/slots/available-dates/${salonId}`
    ),
};

// ==========================================
// BOOKING API
// ==========================================

export const bookingAPI = {

  getAll: (params) =>
    api.get("/bookings", { params }),

  getById: (id) =>
    api.get(`/bookings/${id}`),

  create: (data) =>
    api.post("/bookings", data),

  update: (id, data) =>
    api.put(`/bookings/${id}`, data),

  cancel: (id) =>
    api.put(`/bookings/${id}/cancel`),

  getMyBookings: () =>
    api.get("/bookings/my-bookings"),

  getByCustomer: (customerId) =>
    api.get(
      `/bookings/customer/${customerId}`
    ),

  getBySalonOwner: (userId) =>
    api.get(
      `/bookings/salon-owner/${userId}`
    ),

  getBySalon: (salonId) =>
    api.get(
      `/bookings/salon/${salonId}`
    ),

  updateStatus: (id, status) =>
    api.patch(
      `/bookings/${id}/status`,
      { status }
    ),
};

// ==========================================
// NOTIFICATION API
// ==========================================

export const notificationAPI = {

  getAll: () =>
    api.get("/notifications"),

  getUnread: () =>
    api.get("/notifications/unread"),

  markRead: (id) =>
    api.patch(
      `/notifications/${id}/read`
    ),

  markReadAll: () =>
    api.patch(
      "/notifications/read-all"
    ),
};

// ==========================================
// SUPPORT API
// ==========================================

export const supportAPI = {

  // Create Customer Support Ticket
  create: (data) =>
    api.post("/support", data),

  // Get Logged In Customer's Tickets
  getMyTickets: () =>
    api.get("/support/my-tickets"),
};

// ==========================================
// ANALYTICS API
// ==========================================

export const analyticsAPI = {

  getOverview: (salonId) =>
    api.get(
      `/analytics/salon/${salonId}/overview`
    ),

  getDaily: (
    salonId,
    params
  ) =>
    api.get(
      `/analytics/salon/${salonId}/daily`,
      { params }
    ),

  getTransactions: (
    salonId,
    params
  ) =>
    api.get(
      `/analytics/salon/${salonId}/transactions`,
      { params }
    ),
};

// ==========================================
// ADMIN DASHBOARD API
// ==========================================

export const adminAPI = {

  // ==========================================
  // DASHBOARD
  // ==========================================

  getStats: () =>
    api.get("/admin/stats"),

  getDashboard: () =>
    api.get("/admin/dashboard"),

  // ==========================================
  // ANALYTICS
  // ==========================================

  getAnalytics: (params) =>
    api.get(
      "/admin/analytics",
      { params }
    ),

  getSalonAnalytics: (params) =>
    api.get(
      "/admin/analytics/salons",
      { params }
    ),

  getTransactions: (params) =>
    api.get(
      "/admin/transactions",
      { params }
    ),

  // ==========================================
  // SALON MANAGEMENT
  // ==========================================

  getSalons: (params) =>
    api.get(
      "/admin/salons",
      { params }
    ),

  getSalonById: (id) =>
    api.get(
      `/admin/salons/${id}`
    ),

  updateSalonStatus: (
    id,
    status
  ) =>
    api.patch(
      `/admin/salons/${id}/status`,
      { status }
    ),

  // ==========================================
  // USER MANAGEMENT
  // ==========================================

  getUsers: (params) =>
    api.get(
      "/admin/users",
      { params }
    ),

  getUserById: (id) =>
    api.get(
      `/admin/users/${id}`
    ),

  updateUserStatus: (
    id,
    isActive
  ) =>
    api.patch(
      `/admin/users/${id}/status`,
      { isActive }
    ),

  // ==========================================
  // BOOKING MANAGEMENT
  // ==========================================

  getBookings: (params) =>
    api.get(
      "/admin/bookings",
      { params }
    ),

  getBookingById: (id) =>
    api.get(
      `/admin/bookings/${id}`
    ),
};

// ==========================================
// EXPORT AXIOS INSTANCE
// ==========================================

export default api;