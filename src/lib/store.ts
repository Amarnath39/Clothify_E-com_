import { configureStore, Store } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";

import { combineReducers } from "redux";
import LoadSlice from "./features/loading";
import AuthSlice from "./features/auth";
import categorySlice from "./features/catogary";
import instaSlice from "./features/insta";
import cartSlice from "./features/cart";
// import storage from "redux-persist/lib/storage";
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
// Define the persist config
const persistConfig = {
  key: "Udayaada",
  storage,

  whitelist: ["cart", "auth", "wishlist", "order"],
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

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
