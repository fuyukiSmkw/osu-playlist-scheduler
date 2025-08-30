<template>
  <n-flex vertical align="center" justify="center" size="large">
    <!-- playlist list data table -->
    <n-data-table :row-key="id" size="small" :columns="columns" :data="playlist" :pagination="false"
      :max-height="400" />
    <n-divider v-if="!readOnly" />
    <!-- add beatmap -->
    <n-flex v-if="!readOnly" vertical align="center" justify="center">
      <b>Add beatmap to playlist</b>
      <div v-if="!addConfirmReady">
        <n-form ref="addFormRef" inline :model="addFormValue" :rules="addFormRules">
          <n-form-item label="Beatmap ID" path="bid">
            <n-input v-model:value="addFormValue.bid" placeholder="a number" />
          </n-form-item>
          <n-form-item><n-button attr-type="button" @click="addFormGo" :disabled="addButtonPressed || !addValid">Add
              beatmap</n-button></n-form-item>
        </n-form>
      </div>
      <!-- confirm beatmap -->
      <div v-else>
        <n-space vertical align="center" justify="center">
          <a>Is this the map you want?</a>
          <n-flex align="center">
            <n-image lazy height="32" :src="getMapCoverUrl(beatmapToAdd)" />
            <a>{{ getMapStarRating(beatmapToAdd) }} {{ getMapTitle(beatmapToAdd) }}</a>
          </n-flex>
          <n-space>
            <n-button @click="addBeatmap">Yes, add it to playlist</n-button>
            <n-button @click="addConfirmReady = false; addButtonPressed = false;">No, edit BID</n-button>
          </n-space>
        </n-space>
      </div>
    </n-flex>
    <n-divider v-if="!readOnly" />
    <!-- done editing -->
    <n-button v-if="!readOnly" @click="finish" :disabled="!playlist.length">Finish</n-button>
  </n-flex>
</template>

<script setup>
import {
  NFlex,
  NDataTable,
  NDivider,
  NForm, NFormItem, NInput,
  NButton,
  NSpace,
  NImage,
  NDropdown,
} from 'naive-ui';
import { h, ref, watch } from 'vue';
import { getAssetUrl } from '@/utils/getAssetUrl';
import ModEditor from '@/components/ModEditor.vue';

