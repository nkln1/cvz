import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { RequestForm } from '../RequestForm';
import { useAuth } from '@/context/AuthContext';
import * as firestore from 'firebase/firestore';

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock;

// Mock Firebase Auth
vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  getFirestore: vi.fn()
}));

// Mock Firebase App
vi.mock('@/lib/firebase', () => ({
  db: vi.fn(),
  auth: vi.fn()
}));

describe('RequestForm', () => {
  const mockUser = { uid: 'test-uid', emailVerified: true };
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnAddCar = vi.fn();
  const mockCars = [
    { id: 'car1', brand: 'Toyota', model: 'Camry', year: '2020' },
    { id: 'car2', brand: 'Honda', model: 'Civic', year: '2021' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ user: mockUser });
    vi.mocked(firestore.getDocs).mockResolvedValue({
      forEach: (callback) => {
        mockCars.forEach((car) => {
          callback({
            id: car.id,
            data: () => car
          });
        });
      }
    } as any);
  });

  it('renders form with all required fields', async () => {
    await act(async () => {
      render(
        <RequestForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onAddCar={mockOnAddCar}
        />
      );
    });

    expect(screen.getByLabelText(/titlu cerere/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/descriere cerere/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByLabelText(/data preferată/i)).toBeInTheDocument();
    expect(screen.getByText(/județ/i)).toBeInTheDocument();
  });

  it('validates required fields on submit', async () => {
    await act(async () => {
      render(
        <RequestForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onAddCar={mockOnAddCar}
        />
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByText(/trimite cererea/i));
    });

    await waitFor(() => {
      expect(screen.getByText(/titlul trebuie să conțină cel puțin 3 caractere/i)).toBeInTheDocument();
      expect(screen.getByText(/descrierea trebuie să conțină cel puțin 10 caractere/i)).toBeInTheDocument();
      expect(screen.getByText(/te rugăm să selectezi o mașină/i)).toBeInTheDocument();
      expect(screen.getByText(/te rugăm să selectezi județul/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('handles cancel button click', async () => {
    await act(async () => {
      render(
        <RequestForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onAddCar={mockOnAddCar}
        />
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByText(/anulează/i));
    });

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('handles add car button click', async () => {
    await act(async () => {
      render(
        <RequestForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onAddCar={mockOnAddCar}
        />
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByText(/adaugă mașină/i));
    });

    expect(mockOnAddCar).toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const validFormData = {
      title: 'Test Title',
      description: 'Test Description that is long enough',
      carId: 'car1',
      preferredDate: '2025-02-01',
      county: 'București',
      cities: ['Sector 1']
    };

    await act(async () => {
      render(
        <RequestForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onAddCar={mockOnAddCar}
          initialData={validFormData}
        />
      );
    });

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        title: validFormData.title,
        description: validFormData.description,
        carId: validFormData.carId,
        preferredDate: validFormData.preferredDate,
        county: validFormData.county,
        cities: validFormData.cities
      }));
    });
  });

  it('initializes with provided data', async () => {
    const initialData = {
      title: 'Initial Title',
      description: 'Initial Description',
      carId: 'car1',
      preferredDate: '2025-02-01',
      county: 'București',
      cities: ['Sector 1']
    };

    await act(async () => {
      render(
        <RequestForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onAddCar={mockOnAddCar}
          initialData={initialData}
        />
      );
    });

    expect(screen.getByDisplayValue(initialData.title)).toBeInTheDocument();
    expect(screen.getByDisplayValue(initialData.description)).toBeInTheDocument();
    expect(screen.getByDisplayValue(initialData.preferredDate)).toBeInTheDocument();
  });
});