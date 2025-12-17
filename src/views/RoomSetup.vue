<template>
  <n-flex vertical align="center" justify="center" size="large">
    <n-grid x-gap="12" cols="1 600:3">
      <!-- room info -->
      <n-gi span="1">
        <n-form ref="roomFormRef" :model="roomFormValue" :rules="roomFormRules" :disabled="submitted">
          <n-form-item label="Playlist name" path="name">
            <n-input v-model:value="roomFormValue.name" />
          </n-form-item>
          <n-form-item label="Duration (minutes)" path="duration">
            <n-input-number v-model:value="roomFormValue.duration" :min="30" :precision="0" placeholder="Must be >= 30"
              clearable />
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
            <n-input-number v-model:value="roomFormValue.maxAttempts" :min="1" :precision="0" placeholder="> 0"
              clearable />
          </n-form-item>
        </n-form>
      </n-gi>
      <!-- playlist preview -->
      <n-gi span="1 600:2">
        <n-flex vertical align="center" justify="center">
          <PlaylistEdit readOnly :playlist="playlist" />
          <div v-if="!submitted">If you find anything wrong, you can <n-button size="small" type="error"
              @click="prev">go back</n-button> and edit</div>
        </n-flex>
      </n-gi>
    </n-grid>
    <n-divider />
    
    <!-- Challengers scheduling option -->
    <n-card v-if="isChallengersAdmin" title="Scheduling Method" size="small" style="max-width: 600px;">
      <n-space vertical>
        <n-radio-group v-model:value="schedulingMethod" :disabled="submitted">
          <n-space vertical>
            <n-radio value="challengers">
              <n-space align="center">
                <span>Schedule via <b class="c">Challengers</b></span>
                <n-tag type="success" size="small">Recommended</n-tag>
              </n-space>
              <div class="radio-description">
                Server-side scheduling. You can close this tab after submitting.
              </div>
            </n-radio>
            <n-radio value="local">
              <span>Local scheduling</span>
              <div class="radio-description">
                Keep this tab open until the scheduled time.
              </div>
            </n-radio>
          </n-space>
        </n-radio-group>
        
        <!-- Email verification reminder for Challengers -->
        <n-alert v-if="schedulingMethod === 'challengers'" type="warning" title="Email Verification Required" style="margin-top: 12px;">
          Make sure you've clicked the <b>osu! verification link</b> in your email after logging in.
          Otherwise, the scheduled room creation will fail with a 401 error.
        </n-alert>
        
        <!-- Token storage option for Challengers -->
        <n-alert v-if="schedulingMethod === 'challengers' && !hasStoredToken" type="info" title="Token Storage" style="margin-top: 12px;">
          <n-space vertical>
            <span>Your token will be sent with this schedule request. For future schedules, you can store your token on Challengers servers.</span>
            <n-checkbox v-model:checked="storeTokenForFuture" :disabled="submitted">
              Store my token for future scheduled challenges
            </n-checkbox>
          </n-space>
        </n-alert>
        <n-alert v-else-if="schedulingMethod === 'challengers' && hasStoredToken" type="success" style="margin-top: 12px;">
          ✓ Using your stored token on Challengers
        </n-alert>
      </n-space>
    </n-card>

    <n-form ref="roomCreationFormRef" :model="roomCreationFormValue" :rules="roomCreationFormRules" inline
      :disabled="submitted">
      <n-form-item label="Publish time (YOUR time zone)" path="publishTimestamp">
        <n-date-picker v-model:value="roomCreationFormValue.publishTimestamp" type="datetime" />
      </n-form-item>
      <n-form-item label="Messages to send in room chat after creation of the playlist" path="messages">
        <n-input v-model:value="roomCreationFormValue.messages" type="textarea"
          placeholder="One line per message; leave blank to send nothing" />
      </n-form-item>
      <n-form-item>
        <n-button attr-type="button" @click="handleSchedule" :disabled="submitted">Schedule!</n-button>
      </n-form-item>
    </n-form>

    <!-- Challengers submission result -->
    <n-flex v-if="submitted && schedulingMethod === 'challengers'" vertical align="center" justify="center" size="large">
      <n-divider />
      <div v-if="challengersSubmitting">
        <n-spin size="large">
          <template #description>Submitting to Challengers...</template>
        </n-spin>
      </div>
      <div v-else-if="challengersSuccess">
        <n-result status="success" title="Scheduled Successfully!" :description="challengersSuccessMessage">
          <template #footer>
            <n-space vertical align="center">
              <n-alert type="info" title="What's next?">
                Your playlist will be created automatically at the scheduled time.<br />
                You can safely close this tab now!
              </n-alert>
              <n-button type="primary" @click="done">Done</n-button>
            </n-space>
          </template>
        </n-result>
      </div>
      <div v-else-if="challengersError">
        <n-result status="error" title="Scheduling Failed" :description="challengersError">
          <template #footer>
            <n-space>
              <n-button @click="retryChallengers">Retry</n-button>
              <n-button @click="switchToLocal">Use Local Scheduling Instead</n-button>
            </n-space>
          </template>
        </n-result>
      </div>
    </n-flex>

    <!-- Local scheduling (existing flow) -->
    <n-flex v-if="submitted && schedulingMethod === 'local'" vertical align="center" justify="center" size="large">
      <n-divider />
      <n-alert type="warning" title="Keep this tab open!">Keep your browser & this tab open! DO NOT
        shutdown your
        computer or make it sleep / hibernate!<br />You don't have to keep it on the foreground thought
        :D</n-alert>
      <a>Settings done! <b><n-countdown :duration="countdownDuration" :active="countdownActive" /></b>
        left to create
        your playlist</a>
      <a v-if="!resultFailed && !sendChatFailed">If you find anything wrong, you can <n-button size="small" type="error"
          @click="prev">go back</n-button> and edit.</a>
      <a v-if="resultFailed">
        Playlist creation has <b class="c">FAILED!</b> for 5 times!<br />
        Check and edit your playlist settings and retry later :(<br />
        Press <kbd>F12</kbd> and see console for additional information.<br />
        <n-button type="error" @click="prev">go back</n-button>
      </a>
      <a v-if="sendChatFailed">
        Playlist creation has succeeded, but sending chat messages <b class="c">FAILED</b>.<br />
        Please go to osu!lazer and send them manually :(<br />
        Press <kbd>F12</kbd> and see console for additional information.<br />
        <n-button @click="done();">continue</n-button>
      </a>
    </n-flex>
  </n-flex>
</template>

<style scoped>
.radio-description {
  font-size: 12px;
  color: #888;
  margin-left: 24px;
}
</style>

<script setup>

import {
  NFlex,
  NDivider,
  NForm, NFormItem,
  NInput, NInputNumber, NDatePicker,
  NButton,
  NAlert,
  NGrid, NGi,
  NCountdown,
  NCard,
  NRadioGroup, NRadio,
  NSpace,
  NTag,
  NCheckbox,
  NSpin,
  NResult,
} from 'naive-ui';
import { ref, watch, computed } from 'vue';
import { message } from '@/utils/message.js';
import PlaylistEdit from './PlaylistEdit.vue';
import { api, me, playlist, room, chatMessages, writeRoom1ToCookies, writeRoom2ToCookies, roomFormValue, roomCreationFormValue, resultRoomRef, removeCookies, isChallengersAdmin, hasStoredToken, useChallengersScheduling } from '@/utils/useGlobalStorage';
import { challengersApi } from '@/utils/ChallengersApi.js';


const emit = defineEmits(['next', 'prev', 'challengers-done']);

const submitted = ref(false);

// Scheduling method selection
const schedulingMethod = ref(isChallengersAdmin.value ? 'challengers' : 'local');
const storeTokenForFuture = ref(false);

// Challengers submission state
const challengersSubmitting = ref(false);
const challengersSuccess = ref(false);
const challengersSuccessMessage = ref('');
const challengersError = ref(null);

function next() {
  submitted.value = true;
  writeRoom1ToCookies();
  writeRoom2ToCookies();
  emit('next');
}

function prev() {
  submitted.value = false;
  challengersSubmitting.value = false;
  challengersSuccess.value = false;
  challengersError.value = null;
  emit('prev');
}

// #region <!-- 3. fill room info --> BEGIN

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
const cookieWriter1 = {
  trigger: ['blur'],
  level: 'warning',
  validator() {
    writeRoom1ToCookies();
    return true;
  },
};
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
  }, cookieWriter1],
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
  }, cookieWriter1],
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
  }, cookieWriter1],
  maxAttempts: [{
    required: false,
    validator: (_, v) => v ? v >= 1 : true,
    trigger: ['input'],
  }, cookieWriter1],
};

