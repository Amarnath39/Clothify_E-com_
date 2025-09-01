import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface WishlistItem {
  id: string | any;
  name: string | any;
  description: string | any;
  amount: number | any;
  colors: string[] | any[];
  img: string[] | any[];
}

export interface WishlistState {
  items: WishlistItem[];
}

const initialState: WishlistState = {
  items: [],
};

export const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    setInitialState: () => initialState,
    addItem: (state, action: PayloadAction<WishlistItem>) => {
      state.items.push(action.payload);
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    updateItem: (state, action: PayloadAction<WishlistItem>) => {
      const index = state.items.findIndex(
        (item) => item.id === action.payload.id
      );
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    clearWishlist: (state) => {
      state.items = [];
    },
    updateItemAmount: (
      state,
      action: PayloadAction<{ id: string; amount: number }>
    ) => {
      const item = state.items.find((item) => item.id === action.payload.id);
      if (item) {
        item.amount = action.payload.amount;
      }
    },
    addColorToItem: (
      state,
      action: PayloadAction<{ id: string; color: string }>
    ) => {
      const item = state.items.find((item) => item.id === action.payload.id);
      if (item && !item.colors.includes(action.payload.color)) {
        item.colors.push(action.payload.color);
      }
    },
    removeColorFromItem: (
      state,
      action: PayloadAction<{ id: string; color: string }>
    ) => {
      const item = state.items.find((item) => item.id === action.payload.id);
      if (item) {
        item.colors = item.colors.filter(
          (color) => color !== action.payload.color
        );
      }
    },
    toggleItem: (state, action: PayloadAction<WishlistItem>) => {
      const index = state.items.findIndex(
        (item) => item.id === action.payload.id
      );
      if (index !== -1) {
        // Item exists, remove it
        state.items.splice(index, 1);
      } else {
        // Item doesn't exist, add it
        state.items.push(action.payload);
      }
    },
  },
});

export const {
  setInitialState,
  addItem,
  removeItem,
  updateItem,
  clearWishlist,
  updateItemAmount,
  addColorToItem,
  removeColorFromItem,
  toggleItem,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;
