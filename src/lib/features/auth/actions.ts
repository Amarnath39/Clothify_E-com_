import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiConnector } from "@/apis/apiConnector";
import { selectToken } from "@/lib/hooks";
// 1. Import your thunk config type from your store file
import type { AppThunkConfig } from "@/lib/store"; // Adjust path if needed

// Note: It's highly recommended to replace 'any' with specific types for your data.
// For example: interface LoginPayload { email: string; password; string; }

export const login = createAsyncThunk<any, any, AppThunkConfig>(
  "auth/login", // Conventional action type name
  async (data, { rejectWithValue, getState }) => {
    // 2. getState() is now correctly typed
    const state = getState();
    const token = selectToken(state);

    try {
      const response = await apiConnector("post", "/api/auth", data, {}, null);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const verifyOtp = createAsyncThunk<any, any, AppThunkConfig>(
  "auth/verifyOtp",
  async (data, { rejectWithValue, getState }) => {
    const state = getState();
    const token = selectToken(state);
    try {
      const response = await apiConnector("post", "/api/auth/verify-otp", data, {}, null);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const getUserDetails = createAsyncThunk<any, void, AppThunkConfig>(
  "auth/getUserDetails",
  async (_, { rejectWithValue, getState }) => {
    const state = getState();
    const token = selectToken(state);
    try {
      const response = await apiConnector("get", "/api/user", null, {}, null);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const updateUserDetails = createAsyncThunk<any, any, AppThunkConfig>(
  "auth/updateUserDetails",
  async (data, { rejectWithValue, getState }) => {
    const state = getState();
    const token = selectToken(state);
    try {
      const response = await apiConnector("patch", "/api/user", data, {}, null);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const loginAdmin = createAsyncThunk<any, any, AppThunkConfig>(
  "auth/loginAdmin",
  async (data, { rejectWithValue }) => {
    // Note: getState was not used here, but it's still best practice to type the thunk.
    try {
      const response = await apiConnector("post", "/api/auth/admin", data, {}, null);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const logoutApi = createAsyncThunk<any, void, AppThunkConfig>(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiConnector("post", "/api/auth/logout", null, {}, null);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const smsLogin = createAsyncThunk<any, any, AppThunkConfig>(
  "auth/smsLogin",
  async (data, { rejectWithValue, getState }) => {
    const state = getState();
    const token = selectToken(state);

    try {
      const response = await apiConnector("post", "/api/auth/login", data, {}, null);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const emailLogin = createAsyncThunk<any, { email: string }, AppThunkConfig>(
  "auth/emailLogin",
  async ({ email }, { rejectWithValue, getState }) => {
    const state = getState();
    const token = selectToken(state);

    try {
      const response = await apiConnector("post", "/api/auth/login", { email }, {}, token);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || { message: "Email login failed" });
    }
  }
);