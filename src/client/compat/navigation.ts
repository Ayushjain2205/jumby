import { useSearch, useLocation } from 'wouter';

export function useSearchParams(): URLSearchParams {
  const search = useSearch();
  return new URLSearchParams(search);
}

export function useRouter() {
  const [, setLocation] = useLocation();
  return {
    push: (href: string) => setLocation(href),
    replace: (href: string) => setLocation(href, { replace: true }),
    back: () => window.history.back(),
  };
}

export function notFound() {
  throw new Error('NOT_FOUND');
}
