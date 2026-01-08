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

export const getVisibleCoupons = createAsyncThunk(
  "/coupon",
  async (_, { rejectWithValue, getState }) => {
    const state: any = getState();
    const userId = state.auth?.user?._id; // Get current user ID

    try {
      const response = await apiConnector(
        "get",
        "/api/coupon",
        null,
        { "x-user-id": userId }, // Pass user ID in header
        null
      );

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const getCouponById = createAsyncThunk(
  "/couponByid",
  async (data: any, { rejectWithValue, getState }) => {
    const state: any = getState();
    const userId = state.auth?.user?._id || state.auth?.userId;

    if (!userId) {
      return rejectWithValue({
        success: false,
        msg: "User not authenticated",
      });
    }

    try {
      const response = await apiConnector(
        "post",
        `/api/coupon/${encodeURIComponent(data.code)}`,
        { totalPrice: data.totalPrice },  // 🔥 BODY (Backend expects JSON)
        {
          "x-user-id": userId,           // 🔥 HEADER
        },
        null
      );

      console.log("✅ Coupon response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Coupon error:", error);
      return rejectWithValue(error.response?.data);
    }
  }
);