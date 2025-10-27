import { ref } from 'vue';
import { MyApi } from '@/utils/MyApi.js';
import { cookies } from '@/utils/cookies';

export const api = new MyApi();

export const me = ref({});
export let playlist = ref([]);
export let room = ref({
    // fixed
    id: null,
    password: null,
    category: 'normal',
    starts_at: null,
    type: 'playlists',
    queue_mode: 'host_only',
    auto_skip: false,
    status: 'idle',
    // to be filled
    host: {},
    playlist: {},
    // from input
    name: '',
    duration: 0, // minutes
    ends_at: null,
    max_attempts: null,
});

export const chatMessages = ref([]);

// #region Read cookies first BEGIN

// read playlist from cookie
export const lastPlaylistExist = ref(false);
let cookie_playlist = JSON.parse(decodeURIComponent(cookies.get('playlist')));
if (cookie_playlist && typeof cookie_playlist === 'object') {
    lastPlaylistExist.value = true;
} else {
    cookies.remove('playlist');
}

// read room from cookie
export const lastRoom1Exist = ref(false);
let cookie_room1 = JSON.parse(decodeURIComponent(cookies.get('room1')));
if (cookie_room1 && typeof cookie_room1 === 'object') {
    lastRoom1Exist.value = true;
} else {
    cookies.remove('room1');
}

export const lastRoom2Exist = ref(false);
let cookie_room2 = JSON.parse(decodeURIComponent(cookies.get('room2')));
if (cookie_room2 && typeof cookie_room2 === 'object') {
    lastRoom2Exist.value = true;
} else {
    cookies.remove('room2');
}

export const roomFormValue = ref({
    name: '',
    duration: null,
    endTimestamp: null,
    maxAttempts: null
});
export const roomCreationFormValue = ref({
    publishTimestamp: null,
    messages: '',
});
export const resultRoomRef = ref({});

export async function loadFromCookies() {
    if (lastPlaylistExist.value) {
        for (const i of cookie_playlist) {
            i.owner_id = me.value.id;
            i.beatmap = api.getBeatmap(i.beatmap_id);
        }
        for (const i of cookie_playlist) {
            i.beatmap = await i.beatmap;
        }
        Object.assign(playlist.value, cookie_playlist);
        lastPlaylistExist.value = false;
    }
    if (lastRoom1Exist.value) {
        Object.assign(roomFormValue.value, cookie_room1);
        lastRoom1Exist.value = false;
    }
    if (lastRoom2Exist.value) {
        Object.assign(roomCreationFormValue.value, cookie_room2);
        lastRoom2Exist.value = false;
    }
}

export function writePlaylistToCookies() {
    const p = JSON.parse(JSON.stringify(playlist.value));
    for (const i of p) {
        delete i.beatmap; // too big!
    }
    cookies.set('playlist', encodeURIComponent(JSON.stringify(p)));
}

export function writeRoom1ToCookies() {
    cookies.set('room1', encodeURIComponent(JSON.stringify(roomFormValue.value)));
}

export function writeRoom2ToCookies() {
    cookies.set('room2', encodeURIComponent(JSON.stringify(roomCreationFormValue.value)));
}

export function removeCookies() {
    cookies.remove('playlist');
    cookies.remove('room1');
    cookies.remove('room2');
}

// #endregion Read cookies first END
