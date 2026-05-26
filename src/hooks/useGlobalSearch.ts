import { useQuery } from '@tanstack/react-query';
import { globalSearchService, GlobalSearchResult } from '../services/globalSearchService';
import { useState, useEffect } from 'react';

export function useGlobalSearch(searchTerm: string, delayMs: number = 300) {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, delayMs]);

  const query = useQuery<GlobalSearchResult[]>({
    queryKey: ['globalSearch', debouncedTerm],
    queryFn: () => globalSearchService.searchAll(debouncedTerm),
    enabled: debouncedTerm.trim().length >= 2,
    staleTime: 1000 * 60, // 1 minute
  });

  return {
    results: query.data ?? [],
    isLoading: query.isFetching,
    isError: query.isError,
    error: query.error,
    debouncedTerm,
  };
}
