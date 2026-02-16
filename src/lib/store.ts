import { configureStore, Store } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";

import { combineReducers } from "redux";
import LoadSlice from "./features/loading";
import AuthSlice from "./features/auth";
import categorySlice from "./features/catogary";
import instaSlice from "./features/insta";
import cartSlice from "./features/cart";
import { useDispatch, useSelector } from "react-redux"; // ✅ ADD THIS IMPORT
import type { TypedUseSelectorHook } from "react-redux"; // ✅ ADD THIS IMPORT
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
} from "redux-persist";
import storage from "./customStorage";
import bannerSlice from "./features/banner";
import wishlistSlice from "./features/wishlist";
import miscSlice from "./features/misc";
import orderSlice from "./features/order";
import productSlice from "./features/products";
import addressSlice from "./features/address";
import recentlyViewedSlice from "./features/recentlyViewed";
import marqueeSlice from "./features/marquee";

// Define the persist config
const persistConfig = {
  key: "Swaarasya",
  storage,
  whitelist: ["cart", "auth", "wishlist", "order", "recentlyViewed", "marquee"],
};

// Combine your reducers
const rootReducer = combineReducers({
  auth: AuthSlice,
  address: addressSlice,
  load: LoadSlice,
  category: categorySlice,
  insta: instaSlice,
  cart: cartSlice,
  banner: bannerSlice,
  wishlist: wishlistSlice,
  misc: miscSlice,
  order: orderSlice,
  product: productSlice,
  recentlyViewed: recentlyViewedSlice,
  marquee: marqueeSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const makeStore = () => {
  return configureStore({
    reducer: persistedReducer,
    devTools: process.env.NODE_ENV !== "production",
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }),
  });
};

// No changes to these types
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = AppStore["dispatch"];

// --- ADD THIS NEW TYPE ---
// This defines the shape of the state for all our async thunks
export type AppThunkConfig = {
  state: RootState;
  dispatch: AppDispatch;
  rejectValue: string; // Or a more specific error type
};

// ✅ ADD THESE TYPED HOOKS AT THE END
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;