import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Product {
    _id: string;
    name: string;
    img: string[];
    // Add other necessary fields
    [key: string]: any;
}

interface RecentlyViewedState {
    items: Product[];
}

const initialState: RecentlyViewedState = {
    items: [],
};

const recentlyViewedSlice = createSlice({
    name: "recentlyViewed",
    initialState,
    reducers: {
        addRecentlyViewed: (state, action: PayloadAction<Product>) => {
            const product = action.payload;
            // Remove if exists
            state.items = state.items.filter((item) => item._id !== product._id);
            // Add to front
            state.items.unshift(product);
            // Limit to 10 items
            if (state.items.length > 10) {
                state.items.pop();
            }
        },
    },
});

export const { addRecentlyViewed } = recentlyViewedSlice.actions;
export default recentlyViewedSlice.reducer;
