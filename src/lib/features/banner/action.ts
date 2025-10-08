import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiConnector } from "@/apis/apiConnector";
import { selectToken } from "@/lib/hooks";
// 1. Import your thunk config type
import type { AppThunkConfig } from "@/lib/store"; // Adjust path if needed

// Note: It's best to replace 'any' with a specific type for your banner data, e.g., Banner[]
export const getAllBanner = createAsyncThunk<any, void, AppThunkConfig>(
  "banner/getAll", // 2. Conventional action type name
  async (_, { rejectWithValue, getState }) => {
    // 3. getState() is now correctly typed
    const state = getState();
    const token = selectToken(state);
    
    try {
      const response = await apiConnector("get", `/api/banner`, null, {}, null);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);