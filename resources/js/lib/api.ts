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
    if (meta) return meta.content;

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
    body?: unknown
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
        body: isFormData ? body : body ? JSON.stringify(body) : undefined,
        credentials: 'same-origin',
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
    get: <T>(url: string) => request<T>('GET', url),
    post: <T>(url: string, body?: unknown) => request<T>('POST', url, body),
    put: <T>(url: string, body?: unknown) => request<T>('PUT', url, body),
    patch: <T>(url: string, body?: unknown) => request<T>('PATCH', url, body),
    delete: <T>(url: string) => request<T>('DELETE', url),
};
