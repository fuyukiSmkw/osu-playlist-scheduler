import { BadRequestError } from '../../utils/BadRequestError.js';
import { errorReturn } from '../../utils/errorReturn.js'
import { withJsonContent } from '../../utils/withJsonContent.js';
import { newFreshApi } from './utils/newApi.js';

export function register(router, routePrefix) {

    /**
     * get a beatmap
     * POST /beatmap/{bid}
     *   where bid is a number
     * Body: { api: osu.API or at least { access_token } }
     * return { api: osu.API, beatmap: osu.Beatmap }
     */
    router.post(routePrefix + '/beatmap/:bid', withJsonContent, async ({ params, content }) => {
        try {
            if (!content.api?._access_token) {
                throw new BadRequestError('No api / access token!');
            }
            const id = Number(params.bid);
            if (!id) {
                throw new BadRequestError('Beatmap id not valid!');
            }
            const api = await newFreshApi(content.api);
            const beatmap = await api.getBeatmap(id);
            return { api, beatmap };
        } catch (err) {
            return errorReturn(err);
        }
    });

}