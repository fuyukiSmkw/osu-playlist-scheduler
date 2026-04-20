import { error } from 'itty-router';

const CHALLENGERS_API_URL = 'https://www.challengersnexus.com';

/**
 * Proxy request to Challengers API with authentication
 */
async function proxyToChallengers(env, method, endpoint, body = null) {
    const secret = env.CHALLENGERS_SCHEDULER_SECRET;
    
    if (!secret) {
        throw new Error('CHALLENGERS_SCHEDULER_SECRET not configured');
    }

    const url = `${CHALLENGERS_API_URL}${endpoint}`;
    
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'X-Scheduler-Secret': secret,
        },
    };

    if (body && (method === 'POST' || method === 'PATCH' || method === 'DELETE')) {
        options.body = JSON.stringify(body);
    }

    console.log(`[Challengers Proxy] ${method} ${endpoint}`);

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
        console.error(`[Challengers Proxy] Error ${response.status}:`, data);
        const err = new Error(data.error || 'Challengers API error');
        err.status = response.status;
        err.data = data;
        throw err;
    }

    return data;
}

/**
 * Error handler for Challengers proxy
 */
function handleProxyError(err) {
    console.error('[Challengers Proxy] Error:', err.message);
    const status = err.status || 500;
    const message = err.data?.error || err.message || 'Internal error';
    return error(status, message);
}

/**
 * Register Challengers proxy routes
 */
export function register(router, routePrefix) {

    /**
     * Verify if user can schedule challenges
     * POST /challengers/verify-permission
     * Body: { osu_id: number }
     */
    router.post(routePrefix + '/verify-permission', async (request, env) => {
        try {
            const body = await request.json();
            
            if (!body.osu_id) {
                return error(400, 'osu_id is required');
            }

            const result = await proxyToChallengers(
                env,
                'POST',
                '/api/admin/verify-schedule-permission',
                { osu_id: body.osu_id }
            );

            return result;
        } catch (err) {
            return handleProxyError(err);
        }
    });

    /**
     * Check if user has stored token
     * GET /challengers/user-token?osu_id=123
     */
    router.get(routePrefix + '/user-token', async (request, env) => {
        try {
            const url = new URL(request.url);
            const osu_id = url.searchParams.get('osu_id');
            
            if (!osu_id) {
                return error(400, 'osu_id query parameter is required');
            }

            const result = await proxyToChallengers(
                env,
                'GET',
                `/api/admin/user-token?osu_id=${osu_id}`
            );

            return result;
        } catch (err) {
            return handleProxyError(err);
        }
    });

    /**
     * Set user's osu! token
     * POST /challengers/user-token
     * Body: { osu_id: number, osu_token: string }
     */
    router.post(routePrefix + '/user-token', async (request, env) => {
        try {
            const body = await request.json();
            
            if (!body.osu_id || !body.osu_token) {
                return error(400, 'osu_id and osu_token are required');
            }

            const result = await proxyToChallengers(
                env,
                'POST',
                '/api/admin/user-token',
                {
                    osu_id: body.osu_id,
                    osu_token: body.osu_token
                }
            );

            return result;
        } catch (err) {
            return handleProxyError(err);
        }
    });

    /**
     * Revoke user's stored token
     * DELETE /challengers/user-token
     * Body: { osu_id: number }
     */
    router.delete(routePrefix + '/user-token', async (request, env) => {
        try {
            const body = await request.json();
            
            if (!body.osu_id) {
                return error(400, 'osu_id is required');
            }

            const result = await proxyToChallengers(
                env,
                'DELETE',
                '/api/admin/user-token',
                { osu_id: body.osu_id }
            );

            return result;
        } catch (err) {
            return handleProxyError(err);
        }
    });

    /**
     * Create a scheduled challenge
     * POST /challengers/schedules
     * Body: { osu_id, scheduled_time, room_data, osu_token?, chat_messages? }
     */
    router.post(routePrefix + '/schedules', async (request, env) => {
        try {
            const body = await request.json();
            
            if (!body.osu_id || !body.scheduled_time || !body.room_data) {
                return error(400, 'osu_id, scheduled_time, and room_data are required');
            }

            const payload = {
                osu_id: body.osu_id,
                scheduled_time: body.scheduled_time,
                room_data: body.room_data,
            };

            // Optional fields
            if (body.osu_token) {
                payload.osu_token = body.osu_token;
            }
            if (body.chat_messages) {
                payload.chat_messages = body.chat_messages;
            }

            const result = await proxyToChallengers(
                env,
                'POST',
                '/api/admin/scheduled-challenges',
                payload
            );

            return result;
        } catch (err) {
            return handleProxyError(err);
        }
    });

    /**
     * List scheduled challenges
     * GET /challengers/schedules?osu_id=123&status=pending&limit=50&offset=0
     */
    router.get(routePrefix + '/schedules', async (request, env) => {
        try {
            const url = new URL(request.url);
            const params = new URLSearchParams();
            
            // Forward query params
            ['osu_id', 'status', 'limit', 'offset'].forEach(param => {
                const value = url.searchParams.get(param);
                if (value) params.set(param, value);
            });

            const queryString = params.toString();
            const endpoint = `/api/admin/scheduled-challenges${queryString ? '?' + queryString : ''}`;

            const result = await proxyToChallengers(env, 'GET', endpoint);

            return result;
        } catch (err) {
            return handleProxyError(err);
        }
    });

    /**
     * Update a scheduled challenge
     * PATCH /challengers/schedules
     * Body: { id, scheduled_time?, room_data?, chat_messages? }
     */
    router.patch(routePrefix + '/schedules', async (request, env) => {
        try {
            const body = await request.json();
            
            if (!body.id) {
                return error(400, 'id is required');
            }

            const result = await proxyToChallengers(
                env,
                'PATCH',
                '/api/admin/scheduled-challenges',
                body
            );

            return result;
        } catch (err) {
            return handleProxyError(err);
        }
    });

    /**
     * Cancel a scheduled challenge
     * DELETE /challengers/schedules
     * Body: { id: number }
     */
    router.delete(routePrefix + '/schedules', async (request, env) => {
        try {
            const body = await request.json();
            
            if (!body.id) {
                return error(400, 'id is required');
            }

            const result = await proxyToChallengers(
                env,
                'DELETE',
                '/api/admin/scheduled-challenges',
                { id: body.id }
            );

            return result;
        } catch (err) {
            return handleProxyError(err);
        }
    });
}