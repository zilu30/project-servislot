import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true; 
      const refresh = sessionStorage.getItem("refresh");

      if (!refresh) {
        sessionStorage.clear();
        window.location.href = "/customer-login";
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          "http://127.0.0.1:8000/api/token/refresh/",
          { refresh }
        );
        sessionStorage.setItem("access", data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
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
