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
    <!-- 4. wait -->
    <n-flex v-if="submitted" vertical align="center" justify="center" size="large">
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
} from 'naive-ui';
import { ref, watch } from 'vue';
import { message } from '@/utils/message.js';
import PlaylistEdit from './PlaylistEdit.vue';
import { api, me, playlist, room, chatMessages, writeRoom1ToCookies, writeRoom2ToCookies, roomFormValue, roomCreationFormValue, resultRoomRef, removeCookies } from '@/utils/useGlobalStorage';


const emit = defineEmits(['next', 'prev']);

const submitted = ref(false);

function next() {
  submitted.value = true;
  writeRoom1ToCookies();
  writeRoom2ToCookies();
  emit('next');
}

function prev() {
  submitted.value = false;
  emit('prev');
}

// #region <!-- 3. fill room info --> BEGIN

/*let room = ref({
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
});*/

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
// const roomFormValue = ref({
//   name: '',
//   duration: null,
//   endTimestamp: null,
//   maxAttempts: null
// });
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
// const roomCreationFormValue = ref({
//   publishTimestamp: null,
//   messages: '',
// });
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
  scheduleGo();
}

let scheduledTime = new Date();

async function scheduleGo() {
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

  next();
}

// #endregion <!-- 3. fill room info --> END

// #region <!-- 4. wait --> BEGIN

// watch and start countdown
watch(submitted, async (s, olds) => {
  if (s) {
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

// const resultRoomRef = ref({});
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
  emit('next');
  removeCookies();
}

</script>