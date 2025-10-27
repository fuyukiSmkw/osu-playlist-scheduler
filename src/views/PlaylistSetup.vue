<template>
  <n-spin :show="lastPlaylistExist">
    <template #description>You seem to have an unsaved playlist last time...</template>
    <PlaylistEdit :api="api" :user="me" :message="message" @ready="playlistReady" />
  </n-spin>
</template>

<script setup>

import {
  NSpin,
} from 'naive-ui';
import { message } from '@/utils/message.js';
import PlaylistEdit from '@/views/PlaylistEdit.vue';
import { api, me, lastPlaylistExist, writePlaylistToCookies } from '@/utils/useGlobalStorage';

const emit = defineEmits(['next']);

// #region <!-- 2. setup playlist --> BEGIN

function playlistReady() {
  writePlaylistToCookies();
  emit('next');
}

// #endregion <!-- 2. setup playlist --> END

</script>