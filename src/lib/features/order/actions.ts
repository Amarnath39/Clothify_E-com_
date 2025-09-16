// import { createAsyncThunk } from "@reduxjs/toolkit";

// import { apiConnector } from "@/apis/apiConnector";
// import { selectToken } from "@/lib/hooks";

// export const proceedToCheckoutApi = createAsyncThunk(
//   "/order",

//   async (data: any, { rejectWithValue, getState }) => {
//     const token = selectToken(getState());
//     try {
//       const response = await apiConnector("post", `/api/order`, data, {}, null);
//       return response.data;
//     } catch (error: any) {
//       return rejectWithValue(error.response?.data);
//     }
//   }
// );

// export const getOrdersData = createAsyncThunk(
//   "/orders-data",

//   async (_, { rejectWithValue, getState }) => {
//     const token = selectToken(getState());
//     try {
//       const response = await apiConnector("get", `/api/order`, null, {}, null);
//       return response.data;
//     } catch (error: any) {
//       return rejectWithValue(error.response?.data);
//     }
//   }
// );

// export const successOrder = createAsyncThunk(
//   "/orders",

//   async (data: any, { rejectWithValue, getState }) => {
//     const token = selectToken(getState());
//     try {
//       const response = await apiConnector(
//         "post",
//         `/api/order/${data.id}`,
//         data,
//         {},
//         null
//       );
//       return response.data;
//     } catch (error: any) {
//       return rejectWithValue(error.response?.data);
//     }
//   }
// );

// export const refreshOrderStatus = createAsyncThunk(
//   "/refreshOrders",

//   async (
//     data: { orderId: string; transactionId: string; userId?: string }, // ✅ added userId
//     { rejectWithValue, getState }
//   ) => {
//     const token = selectToken(getState());
//     try {
//       const response = await apiConnector(
//         "get", // ✅ GET instead of POST
//         `/api/payment/status/${data.orderId}`,
//         null,
//         {
//           "x-user-id": data.userId || "", // ✅ use optional userId
//         },
//         null
//       );
//       return response.data;
//     } catch (error: any) {
//       return rejectWithValue(error.response?.data);
//     }
//   }
// );

import { createAsyncThunk } from "@reduxjs/toolkit";

import { apiConnector } from "@/apis/apiConnector";
import { selectToken } from "@/lib/hooks";



export const proceedToCheckoutApi = createAsyncThunk(
  "/order",

  async (data: any, { rejectWithValue, getState }) => {
    const token = selectToken(getState());
    try {
      const response = await apiConnector("post", `/api/order`, data, {}, null);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const getOrdersData = createAsyncThunk(
  "/orders-data",

  async (_, { rejectWithValue, getState }) => {
    const token = selectToken(getState());
    try {
      const response = await apiConnector("get", `/api/order`, null, {}, null);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const successOrder = createAsyncThunk(
  "/orders",

  async (data: any, { rejectWithValue, getState }) => {
    const token = selectToken(getState());
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

export const refreshOrderStatus = createAsyncThunk(
  "/refreshOrders",
  async (
    data: { transactionId: string; userId?: string }, // ❌ removed orderId from here
    { rejectWithValue, getState }
  ) => {
    const state: any = getState();
    const token = selectToken(state);

    // ✅ Get orderId from Redux slice
    const orderId = state.order?.orderId; 

    try {
      const response = await apiConnector(
        "get",
        `/api/payment/status/${orderId}`,
        null,
        {
          "x-user-id": data.userId || "",
          Authorization: token ? `Bearer ${token}` : "",
        },
        null
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);



