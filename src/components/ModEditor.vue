<template>
  <n-space>
    <n-button round @click="reqModsShow = true;" size="small">
      <n-avatar-group v-if="item.required_mods.length" :options="item.required_mods" :size="18" :max="3">
        <template #avatar="{ option: { acronym, settings } }">
          <n-tooltip>
            <template #trigger>
              <img style="height: 20px;" :src="getModIconUrl(acronym)" />
            </template>
            {{ getModDescription({ acronym, settings }) }}
          </n-tooltip>
        </template>
        <template #rest="{ options: restOptions, rest }">
          <n-tooltip>
            <template #trigger>
              <n-tag size="small" round>+{{ rest }}</n-tag>
            </template>
            {{ restOptions.map(getModDescription).join(', ') }}
          </n-tooltip>
        </template>
      </n-avatar-group>
      <div v-else>none</div>
    </n-button>
    <n-divider vertical />
    <n-switch v-if="!readOnly" v-model:value="item.freestyle" @update:value="freestyleUpdate" />
    <div v-if="item.freestyle">
      <n-tag round type="info">freestyle</n-tag>
    </div>
    <div v-else>
      <n-button round @click="freeModsShow = true;" size="small"> {{ item.allowed_mods.length }} freemods </n-button>
    </div>
  </n-space>
  <!-- required mods edit drawer -->
  <n-drawer v-if="!readOnly" v-model:show="reqModsShow" :default-width="500" resizable :mask-closable="false">
    <n-drawer-content title="required mods (click X to cancel →)" closable>
      <ModSelect :mods="item.required_mods" :rulesetId="item.ruleset_id"
        :mode="item.freestyle ? 'required_mods_freestyle' : 'required_mods'" :disabledModAcronyms="[]"
        @update="({ mods }) => { reqModsShow = false; item.required_mods = mods; updateFreeMods(); }" />
    </n-drawer-content>
  </n-drawer>
  <!-- freemod edit drawer -->
  <n-drawer v-if="!readOnly" v-model:show="freeModsShow" :default-width="500" resizable :mask-closable="false">
    <n-drawer-content title="freemods (click X to cancel →)" closable>
      <ModSelect :mods="item.allowed_mods" :rulesetId="item.ruleset_id" mode="freemods"
        :disabledModAcronyms="incompatibleFreeMods"
        @update="({ mods }) => { freeModsShow = false; item.allowed_mods = mods; }" />
    </n-drawer-content>
  </n-drawer>
</template>

<script setup>
import {
  NSpace,
  NSwitch,
  NButton,
  NAvatarGroup,
  NTag,
  NTooltip,
  NDrawer, NDrawerContent,
  NDivider,
} from 'naive-ui';
import { acronymToMod, allFreemodList, allModList } from '@/utils/ModData.js';
import { getAssetUrl } from '@/utils/getAssetUrl';
import ModSelect from './ModSelect.vue';
import { ref, watch } from 'vue';

const { readOnly } = defineProps({
  readOnly: {
    type: Boolean,
    default: false,
  },
});

const item = defineModel({ type: Object, required: true }); // <ModEditor v-model="playlistItem" />

const getModIconUrl = (acronym) => getAssetUrl(`/assets/images/mod/${acronym}.png`);
function getModDescription(mod) {
  if (Object.keys(mod.settings).length === 0)
    return acronymToMod[item.value.ruleset_id][mod.acronym].Name;
  return `${acronymToMod[item.value.ruleset_id][mod.acronym].Name} ${JSON.stringify(mod.settings)}`;
}

const reqModsShow = ref(false);
const freeModsShow = ref(false);
const incompatibleFreeMods = ref([]);

function freestyleUpdate(freestyle) {
  if (freestyle) {
    // freestyle OFF -> ON
    item.value.allowed_mods = [];
    item.value.required_mods = item.value.required_mods.filter((mod) => acronymToMod[item.value.ruleset_id][mod.acronym].ValidForFreestyleAsRequiredMod);
  } else {
    // freestyle ON -> OFF
    // this is playlist instead of multiplayer room, so this should be all mods
    item.value.allowed_mods = allModList[item.value.ruleset_id].map(mod => ({
      acronym: mod.Acronym,
      settings: {}
    })); // copy
    updateFreeMods();
  }
}

function updateFreeMods() {
  updateIncompatibleFreeMods();
  item.value.allowed_mods = item.value.allowed_mods.filter((mod) => !incompatibleFreeMods.value.includes(mod.acronym));
}

function updateIncompatibleFreeMods() {
  let newIncompatibleFreeMods = new Set();
  item.value.required_mods.forEach((mod) => {
    newIncompatibleFreeMods.add(mod.acronym);
    acronymToMod[item.value.ruleset_id][mod.acronym].IncompatibleMods.forEach((a) => newIncompatibleFreeMods.add(a));
  });
  incompatibleFreeMods.value = Array.from(newIncompatibleFreeMods);
}

watch(item, () => updateIncompatibleFreeMods(), { immediate: true });

</script>