const { api, user, message, readOnly, playlist: currentPlaylist } = defineProps({
  api: {
    type: Object,
    default: undefined,
  },
  user: {
    type: Object,
    default: undefined,
  },
  message: {
    type: Object,
    default: undefined,
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
  playlist: {
    type: Array,
    default: [],
  },
});

const emit = defineEmits(['ready']);
const playlist = ref([]);
watch(() => currentPlaylist, () => { playlist.value = currentPlaylist }, { immediate: true });

// #region <!-- playlist list data table --> BEGIN

const cir = (key, title, width, render) => ({ key, title, width, render });
const cier = (key, title, width, render) => ({ key, title, width, ellipsis: { tooltip: true }, render });
const cbt = (inner, action, row, extraProps) => h(
  NButton,
  {
    strong: true,
    tertiary: true,
    size: "small",
    onClick: () => action(row),
    ...extraProps,
  },
  () => inner
);
const renderNImage = (url, noPreview = true) => h(NImage, { lazy: true, 'preview-disabled': noPreview, height: 24, src: url });
const renderImg = (url) => h('img', { style: "height: 24px;", src: url });
const columns = ref([
  cir('ruleset', '', 2, renderRulesetSelector),
  cir('bid', 'ID', 4, (row) => row?.beatmap_id),
  cir('cover', 'Cover', 5, (row) => renderNImage(getMapCoverUrl(row?.beatmap ?? {}), false)),
  cier('title', 'Artist - Title [Diff]', 16, (row) => getMapTitle(row?.beatmap ?? {})),
  cier('sr', 'Star', 4, (row) => getMapStarRating(row?.beatmap ?? {})),
  cir('mods', 'Required mods, freemods / freestyle', 20, renderMods),
]);
if (!readOnly) {
  columns.value.push(cir('actions', 'Actions', 8, (row, rowIndex) => h(NSpace, {}, () => [
    cbt("↑", moveUp, row, { disabled: rowIndex === 0 }),
    cbt("↓", moveDown, row, { disabled: rowIndex === playlist.value.length - 1 }),
    cbt("☒", removeRow, row, { type: 'error', strong: true }),
  ])));
}

const getRulesetIconUrl = (id) => getAssetUrl(`/assets/images/ruleset/${id}.png`);
const getMapCoverUrl = (map) => map?.beatmapset?.covers?.card ?? '';
const getMapTitle = (map) => `${map?.beatmapset?.artist} - ${map?.beatmapset?.title} [${map?.version}]`;
const getMapStarRating = (map) => `★${map?.difficulty_rating}`;

const Mode = { osu: 0, taiko: 1, fruits: 2, mania: 3 };
const rulesetSelectorOptions = [
  {
    label: "osu!",
    key: "osu",
  },
  {
    label: "taiko",
    key: "taiko",
  },
  {
    label: "catch",
    key: "fruits",
  },
  {
    label: "mania",
    key: "mania",
  }
];
function renderRulesetSelector(row) {
  if (!readOnly && row?.beatmap?.mode === 'osu') {
    return h(NDropdown, {
      options: rulesetSelectorOptions, onSelect: (k) => {
        // Reset mod settings after changing ruleset!!!
        if (row.ruleset_id !== Mode[k]) {
          row.required_mods = [];
          row.allowed_mods = [];
          row.freestyle = true;
          row.ruleset_id = Mode[k];
        }
      }
    }, [
      h(NButton, { circle: true }, renderImg(getRulesetIconUrl(row.ruleset_id))),
    ]);
  }
  else
    return h(NButton, { circle: true }, renderImg(getRulesetIconUrl(row.ruleset_id)));
}

function renderMods(row) {
  return h(ModEditor, {
    readOnly,
    // you can't simply 'v-model': row !!
    modelValue: row,
    'onUpdate:modelValue': (newValue) => {
      Object.assign(row, newValue);
    },
  });
}

const swapElementsAndIds = (arr, fromIndex, toIndex) => {
  if (fromIndex < 0 || fromIndex >= arr.length || toIndex < 0 || toIndex >= arr.length)
    throw new Error(`Invalid index provided: swapElementsAndIds(_, ${fromIndex}, ${toIndex})`);
  const el1 = arr[fromIndex];
  const el2 = arr[toIndex];
  const tempId = el1.id;
  el1.id = el2.id;
  el2.id = tempId;
  [arr[fromIndex], arr[toIndex]] = [arr[toIndex], arr[fromIndex]];
};
function moveUp(row) {
  const i = playlist.value.findIndex(item => item.id === row.id);
  swapElementsAndIds(playlist.value, i, i - 1);
}
function moveDown(row) {
  const i = playlist.value.findIndex(item => item.id === row.id);
  swapElementsAndIds(playlist.value, i, i + 1);
}

function removeRow(row) {
  const index = playlist.value.findIndex(item => item.id === row.id);
  if (index > -1) {
    playlist.value.splice(index, 1);
    for (let i = index; i < playlist.value.length; i++) {
      playlist.value[i].id = i + 1;
    }
  }
}

// #endregion <!-- playlist list data table --> END

// #region <!-- add beatmap --> BEGIN

const addConfirmReady = ref(false);
const beatmapToAdd = ref({});
const addFormRef = ref();
const addFormValue = ref({ bid: void 0 });
const addButtonPressed = ref(false);
const addValid = ref(false);
const addFormRules = ref({
  bid: {
    required: true,
    validator(_, value) {
      if (!value) {
        addValid.value = false;
        return new Error('Input Beatmap ID');
      } else if (!/^\d*$/.test(value)) {
        addValid.value = false;
        return new Error('Invalid');
      }
      addValid.value = true;
      return true;
    },
    trigger: ['input', 'blur'],
  },
  user: {
    type: Object,
    default: undefined,
  },
});

function addFormGo(e) {
  e.preventDefault();
  addFormRef.value?.validate(async (errors) => {
    if (!errors) {
      addButtonPressed.value = true;
      addConfirmReady.value = false;

      try {
        beatmapToAdd.value = await api.getBeatmap(Number(addFormValue.value.bid));
      } catch (exc) {
        message.error('Get beatmap failed! Try again later :(')
        console.error('api.getBeatmap failed:');
        console.error(exc);
        addButtonPressed.value = false;
        addConfirmReady.value = false;
        return;
      }

      addConfirmReady.value = true;
    }
  })
}

function addBeatmap() {
  playlist.value.push({
    id: playlist.value.length,
    owner_id: user.id,
    ruleset_id: Mode[beatmapToAdd.value.mode],
    expired: false,
    beatmap: JSON.parse(JSON.stringify(beatmapToAdd.value)), // copy
    beatmap_id: beatmapToAdd.value.id,
    allowed_mods: [],
    required_mods: [],
    freestyle: true,
  });

  addConfirmReady.value = false;
  addButtonPressed.value = false;
  addFormValue.value.bid = void 0;
  addValid.value = false;
}

// #endregion <!-- add beatmap --> END

function finish() {
  emit('ready', playlist.value);
}
</script>