import { error } from "itty-router";

export function withAllowedOrigin(request, env) {
    const origin = request.headers.get('Origin');

    try {
        const requestUrl = new URL(origin);
        const allowedHosts = [
            'http://localhost:5173',
            ...env.ALLOWED_ORIGINS.split(',')
        ].map(host => new URL(host).host); // only take host

        if (!allowedHosts.includes(requestUrl.host)) {
            return error(403, `Origin ${origin} not allowed`);
        }
    } catch (e) {
        return error(403, `Invalid Origin URL: ${origin}`);
    }
}
