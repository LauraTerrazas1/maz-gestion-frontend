const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL no está configurada");
  }

  const finalUrl = `${API_URL}${endpoint}`;
  const esFormData = options.body instanceof FormData;

  const response = await fetch(finalUrl, {
    ...options,
    headers: {
      ...(!esFormData
        ? { "Content-Type": "application/json" }
        : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Error al consultar API");
  }

  return response.json();
}