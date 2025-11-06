export function handleAuthRedirect(response: Response) {
  if (response.status !== 401) return;

  if (typeof window !== "undefined") {
    const current = window.location.pathname + window.location.search;
    const redirect = encodeURIComponent(current);
    window.location.href = `/login?redirect=${redirect}`;
  }
}

