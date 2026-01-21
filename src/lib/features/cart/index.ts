import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { getCartItems, getCouponById, getVisibleCoupons } from "./action";

export interface CounterState { }

const initialState: any = {
  items: [],
  totalAmount: 0,
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setInitialState: () => initialState,
    addToCart: (state, action: PayloadAction<{ id: string; size: any; quantity?: number }>) => {
      const { id, size, quantity } = action.payload;
      const countToAdd = quantity || 1;

      const existingItem = state.items.find((item) => {
        return item.id === id && item.size._id === size._id;
      });
      if (existingItem) {
        existingItem.count += countToAdd;
      } else {
        state.items.push({ id, size, count: countToAdd });
      }
    },
    increaseCount: (
      state,
      action: PayloadAction<{ id: string; sizeId: string }>
    ) => {
      const { id, sizeId } = action.payload;

      const item = state.items.find((item) => {
        return item.id === id && item.size._id === sizeId;
      });
      if (item) {
        item.count += 1;
      }
    },
    decreaseCount: (
      state,
      action: PayloadAction<{ id: string; sizeId: string }>
    ) => {
      const { id, sizeId } = action.payload;
      const item = state.items.find(
        (item) => item.id === id && item.size._id === sizeId
      );
      if (item) {
        if (item.count > 1) {
          item.count -= 1;
        } else {
          state.items = state.items.filter(
            (i) => !(i.id === id && i.size._id === sizeId)
          );
        }
      }
    },
    removeFromCart: (
      state,
      action: PayloadAction<{ id: string; sizeId: string }>
    ) => {
      const { id, sizeId } = action.payload;

      state.items = state.items.filter((item) => {
        return !(item.id === id && item.size._id === sizeId);
      });
    },
    emptyCart: (state) => {
      state.items = [];
      state.totalAmount = 0;
    },
    setTotalAmount: (state, action: PayloadAction<number>) => {
      state.totalAmount = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(getCartItems.fulfilled, (state, { payload }) => { });
    builder.addCase(getVisibleCoupons.fulfilled, (state, { payload }) => { });
    builder.addCase(getCouponById.fulfilled, (state, { payload }) => { });
  },
});

export const {
  setInitialState,
  addToCart,
  increaseCount,
  decreaseCount,
  removeFromCart,
  emptyCart,
  setTotalAmount,
} = cartSlice.actions;
export { getCartItems, getCouponById, getVisibleCoupons };
export default cartSlice.reducer;
