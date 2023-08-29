export const login = (args: { username: string; password: string }) =>
  post<{ status: number; msg?: string; token?: string; user?: { id: string } }>(
    'common/login',
    args,
  );
