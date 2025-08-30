# osu-playlist-scheduler

Schedule your osu!lazer playlist creation!

## Development

### Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

### Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

### Project Setup

```sh
npm install
```

#### Compile and Hot-Reload for Development

```sh
npm run dev
```

#### Compile and Minify for Production

```sh
npm run build
```

##### Preview

```sh
npm run preview
```

#### Deploy (to Cloudflare Workers)

1.
```sh
npm run deploy
```
2. Set up env var `ALLOWED_ORIGINS`. eg.
```sh
ALLOWED_ORIGINS="https://playsche.osu.fuyukis.uk,https://osu-playlist-scheduler.fuyukismkw.workers.dev"
```

## Acknowledgements

- [Vue](https://vuejs.org), [Vite](https://vite.dev), [Naive UI](https://naiveui.com)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/), [itty-router](https://itty.dev/itty-router)
- [osu! (website)](https://osu.ppy.sh), [osu!web](https://github.com/ppy/osu-web), [osu!lazer](https://github.com/ppy/osu)
- [osu-api-v2-js](https://github.com/TTTaevas/osu-api-v2-js)
- [osu-mod-icons-generator](https://github.com/fuyukiSmkw/osu-mod-icons-generator)

## License

AGPL-3.0-or-later
