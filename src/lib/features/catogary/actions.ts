import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiConnector } from "@/apis/apiConnector";
import { selectToken } from "@/lib/hooks";
// 1. Import your thunk config type
import type { AppThunkConfig } from "@/lib/store"; // Adjust path if needed

// Note: It's best to replace 'any' with specific types like Product[], Category[], etc.
export const getAllProducts = createAsyncThunk<any, string, AppThunkConfig>(
  "products/getAll", // 2. Conventional action type name
  async (queryString, { rejectWithValue, getState }) => {
    // 3. getState() is now correctly typed
    const state = getState();
    const token = selectToken(state);

    try {
      const response = await apiConnector(
        "get",
        `/api/products?${queryString}`,
        null,
        {},
        null
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const getAllCategories = createAsyncThunk<any, void, AppThunkConfig>(
  "category/getAll",
  async (_, { rejectWithValue, getState }) => {
    const state = getState();
    const token = selectToken(state);

    try {
      const response = await apiConnector(
        "get",
        `/api/category`,
        null,
        {},
        null
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const getProductsById = createAsyncThunk<any, string, AppThunkConfig>(
  "products/getById",
  async (productId, { rejectWithValue, getState }) => {
    const state = getState();
    const token = selectToken(state);
    
    try {
      const response = await apiConnector(
        "get",
        `/api/products/${productId}`,
        null,
        {},
        null
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);