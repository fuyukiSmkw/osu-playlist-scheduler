<template>
  <n-flex vertical align="center" justify="center" size="large">
    <n-gradient-text :size="48" :gradient="{ from: '#c54f86', to: '#ff66ab', deg: 90 }">
      osu! playlist scheduler
    </n-gradient-text>
    <div>schedule your osu!lazer playlist creation!</div>
    <SecurityWarning />
    <n-divider />
    <div v-if="!userConfirmReady">
      <n-spin :show="showSpin">
        <template #description>You seem to have previous used token...</template>
        <n-tabs default-value="token" size="large" justify-content="space-evenly">

          <n-tab-pane name="token" tab="osu!lazer token">
            <n-form ref="tokenFormRef" :model="tokenFormValue" :rules="tokenFormRules" @submit="tokenFormGo">
              <n-flex justify="center" align="center">
                <n-form-item path="token" label="your osu!lazer token">
                  <n-input autofocus clearable v-model:value="tokenFormValue.token" :disabled="tokenFormGoPressed"
                    style="width: 350px;" />
                </n-form-item>
                <n-form-item>
                  <n-button @click="tokenFormGo" :disabled="tokenFormGoDisabled && !tokenFormGoPressed">Go
                    ⇒</n-button>
                </n-form-item>
                <n-alert type="warning">
                  Your current lazer login will be <b>LOGGED OUT IMMEDIATELY</b> (so all the online
                  functions of your lazer will
                  be unavailable until you log in again) and that is expected, that doesn't mean you get
                  hacked.<br />
                  This is because the token got in this way might already be expired so we send it to
                  osu.ppy.sh and refresh it,
                  which invalidates your curent token in lazer. Simply login your lazer again if you get
                  logged out and
                  everything will be fine.<br />
                  Read the "Why is your token needed?" below for more information.
                </n-alert>
              </n-flex>
            </n-form>
          </n-tab-pane>

          <n-tab-pane name="password" tab="Username and password">
            <n-form ref="passwordFormRef" :model="passwordFormValue" :rules="passwordFormRules"
              @submit="passwordFormGo">
              <n-flex justify="center" align="center">
                <n-form-item path="username" label="Username">
                  <n-input autofocus clearable v-model:value="passwordFormValue.username"
                    :disabled="passwordFormGoPressed" style="width: 350px;" />
                </n-form-item>
                <n-form-item path="password" label="Password">
                  <n-input type="password" show-password-on="mousedown" clearable :disabled="passwordFormGoPressed"
                    v-model:value="passwordFormValue.password" style="width: 350px;" />
                </n-form-item>
                <n-form-item>
                  <n-button @click="passwordFormGo"
                    :disabled="!usernameOk || !passwordOk || passwordFormGoPressed">Login</n-button>
                </n-form-item>
                <n-alert type="warning">
                  You probably have to check your <b>email inbox</b> and click on the osu! verification
                  link after logging in.<br />
                  Otherwise, your playlist could <b>likely NOT</b> be successfully created.
                </n-alert>
              </n-flex>
            </n-form>
          </n-tab-pane>

        </n-tabs>
      </n-spin>
    </div>
    <div v-else>
      <n-space vertical justify="center" align="center">
        <a>Is this you?</a>
        <UserConfirm :user="me" />
        <n-space justify="space-between">
          <n-button @click="userConfirmed">Yes, let's go</n-button>
          <n-button @click="userConfirmReady = false; tokenFormGoPressed = false; passwordFormGoPressed = false;">
            No, edit token</n-button>
        </n-space>
      </n-space>
    </div>
    <GuideForToken />
    <WhyTokenNeeded />
  </n-flex>
</template>

<script setup>

