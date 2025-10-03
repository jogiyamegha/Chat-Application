import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    user : null,
    role : null,
    userType : null,
    token : null,
    loading: false,
    error : null
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser: (state, action) => {
            const {
                user,
                role = null,
                userType = null,
                token = null
            } = action.payload
            state.user = user;
            state.userType = userType || role;
            state.role = role;
            state.token = token;
            state.loading = false;
            state.error = null
        },

        clearUser: (state) => {
            state.user = null,
            state.userType = null,
            state.role = null,
            state.loading = false,
            state.error = null;
        },

        setLoading: (state, action) => {
            state.loading = action.payload
        },

        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        }

    }
})

export const {setUser, clearUser, setLoading, setError} = userSlice.actions;
export default userSlice.reducer;