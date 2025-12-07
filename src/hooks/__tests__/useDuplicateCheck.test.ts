import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDuplicateCheck } from '../useDuplicateCheck';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

import { supabase } from '@/integrations/supabase/client';

describe('useDuplicateCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should initialize with no results', () => {
    const { result } = renderHook(() => useDuplicateCheck());
    
    expect(result.current.isChecking).toBe(false);
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should not check when both email and phone are empty', async () => {
    const { result } = renderHook(() => useDuplicateCheck('', ''));
    
    await waitFor(() => {
      expect(supabase.rpc).not.toHaveBeenCalled();
    });
  });

  it('should check for duplicate email', async () => {
    const mockRpcResponse = {
      data: {
        emailExists: true,
        phoneExists: false,
        existsInTable: 'customers',
      },
      error: null,
    };

    vi.mocked(supabase.rpc).mockResolvedValue(mockRpcResponse);

    const { result } = renderHook(() => 
      useDuplicateCheck('test@example.com', '', 100) // 100ms debounce for faster tests
    );

    // Wait for debounce and API call
    await waitFor(() => {
      expect(result.current.result?.emailExists).toBe(true);
    });

    expect(result.current.result?.phoneExists).toBe(false);
    expect(result.current.result?.existsInTable).toBe('customers');
  });

  it('should check for duplicate phone', async () => {
    const mockRpcResponse = {
      data: {
        emailExists: false,
        phoneExists: true,
        existsInTable: 'vendors',
      },
      error: null,
    };

    vi.mocked(supabase.rpc).mockResolvedValue(mockRpcResponse);

    const { result } = renderHook(() => 
      useDuplicateCheck('', '+91 9876543210', 100)
    );

    await waitFor(() => {
      expect(result.current.result?.phoneExists).toBe(true);
    });

    expect(result.current.result?.emailExists).toBe(false);
    expect(result.current.result?.existsInTable).toBe('vendors');
  });

  it('should check both email and phone', async () => {
    const mockRpcResponse = {
      data: {
        emailExists: false,
        phoneExists: false,
        existsInTable: null,
      },
      error: null,
    };

    vi.mocked(supabase.rpc).mockResolvedValue(mockRpcResponse);

    const { result } = renderHook(() => 
      useDuplicateCheck('new@example.com', '+91 9876543210', 100)
    );

    await waitFor(() => {
      expect(result.current.result).not.toBeNull();
    });

    expect(result.current.result?.emailExists).toBe(false);
    expect(result.current.result?.phoneExists).toBe(false);
    expect(result.current.result?.existsInTable).toBeNull();
    
    expect(supabase.rpc).toHaveBeenCalledWith('check_email_phone_exists', {
      p_email: 'new@example.com',
      p_phone: '+91 9876543210',
    });
  });

  it('should debounce multiple rapid calls', async () => {
    const mockRpcResponse = {
      data: { emailExists: false, phoneExists: false, existsInTable: null },
      error: null,
    };

    vi.mocked(supabase.rpc).mockResolvedValue(mockRpcResponse);

    const { result, rerender } = renderHook(
      ({ email }) => useDuplicateCheck(email, '', 200),
      { initialProps: { email: 'test1@example.com' } }
    );

    // Rapidly change email multiple times
    rerender({ email: 'test2@example.com' });
    rerender({ email: 'test3@example.com' });
    rerender({ email: 'test4@example.com' });
    rerender({ email: 'test5@example.com' });

    // Wait for debounce period
    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalled();
    }, { timeout: 3000 });

    // Should only call RPC once (or very few times) due to debouncing
    const callCount = vi.mocked(supabase.rpc).mock.calls.length;
    expect(callCount).toBeLessThanOrEqual(2); // Allow for 1-2 calls due to timing
  });

  it('should handle RPC errors gracefully', async () => {
    const mockError = { message: 'Network error' };
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: mockError });

    const { result } = renderHook(() => 
      useDuplicateCheck('test@example.com', '', 100)
    );

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.error).toContain('Failed to verify');
  });

  it('should set loading state during check', async () => {
    const mockRpcResponse = {
      data: { emailExists: false, phoneExists: false, existsInTable: null },
      error: null,
    };

    // Delay the response to observe loading state
    vi.mocked(supabase.rpc).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockRpcResponse), 200))
    );

    const { result } = renderHook(() => 
      useDuplicateCheck('test@example.com', '', 50)
    );

    // Wait for debounce
    await waitFor(() => {
      expect(result.current.isChecking).toBe(true);
    }, { timeout: 500 });

    // Wait for completion
    await waitFor(() => {
      expect(result.current.isChecking).toBe(false);
    }, { timeout: 1000 });
  });

  it('should support manual duplicate check', async () => {
    const mockRpcResponse = {
      data: { emailExists: true, phoneExists: false, existsInTable: 'vendors' },
      error: null,
    };

    vi.mocked(supabase.rpc).mockResolvedValue(mockRpcResponse);

    const { result } = renderHook(() => useDuplicateCheck('', '', 100, false)); // disabled auto-check

    // Manually trigger check
    const checkResult = await result.current.checkDuplicate('manual@example.com', '');

    expect(checkResult?.emailExists).toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith('check_email_phone_exists', {
      p_email: 'manual@example.com',
      p_phone: null,
    });
  });

  it('should not auto-check when disabled', async () => {
    const { result } = renderHook(() => 
      useDuplicateCheck('test@example.com', '', 100, false) // disabled
    );

    await waitFor(() => {
      // Give it time to potentially make a call
      expect(supabase.rpc).not.toHaveBeenCalled();
    }, { timeout: 300 });
  });
});
