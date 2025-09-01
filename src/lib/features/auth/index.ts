import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  getUserDetails,
  login,
  loginAdmin,
  logoutApi,
  smsLogin,
  updateUserDetails,
  verifyOtp,
  emailLogin, // ✅ Import emailLogin
} from "./actions";

export interface AuthState {
  id: string;
  authDialog: boolean;
  token: string | null;
  loading: boolean;
  user: any;
  adminToken: any;
}

const initialState: AuthState = {
  authDialog: false,
  id: "",
  token: null,
  loading: false,
  user: {},
  adminToken: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthDialog: (state, action: PayloadAction<boolean>) => {
      state.authDialog = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setUser: (state, action: PayloadAction<string>) => {
      state.id = action.payload;
    },
    logout: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
      })
      .addCase(login.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(login.rejected, (state) => {
        state.loading = false;
      })
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
      })
      .addCase(verifyOtp.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload.success) {
          state.token = payload.token;
          state.id = payload.id;
        }
      })
      .addCase(verifyOtp.rejected, (state) => {
        state.loading = false;
      });

    builder.addCase(getUserDetails.fulfilled, (state, { payload }) => {
      if (payload.success) {
        state.user = payload.user;
      }
    });

    builder.addCase(updateUserDetails.fulfilled, (state, { payload }) => {
      // Optional: handle updated user data if needed
    });

    builder.addCase(logoutApi.fulfilled, (state, { payload }) => {
      if (payload.success) {
        state.token = null;
        state.adminToken = null;
        state.user = {};
      }
    });

    builder.addCase(loginAdmin.fulfilled, (state, { payload }) => {
      if (payload.success) {
        state.token = null; // Admin login shouldn't overwrite user token
        state.user = payload.user;
        state.adminToken = payload.token;
      }
    });

    builder.addCase(smsLogin.fulfilled, (state, { payload }) => {
      if (payload.success) {
        state.token = payload.token;
        state.id = payload.id;
      }
    });

    // ✅ Handle email login just like smsLogin
    builder
      .addCase(emailLogin.pending, (state) => {
        state.loading = true;
      })
      .addCase(emailLogin.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload.success) {
          state.token = payload.token;
          state.id = payload.id;
        }
      })
      .addCase(emailLogin.rejected, (state) => {
        state.loading = false;
      });
  },
});

// ✅ Slice actions
export const { setAuthDialog, setUser, setLoading, logout } = authSlice.actions;

// ✅ Export thunks so you can dispatch them from components
export {
  login,
  verifyOtp,
  getUserDetails,
  updateUserDetails,
  loginAdmin,
  logoutApi,
  smsLogin,
  emailLogin, // ✅ Add emailLogin here
};

// ✅ Default reducer export
export default authSlice.reducer;
