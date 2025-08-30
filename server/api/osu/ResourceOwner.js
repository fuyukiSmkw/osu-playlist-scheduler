import { BadRequestError } from '../../utils/BadRequestError.js';
import { errorReturn } from '../../utils/errorReturn.js'
import { withJsonContent } from '../../utils/withJsonContent.js';
import { newFreshApi } from './utils/newApi.js';

export function register(router, routePrefix) {

    /**
     * get resource owner
     * POST /resource-owner
     * Body: { api: osu.API or at least { access_token } }
     * return { api: osu.API, me: osu.User }
     */
    router.post(routePrefix + '/resource-owner', withJsonContent, async ({ content }) => {
        try {
            if (!content.api?._access_token) {
                throw new BadRequestError('No api / access token!');
            }
            const api = await newFreshApi(content.api);
            const me = await api.getResourceOwner();
            return { api, me };
        } catch (err) {
            return errorReturn(err);
        }
    });

}