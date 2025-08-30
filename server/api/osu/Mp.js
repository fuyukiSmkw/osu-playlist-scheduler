import { BadRequestError } from '../../utils/BadRequestError.js';
import { errorReturn } from '../../utils/errorReturn.js'
import { withJsonContent } from '../../utils/withJsonContent.js';
import { newFreshApi } from './utils/newApi.js';

export function register(router, routePrefix) {

    /**
     * create a room
     * POST /mp/create
     * Body: { api: (osu.API or at least { access_token }), room: osu.Multiplayer.Room}
     * return { api: osu.API, room: osu.Multiplayer.Room }
     */
    router.post(routePrefix + '/mp/create', withJsonContent, async ({ content }) => {
        try {
            if (!content.api?._access_token) {
                throw new BadRequestError('No api / access token!');
            }
            if (!content.room) {
                throw new BadRequestError('No room!');
            }
            const api = await newFreshApi(content.api);
            const room = await api.request('post', ['rooms'], content.room);
            return { api, room };
        } catch (err) {
            return errorReturn(err);
        }
    });

    /**
     * put user into a room, send some messages, and remove user from the room
     * POST /mp/send-chat/:roomid/users/:userid
     * Body: { api: (osu.API or at least { access_token }), messages: string[] }
     * return { api: osu.API }
     */
    router.post(routePrefix + '/mp/send-chat/:roomid/users/:userid', withJsonContent, async ({ params, content }) => {
        try {
            if (!content.api?._access_token) {
                throw new BadRequestError('No api / access token!');
            }
            if (!params.roomid) {
                throw new BadRequestError('Invalid room id!');
            }
            if (!params.userid) {
                throw new BadRequestError('Invalid user id!');
            }
            if (!content.messages || !content.messages.length) {
                throw new BadRequestError('Invalid messages!');
            }
            const api = await newFreshApi(content.api);
            const messages = content.messages;
            // put user in
            const room = await api.request('put', ['rooms', params.roomid, 'users', params.userid]);
            // try to get user out if error occured below to avoid user stuck in room
            try {
                // send chat
                if (!room.channel_id) {
                    throw new Error(`channel_id of room being ${room.channel_id}, which is not valid!`);
                }
                for (const msg of messages) {
                    let errorSendingMessages = null;
                    // retry 5 times for each message
                    for (let i = 0; i < 5; i++) {
                        try {
                            await api.sendChatMessage(room.channel_id, msg);
                            errorSendingMessages = null;
                            break;
                        } catch (err) {
                            console.log(`Error occurred when api.sendChatMessage(${room.channel_id}, ${msg})`);
                            errorSendingMessages = err;
                        }
                    }
                    if (errorSendingMessages)
                        throw errorSendingMessages;
                }
                // get out
                await api.request('delete', ['rooms', params.roomid, 'users', params.userid]);
            } catch (err) {
                // get out with retry
                console.log(`Error occurred during /mp/send-chat/${params.roomid}/users/${params.userid}, try to get user out`);
                for (let i = 0; i < 5; i++) {
                    try {
                        await api.request('delete', ['rooms', params.roomid, 'users', params.userid]);
                        break;
                    } catch (e) {
                        console.log(`Try number ${i} deleting failed:`);
                        console.error(e);
                    }
                }
                throw err;
            }

            return { api };
        } catch (err) {
            return errorReturn(err);
        }
    })

    /**
     * remove user from a room
     * POST /mp/delete/:roomid/users/:userid
     * Body: { api: (osu.API or at least { access_token }) }
     * return { api: osu.API, room: osu.Multiplayer.Room }
     */
    router.post(routePrefix + '/mp/delete/:roomid/users/:userid', withJsonContent, async ({ params, content }) => {
        try {
            if (!content.api?._access_token) {
                throw new BadRequestError('No api / access token!');
            }
            if (!params.roomid) {
                throw new BadRequestError('Invalid room id!');
            }
            if (!params.userid) {
                throw new BadRequestError('Invalid user id!');
            }
            const api = await newFreshApi(content.api);
            await api.request('put', ['rooms', params.roomid, 'users', params.userid]);
            return { api };
        } catch (err) {
            return errorReturn(err);
        }
    })

}