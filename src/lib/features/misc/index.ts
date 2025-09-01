import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { getImageTextData, getSearchSuggestion } from "./action";

export interface CounterState {}

const initialState: CounterState = {};

export const miscSlice = createSlice({
  name: "misc",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder.addCase(getSearchSuggestion.fulfilled, (state, { payload }) => {});
    builder.addCase(getImageTextData.fulfilled, (state, { payload }) => {});
  },
});

export const {} = miscSlice.actions;
export { getSearchSuggestion, getImageTextData };
export default miscSlice.reducer;
