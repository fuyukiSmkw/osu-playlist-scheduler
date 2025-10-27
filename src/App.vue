<template>
  <n-config-provider :theme="theme" :theme-overrides="themeOverrides">
    <n-global-style />

    <n-message-provider>
      <n-layout position="absolute">
        <n-layout-header id="header" bordered position="absolute">
          <n-flex align="center" justify="space-between" id="header-flex" :wrap="false">
            <n-steps :current="currentStep" size="small">
              <n-step title="fill token" />
              <n-step title="setup your playlist" />
              <n-step title="fill room info" />
              <n-step title="wait" />
              <n-step title="done" />
            </n-steps>
            <b class="c" style="white-space: nowrap;">osu! playlist scheduler</b>
          </n-flex>
        </n-layout-header>
        <n-layout id="body-container" position="static">
          <n-flex justify="center" :wrap="false">
            <n-layout :style="{ width: '100%', maxWidth: '1200px' }" content-style="padding: 24px;">

              <!-- Contents -->

              <!-- 1. fill token -->
              <div v-if="currentStep === 1">
                <Login @next="nextStep" />
              </div>

              <!-- 2. setup your playlist -->
              <div v-else-if="currentStep === 2">
                <PlaylistSetup @next="nextStep" />
              </div>

              <!-- 3. fill room info -->
              <div v-else-if="currentStep === 3 || currentStep === 4">
                <RoomSetup @next="nextStep" @prev="prevStep" />
              </div>

              <!-- 5. done -->
              <div v-else-if="currentStep === 5">
                <n-flex vertical align="center" justify="center" size="large">
                  <n-gradient-text :size="48" :gradient="{ from: '#c54f86', to: '#ff66ab', deg: 90 }">
                    success :D
                  </n-gradient-text>
                  <a class='c' :href="`https://osu.ppy.sh/multiplayer/rooms/${resultRoomRef.id}`">Link to room</a>
                </n-flex>
              </div>

            </n-layout>
          </n-flex>
        </n-layout>
        <n-layout-footer id="footer" position="absolute">
          <n-flex align="center" justify="space-between" id="footer-flex">
            <a class="dim"><b>do NOT refresh</b> during operation!</a>
            <div>
              <a class="dim">not aff. w/ osu! or ppy Pty Ltd</a> | by <a class='c' href='https://fuyukis.uk'
                target="_blank">fuyukiS</a> | <a class='c' href='https://github.com/fuyukiSmkw/osu-playlist-scheduler'
                target="_blank">GitHub</a>
            </div>
          </n-flex>
        </n-layout-footer>
      </n-layout>
    </n-message-provider>
  </n-config-provider>
</template>

<style>
.dim {
  color: #888;
}

.c {
  color: #ff66ab
}
</style>

<style scoped>
#header {
  z-index: 1000;
}

#header-flex {
  padding-left: 48px;
  padding-right: 48px;
  height: 48px;
  background-color: #1e181b;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

#footer {
  height: 28px;
  z-index: 1000;
  background-color: #2a2226;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

#footer-flex {
  padding-left: 48px;
  padding-right: 48px;
}

#body-container {
  margin-top: 48px;
  margin-bottom: 28px;
}

.s {
  width: 2%;
}
</style>

<script setup>
import {
  NConfigProvider,
  NGlobalStyle,
  NLayout, NLayoutHeader, NLayoutFooter,
  NFlex,
  NSteps, NStep,
  NGradientText,
  NMessageProvider,
} from 'naive-ui';
import { ref, watch } from 'vue';
import { theme, themeOverrides } from './theme';
import Login from './views/Login.vue';
import PlaylistSetup from './views/PlaylistSetup.vue';
import RoomSetup from './views/RoomSetup.vue';
import { resultRoomRef } from './utils/useGlobalStorage';

const currentStep = ref(1);
function nextStep() {
  currentStep.value++;
}
function prevStep() {
  currentStep.value--;
}

// #region prevent user refresh BEGIN

const handleBeforeUnload = (event) => {
  event.preventDefault();
  event.returnValue = '';
};
const addLeaveDialog = () => window.addEventListener('beforeunload', handleBeforeUnload);
const removeLeaveDialog = () => window.removeEventListener('beforeunload', handleBeforeUnload);
watch(currentStep, (step, oldStep) => {
  if (step === 2 && oldStep === 1) {
    addLeaveDialog();
  }
  if (step === 5 && oldStep === 4) {
    removeLeaveDialog();
  }
});

// #endregion prevent user refresh END

</script>