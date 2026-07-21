import type { InertiaLinkProps } from '@inertiajs/react';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

export function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export function formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let size = bytes;
    while (size >= 1024 && i < units.length - 1) {
        size /= 1024;
        i++;
    }
    return `${size.toFixed(1)} ${units[i]}`;
}

export function fileIconColor(ext: string): string {
    const colors: Record<string, string> = {
        php: '#777BB3',
        blade: '#F05340',
        js: '#F7DF1E',
        ts: '#3178C6',
        jsx: '#61DAFB',
        tsx: '#61DAFB',
        py: '#3776AB',
        go: '#00ADD8',
        rs: '#DEA584',
        vue: '#4FC08D',
        svelte: '#FF3E00',
        html: '#E34F26',
        css: '#1572B6',
        scss: '#CC6699',
        json: '#292929',
        xml: '#0060AC',
        yaml: '#6DB33F',
        yml: '#6DB33F',
        md: '#083FA1',
        sql: '#E38C00',
        dockerfile: '#2496ED',
        gitignore: '#F05032',
        env: '#FFA000',
        toml: '#9C4221',
        lock: '#7F8C8D',
    };
    return colors[ext] || '#849581';
}

export function fileTypeFromMime(mime: string): string {
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    if (mime.includes('pdf')) return 'pdf';
    if (mime.includes('zip') || mime.includes('rar') || mime.includes('tar') || mime.includes('7z')) return 'archive';
    if (mime.startsWith('text/') || mime.includes('json') || mime.includes('javascript') || mime.includes('xml')) return 'text';
    return 'other';
}

export function isTextFile(mime: string): boolean {
    const textTypes = [
        'text/',
        'application/json',
        'application/javascript',
        'application/xml',
        'application/x-httpd-php',
        'application/x-sh',
        'application/x-yaml',
    ];
    return textTypes.some((t) => mime.startsWith(t));
}
