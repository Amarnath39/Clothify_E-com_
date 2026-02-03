import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const getMarqueeText = createAsyncThunk(
    "marquee/getMarqueeText",
    async (id, { rejectWithValue }) => {
        try {
            const { data } = await axios.get("/api/marquee");
            return data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.msg || "Failed to fetch marquee text");
        }
    }
);

const initialState = {
    entries: [],
    loading: false,
    error: null,
};

const marqueeSlice = createSlice({
    name: "marquee",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getMarqueeText.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getMarqueeText.fulfilled, (state: any, action) => {
                state.loading = false;
                state.entries = action.payload.entries;
            })
            .addCase(getMarqueeText.rejected, (state: any, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default marqueeSlice.reducer;
