import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { getAllBanner } from "./action";

const initialState = {};

export const bannerSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // setInitialState: () => initialState,
  },

  extraReducers: (builder) => {
    builder.addCase(getAllBanner.fulfilled, (state, { payload }) => {});
  },
});

export const {} = bannerSlice.actions;
export { getAllBanner };
export default bannerSlice.reducer;
