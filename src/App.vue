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
                          <n-form ref="tokenFormRef" :model="tokenFormValue" :rules="tokenFormRules"
                            @submit="tokenFormGo">
                            <n-flex justify="center" align="center">
                              <n-form-item path="token" label="your osu!lazer token">
                                <n-input autofocus clearable v-model:value="tokenFormValue.token"
                                  :disabled="tokenFormGoPressed" style="width: 350px;" />
                              </n-form-item>
                              <n-form-item>
                                <n-button @click="tokenFormGo" :disabled="tokenFormGoDisabled && !tokenFormGoPressed">Go
                                  ⇒</n-button>
                              </n-form-item>
                              <n-alert type="warning">
                                Your current lazer login will be <b>LOGGED OUT</b> and that is expected, that doesn't
                                mean you get
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
                                <n-input type="password" show-password-on="mousedown" clearable
                                  :disabled="passwordFormGoPressed" v-model:value="passwordFormValue.password"
                                  style="width: 350px;" />
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
                        <n-button @click="currentStep++">Yes, let's go</n-button>
                        <n-button
                          @click="userConfirmReady = false; tokenFormGoPressed = false; passwordFormGoPressed = false;">
                          No, edit token</n-button>
                      </n-space>
                    </n-space>
                  </div>
                  <GuideForToken />
                  <WhyTokenNeeded />
                </n-flex>
              </div>

              <!-- 2. setup your playlist -->
              <div v-else-if="currentStep === 2">
                <PlaylistEdit :api="api" :user="me" :playlist="playlist" :message="message" @ready="playlistReady" />
              </div>

              <!-- 3. fill room info -->
              <div v-else-if="currentStep === 3 || currentStep === 4">
                <n-flex vertical align="center" justify="center" size="large">
                  <n-grid x-gap="12" cols="1 600:3">
                    <!-- room info -->
                    <n-gi span="1">
                      <n-form ref="roomFormRef" :model="roomFormValue" :rules="roomFormRules"
                        :disabled="currentStep !== 3">
                        <n-form-item label="Playlist name" path="name">
                          <n-input v-model:value="roomFormValue.name" />
                        </n-form-item>
                        <n-form-item label="Duration (minutes)" path="duration">
                          <n-input-number v-model:value="roomFormValue.duration" :min="30" :precision="0"
                            placeholder="Must be >= 30" clearable />
                        </n-form-item>
                        <n-form-item label="Close time (YOUR time zone)" path="endTimestamp">
                          <n-date-picker v-model:value="roomFormValue.endTimestamp" type="datetime" clearable />
                        </n-form-item>
                        <n-alert type="warning" title="Warning about duration">
                          The minimum duration is 30 minutes, while the maximum is 14 days (if you are not a supporter)
                          or 93 days (if
                          you are a supporter) (the longest option in lazer, not sure whether there is an actual limit)
                        </n-alert>
                        <n-form-item label="Max attempts (leave blank to disable)" path="maxAttempts">
                          <n-input-number v-model:value="roomFormValue.maxAttempts" :min="1" :precision="0"
                            placeholder="> 0" clearable />
                        </n-form-item>
                      </n-form>
                    </n-gi>
                    <!-- playlist preview -->
                    <n-gi span="1 600:2">
                      <n-flex vertical align="center" justify="center">
                        <PlaylistEdit readOnly :playlist="playlist" />
                        <div v-if="currentStep === 3">If you find anything wrong, you can <n-button size="small"
                            type="error" @click="currentStep--;">go back</n-button> and edit</div>
                      </n-flex>
                    </n-gi>
                  </n-grid>
                  <n-divider />
                  <n-form ref="roomCreationFormRef" :model="roomCreationFormValue" :rules="roomCreationFormRules" inline
                    :disabled="currentStep !== 3">
                    <n-form-item label="Publish time (YOUR time zone)" path="publishTimestamp">
                      <n-date-picker v-model:value="roomCreationFormValue.publishTimestamp" type="datetime" />
                    </n-form-item>
                    <n-form-item label="Messages to send in room chat after creation of the playlist" path="messages">
                      <n-input v-model:value="roomCreationFormValue.messages" type="textarea"
                        placeholder="One line per message; leave blank to send nothing" />
                    </n-form-item>
                    <n-form-item>
                      <n-button attr-type="button" @click="handleSchedule"
                        :disabled="currentStep !== 3">Schedule!</n-button>
                    </n-form-item>
                  </n-form>
                  <!-- 4. wait -->
                  <n-flex v-if="currentStep === 4" vertical align="center" justify="center" size="large">
                    <n-divider />
                    <n-alert type="warning" title="Keep this tab open!">Keep your browser & this tab open! DO NOT
                      shutdown your
                      computer or make it sleep / hibernate!<br />You don't have to keep it on the foreground thought
                      :D</n-alert>
                    <a>Settings done! <b><n-countdown :duration="countdownDuration" :active="countdownActive" /></b>
                      left to create
                      your playlist</a>
                    <a v-if="!resultFailed && !sendChatFailed">If you find anything wrong, you can <n-button
                        size="small" type="error" @click="currentStep--;">go back</n-button> and edit.</a>
                    <a v-if="resultFailed">
                      Playlist creation has <b class="c">FAILED!</b> for 5 times!<br />
                      Check and edit your playlist settings and retry later :(<br />
                      Press <kbd>F12</kbd> and see console for additional information.<br />
                      <n-button type="error" @click="currentStep--;">go back</n-button>
                    </a>
                    <a v-if="sendChatFailed">
                      Playlist creation has succeeded, but sending chat messages <b class="c">FAILED</b>.<br />
                      Please go to osu!lazer and send them manually :(<br />
                      Press <kbd>F12</kbd> and see console for additional information.<br />
                      <n-button @click="done();">continue</n-button>
                    </a>
                  </n-flex>
                </n-flex>
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
  NSpace,
  NFlex,
  NSteps, NStep,
  NDivider,
  NForm, NFormItem,
  NTabs, NTabPane,
  NInput, NInputNumber, NDatePicker,
  NButton,
  NGradientText,
  NSpin,
  NAlert,
  NMessageProvider,
  NGrid, NGi,
  NCountdown,
} from 'naive-ui';
import { ref, watch } from 'vue';
import { theme, themeOverrides } from './theme';
import SecurityWarning from './components/SecurityWarning.vue';
import GuideForToken from './components/GuideForToken.vue';
import WhyTokenNeeded from './components/WhyTokenNeeded.vue';
import UserConfirm from './components/UserConfirm.vue';
import { MyApi } from './utils/MyApi.js';
import { message } from './utils/message.js';
import PlaylistEdit from './views/PlaylistEdit.vue';

const api = new MyApi();

const currentStep = ref(1);

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
});

