<template>
  <n-alert type="error" title="!!! IMPORTANT SECURITY WARNING !!!" closable>
    <a class="b">⚠️ DO NOT enter <b>ANYTHING</b> below ⚠️</a> unless you fully trust this domain and confirm the
    protocol is <b>HTTPS</b>!<br />
    <a class="b">Otherwise, your osu! account could <b>BE HACKED</b>!!!</a> USE AT YOUR OWN RISK!<br />
    Double-check your browser’s address bar <b>RIGHT NOW</b> and make sure the domain and protocol are exactly
    <n-code class="c" code="https://playsche.osu.fuyukis.uk" inline /> (the developer’s official site).<br />
    If you do not trust this domain or if the protocol is not HTTPS but still want to try this project, you can
    clone and run it locally from <a class="c" href='https://github.com/fuyukiSmkw/osu-playlist-scheduler'
      target="_blank">this GitHub repo</a>.
  </n-alert>
</template>

<style scoped>
.b {
  font-size: 32px;
}
</style>

<script setup>
import { NAlert, NCode } from 'naive-ui';
</script>