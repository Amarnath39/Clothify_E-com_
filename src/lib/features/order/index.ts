import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  getOrdersData,
  proceedToCheckoutApi,
  refreshOrderStatus,
  successOrder,
} from "./actions";

export interface CounterState {
  currentOrder: any;
  orderId: string | null;
  orderDate: string | null;
}

const initialState: CounterState = {
  currentOrder: {},
  orderId: null,
  orderDate: null,
};

export const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    setInitialState: () => initialState,
    // setCurrentOrder: (state, action) => {
    //   state.currentOrder = action.payload;
    // },
    setOrderId: (
      state,
      action: PayloadAction<{ orderId: string; orderDate: string }>
    ) => {
      state.orderId = action.payload.orderId; // Store the orderId
      state.orderDate = action.payload.orderDate;
    },
    clearOrderId: (state) => {
      state.orderId = null; // Clear the orderId
      state.orderDate = null;
    },
  },

  extraReducers: (builder) => {
    builder.addCase(proceedToCheckoutApi.fulfilled, (state, { payload }) => {
      if (payload.success) {
        state.currentOrder = payload.orderDetails;
      }
    });
    builder.addCase(successOrder.fulfilled, (state, { payload }) => {});
    builder.addCase(getOrdersData.fulfilled, (state, { payload }) => {});
    builder.addCase(refreshOrderStatus.fulfilled, (state, { payload }) => {});
  },
});

export const { setInitialState, setOrderId, clearOrderId } = orderSlice.actions;
export {
  proceedToCheckoutApi,
  successOrder,
  getOrdersData,
  refreshOrderStatus,
};
export default orderSlice.reducer;
