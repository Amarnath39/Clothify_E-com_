import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  AddNewAddress,
  deleteAddress,
  getAllAddress,
  makeDefaultAddress,
  updateAddress,
} from "./actions";

const initialState = {
  addressState: "",
};

export const addressSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // setInitialState: () => initialState,
    setAddressState: (state, action) => {
      state.addressState = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder.addCase(getAllAddress.fulfilled, (state, { payload }) => {});
    builder.addCase(AddNewAddress.fulfilled, (state, { payload }) => {});
    builder.addCase(makeDefaultAddress.fulfilled, (state, { payload }) => {});
    builder.addCase(updateAddress.fulfilled, (state, { payload }) => {});
    builder.addCase(deleteAddress.fulfilled, (state, { payload }) => {});
  },
});

export const { setAddressState } = addressSlice.actions;
export {
  getAllAddress,
  deleteAddress,
  makeDefaultAddress,
  updateAddress,
  AddNewAddress,
};
export default addressSlice.reducer;