const roomCreationFormRef = ref();
const cookieWriter2 = {
  trigger: ['blur'],
  level: 'warning',
  validator() {
    writeRoom2ToCookies();
    return true;
  },
};
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
    cookieWriter2,
  ],
  messages: [cookieWriter2],
};

function handleSchedule(e) {
  e.preventDefault();
  
  if (schedulingMethod.value === 'challengers') {
    scheduleViaChallengers();
  } else {
    scheduleLocal();
  }
}

/**
 * Build room_data object for Challengers API
 */
function buildRoomData() {
  // Make copy of playlist: only keep required values
  const minPlaylist = playlist.value.map(i => ({
    id: i.id,
    beatmap_id: i.beatmap_id,
    ruleset_id: i.ruleset_id,
    allowed_mods: i.allowed_mods,
    required_mods: i.required_mods,
    freestyle: i.freestyle,
  }));

  const roomData = {
    name: roomFormValue.value.name,
    duration: roomFormValue.value.duration || 30,
    type: 'playlists',
    playlist: minPlaylist,
  };

  // Add ends_at if specified
  if (roomFormValue.value.endTimestamp > 0) {
    roomData.ends_at = new Date(roomFormValue.value.endTimestamp).toISOString();
  }

  // Add max_attempts if specified
  if (roomFormValue.value.maxAttempts) {
    roomData.max_attempts = roomFormValue.value.maxAttempts;
  }

  return roomData;
}

