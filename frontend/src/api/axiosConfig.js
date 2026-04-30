import axios from "axios";

// Central Axios instance — import this everywhere, never use raw axios in pages.
// Having one instance means auth headers and refresh logic are handled in one place.

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  headers: { "Content-Type": "application/json" },
});

// Attach the JWT access token to every outgoing request
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, try to silently refresh the access token and replay the original request.
// If the refresh also fails (expired/missing), clear session and redirect to login.
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true; // prevent infinite retry loop
      const refresh = sessionStorage.getItem("refresh");

      if (!refresh) {
        sessionStorage.clear();
        window.location.href = "/customer-login";
        return Promise.reject(error);
      }

      try {
        // use raw axios here — the interceptor shouldn't intercept itself
        const { data } = await axios.post(
          "http://127.0.0.1:8000/api/token/refresh/",
          { refresh }
        );
        sessionStorage.setItem("access", data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original); // replay the failed request with the new token
      } catch {
        sessionStorage.clear();
        window.location.href = "/customer-login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
