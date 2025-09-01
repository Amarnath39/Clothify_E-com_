// import { makeStore } from "@/lib/store";
// import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

// // Create a function to get the current token from the store
// const getToken = () => {
//   const state: any = makeStore.getState();
//   return state.auth.token;
// };

// // Create the Axios instance
// const api: AxiosInstance = axios.create({
//   baseURL: "/api",
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// // Request interceptor
// api.interceptors.request.use(
//   (config: any) => {
//     const token = getToken();
//     if (token && config.headers) {
//       config.headers["Authorization"] = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // Response interceptor (optional, but useful for global error handling)
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response && error.response.status === 401) {
//       // Handle unauthorized access (e.g., logout user, refresh token)
//     }
//     return Promise.reject(error);
//   }
// );

// // Helper functions for common HTTP methods
// export const get = <T>(url: string, config?: AxiosRequestConfig) =>
//   api.get<T>(url, config);

// export const post = <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
//   api.post<T>(url, data, config);

// export const put = <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
//   api.put<T>(url, data, config);

// export const del = <T>(url: string, config?: AxiosRequestConfig) =>
//   api.delete<T>(url, config);

// export default api;
