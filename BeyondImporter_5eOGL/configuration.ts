import { SCRIPT_NAME } from "./consts";

export class Configuration {
  private static _STATE_NAME = 'BEYONDIMPORTER';

  constructor(state: {}) {
    this._configurationStore = state[Configuration._STATE_NAME];
  }

  private _configurationStore: ConfigurationStore;

  public configForPlayer(playerId: string): PlayerConfiguration | null {
    return this._configurationStore[playerId].config || null;
  }

  public clearPlayerConfig(playerId: string) {
    delete this._configurationStore[playerId];
  }

  public static checkInstall(): Configuration {
    if(!state.hasOwnProperty(Configuration._STATE_NAME)){
      state[Configuration._STATE_NAME] = {};
    }
    const configuration = new Configuration(state); 
    configuration.setDefaults();
    return configuration;
  };

  public setDefaults(reset: boolean) {
    const defaults = {
      overwrite: false,
      debug: false,
      prefix: '',
      suffix: '',
      inplayerjournals: '',
      controlledby: '',
      languageGrouping: false,
      initTieBreaker: false,
      spellTargetInAttacks: true,
      imports: {
        classes: true,
        class_spells: true,
        class_traits: true,
        inventory: true,
        proficiencies: true,
        traits: true,
        languages: true,
        bonuses: true,
        notes: true,
      }
    };

    const playerObjects: Player[] = findObjs({
      _type: "player",
    }) as Player[];
    playerObjects.forEach((player) => {
      if(!this.configForPlayer(player.id)) {
        this._configurationStore[player.id] = {};
      }

      if(!state[state_name][player.id].config) {
        state[state_name][player.id].config = defaults;
      }

      for(let item in defaults) {
        if(!state[state_name][player.id].config.hasOwnProperty(item)) {
          state[state_name][player.id].config[item] = defaults[item];
        }
      }

      for(let item in defaults.imports) {
        if(!state[state_name][player.id].config.imports.hasOwnProperty(item)) {
          state[state_name][player.id].config.imports[item] = defaults.imports[item];
        }
      }

      if(!state[state_name][player.id].config.hasOwnProperty('firsttime')){
        if(!reset){
          sendConfigMenu(player, true);
        }
        state[state_name][player.id].config.firsttime = false;
      }
    });
    
    return new Configuration(state);
  };

