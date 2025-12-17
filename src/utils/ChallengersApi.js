import { message } from './message';

/**
 * Challengers API client
 * Communicates with our Cloudflare Worker proxy which forwards to Challengers API
 */
class ChallengersApiClient {
    
    /**
     * Make a request to the Challengers proxy
     * @param {string} endpoint - API endpoint (e.g., '/verify-permission')
     * @param {object} options - Fetch options
     * @returns {Promise<any>} Response data
     */
    async #request(endpoint, options = {}) {
        const url = `/api/challengers${endpoint}`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                },
                ...options,
            });

            // Handle 204 No Content
            if (response.status === 204) {
                return { success: true };
            }

            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data.error || `Request failed with status ${response.status}`;
                throw new Error(errorMessage);
            }

            return data;
        } catch (err) {
            console.error(`[ChallengersApi] ${endpoint} failed:`, err);
            throw err;
        }
    }

    /**
     * Check if user can schedule challenges (is Challengers admin)
     * @param {number} osuId - User's osu! ID
     * @returns {Promise<{allowed: boolean, reason: string, user?: object}>}
     */
    async verifyPermission(osuId) {
        const result = await this.#request('/verify-permission', {
            method: 'POST',
            body: JSON.stringify({ osu_id: osuId }),
        });
        return result.data || result;
    }

    /**
     * Check if user has a stored token
     * @param {number} osuId - User's osu! ID
     * @returns {Promise<{has_token: boolean, user: object, token_set_at?: string}>}
     */
    async checkUserToken(osuId) {
        const result = await this.#request(`/user-token?osu_id=${osuId}`, {
            method: 'GET',
        });
        return result.data || result;
    }

    /**
     * Store user's osu! token for future scheduled challenges
     * @param {number} osuId - User's osu! ID
     * @param {string} osuToken - Token in format: access_token|timestamp|refresh_token
     * @returns {Promise<{message: string, user: object, token_set_at: string}>}
     */
    async setUserToken(osuId, osuToken) {
        const result = await this.#request('/user-token', {
            method: 'POST',
            body: JSON.stringify({ 
                osu_id: osuId, 
                osu_token: osuToken 
            }),
        });
        return result.data || result;
    }

    /**
     * Revoke user's stored token
     * @param {number} osuId - User's osu! ID
     * @returns {Promise<{message: string, user: object}>}
     */
    async revokeUserToken(osuId) {
        const result = await this.#request('/user-token', {
            method: 'DELETE',
            body: JSON.stringify({ osu_id: osuId }),
        });
        return result.data || result;
    }

    /**
     * Create a scheduled challenge
     * @param {object} params - Schedule parameters
     * @param {number} params.osuId - User's osu! ID
     * @param {string} params.scheduledTime - ISO datetime string
     * @param {object} params.roomData - Room configuration
     * @param {string} [params.osuToken] - Optional token (if not using stored token)
     * @param {string[]} [params.chatMessages] - Optional chat messages to send after creation
     * @returns {Promise<{message: string, schedule: object, scheduled_by: object}>}
     */
    async createSchedule({ osuId, scheduledTime, roomData, osuToken, chatMessages }) {
        const payload = {
            osu_id: osuId,
            scheduled_time: scheduledTime,
            room_data: roomData,
        };

        if (osuToken) {
            payload.osu_token = osuToken;
        }

        if (chatMessages && chatMessages.length > 0) {
            payload.chat_messages = chatMessages;
        }

        const result = await this.#request('/schedules', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        return result.data || result;
    }

    /**
     * List scheduled challenges
     * @param {object} [filters] - Optional filters
     * @param {number} [filters.osuId] - Filter by user
     * @param {string} [filters.status] - Filter by status (pending, completed, failed, cancelled)
     * @param {number} [filters.limit] - Results per page (max 100)
     * @param {number} [filters.offset] - Pagination offset
     * @returns {Promise<{schedules: object[], pagination: object}>}
     */
    async listSchedules(filters = {}) {
        const params = new URLSearchParams();
        
        if (filters.osuId) params.set('osu_id', filters.osuId);
        if (filters.status) params.set('status', filters.status);
        if (filters.limit) params.set('limit', filters.limit);
        if (filters.offset) params.set('offset', filters.offset);

        const queryString = params.toString();
        const endpoint = `/schedules${queryString ? '?' + queryString : ''}`;

        const result = await this.#request(endpoint, {
            method: 'GET',
        });
        return result.data || result;
    }

    /**
     * Update a pending scheduled challenge
     * @param {number} id - Schedule ID
     * @param {object} updates - Fields to update
     * @param {string} [updates.scheduledTime] - New scheduled time
     * @param {object} [updates.roomData] - New room configuration
     * @param {string[]} [updates.chatMessages] - New chat messages
     * @returns {Promise<{message: string, schedule: object}>}
     */
    async updateSchedule(id, updates) {
        const payload = { id };

        if (updates.scheduledTime) {
            payload.scheduled_time = updates.scheduledTime;
        }
        if (updates.roomData) {
            payload.room_data = updates.roomData;
        }
        if (updates.chatMessages) {
            payload.chat_messages = updates.chatMessages;
        }

        const result = await this.#request('/schedules', {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });
        return result.data || result;
    }

    /**
     * Cancel a pending scheduled challenge
     * @param {number} id - Schedule ID
     * @returns {Promise<{message: string, id: number}>}
     */
    async cancelSchedule(id) {
        const result = await this.#request('/schedules', {
            method: 'DELETE',
            body: JSON.stringify({ id }),
        });
        return result.data || result;
    }
}

// Export singleton instance
export const challengersApi = new ChallengersApiClient();