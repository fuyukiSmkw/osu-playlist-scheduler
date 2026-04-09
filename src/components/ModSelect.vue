<template>
  <n-space vertical>
    <n-space>
      <n-button v-if="mode === 'freemods'" @click="selectAllFreemods">Select all available</n-button>
      <n-button @click="removeAll">Deselect all</n-button>
    </n-space>
    <n-checkbox-group v-model:value="selectedAcronyms" @update:value="handleUpdateSelection">
      <n-flex v-for="mod in modeMap[mode][rulesetId]" :key="mod.Acronym" align="center">
        <n-image height="32" lazy preview-disabled :src="getModIconUrl(mod.Acronym)"
          :class="{ 'grayscale': incompatibleMods.has(mod.Acronym) }" />
        <n-checkbox :value="mod.Acronym" :disabled="incompatibleMods.has(mod.Acronym)">
          {{ mod.Name }}
        </n-checkbox>
        <!-- mod settings -->
        <n-popover v-if="mode !== 'freemods' && mod.Settings && mod.Settings.length" trigger="click">
          <template #trigger>
            <n-button :disabled="!isModSelected(mod.Acronym)">settings</n-button>
          </template>
          <template #header>Settings of {{ mod.Name }}</template>
          <n-space vertical>
            <n-checkbox-group v-model:value="modSettingsMapEnabled[mod.Acronym]"
              @update:value="(_, m) => handleUpdateSettingToggle(mod, m.actionType, m.value)">
              <div v-for="setting in mod.Settings" :key="setting.Name">
                <n-space align="center" :wrap="false">
                  <n-checkbox :value="setting.Name"
                    @update:checked="(checked) => handleToggleSetting(mod.Acronym, setting.Name, setting.Type, checked)"
                    :label="setting.Label" />
                  <div v-if="modSettingsMapEnabled[mod.Acronym].includes(setting.Name)">
                    <n-input v-if="setting.Type !== 'boolean'" clearable
                      v-model:value="modSettingsMap[mod.Acronym][setting.Name]" :placeholder="setting.Type"
                      :allow-input="allowInputFunctions[setting.Type]">
                      <template #prefix>{{ setting.Label }}: </template>
                    </n-input>
                    <n-space v-else align="center">
                      {{ setting.Label }}
                      <n-switch v-model:value="modSettingsMap[mod.Acronym][setting.Name]" />
                    </n-space>
                  </div>
                </n-space>
              </div>
            </n-checkbox-group>
          </n-space>
          <template #footer>Note: you should make <b>100% sure</b> that all values are valid!</template>
        </n-popover>
      </n-flex>
    </n-checkbox-group>
    <n-divider />
    <n-button @click="done">Done</n-button>
  </n-space>
</template>

<style scoped>
.grayscale {
  filter: grayscale(100%);
}
</style>

<script setup>
import {
  NCheckbox, NCheckboxGroup,
  NPopover,
  NSpace, NFlex,
  NImage,
  NButton,
  NInput,
  NSwitch,
  NDivider,
} from 'naive-ui';
import { acronymToMod, allMpModList, allFreestyleRequiredModList, allFreemodList } from '@/utils/ModData';
import { getAssetUrl } from '@/utils/getAssetUrl';
import { ref, watch } from 'vue';

// <ModSelect :mods="mods" :rulesetId="item.ruleset_id" mode="freemods" :disabledModAcronyms="['NF',]" @update="updateMods" />
const { mods, rulesetId, mode, disabledModAcronyms } = defineProps({
  mods: {
    type: Array,
    default: []
  },
  rulesetId: {
    type: Number,
    default: 0,
  },
  mode: {
    type: String,
    default: 'required_mods', // one of 'required_mods', 'required_mods_freestyle', 'freemods'
  },
  disabledModAcronyms: {
    type: Array,
    default: [],
  },
});
const emit = defineEmits(['update']);

