import type { AuthUser } from "@/types/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(body?.message ?? "Something went wrong", res.status);
  }

  return body as T;
}

export function apiRegister(email: string, password: string) {
  return request<{ message: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function apiLogin(email: string, password: string) {
  const res = await request<{ message: string; data: { token: string } }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return res.data;
}

export async function apiMe(token: string) {
  const res = await request<{ message: string; data: { user: AuthUser } }>("/auth/me", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.user;
}