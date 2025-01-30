import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileSection } from '../ProfileSection';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import * as useProfileHook from '@/hooks/useProfile';

// Mock the useProfile hook
vi.mock('@/hooks/useProfile', () => ({
  useProfile: vi.fn()
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('ProfileSection', () => {
  const mockProfile = {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    county: 'București',
    city: 'Sector 1'
  };

  const mockUseProfile = (overrides = {}) => {
    const defaultValues = {
      profile: mockProfile,
      isLoading: false,
      error: null,
      fetchProfile: vi.fn().mockResolvedValue(undefined),
      updateUserProfile: vi.fn().mockResolvedValue(true),
      ...overrides
    };

    vi.mocked(useProfileHook.useProfile).mockReturnValue(defaultValues);
  };

  beforeEach(() => {
    mockUseProfile();
  });

  it('renders loading state', () => {
    mockUseProfile({ isLoading: true });
    render(
      <Provider store={store}>
        <ProfileSection userId="test-user-id" />
      </Provider>
    );

    expect(screen.getByText('Se încarcă...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    mockUseProfile({ error: 'Failed to load profile' });
    render(
      <Provider store={store}>
        <ProfileSection userId="test-user-id" />
      </Provider>
    );

    expect(screen.getByText('Failed to load profile')).toBeInTheDocument();
  });

  it('renders profile information correctly', () => {
    render(
      <Provider store={store}>
        <ProfileSection userId="test-user-id" />
      </Provider>
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('1234567890')).toBeInTheDocument();
    expect(screen.getByText('București')).toBeInTheDocument();
    expect(screen.getByText('Sector 1')).toBeInTheDocument();
  });

  it('enters edit mode when edit button is clicked', async () => {
    render(
      <Provider store={store}>
        <ProfileSection userId="test-user-id" />
      </Provider>
    );

    // Find and click the edit name button
    const editNameButton = screen.getByRole('button', { name: /edit name/i });
    fireEvent.click(editNameButton);

    // Check if input fields are visible
    const nameInput = screen.getByDisplayValue('John Doe');
    expect(nameInput).toBeInTheDocument();
    expect(screen.getByText('Salvează')).toBeInTheDocument();
  });

  it('updates profile successfully', async () => {
    const updateUserProfile = vi.fn().mockResolvedValue(true);
    mockUseProfile({ updateUserProfile });

    render(
      <Provider store={store}>
        <ProfileSection userId="test-user-id" />
      </Provider>
    );

    // Enter edit mode by clicking edit name button
    const editNameButton = screen.getByRole('button', { name: /edit name/i });
    fireEvent.click(editNameButton);

    // Update name
    const nameInput = screen.getByDisplayValue('John Doe');
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

    // Save changes
    fireEvent.click(screen.getByText('Salvează'));

    await waitFor(() => {
      expect(updateUserProfile).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Jane Doe'
      }));
    });
  });
});