// #endregion prevent user refresh END

// #region <!-- 1. fill token --> BEGIN

const me = ref({});
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
      console.log('password form Go!');
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

// #endregion <!-- 1. fill token --> END

// #region <!-- 2. setup playlist --> BEGIN

let playlist = ref([]);
function playlistReady(p) {
  playlist.value = p;
  currentStep.value++;
}

// #endregion <!-- 2. setup playlist --> END

// #region <!-- 3. fill room info --> BEGIN

let room = ref({
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

const encoder = new TextEncoder();
function strlen(str) {
  const s = encoder.encode(str);
  return s.length;
}

async function isFormValid(formRef) {
  try {
    await formRef.value.validate();
    return true;
  } catch (errors) {
    return false;
  }
}

const roomFormRef = ref();
const roomFormValue = ref({
  name: '',
  duration: null,
  endTimestamp: null,
  maxAttempts: null
});
const roomFormRules = {
  name: [{
    required: true,
    validator(rule, value) {
      if (!value) {
        return new Error('Name required');
      }
      if (strlen(value) > 100) {
        return new Error('Too long');
      }
      return true;
    },
    trigger: ['input', 'blur'],
  }],
  duration: [{
    required: false,
    validator(rule, value) {
      if (!value && !roomFormValue.value.endTimestamp) {
        return new Error('Duration or end time needed');
      }
      if (value) {
        if (isNaN(value) || value < 30) {
          return new Error('Invalid');
        }
        roomFormValue.value.endTimestamp = null;
      }
      return true;
    },
    trigger: ['input', 'blur'],
  }],
  endTimestamp: [{
    required: false,
    validator(rule, value) {
      if (!value && !roomFormValue.value.duration) {
        return new Error('End time or duration needed');
      }
      if (value) {
        if (isNaN(value))
          return new Error('Invalid');
        else if (value <= new Date()) {
          return new Error('End time should be in future');
        }
        roomFormValue.value.duration = null;
      }
      return true;
    },
    trigger: ['input', 'blur'],
  }],
  maxAttempts: [{
    required: false,
    validator: (_, v) => v ? v >= 1 : true,
    trigger: ['input'],
  }],
};

const roomCreationFormRef = ref();
const roomCreationFormValue = ref({
  publishTimestamp: null,
  messages: '',
});
const roomCreationFormRules = {
  publishTimestamp: [
    {
      required: true,
      validator(_, v) {
        if (!v) {
          return new Error('Publish time needed');
        }
        if (isNaN(v)) {
          return new Error('Invalid');
        }
        return true;
      },
      trigger: ['input', 'blur'],
    },
    {
      trigger: ['input', 'blur'],
      level: 'warning',
      validator(_, v) {
        if (v <= new Date()) {
          return new Error('Playlist will be created immediately');
        }
        return true;
      },
    },
  ],
};

function handleSchedule(e) {
  e.preventDefault();
  scheduleGo();
}

let scheduledTime = new Date();
let chatMessages = ref([]);

async function scheduleGo() {
  let valid = await isFormValid(roomFormRef) && await isFormValid(roomCreationFormRef);
  if (!valid) {
    message.warning('Room info invalid!');
    return;
  }

  scheduledTime = new Date(roomCreationFormValue.value.publishTimestamp);
  room.value = Object.assign(room.value, {
    host: me,
    playlist: playlist.value,
    name: roomFormValue.value.name,
    duration: roomFormValue.value.duration || 30, // cannot be null even if ends_at is used
    ends_at: roomFormValue.value.endTimestamp > 0 ? new Date(roomFormValue.value.endTimestamp) : null,
    max_attempts: roomFormValue.value.maxAttempts,
  });

  chatMessages.value = [];
  roomCreationFormValue.value.messages.split(/\r?\n/).forEach(line => {
    if (line) {
      chatMessages.value.push(line);
    }
  });

  currentStep.value++;
}

// #endregion <!-- 3. fill room info --> END

// #region <!-- 4. wait --> BEGIN
const waitingStep = 4;

// watch and start the moment currentStep turns 4
watch(currentStep, async (step, oldStep) => {
  if (step === waitingStep) {
    if (oldStep !== waitingStep) {
      startCountdown();
    }
  } else if (oldStep === waitingStep && step !== waitingStep) {
    endCountdown();
  }
})


const countdownDuration = ref(0);
const countdownActive = ref(false);
const resultFailed = ref(false);
const sendChatFailed = ref(false);

let timers = [];
function clearAllTimers() {
  timers.forEach(timerId => clearTimeout(timerId));
  timers = [];
}

async function startCountdown() {
  countdownDuration.value = Number(scheduledTime - Date.now());
  countdownActive.value = true;
  resultFailed.value = false;
  sendChatFailed.value = false;

  clearAllTimers();
  const now = new Date();

  // update API 30s before operation
  const updateApiTime = new Date(scheduledTime - 30 * 1000);
  if (now >= updateApiTime) {
    console.log('update API now');
    await api.refreshToken();
  } else {
    const delay = updateApiTime - now;
    timers.push(setTimeout(() => {
      console.log('update API now');
      api.refreshToken();
    }, delay));
  }

  // create
  if (now >= scheduledTime) {
    await createPlaylist();
  } else {
    const delay = scheduledTime - now;
    timers.push(setTimeout(() => createPlaylist(), delay));
  }
}

function endCountdown() {
  countdownActive.value = false;
  clearAllTimers();
}

const resultRoomRef = ref({});
let resultRoom = null;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function createPlaylist() {
  // try to create room 5 times
  for (let i = 0; i < 5; i++) {
    try {
      resultRoom = await api.createRoom(room.value);
      break;
    } catch (err) {
      console.log(`Try number ${i} of createRoom(`, room.value, ') failed:');
      console.error(err);
      message.info(`Try number ${i} of creating room failed! retry after 5 seconds...`);
      await sleep(5000);
    }
  }
  if (!resultRoom) {
    message.error('Retry failed 5 times, gave up. Please check and edit your playlist and try again later :(');
    resultFailed.value = true;
    return;
  }
  resultRoomRef.value = resultRoom;

  // try to send messages; retries would be handled on server side
  try {
    if (chatMessages.value && chatMessages.value.length > 0)
      await api.sendChatInRoom(resultRoom.id, me.value.id, chatMessages.value);
  } catch (err) {
    console.log('Send messages failed:');
    console.error(err);
    message.error('Send messages failed for 5 times, gave up. Your playlist is created though. Please send chat manually :(');
    sendChatFailed.value = true;
    return;
  }

  // success
  done();
}

// #endregion <!-- 4. wait --> END

// #region <!-- 5. done --> BEGIN

function done() {
  currentStep.value = 5;
  removeLeaveDialog();
}

// #endregion <!-- 5. done --> END

</script>