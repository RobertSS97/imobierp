"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ApiError } from "@/lib/api-client";

// ─── useApiQuery: buscar dados com cache e refetch ───────────────
interface UseApiQueryOptions<T> {
  enabled?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
  initialData?: T;
}

interface UseApiQueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
  setData: (data: T | ((prev: T | undefined) => T)) => void;
}

export function useApiQuery<T>(
  queryFn: () => Promise<{ data?: T; [key: string]: any }>,
  deps: any[] = [],
  options: UseApiQueryOptions<T> = {}
): UseApiQueryResult<T> {
  const { enabled = true, refetchInterval, onSuccess, onError, initialData } = options;
  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const mountedRef = useRef(true);

  const fetch = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const response = await queryFn();
      if (mountedRef.current) {
        const responseData = response.data as T;
        setData(responseData);
        onSuccess?.(responseData);
      }
    } catch (err) {
      if (mountedRef.current) {
        const apiError = err instanceof ApiError ? err : new ApiError("Erro desconhecido", 500);
        setIsError(true);
        setError(apiError);
        onError?.(apiError);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  useEffect(() => {
    mountedRef.current = true;
    fetch();
    return () => {
      mountedRef.current = false;
    };
  }, [fetch]);

  // Refetch periódico
  useEffect(() => {
    if (!refetchInterval || !enabled) return;
    const interval = setInterval(fetch, refetchInterval);
    return () => clearInterval(interval);
  }, [refetchInterval, enabled, fetch]);

  return { data, isLoading, isError, error, refetch: fetch, setData };
}

// ─── useApiList: buscar listas paginadas ─────────────────────────
interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface UseApiListResult<T> {
  items: T[];
  pagination: PaginationInfo | null;
  stats: any;
  isLoading: boolean;
  isError: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
  setItems: (items: T[] | ((prev: T[]) => T[])) => void;
}

export function useApiList<T>(
  queryFn: () => Promise<{ data?: T[]; pagination?: PaginationInfo; stats?: any; [key: string]: any }>,
  deps: any[] = [],
  options: { enabled?: boolean } = {}
): UseApiListResult<T> {
  const { enabled = true } = options;
  const [items, setItems] = useState<T[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const mountedRef = useRef(true);

  const fetch = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const response = await queryFn();
      if (mountedRef.current) {
        setItems((response.data as T[]) || []);
        setPagination(response.pagination || null);
        setStats(response.stats || null);
      }
    } catch (err) {
      if (mountedRef.current) {
        const apiError = err instanceof ApiError ? err : new ApiError("Erro desconhecido", 500);
        setIsError(true);
        setError(apiError);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  useEffect(() => {
    mountedRef.current = true;
    fetch();
    return () => {
      mountedRef.current = false;
    };
  }, [fetch]);

  return { items, pagination, stats, isLoading, isError, error, refetch: fetch, setItems };
}

// ─── useApiMutation: executar ações (POST/PUT/DELETE) ────────────
interface UseApiMutationOptions<TData, TResult> {
  onSuccess?: (result: TResult, variables: TData) => void;
  onError?: (error: ApiError, variables: TData) => void;
}

interface UseApiMutationResult<TData, TResult> {
  mutate: (data: TData) => Promise<TResult | undefined>;
  isLoading: boolean;
  isError: boolean;
  error: ApiError | null;
  data: TResult | undefined;
  reset: () => void;
}

export function useApiMutation<TData = any, TResult = any>(
  mutationFn: (data: TData) => Promise<{ data?: TResult; [key: string]: any }>,
  options: UseApiMutationOptions<TData, TResult> = {}
): UseApiMutationResult<TData, TResult> {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [data, setData] = useState<TResult | undefined>(undefined);

  const mutate = useCallback(
    async (variables: TData): Promise<TResult | undefined> => {
      setIsLoading(true);
      setIsError(false);
      setError(null);

      try {
        const response = await mutationFn(variables);
        const result = response.data as TResult;
        setData(result);
        options.onSuccess?.(result, variables);
        return result;
      } catch (err) {
        const apiError = err instanceof ApiError ? err : new ApiError("Erro desconhecido", 500);
        setIsError(true);
        setError(apiError);
        options.onError?.(apiError, variables);
        throw apiError;
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mutationFn]
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    setIsError(false);
    setError(null);
    setData(undefined);
  }, []);

  return { mutate, isLoading, isError, error, data, reset };
}
