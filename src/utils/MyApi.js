import { cookies } from './cookies';
import { message } from './message';
// import * as osu from 'osu-api-v2-js';

const defaultApiConfig = {
    refresh_token_on_expires: false,
};

export class MyApi {
    #api; // osu.API

    /**
     * update api object and write to cookie
     * @param {osu.API} api
     */
    updateApi(api) {
        Object.assign(this.#api, api);
        cookies.set('api', encodeURIComponent(JSON.stringify(this.#api)));
    }

    /**
     * @param {string} token
     */
    updateApiFromString(token) {
        const [accessToken, expires, refreshToken] = token.split('|');
        const expiresNum = parseInt(expires);
        this.updateApi({
            _access_token: accessToken,
            _expires: new Date(expiresNum * 1000),
            _refresh_token: refreshToken,
        });
    }

    /**
     * if access_token is not void
     * @returns {bool}
     */
    accessible() {
        return this.#api._access_token;
    }

    /**
     * read cookie and write to api
     */
    readApiFromCookie() {
        try {
            let capi = JSON.parse(decodeURIComponent(cookies.get('api')));
            if (capi && typeof capi === 'object') {
                Object.assign(this.#api, capi);
            }
        } catch (err) {
            console.log('error reading cookie:');
            console.error(err);
            cookies.remove('api');
        }
    }

    constructor() {
        this.#api = Object.assign(defaultApiConfig);
        this.readApiFromCookie();
    }

    /**
     * request and update api
     * @param {string} endpoint url
     * @param {object} body parameters
     * @param {string} method
     * @returns {Promise<any>} response
     */
    async #request(endpoint, body, method = 'POST') {
        const requestBody = {
            ...(body ?? {}),
            api: this.#api
        };

        try {
            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (response.status === 204)
                return;
            if (!response.ok) {
                let err = await response.json();
                if (err?.error)
                    throw err;
                else
                    throw { error: `Server or HTTP error! status: ${response.status}` };
            }

            const data = await response.json();
            if (data.api) {
                this.updateApi(data.api);
            }
            return data;
        } catch (err) {
            message.error(`API request on ${endpoint} with method ${method} failed: ` + err.error);
            console.log(`API request on ${endpoint} with method ${method} failed, body:`);
            console.log(requestBody);
            console.error(err);
            throw err;
        }
    }

    /**
     * /auth/refresh
     */
    async refreshToken() {
        await this.#request('/api/osu/auth/refresh');
    }

    /**
     * /auth/login
     * @param {string} username
     * @param {string} password
     */
    async loginWithPassword(username, password) {
        await this.#request('/api/osu/auth/login', {
            username,
            password
        });
    }

    /**
     * /auth/revoke
     */
    async revokeToken() {
        await this.#request('/api/osu/auth/revoke');
    }

    /**
     * /beatmap/{bid}
     * @param {number} bid
     * @returns {Promise<osu.Beatmap>} beatmap
     */
    async getBeatmap(bid) {
        if (typeof bid !== 'number')
            throw Error(`bid ${bid} is not a number`);
        const data = await this.#request(`/api/osu/beatmap/${bid}`);
        return data.beatmap;
    }

    /**
     * /mp/create
     * @param {osu.Room} room
     * @returns {Promise<osu.Room>} created room
     */
    async createRoom(room) {
        const data = await this.#request('/api/osu/mp/create', {
            room
        });
        return data.room;
    }

    /**
     * /mp/send-chat
     * @param {number} roomId
     * @param {number} userId
     * @param {string[]} messages
     */
    async sendChatInRoom(roomId, userId, messages) {
        await this.#request(`/api/osu/mp/send-chat/${roomId}/users/${userId}`, { messages });
    }

    /**
     * /mp/delete
     * @param {number} roomId
     * @param {number} userId
     */
    async removeUserFromRoom(roomId, userId) {
        await this.#request(`/api/osu/mp/delete/${roomId}/users/${userId}`);
    }

    /**
     * /resource-owner
     * @returns {Promise<osu.User>} resource owner user
     */
    async getResourceOwner() {
        const data = await this.#request('/api/osu/resource-owner');
        return data.me;
    }
}
