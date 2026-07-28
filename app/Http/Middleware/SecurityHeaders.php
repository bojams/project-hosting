<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    private const CSP = [
        "default-src 'self'",
        'script-src \'self\' \'nonce-{nonce}\' https://cdn.jsdelivr.net',
        'style-src \'self\' \'unsafe-inline\' https://cdn.jsdelivr.net',
        'img-src \'self\' data: blob:',
        'font-src \'self\' data:',
        'connect-src \'self\' ws: https://api.cloudflare.com',
        'frame-ancestors \'none\'',
        'form-action \'self\'',
        'base-uri \'self\'',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        if (! $request->is('api/preview*')) {
            $response->headers->set('X-Frame-Options', 'DENY');
        }

        if ($request->isSecure() || app()->environment('production')) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        $csp = implode('; ', self::CSP);
        $nonce = base64_encode(random_bytes(16));
        $csp = str_replace('{nonce}', $nonce, $csp);
        $response->headers->set('Content-Security-Policy', $csp);
        $response->headers->set('X-Content-Security-Policy', $csp);

        return $response;
    }
}
