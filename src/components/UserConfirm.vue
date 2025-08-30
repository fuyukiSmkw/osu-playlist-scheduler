<template>
  <n-space align="center" size="small">
    <slot name="before" />
    <n-avatar round lazy :src="user.avatar_url" />
    <a :href="`https://osu.ppy.sh/users/${user.id}`" target="_blank">{{ countryCodeToFlagEmoji(user.country_code) +
      user.username }}</a>
  </n-space>
</template>

<style scoped>
a {
  color: #fff;
}
</style>

<script setup>

const props = defineProps({
  user: {
    type: Object,
    default: undefined,
  },
});

import { NAvatar, NSpace } from 'naive-ui';
import { countryCodeToFlagEmoji } from '@/utils/countryCodeToFlagEmoji';

</script>