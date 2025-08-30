// data/mods.json -> https://github.com/ppy/osu-web/blob/master/database/mods.json
import modData from '@/assets/data/mods.json';

export const acronymToMod = [{}, {}, {}, {}];
export const allModList = [[], [], [], []];
export const allFreemodList = [[], [], [], []];
export const allFreestyleRequiredModList = [[], [], [], []];

for (const ruleset of modData) {
  const mode = ruleset.RulesetID;
  for (const mod of ruleset.Mods) {
    acronymToMod[mode][mod.Acronym] = mod;
    if (mod.Type !== 'System')
      allModList[mode].push(mod);
    if (mod.ValidForMultiplayerAsFreeMod)
      allFreemodList[mode].push(mod);
    if (mod.ValidForFreestyleAsRequiredMod)
      allFreestyleRequiredModList[mode].push(mod);
  }
}
