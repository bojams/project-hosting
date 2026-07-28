export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public data?: unknown
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

async function csrfToken(): Promise<string | null> {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');

    if (meta) {
        return meta.content;
    }

    try {
        const res = await fetch('/csrf-token');
        const data = await res.json();

        return data.token;
    } catch {
        return null;
    }
}

async function request<T>(
    method: string,
    url: string,
    body?: unknown,
    signal?: AbortSignal
): Promise<T> {
    const token = await csrfToken();
    const headers: Record<string, string> = {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    };

    if (token) {
        headers['X-CSRF-TOKEN'] = token;
    }

    const isFormData = body instanceof FormData;

    if (!isFormData && body !== undefined) {
        headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(url, {
        method,
        headers,
        body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
        credentials: 'same-origin',
        signal,
    });

    if (!res.ok) {
        let errorData: unknown;

        try {
            errorData = await res.json();
        } catch {
            errorData = { message: res.statusText };
        }

        const message =
            (errorData as { message?: string })?.message || res.statusText;

        throw new ApiError(message, res.status, errorData);
    }

    return res.json();
}

export const api = {
    get: <T>(url: string, signal?: AbortSignal) => request<T>('GET', url, undefined, signal),
    post: <T>(url: string, body?: unknown, signal?: AbortSignal) => request<T>('POST', url, body, signal),
    put: <T>(url: string, body?: unknown, signal?: AbortSignal) => request<T>('PUT', url, body, signal),
    patch: <T>(url: string, body?: unknown, signal?: AbortSignal) => request<T>('PATCH', url, body, signal),
    delete: <T>(url: string, signal?: AbortSignal) => request<T>('DELETE', url, undefined, signal),
};
