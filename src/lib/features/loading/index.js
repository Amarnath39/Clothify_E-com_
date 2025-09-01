import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  loading: false,
};

export const LoadSlice = createSlice({
  name: "load",
  initialState,
  reducers: {
    setLoader: (state, action) => {
      return { ...state, loading: action.payload };
    },
  },
});

export const { setLoader } = LoadSlice.actions;
export default LoadSlice.reducer;
