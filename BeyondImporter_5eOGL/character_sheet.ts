import { PlayerConfiguration } from "./configuration";
import { BeyondDNDCharacterSheetJSON } from "./beyond_dnd";

export class CharacterSheet {
  constructor(private _character) {}

  private _singleAttributes: { [key: string]: any } = {};
  private _repeatingAttributes: { [key: string]: any[] } = {};


  public static createNew(
      prototype: BeyondDNDCharacterSheetJSON, config: PlayerConfiguration,
      callerId: string) {
    // Create character object
    const character = createObj("character", {
      name: config.prefix + prototype.name + config.suffix,
      inplayerjournals: playerIsGM(callerId) ? config.inplayerjournals : callerId,
      controlledby: playerIsGM(callerId) ? config.controlledby : callerId
    });
  }
  
  private createRepeatingTrait(object, trait, options?) {
    options = options || {};

    let opts = {
      index: 0,
      itemid: ''
    };
    Object.assign(opts, options);

    let row = getRepeatingRowIds('traits', 'name', trait.name, opts.index);

    let attributes = {}
    attributes["repeating_traits_"+row+"_name"] = trait.name;
    attributes["repeating_traits_"+row+"_source"] = trait.source;
    attributes["repeating_traits_"+row+"_source_type"] = trait.source_type;
    attributes["repeating_traits_"+row+"_description"] = replaceChars(trait.description);
    attributes["repeating_traits_"+row+"_options-flag"] = '0';

    return attributes;
  };

  private createRepeatingAttack(object, attack, options) {
    options = options || {};

    let opts = {
      index: 0,
      itemid: ''
    };
    Object.assign(opts, options);

    let attackrow = getRepeatingRowIds('attack', 'atkname', attack.name, opts.index);

    let attackattributes = {};
    attackattributes["repeating_attack_"+attackrow+"_options-flag"] = '0';
    attackattributes["repeating_attack_"+attackrow+"_atkname"] = attack.name;
    attackattributes["repeating_attack_"+attackrow+"_itemid"] = opts.itemid;
    attackattributes["repeating_attack_"+attackrow+"_atkflag"] = '{{attack=1}}';
    attackattributes["repeating_attack_"+attackrow+"_atkattr_base"] = '@{'+attack.attack.attribute+'_mod}';
    attackattributes["repeating_attack_"+attackrow+"_atkprofflag"] = '(@{pb})';
    attackattributes["repeating_attack_"+attackrow+"_atkmagic"] = attack.magic;
    attackattributes["repeating_attack_"+attackrow+"_atkrange"] = attack.range;
    attackattributes["repeating_attack_"+attackrow+"_atkmod"] = attack.attack.mod == null ? '' : attack.attack.mod;
    attackattributes["repeating_attack_"+attackrow+"_atkcritrange"] = attack.critrange == null ? '' : attack.critrange;

    attackattributes["repeating_attack_"+attackrow+"_dmgflag"] = '{{damage=1}} {{dmg1flag=1}}';
    attackattributes["repeating_attack_"+attackrow+"_dmgbase"] = typeof attack.damage.diceString == 'string' ? attack.damage.diceString+'' : '';
    attackattributes["repeating_attack_"+attackrow+"_dmgattr"] = (attack.damage.attribute === '0') ? '0' : '@{'+attack.damage.attribute+'_mod}';
    attackattributes["repeating_attack_"+attackrow+"_dmgtype"] = attack.damage.type;
    attackattributes["repeating_attack_"+attackrow+"_dmgcustcrit"] = attack.damage.diceString;
    attackattributes["repeating_attack_"+attackrow+"_dmgmod"] = attack.damage.mod == null ? '' : attack.damage.mod;

    if(attack.damage2 != null) {
      attackattributes["repeating_attack_"+attackrow+"_dmg2flag"] = '{{damage=1}} {{dmg2flag=1}}';
      attackattributes["repeating_attack_"+attackrow+"_dmg2base"] = attack.damage2.diceString;
      attackattributes["repeating_attack_"+attackrow+"_dmg2attr"] = (attack.damage2.attribute === '0') ? '0' : '@{'+attack.damage2.attribute+'_mod}';
      attackattributes["repeating_attack_"+attackrow+"_dmg2type"] = attack.damage2.type;
      attackattributes["repeating_attack_"+attackrow+"_dmg2custcrit"] = attack.damage2.diceString;
    }

    attackattributes["repeating_attack_"+attackrow+"_atk_desc"] = '';//replaceChars(attack.description);

    return attackattributes;
  }

  private getTotalAbilityScore(scoreId) {
    let index = scoreId-1;
    let base = (this._character.stats[index].value == null ? 10 : this._character.stats[index].value),
        bonus = (this._character.bonusStats[index].value == null ? 0 : this._character.bonusStats[index].value),
        override = (this._character.overrideStats[index].value == null ? 0 : this._character.overrideStats[index].value),
        total = base + bonus,
        modifiers = getObjects(this._character, '', _ABILITY[_ABILITIES[scoreId]] + "-score");
    if(override > 0) total = override;
    if(modifiers.length > 0) {
      let used_ids = [];
      for(let i = 0; i < modifiers.length; i++){
        if(modifiers[i].type == 'bonus' && used_ids.indexOf(modifiers[i].id) == -1) {
          total += modifiers[i].value;
          used_ids.push(modifiers[i].id);
        }
      }
    }

    return total;
  };

  // Find an existing repeatable item with the same name, or generate new row ID
  private getOrMakeRowID(repeatPrefix, name) {
    // Get list of all of the character's attributes
    let attrObjs = findObjs({ _type: "attribute", _characterid: this._character.get("_id") });

    let i = 0;
    while (i < attrObjs.length)
    {
      // If this is a feat taken multiple times, strip the number of times it was taken from the name
      /*let attrName = attrObjs[i].get("current").toString();
       if (regexIndexOf(attrName, / x[0-9]+$/) !== -1)
       attrName = attrName.replace(/ x[0-9]+/,"");

       if (attrObjs[i].get("name").indexOf(repeatPrefix) !== -1 && attrObjs[i].get("name").indexOf("_name") !== -1 && attrName === name)
       return attrObjs[i].get("name").substring(repeatPrefix.length,(attrObjs[i].get("name").indexOf("_name")));
       i++;*/
      i++;
    }
    return generateRowID();
  }

  // These are automatically sorted into attributes that are written
  // individually, in alphabetical order and other attributes that are then
  // written as a bulk write, but all are written before repeating_attributes
  public setSingleAttributes(key: string, value: any): {} {
  }

  // these are written in one large write once everything else is written
  // NOTE: changing any stats after all these are imported would create a lot of updates, so it is
  // good that we write these when all the stats are done
  public repeatingAttributes(): {} {
    return {};
  }
}
