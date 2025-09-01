import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { resizableProducts } from "./action";





export interface CounterState {}

const initialState: CounterState = {};

export const productSlice = createSlice({
  name: "misc",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder.addCase(resizableProducts.fulfilled, (state, { payload }) => {});
  },
});

export const {} = productSlice.actions;
export { resizableProducts };
export default productSlice.reducer;