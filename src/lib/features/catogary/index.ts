import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { getAllCategories, getAllProducts, getProductsById } from "./actions";

export interface CounterState {}

const initialState: CounterState = {};

export const categorySlice = createSlice({
  name: "category",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder.addCase(getAllProducts.fulfilled, (state, { payload }) => {});
    builder.addCase(getAllCategories.fulfilled, (state, { payload }) => {});
    builder.addCase(getProductsById.fulfilled, (state, { payload }) => {});
  },
});

export const {} = categorySlice.actions;
export { getAllProducts, getAllCategories, getProductsById };
export default categorySlice.reducer;
