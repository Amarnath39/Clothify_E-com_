import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiConnector } from "@/apis/apiConnector";
import { selectToken } from "@/lib/hooks";
// 1. Import your thunk config type
import type { AppThunkConfig } from "@/lib/store"; // Adjust path if needed

// Note: It's best to replace 'any' with specific types for your cart and coupon data.
export const getCartItems = createAsyncThunk<any, any, AppThunkConfig>(
  "cart/getItems", // 2. Conventional action type name
  async (data, { rejectWithValue, getState }) => {
    // 3. getState() is now correctly typed
    const state = getState();
    const token = selectToken(state);
    
    try {
      const response = await apiConnector("post", "/api/cart", data, {}, null);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const getVisibleCoupons = createAsyncThunk<any, void, AppThunkConfig>(
  "cart/getVisibleCoupons",
  async (_, { rejectWithValue, getState }) => {
    const state = getState();
    const token = selectToken(state);
    
    try {
      const response = await apiConnector("get", "/api/coupon", null, {}, null);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const getCouponById = createAsyncThunk<any, { code: string; amount: number }, AppThunkConfig>(
  "cart/getCouponById",
  async (data, { rejectWithValue, getState }) => {
    const state = getState();
    const token = selectToken(state);
    
    try {
      const response = await apiConnector(
        "get",
        `/api/coupon/${data.code}?totalPrice=${data.amount}`,
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