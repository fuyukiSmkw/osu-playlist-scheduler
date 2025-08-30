import { BadRequestError } from '../../utils/BadRequestError.js';
import { errorReturn } from '../../utils/errorReturn.js';
import { withJsonContent } from '../../utils/withJsonContent.js';
import { newApi } from './utils/newApi.js';


export function register(router, routePrefix) {

    /**
     * refresh this token
     * POST /auth/refresh
     * Body: { api: osu.API or at least { refresh_token } }
     * return { api: osu.API }
     * NOTE your lazer might be logged out
     */
    router.post(routePrefix + '/auth/refresh', withJsonContent, async ({ content }) => {
        try {
            if (!content.api?._refresh_token) {
                throw new BadRequestError('No api / refresh token!');
            }
            const api = newApi(content.api);
            if (!await api.refreshToken()) {
                throw new Error('Refresh failed!');
            }
            return { api };
        } catch (err) {
            return errorReturn(err);
        }
    });

    /**
     * login with password
     * POST /auth/login
     * Body: at least { username, password }, and anything else u wanna add
     * return { api: osu.API }
     * NOTE your lazer might be logged out
     */
    router.post(routePrefix + '/auth/login', withJsonContent, async ({ content }) => {
        try {
            if (!content.username || !content.password) {
                throw new BadRequestError('Username or password not provided!');
            }
            const api = newApi(content.api);
            return {
                api: await api.getAndSetToken({
                    ...content,
                    grant_type: 'password',
                    client_id: api.client_id,
                    client_secret: api.client_secret,
                    scope: '*',
                }, api),
            };
        } catch (err) {
            return errorReturn(err);
        }
    });

    /**
     * revoke this token
     * POST /auth/revoke
     * Body: { api: osu.API or at least { access_token } }
     * return 204
     * NOTE if your api is from osu!lazer's game.ini, this will also log you out from lazer
     */
    router.post(routePrefix + '/auth/revoke', withJsonContent, async ({ content }) => {
        try {
            if (!content.api?._accessToken) {
                throw new BadRequestError('No api / access token!');
            }
            const api = newApi(content.api);
            await api.revokeToken();
            return new Response(null, { status: 204 });
        } catch (err) {
            return errorReturn(err);
        }
    })
}