  public sendConfigMenu(player: Player, first?) {
    const playerConfig = this.configForPlayer(player.id);
    const prefix = (playerConfig.prefix !== '') ? playerConfig.prefix : '[NONE]';
    const prefixButton = makeButton(prefix, '!beyond --config prefix|?{Prefix}', buttonStyle);
    const suffix = (playerConfig.suffix !== '') ? playerConfig.suffix : '[NONE]';
    const suffixButton = makeButton(suffix, '!beyond --config suffix|?{Suffix}', buttonStyle);
    const overwriteButton = makeButton(playerConfig.overwrite, '!beyond --config overwrite|'+!playerConfig.overwrite, buttonStyle);
    const debugButton = makeButton(playerConfig.debug, '!beyond --config debug|'+!playerConfig.debug, buttonStyle);
    // const silentSpellsButton = makeButton(playerConfig.silentSpells, '!beyond --config silentSpells|'+!playerConfig.silentSpells, buttonStyle);

    let listItems = [
      '<span style="float: left; margin-top: 6px;">Overwrite:</span> '+overwriteButton+'<br /><small style="clear: both; display: inherit;">This option will overwrite an existing character sheet with a matching character name. I recommend making a backup copy just in case.</small>',
      '<span style="float: left; margin-top: 6px;">Prefix:</span> '+prefixButton,
      '<span style="float: left; margin-top: 6px;">Suffix:</span> '+suffixButton,
      '<span style="float: left; margin-top: 6px;">Debug:</span> '+debugButton,
      // '<span style="float: left; margin-top: 6px;">Silent Spells:</span> '+silentSpellsButton
    ];

    const list = '<b>Importer</b>'+makeList(listItems, 'overflow: hidden; list-style: none; padding: 0; margin: 0;', 'overflow: hidden; margin-top: 5px;');

    const languageGroupingButton = makeButton(playerConfig.languageGrouping, '!beyond --config languageGrouping|'+!playerConfig.languageGrouping, buttonStyle);
    const initTieBreakerButton = makeButton(playerConfig.initTieBreaker, '!beyond --config initTieBreaker|'+!playerConfig.initTieBreaker, buttonStyle);
    const spellTargetInAttacksButton = makeButton(playerConfig.spellTargetInAttacks, '!beyond --config spellTargetInAttacks|'+!playerConfig.spellTargetInAttacks, buttonStyle);

    let inPlayerJournalsButton = makeButton(player.get('_displayname'), '', buttonStyle);
    let controlledByButton = makeButton(player.get('_displayname'), '', buttonStyle);
    if (playerIsGM(player.id)) {
      let players = '';
      const playerObjects = findObjs({
        _type: "player",
      });
      for(let i = 0; i < playerObjects.length; i++) {
        players += '|'+playerObjects[i]['attributes']['_displayname']+','+playerObjects[i].id;
      }

      let ipj = playerConfig.inplayerjournals == '' ? '[NONE]' : playerConfig.inplayerjournals;
      if (ipj != '[NONE]' && ipj != 'all') {
        ipj = getObj('player', ipj).get('_displayname');
      }
      inPlayerJournalsButton = makeButton(ipj, '!beyond --config inplayerjournals|?{Player|None,[NONE]|All Players,all'+players+'}', buttonStyle);
      let cb = playerConfig.controlledby == '' ? '[NONE]' : playerConfig.controlledby;
      if (cb != '[NONE]' && cb != 'all') {
        cb = getObj('player', cb).get('_displayname');
      }
      controlledByButton = makeButton(cb, '!beyond --config controlledby|?{Player|None,[NONE]|All Players,all'+players+'}', buttonStyle);
    }

    const sheetListItems = [
      '<span style="float: left; margin-top: 6px;">In Player Journal:</span> '+inPlayerJournalsButton,
      '<span style="float: left; margin-top: 6px;">Player Control Permission:</span> '+controlledByButton,
      '<span style="float: left; margin-top: 6px;">Language Grouping:</span> '+languageGroupingButton,
      '<span style="float: left; margin-top: 6px;">Initiative Tie Breaker:</span> '+initTieBreakerButton,
      '<span style="float: left; margin-top: 6px;">Spell Info in Attacks:</span> '+spellTargetInAttacksButton
    ];

    const sheetList = '<hr><b>Character Sheet</b>'+makeList(sheetListItems, 'overflow: hidden; list-style: none; padding: 0; margin: 0;', 'overflow: hidden; margin-top: 5px;');

    let debug = '';
    if (playerConfig.config.debug){
      const debugListItems = [];
      for (let importItemName in playerConfig.config.imports) {
        const button = makeButton(playerConfig.config.imports[importItemName], '!beyond --imports '+importItemName+'|'+!playerConfig.config.imports[importItemName], buttonStyle);
        debugListItems.push('<span style="float: left">'+importItemName+':</span> '+button)
      }

      debug += '<hr><b>Imports</b>'+makeList(debugListItems, 'overflow: hidden; list-style: none; padding: 0; margin: 0;', 'overflow: hidden; margin-top: 5px;');
    }

    const resetButton = makeButton('Reset', '!beyond --reset', buttonStyle + ' margin: auto; width: 90%; display: block; float: none;');

    const title_text = (first) ? SCRIPT_NAME + ' First Time Setup' : SCRIPT_NAME + ' Config';
    const text = '<div style="'+style+'">'+makeTitle(title_text)+list+sheetList+debug+'<hr>'+resetButton+'</div>';

    sendChat(SCRIPT_NAME,
             '/w "' + player.get('_displayname') + '" ' + text,
             null,
            { noarchive: true });
  };
}

interface ConfigurationStore {
  [key: string]: {
    config: PlayerConfiguration;
  };
}

export interface PlayerConfiguration {
  overwrite: boolean;

  prefix: string;
  suffix: string;
  languageGrouping: string;
  inplayerjournals: string;
  initTieBreaker: string;
  spellTargetInAttacks: boolean;
  controlledby: string;

  debug: boolean;
  imports: {
    languages: boolean;
    traits: boolean;
  };
}