import {
  NSpace,
  NFlex,
  NDivider,
  NForm, NFormItem,
  NTabs, NTabPane,
  NInput,
  NButton,
  NGradientText,
  NSpin,
  NAlert,
} from 'naive-ui';
import { ref } from 'vue';
import SecurityWarning from '@/components/SecurityWarning.vue';
import GuideForToken from '@/components/GuideForToken.vue';
import WhyTokenNeeded from '@/components/WhyTokenNeeded.vue';
import UserConfirm from '@/components/UserConfirm.vue';
import { message } from '@/utils/message.js';
import { api, me, loadFromCookies } from '@/utils/useGlobalStorage';

const emit = defineEmits(['next']);

// #region <!-- 1. fill token --> BEGIN

// const me = ref({});
const userConfirmReady = ref(false);

// Token form
const tokenFormRef = ref();
const tokenFormValue = ref({ token: void 0 });
const tokenFormGoDisabled = ref(true);
const tokenPattern = /^[^|]+\|\d+\|.*$/;
const tokenFormRules = {
  token: [
    {
      required: true,
      validator(rule, value) {
        if (!value) {
          tokenFormGoDisabled.value = true;
          return new Error('');
        }
        if (!tokenPattern.test(value)) {
          tokenFormGoDisabled.value = true;
          return new Error('Invalid input');
        }
        tokenFormGoDisabled.value = false;
        return true;
      },
      trigger: ['input'],
    },
  ],
};

const tokenFormGoPressed = ref(false);
function tokenFormGo(e) {
  e.preventDefault();
  tokenFormRef.value?.validate(async (errors, { warnings }) => {
    if (!errors) {
      tokenFormGoPressed.value = true;
      userConfirmReady.value = false;

      api.updateApiFromString(tokenFormValue.value.token.trim());

      try {
        await api.refreshToken();
        me.value = await api.getResourceOwner();
      } catch (exc) {
        message.error('Get user failed! Fix your token and try again :(')
        console.error('api.getResourceOwner failed:');
        console.error(exc);
        tokenFormGoPressed.value = false;
        userConfirmReady.value = false;
        return;
      }

      userConfirmReady.value = true;
    }
  });
}

// Password form
const passwordFormRef = ref();
const passwordFormValue = ref({ username: '', password: '' });
const usernameOk = ref(false);
const passwordOk = ref(false);
const usernamePattern = /^[a-zA-Z0-9\s\-_\[\]]+$/;
const passwordFormRules = {
  username: [
    {
      required: true,
      validator(rule, value) {
        if (!value) {
          usernameOk.value = false;
          return new Error('');
        }
        if (!usernamePattern.test(value)) {
          usernameOk.value = false;
          return new Error('Invalid input');
        }
        usernameOk.value = true;
        return true;
      },
      trigger: ['input'],
    },
  ],
  password: [
    {
      required: true,
      validator(rule, value) {
        if (!value) {
          passwordOk.value = false;
          return new Error('');
        }
        passwordOk.value = true;
        return true;
      },
      trigger: ['input'],
    },
  ],
};

const passwordFormGoPressed = ref(false);
function passwordFormGo(e) {
  e.preventDefault();
  passwordFormRef.value?.validate(async (errors, { warnings }) => {
    if (!errors) {
      passwordFormGoPressed.value = true;
      userConfirmReady.value = false;

      try {
        await api.loginWithPassword(passwordFormValue.value.username.trim(), passwordFormValue.value.password);
        me.value = await api.getResourceOwner();
      } catch (exc) {
        message.error('Get user failed! Fix your token and try again :(')
        console.error('api.getResourceOwner failed:');
        console.error(exc);
        passwordFormGoPressed.value = false;
        userConfirmReady.value = false;
        return;
      }

      userConfirmReady.value = true;
    }
  });
}

// has previous token
const showSpin = ref(false);
(async () => {
  if (api.accessible()) {
    showSpin.value = true;
    try {
      me.value = await api.getResourceOwner();
      userConfirmReady.value = true;
    } catch (_) {
    }
    showSpin.value = false;
  }
})();

function userConfirmed() {
  emit("next");
  loadFromCookies();
}

// #endregion <!-- 1. fill token --> END

</script>