export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
}

export interface Project {
    id: number;
    user_id: number;
    name: string;
    slug: string;
    domain: string | null;
    custom_domain: string | null;
    domain_status: string;
    description: string | null;
    status: string;
    preview_path: string | null;
    source_type: string;
    github_url: string | null;
    framework: string | null;
    framework_version: string | null;
    build_command: string | null;
    output_dir: string | null;
    internal_port: number | null;
    port: number | null;
    port_auto: boolean;
    database_type: string | null;
    database_name: string | null;
    container_id: string | null;
    container_status: string;
    cloudflare_api_token: string | null;
    cloudflare_zone_id: string | null;
    cloudflare_account_id: string | null;
    cloudflare_tunnel_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface MediaFile {
    id: number;
    name: string;
    file_name: string;
    path: string;
    mime_type: string;
    size: number;
    human_size: string;
    url: string;
    thumbnail: string | null;
    is_text?: boolean;
    content?: string;
    created_at: string;
    updated_at: string;
}

export interface Deployment {
    id: number;
    project_id: number;
    version: number;
    status: string;
    description: string | null;
    changed_files: string[];
    deployed_at: string | null;
    created_at: string;
}

export interface User {
    id: number;
    username: string;
    email: string;
    avatar_url: string | null;
    role: string;
    status: string;
    created_at: string;
    updated_at: string;
}
