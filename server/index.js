// --- setTimeout override BEGIN
// not available in workers, so override

const __origSetTimeout = globalThis.setTimeout
const __origClearTimeout = globalThis.clearTimeout

globalThis.setTimeout = function (callback, delay, ...args) {
	const timerId = __origSetTimeout(callback, delay, ...args)

	return {
		id: timerId,
		unref() { /* no-op */ },
		ref() { /* no-op */ }
	}
}

globalThis.clearTimeout = function (timer) {
	const realId = (timer && typeof timer === 'object' && 'id' in timer)
		? timer.id
		: timer
	return __origClearTimeout(realId)
}

// --- setTimeout override END

import { AutoRouter } from 'itty-router'
import { Buffer } from 'buffer/';
globalThis.Buffer = Buffer; // osu-api-v2-js needed

const router = AutoRouter();

// ping
router.all('/api/204', () => new Response(null, { status: 204 }));

// filter origin
import { withAllowedOrigin } from './utils/withAllowedOrigin.js';
router.all('*', withAllowedOrigin);

// import api/osu
import * as Auth from './api/osu/Auth.js';
Auth.register(router, '/api/osu');
import * as ResourceOwner from './api/osu/ResourceOwner.js';
ResourceOwner.register(router, '/api/osu');
import * as Mp from './api/osu/Mp.js';
Mp.register(router, '/api/osu');
import * as Beatmap from './api/osu/Beatmap.js';
Beatmap.register(router, '/api/osu');

export default { ...router }; // "export default router" won't work with vite (npm run dev)
