import { createAsyncThunk } from "@reduxjs/toolkit";

import { apiConnector } from "@/apis/apiConnector";
import { selectToken } from "@/lib/hooks";
// --- 1. IMPORT THE NEW THUNK CONFIG TYPE ---
import type { AppThunkConfig } from "@/lib/store"; // Adjust the path to your store file if needed

// Note: It's a good practice to replace 'any' with specific types for your data,
// for example: Address[], NewAddressPayload, etc.

export const getAllAddress = createAsyncThunk<any, void, AppThunkConfig>(
  "/address",
  async (_, { rejectWithValue, getState }) => {
    // --- 2. GET STATE CORRECTLY ---
    const state = getState();
    const token = selectToken(state);
    try {
      const response = await apiConnector("get", `/api/address`, null, {}, null);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const AddNewAddress = createAsyncThunk<any, any, AppThunkConfig>(
  "/add-address",
  async (data, { rejectWithValue, getState }) => {
    const state = getState();
    const token = selectToken(state);
    try {
      const response = await apiConnector("post", `/api/address`, data, {}, null);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const deleteAddress = createAsyncThunk<any, string, AppThunkConfig>(
  "/del-address",
  async (addressId, { rejectWithValue, getState }) => {
    const state = getState();
    const token = selectToken(state);
    try {
      const response = await apiConnector("delete", `/api/address/${addressId}`, null, {}, null);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const makeDefaultAddress = createAsyncThunk<any, any, AppThunkConfig>(
  "/default-address",
  async (data, { rejectWithValue, getState }) => {
    const state = getState();
    const token = selectToken(state);
    try {
      const response = await apiConnector("post", `/api/address/default`, data, {}, null);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const updateAddress = createAsyncThunk<any, { id: string; address: any }, AppThunkConfig>(
  "/update-address",
  async (data, { rejectWithValue, getState }) => {
    const state = getState();
    const token = selectToken(state);
    try {
      const response = await apiConnector("patch", `/api/address/${data.id}`, data.address, {}, null);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);