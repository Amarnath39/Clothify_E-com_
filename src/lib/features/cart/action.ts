import { createAsyncThunk } from "@reduxjs/toolkit";

import { apiConnector } from "@/apis/apiConnector";
import { selectToken } from "@/lib/hooks";

export const getCartItems = createAsyncThunk(
  "/cart",

  async (data: any, { rejectWithValue, getState }) => {
    const token = selectToken(getState());
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
    const token = selectToken(getState());
    try {
      const response = await apiConnector("get", "/api/coupon", null, {}, null);
    

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const getCouponById = createAsyncThunk(
  "/couponByid",

  async (data: any, { rejectWithValue, getState }) => {
    const token = selectToken(getState());
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
