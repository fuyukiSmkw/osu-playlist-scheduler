<template>
  <n-alert title="Why is your token needed?" type="info" class="a">
    <p>Most osu!-related sites use OAuth2 tokens provided by the official osu! server to access osu! data and
      perform actions on behalf of users. This usually involves a page from osu.ppy.sh where you confirm
      authentication with your osu! account, instead of manually entering a token string or your username and
      password. Why is this site different?</p>
    <p>The reason is that the <a href="https://osu.ppy.sh/docs/#post-apiv2rooms" target="_blank">API endpoint for
        creating a playlist</a> currently rejects all requests except those from the osu!lazer client. This
      means the standard method will always fail when trying to create playlists.</p>
    <p>This site mimics osu!lazer’s behavior to gain API access and create playlists, which avoids being rejected.
      However, it also requires logging in the same way osu!lazer does, which is relatively less secure.</p>
    <p>If the domain is <n-code class="c" code="https://playsche.osu.fuyukis.uk" inline />, all the data you provide
      will ONLY be securely transmitted to the official osu! server (osu.ppy.sh) via HTTPS and will NEVER be
      uploaded or stored on any other online server. Your API tokens will be stored locally in your browser
      cookies for convenience. Your password will NEVER be stored anywhere. If you still have concerns, visit the
      <a class="c" href='https://github.com/fuyukiSmkw/osu-playlist-scheduler' target="_blank">GitHub repo</a> to
      check the
      source code.
    </p>
  </n-alert>
</template>

<script setup>
import { NAlert, NCode, NSpace } from 'naive-ui';
</script>