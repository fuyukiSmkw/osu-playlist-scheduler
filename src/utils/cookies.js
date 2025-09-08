import { useCookies } from 'vue3-cookies';
import { globalCookiesConfig } from 'vue3-cookies';

globalCookiesConfig({
    expireTimes: '30d',
    secure: true,
    sameSite: 'strict',
});

export const { cookies } = useCookies();