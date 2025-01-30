import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UserProfile } from '@/types/dashboard';

interface ProfileState {
  profile: UserProfile;
  isLoading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  profile: {},
  isLoading: false,
  error: null,
};

export const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    updateProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      state.profile = { ...state.profile, ...action.payload };
    },
  },
});

export const { setProfile, setLoading, setError, updateProfile } = profileSlice.actions;
export default profileSlice.reducer;
