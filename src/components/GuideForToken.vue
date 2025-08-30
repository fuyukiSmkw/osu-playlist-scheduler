<template>
  <n-alert title="How to get your osu!lazer token?" type="default" class="a">
    <n-steps :current="currentStep" @update:current="setStep">
      <n-step title="Go to game.ini" />
      <n-step title="Find token and copy it" />
      <n-step title="Paste it here" />
      <n-step title="Here you go" />
      <n-step title="Or login with username and password" />
    </n-steps>
    <br>
    <div v-if="currentStep === 1">
      Open your osu!lazer folder and locate the file <n-code class="c" code="game.ini" inline />.<br><br>
      By default, it can be found at:<br>
      Windows: <n-code class="c" code='%APPDATA%\osu\game.ini' inline /> (Tip: press <kbd>Win</kbd>+<kbd>R</kbd> and run
      <n-code class="c" code='notepad %APPDATA%\osu\game.ini' inline />)<br>
      Linux: <n-code class="c" code='~/.local/share/osu/game.ini' inline /><br>
      macOS: <n-code class="c" code='~/Library/Application Support/osu/game.ini' inline /><br>
      Android: <n-code class="c" code='Android/data/sh.ppy.osulazer/files/files' inline /> (System app "Files" or root
      is required to access this file)
    </div>
    <div v-else-if="currentStep === 2">
      Look for the line that starts with <n-code class="c" code='Token = ...' inline />. Copy everything that comes
      after the "= ".<br><br>
      For example, if the line is <n-code class="c" code="Token = eyJ0eXAiOiJKV|1756047199|def5020" inline />
      (the actual token will be much longer), copy only
      <n-code class="c" code="eyJ0eXAiOiJKV|1756047199|def5020" inline />.
    </div>
    <div v-else-if="currentStep === 3">
      Paste the copied token into the text box above.
    </div>
    <div v-else-if="currentStep === 4">
      Click the "Go" button and confirm that the account shown is yours.
    </div>
    <div v-else-if="currentStep === 5">
      If you can’t access your osu!lazer settings, you can alternatively log in using your username and password.
    </div>
    <n-space justify="end">
      <n-button @click="prevStep">←</n-button>
      <n-button @click="nextStep">next →</n-button>
    </n-space>
  </n-alert>
</template>

<style scoped>
.a {
  padding: 6px;
}
</style>

<script setup>
import { ref } from 'vue';
import { NAlert, NSteps, NStep, NCode, NSpace, NButton } from 'naive-ui';

const currentStep = ref(1);
const maxStep = 5;
function prevStep() {
  if (currentStep.value > 1)
    currentStep.value--;
  else
    currentStep.value = maxStep;
}
function nextStep() {
  if (currentStep.value < maxStep)
    currentStep.value++;
  else
    currentStep.value = 1;
}
function setStep(stepStep) {
  currentStep.value = stepStep;
}
</script>