/**
 * Get current token string from API
 */
function getCurrentTokenString() {
  return api.getTokenString();
}

/**
 * Schedule via Challengers API
 */
async function scheduleViaChallengers() {
  let valid = await isFormValid(roomFormRef) && await isFormValid(roomCreationFormRef);
  if (!valid) {
    message.warning('Room info invalid!');
    return;
  }

  submitted.value = true;
  challengersSubmitting.value = true;
  challengersSuccess.value = false;
  challengersError.value = null;

  writeRoom1ToCookies();
  writeRoom2ToCookies();

  try {
    const scheduledTime = new Date(roomCreationFormValue.value.publishTimestamp).toISOString();
    const roomData = buildRoomData();
    
    // Parse chat messages
    const chatMsgs = [];
    roomCreationFormValue.value.messages.split(/\r?\n/).forEach(line => {
      if (line.trim()) {
        chatMsgs.push(line.trim());
      }
    });

    // Build request params
    const scheduleParams = {
      osuId: me.value.id,
      scheduledTime,
      roomData,
      chatMessages: chatMsgs.length > 0 ? chatMsgs : undefined,
    };

    // Include token if user doesn't have stored token OR wants to store it
    if (!hasStoredToken.value) {
      const tokenString = getCurrentTokenString();
      if (!tokenString) {
        throw new Error('Could not get current token');
      }
      scheduleParams.osuToken = tokenString;

      // If user wants to store token for future, do that first
      if (storeTokenForFuture.value) {
        console.log('Storing token for future use...');
        try {
          await challengersApi.setUserToken(me.value.id, tokenString);
          hasStoredToken.value = true;
          message.success('Token stored for future schedules!');
        } catch (storeErr) {
          console.warn('Failed to store token:', storeErr.message);
          // Continue anyway - token is included in schedule request
        }
      }
    }

    console.log('Creating schedule via Challengers:', {
      osuId: scheduleParams.osuId,
      scheduledTime: scheduleParams.scheduledTime,
      roomName: scheduleParams.roomData.name,
      playlistItems: scheduleParams.roomData.playlist.length,
      hasToken: !!scheduleParams.osuToken,
      hasChatMessages: !!scheduleParams.chatMessages,
    });

    const result = await challengersApi.createSchedule(scheduleParams);
    
    console.log('Challengers schedule created:', result);
    
    challengersSuccess.value = true;
    challengersSuccessMessage.value = `Playlist "${roomData.name}" scheduled for ${new Date(scheduledTime).toLocaleString()}`;
    
    // Store result for reference
    resultRoomRef.value = {
      challengersScheduleId: result.schedule?.id,
      scheduledTime,
      roomName: roomData.name,
    };

  } catch (err) {
    console.error('Challengers scheduling failed:', err);
    challengersError.value = err.message || 'Failed to schedule via Challengers';
  } finally {
    challengersSubmitting.value = false;
  }
}

function retryChallengers() {
  submitted.value = false;
  challengersError.value = null;
  // Re-submit
  setTimeout(() => scheduleViaChallengers(), 100);
}

function switchToLocal() {
  submitted.value = false;
  schedulingMethod.value = 'local';
  challengersError.value = null;
}

// #endregion <!-- 3. fill room info --> END

// #region <!-- Local scheduling (existing flow) --> BEGIN

let scheduledTime = new Date();

async function scheduleLocal() {
  let valid = await isFormValid(roomFormRef) && await isFormValid(roomCreationFormRef);
  if (!valid) {
    message.warning('Room info invalid!');
    return;
  }

  // make copy of playlist: only keep required values
  var minPlaylist = playlist.value.map(i => ({
    id: i.id,
    owner_id: i.owner_id,
    ruleset_id: i.ruleset_id,
    expired: i.expired,
    allowed_mods: i.allowed_mods,
    required_mods: i.required_mods,
    freestyle: i.freestyle,
    beatmap_id: i.beatmap_id,
  }));

  scheduledTime = new Date(roomCreationFormValue.value.publishTimestamp);
  Object.assign(room.value, {
    host: me,
    playlist: minPlaylist,
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

  submitted.value = true;
  writeRoom1ToCookies();
  writeRoom2ToCookies();
}

// #endregion <!-- Local scheduling --> END

// #region <!-- 4. wait (local only) --> BEGIN

// watch and start countdown
watch(submitted, async (s, olds) => {
  if (s && schedulingMethod.value === 'local') {
    if (!olds) {
      startCountdown();
    }
  } else if (olds && !s) {
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

function done() {
  removeCookies();
  if (schedulingMethod.value === 'challengers') {
    emit('challengers-done');
  } else {
    emit('next');
  }
}

</script>