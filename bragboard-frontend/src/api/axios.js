import axios from "axios";

// Create an axios instance
const API = axios.create({
  baseURL: "http://127.0.0.1:8000", // backend URL
  // No need to set multipart/form-data by default, 
  // axios will handle it when using FormData
});

// Add JWT token automatically to all requests if present
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // assuming token is stored in localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;
