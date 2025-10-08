import { createAsyncThunk } from "@reduxjs/toolkit";
import { apiConnector } from "@/apis/apiConnector";
import { selectToken } from "@/lib/hooks";
// 1. Import your thunk config type
import type { AppThunkConfig } from "@/lib/store"; // Adjust path if needed

export const proceedToCheckoutApi = createAsyncThunk<any, any, AppThunkConfig>(
  "order/checkout", // 2. Conventional action type name
  async (data, { rejectWithValue, getState }) => {
    // 3. getState() is now correctly typed
    const state = getState();
    const token = selectToken(state);

    try {
      const response = await apiConnector("post", `/api/order`, data, {}, null);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const getOrdersData = createAsyncThunk<any, void, AppThunkConfig>(
  "order/getAll",
  async (_, { rejectWithValue, getState }) => {
    const state = getState();
    const token = selectToken(state);

    try {
      const response = await apiConnector("get", `/api/order`, null, {}, null);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const successOrder = createAsyncThunk<any, any, AppThunkConfig>(
  "order/success",
  async (data, { rejectWithValue, getState }) => {
    const state = getState();
    const token = selectToken(state);

    try {
      const response = await apiConnector(
        "post",
        `/api/order/${data.id}`,
        data,
        {},
        null
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const refreshOrderStatus = createAsyncThunk<
  any,
  { orderId: string; transactionId: string; userId?: string },
  AppThunkConfig
>(
  "order/refreshStatus",
  async (data, { rejectWithValue, getState }) => {
    const state = getState();
    const token = selectToken(state);

    try {
      const response = await apiConnector(
        "get",
        `/api/payment/status/${data.transactionId}`,
        null,
        {
          "x-user-id": data.userId || "",
        },
        null
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);