const selectedAcronyms = ref([]);
const modSettingsMap = ref({});
const modSettingsMapEnabled = ref({});
const incompatibleMods = ref(new Set());

function initializeLocalData() {
  selectedAcronyms.value = [];
  modSettingsMap.value = {};
  modSettingsMapEnabled.value = {};
  disabledModAcronyms.forEach((a) => incompatibleMods.value.add(a));
  if (mods) {
    mods.forEach((mod) => {
      if (!incompatibleMods.value.has(mod.acronym)) {
        selectedAcronyms.value.push(mod.acronym);
        if (mod.settings) {
          modSettingsMap.value[mod.acronym] = { ...mod.settings };
          modSettingsMapEnabled.value[mod.acronym] = [];
          for (const name in mod.settings)
            modSettingsMapEnabled.value[mod.acronym].push(name);
        }
      }
    });
  }
  allMpModList[rulesetId].forEach(mod => {
    if (!modSettingsMap.value[mod.Acronym]) {
      modSettingsMap.value[mod.Acronym] = {};
      modSettingsMapEnabled.value[mod.Acronym] = [];
    }
  });
  handleUpdateSelection(selectedAcronyms.value);
}
watch(() => mods, initializeLocalData, { immediate: true });

const isModSelected = (acronym) => selectedAcronyms.value.includes(acronym);
const allowInputFunctions = {
  "number": (value) => {
    if (value === null || value === undefined || value === '')
      return true;
    if (typeof value === 'string' && value.trim() === '')
      return false;
    const numberValue = Number(value);
    return !isNaN(numberValue);
  },
  "string": () => true,
  "boolean": () => false, // should not exist
};

const modeMap = {
  required_mods: allMpModList,
  required_mods_freestyle: allFreestyleRequiredModList,
  freemods: allMpModList, // this is playlist instead of multiplayer room, so this should be all mods
};

const getModIconUrl = (acronym) => getAssetUrl(`/assets/images/mod/${acronym}.png`);

// should not use in freemods!
function handleUpdateSelection() {
  if (mode === 'freemods')
    return;
  let newIncompatibleMods = new Set();
  selectedAcronyms.value.forEach((acronym) => {
    acronymToMod[rulesetId][acronym].IncompatibleMods.forEach((a) => {
      if (a !== acronym)
        newIncompatibleMods.add(a);
    });
  });
  incompatibleMods.value = newIncompatibleMods;
}

function selectAllFreemods() {
  removeAll();
  // this is playlist instead of multiplayer room, so this should be all mods
  allMpModList[rulesetId].forEach((mod) => {
    if (!incompatibleMods.value.has(mod.Acronym)) {
      selectedAcronyms.value.push(mod.Acronym);
    }
  });
}
function removeAll() {
  selectedAcronyms.value = [];
  handleUpdateSelection();
}

// handle(["adjust_pitch","final_rate"], {"actionType":"check","value":"final_rate"})
function handleUpdateSettingToggle(mod, checked, settingName) {
  if (checked === 'check') {
    const setting = mod.Settings.find(item => item.Name === settingName);
    modSettingsMap.value[mod.Acronym][settingName] = (setting.Type === 'boolean' ? false : null);
  } else {
    delete modSettingsMap.value[mod.Acronym][settingName];
  }
}

function done() {
  let newMods = [];
  selectedAcronyms.value.forEach((acronym) => {
    const modJson = acronymToMod[rulesetId][acronym];
    const settings = {};
    if (mode !== 'freemods') {
      for (const [name, value] of Object.entries(modSettingsMap.value[acronym])) {
        const modSettingsJson = modJson.Settings.find((s) => s.Name === name);
        if (!modSettingsJson || value === null || value === undefined)
          continue;
        if (modSettingsJson.Type === 'number') {
          settings[name] = Number(value);
        } else {
          settings[name] = value;
        }
      }
    }
    newMods.push({ acronym, settings });
  });
  emit('update', { mods: newMods });
}

</script>