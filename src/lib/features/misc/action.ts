import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiConnector } from "@/apis/apiConnector";
import { selectToken } from "@/lib/hooks";
// 1. Import your thunk config type
import type { AppThunkConfig } from "@/lib/store"; // Adjust path if needed

export const getSearchSuggestion = createAsyncThunk<any, string, AppThunkConfig>(
  "misc/getSearchSuggestion", // 2. Conventional action type name
  async (searchQuery, { rejectWithValue, getState }) => {
    // 3. getState() is now correctly typed
    const state = getState();
    const token = selectToken(state);

    try {
      const response = await apiConnector(
        "get",
        `/api/search?search=${encodeURIComponent(searchQuery)}`,
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


export const getImageTextData = createAsyncThunk<any, void, AppThunkConfig>(
  "misc/getImageTextData",
  async (_, { rejectWithValue, getState }) => {
    const state = getState();
    const token = selectToken(state);

    try {
      const response = await apiConnector(
        "get",
        `/api/imageText`,
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