import * as osu from 'osu-api-v2-js';
import { defaultApiConfig } from './defaultApiConfig';

export function newApi(config) {
    const api = new osu.API({
        _scopes: ['*'],
        ...(config ?? {}), // user's API
        ...defaultApiConfig, // replace client id and client secret
    });
    api.headers['User-Agent'] = 'osu!';
    return api;
}

const refreshBefore = 10000; // ms

export async function newFreshApi(config) {
    const api = newApi(config);

    // let it be if no refresh token
    if (!api._refresh_token || api._refresh_token === '')
        return api;

    var nowplus = new Date(Date.now() + refreshBefore);
    if (!api._access_token || !api._expires || (nowplus >= api._expires)) {
        await api.refreshToken();
    }
    return api;
}