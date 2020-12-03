"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
/*
 * Version 0.4.0
 *
 * Made By Robin Kuiper
 * Skype: RobinKuiper.eu
 * Discord: Atheos#1095
 * My Discord Server: https://discord.gg/AcC9VME
 * Roll20: https://app.roll20.net/users/1226016/robin
 * Roll20 Thread: https://app.roll20.net/forum/post/6248700/script-beta-beyondimporter-import-dndbeyond-character-sheets
 * Github: https://github.com/RobinKuiper/Roll20APIScripts
 * Reddit: https://www.reddit.com/user/robinkuiper/
 * Patreon: https://patreon.com/robinkuiper
 * Paypal.me: https://www.paypal.me/robinkuiper
 *
 * Modified By:
 *
 * Name: Matt DeKok
 * Discord: Sillvva#2532
 * Roll20: https://app.roll20.net/users/494585/sillvva
 *
 * Name: Ammo Goettsch
 * Discord: ammo#7063
 * Roll20: https://app.roll20.net/users/2990964/ammo
 */
require("types-roll20");
(function () {
    var _ABILITIES = { 1: 'STR', 2: 'DEX', 3: 'CON', 4: 'INT', 5: 'WIS', 6: 'CHA' };
    var _ABILITY = { 'STR': 'strength', 'DEX': 'dexterity', 'CON': 'constitution', 'INT': 'intelligence', 'WIS': 'wisdom', 'CHA': 'charisma' };
    var abilities = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
    var alignments = ['', 'Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'];
    var strength_skills = ['athletics'];
    var dexterity_skills = ['acrobatics', 'sleight_of_hand', 'stealth'];
    var intelligence_skills = ['arcana', 'history', 'investigation', 'nature', 'religion'];
    var wisdom_skills = ['animal_handling', 'insight', 'medicine', 'perception', 'survival'];
    var charisma_skills = ['deception', 'intimidation', 'performance', 'persuasion'];
    var saving_throws = ['strength_save', 'dexterity_save', 'constitution_save', 'intelligence_save', 'wisdom_save', 'charisma_save'];
    var all_skills = strength_skills.concat(dexterity_skills, intelligence_skills, wisdom_skills, charisma_skills);
    // these class features are hidden
    var silent_class_features = [
        'Spellcasting',
        'Bonus Proficiency',
        'Ability Score Improvement',
        'Bonus Cantrip',
        'Proficiencies',
        'Hit Points',
        'Pact Magic',
        'Expanded Spell List',
        'Druidic',
        'Expertise',
        'Oath Spells'
    ];
    // these are added by showing the selected options as class features
    var option_class_features = [
        'Maneuvers',
        'Fighting Style',
        'Divine Domain',
        'Arcane Tradition',
        'Otherworldly Patron',
        'Ranger Archetype',
        'Druid Circle',
        'Sorcerous Origin',
        'Monastic Tradition',
        'Bardic College',
        'Roguish Archetype',
        'Sacred Oath',
        'Martial Archetype'
    ];
    var weapons = ['Club', 'Dagger', 'Greatclub', 'Handaxe', 'Javelin', 'Light Hammer', 'Mace', 'Quarterstaff', 'Sickle', 'Spear', 'Crossbow, Light', 'Dart', 'Shortbow', 'Sling', 'Battleaxe', 'Flail', 'Glaive', 'Greataxe', 'Greatsword', 'Halberd', 'Lance', 'Longsword', 'Maul', 'Morningstar', 'Pike', 'Rapier', 'Scimitar', 'Shortsword', 'Trident', 'War Pick', 'Warhammer', 'Whip', 'Blowgun', 'Crossbow, Hand', 'Crossbow, Heavy', 'Longbow', 'Net'];
    var class_spells = [];
    var spellAttacks = [];
    var object;
    // Styling for the chat responses.
    var style = "margin-left: 0px; overflow: hidden; background-color: #fff; border: 1px solid #000; padding: 5px; border-radius: 5px;";
    var buttonStyle = "background-color: #000; border: 1px solid #292929; border-radius: 3px; padding: 5px; color: #fff; text-align: center; float: right;";
    //  jack of all trades feature in input, or undefined
    var jack_feature;
    var script_name = 'BeyondImporter';
    var state_name = 'BEYONDIMPORTER';
    var debug = false;
    var spellTargetInAttacks = true;
    on('ready', function () {
        checkInstall();
        log(script_name + ' Ready! Command: !beyond');
        if (debug) {
            sendChat(script_name, script_name + ' Ready!', null, { noarchive: true });
        }
    });
    on('chat:message', function (msg) {
        if (msg.type != 'api')
            return;
        // Split the message into command and argument(s)
        var args = msg.content.split(/ --(help|reset|config|imports|import) ?/g);
        var command = args.shift().substring(1).trim();
        var beyond_caller = getObj('player', msg.playerid);
        if (command !== 'beyond') {
            return;
        }
        var importData = '';
        if (args.length < 1) {
            sendHelpMenu(beyond_caller);
            return;
        }
        var config = state[state_name][beyond_caller.id].config;
        var initTiebreaker = config.initTieBreaker;
        var languageGrouping = config.languageGrouping;
        // if not set, we default to true even without a config reset
        if (config.hasOwnProperty('spellTargetInAttacks')) {
            spellTargetInAttacks = config.spellTargetInAttacks;
        }
        for (var i = 0; i < args.length; i += 2) {
            var k = args[i].trim();
            var v = args[i + 1] != null ? args[i + 1].trim() : null;
            switch (k) {
                case 'help':
                    sendHelpMenu(beyond_caller);
                    return;
                case 'reset':
                    state[state_name][beyond_caller.id] = {};
                    setDefaults(true);
                    sendConfigMenu(beyond_caller);
                    return;
                case 'config':
                    if (args.length > 0) {
                        var setting = v.split('|');
                        var key = setting.shift();
                        var value = (setting[0] === 'true')
                            ? true
                            : (setting[0] === 'false')
                                ? false
                                : (setting[0] === '[NONE]')
                                    ? ''
                                    : setting[0];
                        if (key === 'prefix' && value.charAt(0) !== '_' && value.length > 0) {
                            value = value + ' ';
                        }
                        if (key === 'suffix' && value.charAt(0) !== '_' && value.length > 0) {
                            value = ' ' + value;
                        }
                        state[state_name][beyond_caller.id].config[key] = value;
                    }
                    sendConfigMenu(beyond_caller);
                    return;
                case 'imports':
                    if (args.length > 0) {
                        var setting = v.split('|');
                        var key = setting.shift();
                        var value = (setting[0] === 'true') ? true : (setting[0] === 'false') ? false : (setting[0] === '[NONE]') ? '' : setting[0];
                        state[state_name][beyond_caller.id].config.imports[key] = value;
                    }
                    sendConfigMenu(beyond_caller);
                    return;
                case 'import':
                    importData = v;
                    break;
                default:
                    sendHelpMenu(beyond_caller);
                    return;
            }
        }
        if (importData === '') {
            return;
        }
        var json = importData;
        var character = JSON.parse(json).character;
        sendChat(script_name, '<div style="' + style + '">Import of <b>' + character.name + '</b> is starting.</div>', null, { noarchive: true });
        class_spells = [];
        // these are automatically sorted into attributes that are written individually, in alphabetical order
        // and other attributes that are then written as a bulk write, but all are written before repeating_attributes
        var single_attributes = {};
        // these are written in one large write once everything else is written
        // NOTE: changing any stats after all these are imported would create a lot of updates, so it is
        // good that we write these when all the stats are done
        var repeating_attributes = {};
        object = null;
        // Remove characters with the same name if overwrite is enabled.
        if (state[state_name][beyond_caller.id].config.overwrite) {
            var objects = findObjs({
                _type: "character",
                name: state[state_name][beyond_caller.id].config.prefix + character.name + state[state_name][beyond_caller.id].config.suffix
            }, { caseInsensitive: true });
            if (objects.length > 0) {
                object = objects[0];
                for (var i = 1; i < objects.length; i++) {
                    objects[i].remove();
                }
            }
        }
        if (!object) {
            // Create character object
            object = createObj("character", {
                name: state[state_name][beyond_caller.id].config.prefix + character.name + state[state_name][beyond_caller.id].config.suffix,
                inplayerjournals: playerIsGM(msg.playerid) ? state[state_name][beyond_caller.id].config.inplayerjournals : msg.playerid,
                controlledby: playerIsGM(msg.playerid) ? state[state_name][beyond_caller.id].config.controlledby : msg.playerid
            });
        }
        // base class, if set
        if (character.classes && (character.classes.length > 0)) {
            Object.assign(single_attributes, {
                'class': character.classes[0].definition.name,
                'subclass': character.classes[0].subclassDefinition == null ? '' : character.classes[0].subclassDefinition.name,
                'base_level': character.classes[0].level
            });
        }
        // Make Speed String
        var weightSpeeds = character.race.weightSpeeds;
        if (weightSpeeds == null) {
            weightSpeeds = {
                "normal": {
                    "walk": 30,
                    "fly": 0,
                    "burrow": 0,
                    "swim": 0,
                    "climb": 0
                }
            };
        }
        var speedMods = getObjects(character.modifiers, 'subType', 'speed');
        if (speedMods != null) {
            speedMods.forEach(function (speedMod) {
                // REVISIT: what item is this for?  boots of striding and springing use set: innate-speed-walking and Loadstone uses bonus: speed
                // so maybe this is for some feat or class feature? we could scope the search to not the whole character to clarify this
                if (speedMod.type == 'set') {
                    weightSpeeds.normal.walk = (speedMod.value > weightSpeeds.normal.walk ? speedMod.value : weightSpeeds.normal.walk);
                }
            });
        }
        speedMods = getObjects(character.modifiers, 'subType', 'innate-speed-flying');
        if (speedMods != null) {
            speedMods.forEach(function (speedMod) {
                if (speedMod.type == 'set' && speedMod.id.indexOf('spell') == -1) {
                    if (speedMod.value == null)
                        speedMod.value = weightSpeeds.normal.walk;
                    weightSpeeds.normal.fly = (speedMod.value > weightSpeeds.normal.fly ? speedMod.value : weightSpeeds.normal.fly);
                }
            });
        }
        speedMods = getObjects(character.modifiers, 'subType', 'innate-speed-swimming');
        if (speedMods != null) {
            speedMods.forEach(function (speedMod) {
                if (speedMod.type == 'set' && speedMod.id.indexOf('spell') == -1) {
                    if (speedMod.value == null)
                        speedMod.value = weightSpeeds.normal.walk;
                    weightSpeeds.normal.swim = (speedMod.value > weightSpeeds.normal.swim ? speedMod.value : weightSpeeds.normal.swim);
                }
            });
        }
        speedMods = getObjects(character.modifiers, 'subType', 'innate-speed-climbing');
        if (speedMods != null) {
            speedMods.forEach(function (speedMod) {
                if (speedMod.type == 'set' && speedMod.id.indexOf('spell') == -1) {
                    if (speedMod.value == null)
                        speedMod.value = weightSpeeds.normal.walk;
                    weightSpeeds.normal.climb = (speedMod.value > weightSpeeds.normal.climb ? speedMod.value : weightSpeeds.normal.climb);
                }
            });
        }
        speedMods = getObjects(character.modifiers, 'subType', 'unarmored-movement');
        if (speedMods != null) {
            speedMods.forEach(function (speedMod) {
                if (speedMod.type == 'bonus') {
                    speedMod.value = isNaN(weightSpeeds.normal.walk + speedMod.value) ? 0 : speedMod.value;
                    weightSpeeds.normal.walk += speedMod.value;
                    if (weightSpeeds.normal.fly > 0)
                        weightSpeeds.normal.fly += speedMod.value;
                    if (weightSpeeds.normal.swim > 0)
                        weightSpeeds.normal.swim += speedMod.value;
                    if (weightSpeeds.normal.climb > 0)
                        weightSpeeds.normal.climb += speedMod.value;
                }
            });
        }
        speedMods = getObjects(character.modifiers, 'subType', 'speed');
        if (speedMods != null) {
            speedMods.forEach(function (speedMod) {
                if (speedMod.type == 'bonus') {
                    speedMod.value = isNaN(weightSpeeds.normal.walk + speedMod.value) ? 0 : speedMod.value;
                    weightSpeeds.normal.walk += speedMod.value;
                    if (weightSpeeds.normal.fly > 0)
                        weightSpeeds.normal.fly += speedMod.value;
                    if (weightSpeeds.normal.swim > 0)
                        weightSpeeds.normal.swim += speedMod.value;
                    if (weightSpeeds.normal.climb > 0)
                        weightSpeeds.normal.climb += speedMod.value;
                }
            });
        }
        var speed = weightSpeeds.normal.walk + 'ft.';
        for (var key in weightSpeeds.normal) {
            if (key !== 'walk' && weightSpeeds.normal[key] !== 0) {
                speed += ', ' + key + ' ' + weightSpeeds.normal[key] + 'ft.';
            }
        }
        var weapon_critical_range = 20;
        var critical_range = 20;
        // Languages
        if (state[state_name][beyond_caller.id].config.imports.languages) {
            var languages = getObjects(character, 'type', 'language');
            if (languageGrouping) {
                var langs_1 = [];
                if (languages != null) {
                    languages.forEach(function (language) {
                        langs_1.push(language.friendlySubtypeName);
                    });
                }
                var row = getRepeatingRowIds('proficiencies', 'prof_type', 'LANGUAGE')[0];
                var attributes = {};
                attributes["repeating_proficiencies_" + row + "_name"] = langs_1.join(', ');
                attributes["repeating_proficiencies_" + row + "_prof_type"] = 'LANGUAGE';
                attributes["repeating_proficiencies_" + row + "_options-flag"] = '0';
                Object.assign(repeating_attributes, attributes);
            }
            else {
                if (languages != null) {
                    languages.forEach(function (language) {
                        var row = getRepeatingRowIds('proficiencies', 'name', language.friendlySubtypeName)[0];
                        var attributes = {};
                        attributes["repeating_proficiencies_" + row + "_name"] = language.friendlySubtypeName;
                        attributes["repeating_proficiencies_" + row + "_prof_type"] = 'LANGUAGE';
                        attributes["repeating_proficiencies_" + row + "_options-flag"] = '0';
                        Object.assign(repeating_attributes, attributes);
                    });
                }
            }
        }
        if (state[state_name][beyond_caller.id].config.imports.traits) {
            // Background Feature
            if (character.background.definition != null) {
                var btrait = {
                    name: character.background.definition.featureName,
                    description: replaceChars(character.background.definition.featureDescription),
                    source: 'Background',
                    source_type: character.background.definition.name
                };
                var attrs = createRepeatingTrait(object, btrait);
                Object.assign(repeating_attributes, attrs);
            }
            // Custom Background Feature
            if (character.background.customBackground != null) {
                if (character.background.customBackground.featuresBackground != null) {
                    var btrait = {
                        name: character.background.customBackground.featuresBackground.featureName,
                        description: replaceChars(character.background.customBackground.featuresBackground.featureDescription),
                        source: 'Background',
                        source_type: character.background.customBackground.name
                    };
                    var attrs = createRepeatingTrait(object, btrait);
                    Object.assign(repeating_attributes, attrs);
                }
            }
            // Feats
            character.feats.forEach(function (feat, fi) {
                var t = {
                    name: feat.definition.name,
                    description: replaceChars(feat.definition.description),
                    source: 'Feat',
                    source_type: feat.definition.name
                };
                var attrs = createRepeatingTrait(object, t, fi);
                Object.assign(repeating_attributes, attrs);
            });
            // Race Features
            if (character.race.racialTraits != null) {
                var ti_1 = 0;
                character.race.racialTraits.forEach(function (trait) {
                    if (['Languages', 'Darkvision', 'Superior Darkvision', 'Skills', 'Ability Score Increase', 'Feat', 'Age', 'Alignment', 'Size', 'Speed', 'Skill Versatility', 'Dwarven Combat Training', 'Keen Senses', 'Elf Weapon Training', 'Extra Language', 'Tool Proficiency'].indexOf(trait.definition.name) !== -1) {
                        return;
                    }
                    var description = '';
                    if (trait.options != null) {
                        trait.options.forEach(function (option) {
                            description += option.name + '\n';
                            description += (option.description !== '') ? option.description + '\n\n' : '\n';
                        });
                    }
                    description += trait.definition.description;
                    var t = {
                        name: trait.definition.name,
                        description: replaceChars(description),
                        source: 'Race',
                        source_type: character.race.fullName
                    };
                    var attrs = createRepeatingTrait(object, t, ti_1);
                    Object.assign(repeating_attributes, attrs);
                    var spells = getFeatureSpells(character, trait.id, 'race');
                    spells.forEach(function (spell) {
                        spell.spellCastingAbility = _ABILITIES[spell.spellCastingAbilityId];
                        class_spells.push(spell);
                    });
                    ti_1++;
                });
            }
        }
        // Handle (Multi)Class Features
        var multiclass_level = 0;
        var total_level = 0;
        var monk_level = 0;
        if (state[state_name][beyond_caller.id].config.imports.classes) {
            var multiclasses_1 = {};
            character.classes.forEach(function (current_class, i) {
                total_level += current_class.level;
                if (!current_class.isStartingClass) {
                    multiclasses_1['multiclass' + i + '_flag'] = '1';
                    multiclasses_1['multiclass' + i + '_lvl'] = current_class.level;
                    multiclasses_1['multiclass' + i] = current_class.definition.name.toLowerCase();
                    multiclasses_1['multiclass' + i + '_subclass'] = current_class.subclassDefinition == null ? '' : current_class.subclassDefinition.name;
                    multiclass_level += current_class.level;
                }
                // Set Pact Magic as class resource
                if (current_class.definition.name.toLowerCase() === 'warlock') {
                    var attributes = {};
                    attributes['other_resource_name'] = 'Pact Magic';
                    attributes['other_resource_max'] = getPactMagicSlots(current_class.level);
                    attributes['other_resource'] = getPactMagicSlots(current_class.level);
                    Object.assign(single_attributes, attributes);
                }
                if (current_class.definition.name == 'Monk')
                    monk_level = current_class.level;
                if (current_class.definition.name.toLowerCase() === 'fighter' && current_class.subclassDefinition != null) {
                    if (current_class.subclassDefinition.name.toLowerCase() == 'champion') {
                        current_class.subclassDefinition.classFeatures.forEach(function (feature, i) {
                            if (feature.id == 215 && current_class.level >= feature.requiredLevel) { // improved critical
                                critical_range = Math.min(19, critical_range);
                            }
                            if (feature.id == 218 && current_class.level >= feature.requiredLevel) {
                                critical_range = Math.min(18, critical_range);
                            }
                        });
                    }
                }
                if (state[state_name][beyond_caller.id].config.imports.class_traits) {
                    var ti_2 = 0;
                    current_class.definition.classFeatures.forEach(function (trait) {
                        if (silent_class_features.indexOf(trait.name) !== -1) {
                            return;
                        }
                        if (option_class_features.indexOf(trait.name) !== -1) {
                            ti_2 = importClassOptions(repeating_attributes, trait, current_class, character.options["class"], ti_2);
                            return;
                        }
                        if (trait.requiredLevel > current_class.level)
                            return;
                        if (trait.name.includes('Jack of All Trades')) {
                            jack_feature = trait;
                        }
                        var description = '';
                        description += trait.description;
                        var t = {
                            name: trait.name,
                            description: replaceChars(description),
                            source: 'Class',
                            source_type: current_class.definition.name
                        };
                        Object.assign(repeating_attributes, createRepeatingTrait(object, t, ti_2));
                        var spells = getFeatureSpells(character, trait.id, 'class');
                        spells.forEach(function (spell) {
                            spell.spellCastingAbility = _ABILITIES[spell.spellCastingAbilityId];
                            class_spells.push(spell);
                        });
                        if (trait.name == 'Metamagic') {
                            character.choices["class"].forEach(function (option) {
                                if (option.type == 3 && (option.optionValue >= 106 && option.optionValue <= 113)) {
                                    var item = getObjects(option.options, 'id', option.optionValue);
                                    if (item.length > 0) {
                                        item = item[0];
                                        var o = {
                                            name: item.label,
                                            description: item.description,
                                            source: 'Class',
                                            source_type: current_class.definition.name
                                        };
                                        Object.assign(repeating_attributes, createRepeatingTrait(object, o));
                                    }
                                }
                            });
                        }
                        ti_2++;
                    });
                    if (current_class.subclassDefinition != null) {
                        var ti_3 = 0;
                        current_class.subclassDefinition.classFeatures.forEach(function (trait) {
                            if (silent_class_features.indexOf(trait.name) !== -1) {
                                return;
                            }
                            if (option_class_features.indexOf(trait.name) !== -1) {
                                ti_3 = importClassOptions(repeating_attributes, trait, current_class, character.options["class"], ti_3);
                                return;
                            }
                            if (trait.requiredLevel > current_class.level)
                                return;
                            if (trait.name.includes('Jack of All Trades')) {
                                jack_feature = trait;
                            }
                            var description = '';
                            description += trait.description;
                            var t = {
                                name: trait.name,
                                description: replaceChars(description),
                                source: 'Class',
                                source_type: current_class.definition.name
                            };
                            Object.assign(repeating_attributes, createRepeatingTrait(object, t, ti_3));
                            var spells = getFeatureSpells(character, trait.id, 'class');
                            spells.forEach(function (spell) {
                                spell.spellCastingAbility = _ABILITIES[spell.spellCastingAbilityId];
                                class_spells.push(spell);
                            });
                            ti_3++;
                        });
                    }
                }
                // Class Spells
                if (state[state_name][beyond_caller.id].config.imports.class_spells) {
                    for (var i_1 in character.classSpells) {
                        var spells = character.classSpells[i_1];
                        if (character.classSpells[i_1].characterClassId == current_class.id) {
                            character.classSpells[i_1].spells.forEach(function (spell) {
                                spell.spellCastingAbility = _ABILITIES[current_class.definition.spellCastingAbilityId];
                                class_spells.push(spell);
                            });
                        }
                    }
                }
            });
            Object.assign(single_attributes, multiclasses_1);
        }
        // Import Character Inventory
        var hasArmor = false;
        if (state[state_name][beyond_caller.id].config.imports.inventory) {
            // accumulate unique fighting styles selected
            var fightingStylesSelected_1 = new Set();
            var fightingStyles = getObjects(character.classes, 'name', 'Fighting Style');
            fightingStyles.forEach(function (fS) {
                var fsOpts = getObjects(character.choices, 'componentId', fS.id);
                fsOpts.forEach(function (fsOpt) {
                    if (fsOpt.optionValue != null) {
                        var selOpts = getObjects(fsOpt.options, 'id', fsOpt.optionValue);
                        selOpts.forEach(function (selOpt) {
                            fightingStylesSelected_1.add(selOpt.label);
                        });
                    }
                });
            });
            var inventory = character.inventory;
            var prevAdded_1 = [];
            if (inventory != null) {
                var shieldEquipped_1 = false;
                inventory.forEach(function (item, i) {
                    if (item.definition.type == 'Shield' && item.equipped)
                        shieldEquipped_1 = true;
                });
                inventory.forEach(function (item, i) {
                    log('beyond: found inventory item ' + item.definition.name);
                    var paIndex = prevAdded_1.filter(function (pAdded) { return pAdded == item.definition.name; }).length;
                    var row = getRepeatingRowIds('inventory', 'itemname', item.definition.name, paIndex);
                    prevAdded_1.push(item.definition.name);
                    var attributes = {};
                    attributes["repeating_inventory_" + row + "_itemname"] = item.definition.name;
                    attributes["repeating_inventory_" + row + "_equipped"] = (item.equipped) ? '1' : '0';
                    attributes["repeating_inventory_" + row + "_itemcount"] = item.quantity;
                    attributes["repeating_inventory_" + row + "_itemweight"] = (item.definition.bundleSize != 0 ? item.definition.weight / item.definition.bundleSize : item.definition.weight);
                    attributes["repeating_inventory_" + row + "_itemcontent"] = replaceChars(item.definition.description);
                    var _itemmodifiers = 'Item Type: ' + item.definition.type;
                    if (typeof item.definition.damage === 'object' && item.definition.type !== 'Ammunition') {
                        var properties_1 = '';
                        var finesse_1 = false;
                        var twohanded_1 = false;
                        var ranged_1 = false;
                        var hasOffhand_1 = false;
                        var isOffhand_1 = false;
                        var versatile_1 = false;
                        var versatileDice_1 = '';
                        item.definition.properties.forEach(function (prop) {
                            if (prop.name == 'Two-Handed') {
                                twohanded_1 = true;
                            }
                            if (prop.name == 'Range') {
                                ranged_1 = true;
                            }
                            if (prop.name == 'Finesse') {
                                finesse_1 = true;
                            }
                            if (prop.name == 'Versatile') {
                                versatile_1 = true;
                                versatileDice_1 = prop.notes;
                            }
                            properties_1 += prop.name + ', ';
                        });
                        var cv = getObjects(character.characterValues, 'valueTypeId', item.entityTypeId);
                        cv.forEach(function (v) {
                            if (v.typeId == 18 && v.value === true) {
                                hasOffhand_1 = true;
                                if (v.valueId == item.id) {
                                    isOffhand_1 = true;
                                }
                            }
                        });
                        attributes["repeating_inventory_" + row + "_itemproperties"] = properties_1;
                        attributes["repeating_inventory_" + row + "_hasattack"] = '0';
                        _itemmodifiers = 'Item Type: ' + item.definition.attackType + ' ' + item.definition.filterType + (item.definition.damage != null ? ', Damage: ' + item.definition.damage.diceString : '') + ', Damage Type: ' + item.definition.damageType + ', Range: ' + item.definition.range + '/' + item.definition.longRange;
                        var magic_1 = 0;
                        item.definition.grantedModifiers.forEach(function (grantedMod) {
                            if (grantedMod.type == 'bonus' && grantedMod.subType == 'magic') {
                                magic_1 += grantedMod.value;
                            }
                        });
                        // Finesse Weapon
                        var isFinesse = item.definition.properties.filter(function (property) { return property.name == 'Finesse'; }).length > 0;
                        if (isFinesse && getTotalAbilityScore(character, 2) > getTotalAbilityScore(character, item.definition.attackType)) {
                            item.definition.attackType = 2;
                        }
                        // Hexblade's Weapon
                        var characterValues = getObjects(character.characterValues, 'valueId', item.id);
                        characterValues.forEach(function (cv) {
                            if (cv.typeId == 29 && getTotalAbilityScore(character, 6) >= getTotalAbilityScore(character, item.definition.attackType)) {
                                item.definition.attackType = 6;
                            }
                        });
                        var gwf_1 = false;
                        var atkmod_1 = 0;
                        var dmgmod_1 = 0;
                        var hasTWFS_1 = false;
                        // process each fighting style only once
                        fightingStylesSelected_1.forEach(function (fightingStyle) {
                            if (fightingStyle == 'Great Weapon Fighting' && twohanded_1 && (!ranged_1)) {
                                gwf_1 = true;
                            }
                            if (fightingStyle == 'Archery' && ranged_1) {
                                atkmod_1 += 2;
                            }
                            if (fightingStyle == 'Dueling' && !(hasOffhand_1 || ranged_1 || twohanded_1)) {
                                log('applying Dueling +2 to ' + item.definition.name);
                                dmgmod_1 += 2;
                                log('damage mod now ' + dmgmod_1);
                            }
                            if (fightingStyle == 'Two-Weapon Fighting') {
                                hasTWFS_1 = true;
                            }
                        });
                        if (versatile_1 && !(hasOffhand_1 || shieldEquipped_1)) {
                            item.definition.damage.diceString = versatileDice_1;
                        }
                        if (item.definition.isMonkWeapon && monk_level > 0) {
                            var itemAvgDmg = 0;
                            if (item.definition.damage != null) {
                                var dS = item.definition.damage.diceString;
                                var itemDieCount = parseInt(dS.substr(0, dS.indexOf('d')));
                                var itemDieSize = parseInt(dS.substr(dS.indexOf('d') + 1));
                                itemAvgDmg = (itemDieCount * (itemDieSize + 1)) / 2;
                            }
                            var monkDieSize = Math.floor((monk_level - 1) / 4) * 2 + 4;
                            var monkAvgDmg = (1 + monkDieSize) / 2;
                            if (monkAvgDmg > itemAvgDmg) {
                                item.definition.damage.diceString = '1d' + monkDieSize;
                            }
                            var str = getTotalAbilityScore(character, 1);
                            var dex = getTotalAbilityScore(character, 2);
                            if (dex > str) {
                                item.definition.attackType = 2;
                            }
                        }
                        var dmgattr = _ABILITY[_ABILITIES[item.definition.attackType]];
                        if (!hasTWFS_1 && isOffhand_1)
                            dmgattr = '0';
                        // CREATE ATTACK
                        var attack_1 = {
                            name: item.definition.name,
                            range: item.definition.range + (item.definition.range != item.definition.longRange ? '/' + item.definition.longRange : '') + 'ft.',
                            attack: {
                                attribute: _ABILITY[_ABILITIES[item.definition.attackType]],
                                mod: atkmod_1
                            },
                            damage: {
                                diceString: item.definition.damage != null ? item.definition.damage.diceString + (gwf_1 ? 'ro<2' : '') : '',
                                type: item.definition.damageType,
                                attribute: dmgattr,
                                mod: dmgmod_1
                            },
                            description: replaceChars(item.definition.description),
                            magic: magic_1,
                            critrange: Math.min(weapon_critical_range, critical_range)
                        };
                        item.definition.grantedModifiers.forEach(function (grantedMod) {
                            if (grantedMod.type == 'damage') {
                                if (grantedMod.dice != null) {
                                    attack_1.damage2 = {
                                        diceString: grantedMod.dice.diceString,
                                        type: grantedMod.friendlySubtypeName,
                                        attribute: grantedMod.statId == null ? '0' : _ABILITY[_ABILITIES[grantedMod.statId]]
                                    };
                                }
                            }
                        });
                        var repAttack = createRepeatingAttack(object, attack_1, { index: paIndex, itemid: row });
                        Object.assign(repeating_attributes, repAttack);
                        // /CREATE ATTACK
                    }
                    var itemArmorClass = 0;
                    itemArmorClass += (item.definition.armorClass == null ? 0 : item.definition.armorClass);
                    item.definition.grantedModifiers.forEach(function (grantedMod) {
                        for (var abilityId in _ABILITIES) {
                            var ABL = _ABILITIES[abilityId];
                            if (grantedMod.type == 'set' && grantedMod.subType == _ABILITY[ABL] + '-score') {
                                _itemmodifiers += ', ' + ucFirst(_ABILITY[ABL]) + ': ' + grantedMod.value;
                            }
                        }
                        if (grantedMod.type == 'bonus') {
                            switch (grantedMod.subType) {
                                case 'armor-class':
                                // wielding a shield or wearing other item which only give a bonus to armor class doesn't qualify as wearing armor
                                // including items such as staff of power, ring of protection, etc.
                                // fall through
                                case 'unarmored-armor-class':
                                    if (item.definition.hasOwnProperty('armorClass')) {
                                        itemArmorClass += grantedMod.value;
                                    }
                                    else {
                                        _itemmodifiers += ', AC +' + grantedMod.value;
                                    }
                                    break;
                                case 'saving-throws':
                                    _itemmodifiers += ', Saving Throws +' + grantedMod.value;
                                    break;
                                case 'ability-checks':
                                    _itemmodifiers += ', Ability Checks +' + grantedMod.value;
                                    break;
                                case 'speed':
                                    // Speed attribute in Roll20 OGL sheets is not calculated. They must be manually set
                                    break;
                                case 'magic':
                                    // these are picked up in the weapons code above
                                    break;
                                default:
                                    // these may indicate an unimplemented conversion
                                    log('ignoring item ' + item.definition.name + ' bonus modifier for ' + grantedMod.subType);
                            }
                        }
                        if (grantedMod.type == 'set') {
                            switch (grantedMod.subType) {
                                case 'armor-class':
                                // If an item qualifies as armor, it will be given the .armorClass property and a type property of "Light/Medium/Heavy Armor".
                                // Items with modifiers like this don't qualify as armor. I don't know of any items that have this specific modifier.
                                // fall through
                                case 'unarmored-armor-class':
                                    _itemmodifiers += ', AC: ' + grantedMod.value;
                                    break;
                                case 'innate-speed-walking':
                                // REVISIT boots of striding and springing give a floor to walking speed through this, but no way to do that in an item in Roll20?
                                // fall through and log as ignored
                                default:
                                    // these may indicate an unimplemented conversion
                                    log('ignoring item ' + item.definition.name + ' set modifier for ' + grantedMod.subType);
                            }
                        }
                    });
                    if (item.definition.hasOwnProperty('armorClass')) {
                        var ac_1 = itemArmorClass;
                        if (["Light Armor", "Medium Armor", "Heavy Armor"].indexOf(item.definition.type) >= 0) {
                            // This includes features such as defense fighting style, which require the user to wear armor
                            var aac = getObjects(character, 'subType', 'armored-armor-class');
                            aac.forEach(function (aacb) {
                                ac_1 = parseInt(ac_1) + parseInt(aacb.value);
                            });
                            hasArmor = true;
                        }
                        _itemmodifiers += ', AC: ' + ac_1;
                    }
                    attributes["repeating_inventory_" + row + "_itemmodifiers"] = _itemmodifiers;
                    Object.assign(repeating_attributes, attributes);
                });
            }
        }
        // if applicable, create pseudo-armor item for unarmored defense
        createUnarmoredDefense(repeating_attributes, character, total_level);
        if (character.spells.race.length > 0) {
            var spells = character.spells.race;
            spells.forEach(function (spell) {
                spell.spellCastingAbility = _ABILITIES[spell.spellCastingAbilityId];
                class_spells.push(spell);
            });
        }
        // calculate final skill bonuses and proficiencies (including initiative), then write results
        var PROFICIENCY_NONE = 0, PROFICIENCY_HALF = 1, PROFICIENCY_HALF_ROUND_UP = 2, PROFICIENCY_FULL = 3;
        PROFICIENCY_EXPERTISE = 4;
        var modifiers = {};
        if (state[state_name][beyond_caller.id].config.imports.proficiencies) {
            for (var _i = 0, _a = getObjects(character.modifiers, 'type', 'half-proficiency'); _i < _a.length; _i++) {
                var half_proficiency = _a[_i];
                if ((jack_feature !== undefined) &&
                    (half_proficiency.componentId === jack_feature.id) &&
                    // XXX technically, we should get the follwing constant from classes/classFeatures[]/definition
                    (half_proficiency.componentTypeId === 12168134)) {
                    // filter out all jack of all trade mods
                    continue;
                }
                updateProficiency(modifiers, half_proficiency, PROFICIENCY_HALF);
            }
            for (var _b = 0, _c = getObjects(character.modifiers, 'type', 'half-proficiency-round-up'); _b < _c.length; _b++) {
                var half_proficiency_round_up = _c[_b];
                updateProficiency(modifiers, half_proficiency_round_up, PROFICIENCY_HALF_ROUND_UP);
            }
            for (var _d = 0, _e = getObjects(character.modifiers, 'type', 'proficiency'); _d < _e.length; _d++) {
                var proficiency = _e[_d];
                updateProficiency(modifiers, proficiency, PROFICIENCY_FULL);
            }
            for (var _f = 0, _g = getObjects(character, 'type', 'expertise'); _f < _g.length; _f++) {
                var expertise = _g[_f];
                updateProficiency(modifiers, expertise, PROFICIENCY_EXPERTISE);
            }
            // Adhoc Expertise (REVISIT: check into whether this can be handled more elegantly)
            for (var _h = 0, _j = getObjects(character.characterValues, 'typeId', 26); _h < _j.length; _h++) {
                var cv = _j[_h];
                if (cv.value == 4) {
                    for (var _k = 0, _l = getObjects(character, 'type', 'proficiency'); _k < _l.length; _k++) {
                        var obj = _l[_k];
                        if (cv.valueId == obj.entityId && cv.valueTypeId == obj.entityTypeId) {
                            updateProficiency(modifiers, obj, PROFICIENCY_FULL);
                        }
                    }
                }
            }
        }
        if (state[state_name][beyond_caller.id].config.imports.bonuses) {
            // import bonuses that are not from items
            // XXX write separate code to implement those item modifiers that we cannot import in the inventory code, e.g. passive-perception
            // XXX and read those only if both bonuses and inventory are enabled
            for (var _m = 0, _o = getObjects(character.modifiers, 'type', 'bonus', ['item']); _m < _o.length; _m++) {
                var bonus = _o[_m];
                if (bonus.id.includes('spell')) {
                    continue;
                }
                var attribute_basename = bonus.subType.replace(/-/g, '_');
                if (modifiers[attribute_basename] === undefined) {
                    log("beyond: modifier '" + attribute_basename + "' bonus " + bonus.value);
                    modifiers[attribute_basename] = { bonus: bonus.value, proficiency: PROFICIENCY_NONE, friendly: bonus.friendlySubtypeName };
                }
                else {
                    log("beyond: modifier '" + attribute_basename + "' bonus increased by " + bonus.value);
                    modifiers[attribute_basename].bonus += bonus.value;
                }
            }
        }
        // emit the final calculated bonuses and proficiencies
        emitAttributesForModifiers(single_attributes, repeating_attributes, modifiers, total_level);
        var contacts = '', treasure = '', otherNotes = '';
        if (state[state_name][beyond_caller.id].config.imports.notes) {
            contacts += (character.notes.allies) ? 'ALLIES:\n' + character.notes.allies + '\n\n' : '';
            contacts += (character.notes.organizations) ? 'ORGANIZATIONS:\n' + character.notes.organizations + '\n\n' : '';
            contacts += (character.notes.enemies) ? 'ENEMIES:\n' + character.notes.enemies : '';
            treasure += (character.notes.personalPossessions) ? 'PERSONAL POSSESSIONS:\n' + character.notes.personalPossessions + '\n\n' : '';
            treasure += (character.notes.otherHoldings) ? 'OTHER HOLDINGS:\n' + character.notes.otherHoldings : '';
            otherNotes += (character.notes.otherNotes) ? 'OTHER NOTES:\n' + character.notes.otherNotes + '\n\n' : '';
            otherNotes += (character.faith) ? 'FAITH: ' + character.faith + '\n' : '';
            otherNotes += (character.lifestyle) ? 'Lifestyle: ' + character.lifestyle.name + ' with a ' + character.lifestyle.cost + ' cost.' : '';
        }
        var background = '';
        if (character.background.definition != null)
            background = character.background.definition.name;
        if (background == '' && character.background.customBackground.name != null)
            background = character.background.customBackground.name;
        var other_attributes = {
            // Base Info
            'level': character.classes[0].level + multiclass_level,
            'experience': character.currentXp,
            'race': (character.race.baseName || character.race.fullName),
            'subrace': character.race.subRaceShortName,
            'background': background,
            'speed': speed,
            'hp_temp': character.temporaryHitPoints || '',
            'inspiration': (character.inspiration) ? 'on' : 0,
            'alignment': character.alignmentId == null ? '' : alignments[character.alignmentId],
            // Bio Info
            'age': (character.age || ''),
            'size': (character.size || ''),
            'height': (character.height || ''),
            'weight': (character.weight || ''),
            'eyes': (character.eyes || ''),
            'hair': (character.hair || ''),
            'skin': (character.skin || ''),
            'character_appearance': (character.traits.appearance || ''),
            // Ability Scores
            'strength_base': getTotalAbilityScore(character, 1),
            'dexterity_base': getTotalAbilityScore(character, 2),
            'constitution_base': getTotalAbilityScore(character, 3),
            'intelligence_base': getTotalAbilityScore(character, 4),
            'wisdom_base': getTotalAbilityScore(character, 5),
            'charisma_base': getTotalAbilityScore(character, 6),
            // Traits
            'personality_traits': character.traits.personalityTraits,
            'options-flag-personality': '0',
            'ideals': character.traits.ideals,
            'options-flag-ideals': '0',
            'bonds': character.traits.bonds,
            'options-flag-bonds': '0',
            'flaws': character.traits.flaws,
            'options-flag-flaws': '0',
            // currencies
            'cp': character.currencies.cp,
            'sp': character.currencies.sp,
            'gp': character.currencies.gp,
            'ep': character.currencies.ep,
            'pp': character.currencies.pp,
            // Notes/Bio
            'character_backstory': character.notes.backstory,
            'allies_and_organizations': contacts,
            'additional_feature_and_traits': otherNotes,
            'treasure': treasure,
            'global_save_mod_flag': 1,
            'global_skill_mod_flag': 1,
            'global_attack_mod_flag': 1,
            'global_damage_mod_flag': 1,
            'dtype': 'full',
            'init_tiebreaker': initTiebreaker ? '@{dexterity}/100' : '',
            'initiative_style': calculateInitiativeStyle(character),
            'initmod': ('initiative' in modifiers) ? modifiers.initiative.bonus : 0,
            'jack_of_all_trades': (jack_feature !== undefined) ? '@{jack}' : '0'
        };
        Object.assign(single_attributes, other_attributes);
        // these do not need to be written carefully, because they aren't looked at until the sheet is opened
        Object.assign(single_attributes, {
            // prevent upgrades, because they recalculate the class (saves etc.)
            'version': '2.5',
            // prevent character mancer from doing anything
            'l1mancer_status': 'complete',
            'mancer_cancel': 'on'
        });
        // check for bad attribute values and change them to empty strings, because these will cause a crash otherwise
        // ('Error: Firebase.update failed: First argument contains undefined in property 'current'')
        var illegal = [];
        for (scan in single_attributes) {
            if ((single_attributes[scan] === undefined) || (single_attributes[scan] === null)) {
                single_attributes[scan] = '';
                illegal.push(scan);
            }
        }
        for (scan in repeating_attributes) {
            if ((repeating_attributes[scan] === undefined) || (repeating_attributes[scan] === null)) {
                repeating_attributes[scan] = '';
                illegal.push(scan);
            }
        }
        if (illegal.length > 0) {
            log("beyond: errors during import: the following imported attributes had undefined or null values: " + illegal);
        }
        // make work queue
        var items = createSingleWriteQueue(single_attributes);
        processItem(character, items, single_attributes, repeating_attributes, total_level);
    });
    var calculateInitiativeStyle = function (character) {
        var init_mods = getObjects(character.modifiers, 'subType', 'initiative');
        var initadv = init_mods.some(function (im) { return im.type == 'advantage'; });
        var initdis = init_mods.some(function (im) { return im.type == 'disadvantage'; });
        if (initadv && !initdis) {
            return '{@{d20},@{d20}}kh1';
        }
        if (!initadv && initdis) {
            return '{@{d20},@{d20}}kl1';
        }
        return '@{d20}';
    };
    var updateProficiency = function (modifiers, input, proficiency_level) {
        var attribute_bases = [];
        switch (input.subType) {
            case 'ability-checks':
                attribute_bases = all_skills;
                break;
            case 'strength-ability-checks':
                attribute_bases = strength_skills;
                break;
            case 'dexterity-ability-checks':
                attribute_bases = dexterity_skills;
                break;
            case 'intelligence-ability-checks':
                attribute_bases = intelligence_skills;
                break;
            case 'wisdom-ability-checks':
                attribute_bases = wisdom_skills;
                break;
            case 'charisma-ability-checks':
                attribute_bases = charisma_skills;
                break;
            case 'saving-throws':
                attribute_bases = saving_throws;
                break;
            case 'strength-saving-throws':
            case 'dexterity-saving-throws':
            case 'constitution-saving-throws':
            case 'intelligence-saving-throws':
            case 'wisdom-saving-throws':
            case 'charisma-saving-throws':
                attribute_bases = [input.subType.replace('-saving-throws', '_save')];
                break;
            default:
                attribute_bases = [input.subType.replace(/-/g, '_')];
                break;
        }
        for (var _i = 0, attribute_bases_1 = attribute_bases; _i < attribute_bases_1.length; _i++) {
            var attribute_base = attribute_bases_1[_i];
            if (modifiers[attribute_base] === undefined) {
                log("beyond: modifier '" + attribute_base + "' profiency set to " + proficiency_level);
                modifiers[attribute_base] = { bonus: 0, proficiency: proficiency_level, friendly: input.friendlySubtypeName };
                continue;
            }
            else {
                if (proficiency_level > modifiers[attribute_base].proficiency) {
                    // store the maximum proficiency level
                    log("beyond: modifier '" + attribute_base + "' profiency increased to " + proficiency_level);
                    modifiers[attribute_base].proficiency = proficiency_level;
                }
            }
        }
    };
    var createUnarmoredDefense = function (repeating_attributes, character, total_level, hasArmor) {
        // If character has unarmored defense, add it to the inventory, so a player can enable/disable it.
        var unarmored = getObjects(character.modifiers, 'subType', 'unarmored-armor-class', ['item']);
        if (unarmored.length < 1) {
            return;
        }
        var x = 0;
        var _loop_1 = function (ua) {
            if (ua.type != 'set') {
                return { value: void 0 };
            }
            if (ua.value == null) {
                ua.value = Math.floor((getTotalAbilityScore(character, ua.statId) - 10) / 2);
            }
            var row = getRepeatingRowIds('inventory', 'itemname', 'Unarmored Defense')[x];
            var name_1 = 'Unarmored Defense';
            var modifiers = '';
            // Label the unarmored armor class based on the feature it originates from
            character.classes.forEach(function (charClass) {
                charClass.definition.classFeatures.filter(function (cF) { return cF.id == ua.componentId; }).forEach(function (cF) {
                    name_1 = cF.name;
                });
                if (charClass.subclassDefinition != null) {
                    charClass.subclassDefinition.classFeatures.filter(function (cF) { return cF.id == ua.componentId; }).forEach(function (cF) {
                        name_1 = cF.name;
                    });
                }
            });
            character.race.racialTraits.filter(function (rT) { return rT.id == ua.componentId; }).forEach(function (rT) {
                name_1 = rT.name;
            });
            var integrated = false;
            if (ua.componentTypeId == 306912077) { // Integrated Protection (Armor Type Option)
                row = getRepeatingRowIds('inventory', 'itemname', 'Integrated Protection', 0);
                name_1 = 'Integrated Protection';
                integrated = true;
                if (ua.value == 6) {
                    modifiers = 'Item Type: Heavy Armor';
                    ua.value = 10 + parseInt(ua.value);
                }
                else if (ua.value == 3) {
                    modifiers == 'Item Type: Medium Armor';
                    ua.value = 10 + parseInt(ua.value);
                }
                ua.value += Math.floor((total_level - 1) / 4) + 2;
            }
            modifiers += (modifiers == '' ? '' : ', ') + 'AC: ' + ua.value;
            var attributes = {};
            attributes["repeating_inventory_" + row + "_itemname"] = name_1;
            attributes["repeating_inventory_" + row + "_equipped"] = (integrated || !hasArmor) ? '1' : '0';
            attributes["repeating_inventory_" + row + "_itemcount"] = 1;
            attributes["repeating_inventory_" + row + "_itemmodifiers"] = modifiers;
            Object.assign(repeating_attributes, attributes);
            x++;
        };
        for (var _i = 0, unarmored_1 = unarmored; _i < unarmored_1.length; _i++) {
            var ua = unarmored_1[_i];
            var state_1 = _loop_1(ua);
            if (typeof state_1 === "object")
                return state_1.value;
        }
    };
    var createSingleWriteQueue = function (attributes) {
        // this is the list of trigger attributes that will trigger class recalculation, as of 5e OGL 2.5 October 2018
        // (see on... handler that calls update_class in sheet html)
        // these are written first and individually, since they trigger a lot of changes
        var class_update_triggers = [
            'class',
            'custom_class',
            'cust_classname',
            'cust_hitdietype',
            'cust_spellcasting_ability',
            'cust_spellslots',
            'cust_strength_save_prof',
            'cust_dexterity_save_prof',
            'cust_constitution_save_prof',
            'cust_intelligence_save_prof',
            'cust_wisdom_save_prof',
            'cust_charisma_save_prof',
            'subclass',
            'multiclass1',
            'multiclass1_subclass',
            'multiclass2',
            'multiclass2_subclass',
            'multiclass3',
            'multiclass3_subclass'
        ];
        // set class first, everything else is alphabetical
        var classAttribute = class_update_triggers.shift();
        class_update_triggers.sort();
        class_update_triggers.unshift(classAttribute);
        // write in deterministic order (class first, then alphabetical)
        var items = [];
        for (var _i = 0, class_update_triggers_1 = class_update_triggers; _i < class_update_triggers_1.length; _i++) {
            trigger = class_update_triggers_1[_i];
            var value = attributes[trigger];
            if ((value === undefined) || (value === null)) {
                continue;
            }
            items.push([trigger, value]);
            log('beyond: trigger attribute ' + trigger);
            delete attributes[trigger];
        }
        return items;
    };
    var processItem = function (character, items, single_attributes, repeating_attributes, total_level) {
        var nextItem = items.shift();
        // check if the write queue was empty
        if (nextItem === undefined) {
            // do one giant write for all the single attributes, before we create a bunch of attacks 
            // and other things that depend on stat changes
            setAttrs(object.id, single_attributes);
            // do one giant write for all the repeating attributes
            setAttrs(object.id, repeating_attributes);
            // configure HP, because we now know our CON score
            loadHitPoints(character, total_level);
            if (class_spells.length > 0 && state[state_name][beyond_caller.id].config.imports.class_spells) {
                sendChat(script_name, '<div style="' + style + '">Import of <b>' + character.name + '</b> is almost ready.<br />Class spells are being imported over time.</div>', null, { noarchive: true });
                // this is really just artificially asynchronous, we are not currently using a worker, so it will happen as soon as we return
                onSheetWorkerCompleted(function () {
                    importSpells(character, class_spells);
                });
            }
            else {
                reportReady(character);
            }
            return;
        }
        // create empty attribute if not already there
        var nextAttribute = findObjs({ type: 'attribute', characterid: object.id, name: nextItem[0] })[0];
        nextAttribute = nextAttribute || createObj('attribute', { name: nextItem[0], characterid: object.id });
        // async load next item
        onSheetWorkerCompleted(function () {
            processItem(character, items, single_attributes, repeating_attributes, total_level);
        });
        log('beyond: ' + nextItem[0] + " = " + String(nextItem[1]));
        nextAttribute.setWithWorker({ current: nextItem[1] });
    };
    var loadHitPoints = function (character, total_level) {
        var hp = Math.floor(character.baseHitPoints + (total_level * Math.floor(((getTotalAbilityScore(character, 3) - 10) / 2))));
        // scan for modifiers except those in items, because we will get those bonuses from the items once they are imported
        // NOTE: this also handles the problem that Beyond includes modifiers from items that are not currently equipped/attuned
        var hpLevelBonus = getObjects(character.modifiers, 'subType', 'hit-points-per-level', ['item']).forEach(function (bonus) {
            var level = total_level;
            // Ensure that per-level bonuses from class features only apply for the levels of the class and not the character's total level.
            var charClasses = character.classes.filter(function (charClass) {
                var output = charClass.definition.classFeatures.findIndex(function (cF) { return cF.id == bonus.componentId; }) >= 0;
                if (charClass.subclassDefinition != null) {
                    output = output || charClass.subclassDefinition.classFeatures.findIndex(function (cF) { return cF.id == bonus.componentId; }) >= 0;
                }
                return output;
            });
            if (charClasses.length > 0) {
                level = 0;
                charClasses.forEach(function (charClass) {
                    level += parseInt(charClass.level);
                });
            }
            hp += level * bonus.value;
        });
        var hpAttr = findObjs({ type: 'attribute', characterid: object.id, name: 'hp' })[0];
        if (hpAttr == null) {
            createObj('attribute', {
                characterid: object.id,
                name: 'hp',
                current: hp,
                max: hp
            });
        }
        else {
            hpAttr.set('current', hp);
            hpAttr.set('max', hp);
        }
    };
    var getPactMagicSlots = function (level) {
        switch (level) {
            case 1:
                return 1;
                break;
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
            case 8:
            case 9:
            case 10:
                return 2;
                break;
            case 11:
            case 12:
            case 13:
            case 14:
            case 15:
            case 16:
                return 3;
                break;
            default:
                return 4;
                break;
        }
        return 0;
    };
    var reportReady = function (character) {
        // TODO this is nonsense.  we aren't actually done importing, because notifications in the character sheet are firing for quite a while
        // after we finish changing things (especially on first import) and we have no way (?) to wait for it to be done.   These are not sheet workers
        // on which we can wait.
        sendChat(script_name, '<div style="' + style + '">Import of <b>' + character.name + '</b> is ready at https://journal.roll20.net/character/' + object.id + '</div>', null, { noarchive: true });
    };
    var getFeatureSpells = function (character, traitId, featureType) {
        var spellsArr = [];
        if (character.spells[featureType] == null)
            return spellsArr;
        if (character.spells[featureType].length > 0) {
            var options = getObjects(character.options[featureType], 'componentId', traitId);
            for (var i = 0; i < options.length; i++) {
                var spells = getObjects(character.spells[featureType], 'componentId', options[i].definition.id);
                for (var j = 0; j < spells.length; j++) {
                    spellsArr.push(spells[j]);
                }
            }
        }
        return spellsArr;
    };
    var importSpells = function (character, spells) {
        // set this to whatever number of items you can process at once
        // return attributes;
        spellAttacks = [];
        var chunk = 5;
        var index = 0;
        function doChunk() {
            var cnt = chunk;
            var attributes = {};
            while (cnt-- && index < spells.length) {
                Object.assign(attributes, importSpell(character, spells, index, true));
                ++index;
            }
            setAttrs(object.id, attributes);
            if (index < spells.length) {
                // set Timeout for async iteration
                onSheetWorkerCompleted(doChunk);
            }
            else {
                log('beyond: spells imported, updating spell attack proficiency');
                onSheetWorkerCompleted(function () {
                    updateSpellAttackProf(character, 0);
                });
            }
        }
        doChunk();
    };
    var updateSpellAttackProf = function (character, i) {
        if (spellAttacks[i] == null) {
            reportReady(character);
            return;
        }
        // This should work... but it doesn't.
        /*let atkOutputAttr = findObjs({ type: 'attribute', characterid: object.id, name: "repeating_spell-"+spellAttacks[i].level+"_"+spellAttacks[i].id+"_spelloutput" })[0];
         atkOutputAttr = atkOutputAttr || createObj('attribute', { name: "repeating_spell-"+spellAttacks[i].level+"_"+spellAttacks[i].id+"_spelloutput", characterid: object.id});
         onSheetWorkerCompleted(function() {
         updateSpellAttackProf(character, ++i);
         });
         log('beyond: ' + "repeating_spell-"+spellAttacks[i].level+"_"+spellAttacks[i].id+"_spelloutput" + " = " + 'ATTACK');
         atkOutputAttr.setWithWorker({ current: 'ATTACK' });*/
        var atkIdAttr = findObjs({ type: 'attribute', characterid: object.id, name: 'repeating_spell-' + spellAttacks[i].level + '_' + spellAttacks[i].id + '_spellattackid' })[0];
        if (atkIdAttr != null) {
            var atkId = atkIdAttr.get('current');
            var atkProfAttr = findObjs({ type: 'attribute', characterid: object.id, name: 'repeating_attack_' + atkId + '_atkprofflag' })[0];
            atkProfAttr = atkProfAttr || createObj('attribute', { name: 'repeating_attack_' + atkId + '_atkprofflag', characterid: object.id });
            // async load next item
            onSheetWorkerCompleted(function () {
                updateSpellAttackProf(character, ++i);
            });
            log('beyond: ' + 'repeating_attack_' + atkId + '_atkprofflag' + " = " + '(@{pb})');
            atkProfAttr.setWithWorker({ current: '(@{pb})' });
        }
        else {
            reportReady(character);
        }
    };
    var importSpell = function (character, spells, index, addAttack) {
        var spell = spells[index];
        var matchingSpells = spells.filter(function (spellAttributes) {
            return spellAttributes.definition.name == spell.definition.name;
        });
        var level = (spell.definition.level === 0) ? 'cantrip' : spell.definition.level.toString();
        var row = getRepeatingRowIds('spell-' + level, 'spellname', spell.definition.name, matchingSpells.findIndex(function (sA) { return sA.id == spell.id && sA.spellCastingAbility == spell.spellCastingAbility; }));
        spell.castingTime = {
            castingTimeInterval: spell.activation.activationTime
        };
        if (spell.activation.activationType == 1)
            spell.castingTime.castingTimeUnit = 'Action';
        if (spell.activation.activationType == 3)
            spell.castingTime.castingTimeUnit = 'Bonus Action';
        if (spell.activation.activationType == 4)
            spell.castingTime.castingTimeUnit = 'Reaction';
        if (spell.activation.activationType == 5)
            spell.castingTime.castingTimeUnit = 'Second' + (spell.activation.activationTime != 1 ? 's' : '');
        if (spell.activation.activationType == 6)
            spell.castingTime.castingTimeUnit = 'Minute' + (spell.activation.activationTime != 1 ? 's' : '');
        if (spell.activation.activationType == 7)
            spell.castingTime.castingTimeUnit = 'Hour' + (spell.activation.activationTime != 1 ? 's' : '');
        if (spell.activation.activationType == 8)
            spell.castingTime.castingTimeUnit = 'Day' + (spell.activation.activationTime != 1 ? 's' : '');
        var attributes = {};
        attributes["repeating_spell-" + level + "_" + row + "_spellprepared"] = (spell.prepared || spell.alwaysPrepared) ? '1' : '0';
        attributes["repeating_spell-" + level + "_" + row + "_spellname"] = spell.definition.name;
        attributes["repeating_spell-" + level + "_" + row + "_spelllevel"] = level;
        attributes["repeating_spell-" + level + "_" + row + "_spellschool"] = spell.definition.school.toLowerCase();
        attributes["repeating_spell-" + level + "_" + row + "_spellritual"] = (spell.ritual) ? '{{ritual=1}}' : '0';
        attributes["repeating_spell-" + level + "_" + row + "_spellcastingtime"] = spell.castingTime.castingTimeInterval + ' ' + spell.castingTime.castingTimeUnit;
        attributes["repeating_spell-" + level + "_" + row + "_spellrange"] = (spell.definition.range.origin === 'Ranged') ? spell.definition.range.rangeValue + 'ft.' : spell.definition.range.origin;
        attributes["repeating_spell-" + level + "_" + row + "_options-flag"] = '0';
        attributes["repeating_spell-" + level + "_" + row + "_spellritual"] = (spell.definition.ritual) ? '1' : '0';
        attributes["repeating_spell-" + level + "_" + row + "_spellconcentration"] = (spell.definition.concentration) ? '{{concentration=1}}' : '0';
        attributes["repeating_spell-" + level + "_" + row + "_spellduration"] = (spell.definition.duration.durationUnit !== null) ? spell.definition.duration.durationInterval + ' ' + spell.definition.duration.durationUnit : spell.definition.duration.durationType;
        attributes["repeating_spell-" + level + "_" + row + "_spell_ability"] = spell.spellCastingAbility == null ? '0*' : '@{' + _ABILITY[spell.spellCastingAbility] + '_mod}+';
        var descriptions = spell.definition.description.split('At Higher Levels. ');
        attributes["repeating_spell-" + level + "_" + row + "_spelldescription"] = replaceChars(descriptions[0]);
        attributes["repeating_spell-" + level + "_" + row + "_spellathigherlevels"] = (descriptions.length > 1) ? replaceChars(descriptions[1]) : '';
        var components = spell.definition.components;
        attributes["repeating_spell-" + level + "_" + row + "_spellcomp_v"] = (components.includes(1)) ? '{{v=1}}' : '0';
        attributes["repeating_spell-" + level + "_" + row + "_spellcomp_s"] = (components.includes(2)) ? '{{s=1}}' : '0';
        attributes["repeating_spell-" + level + "_" + row + "_spellcomp_m"] = (components.includes(3)) ? '{{m=1}}' : '0';
        attributes["repeating_spell-" + level + "_" + row + "_spellcomp_materials"] = (components.includes(3)) ? replaceChars(spell.definition.componentsDescription) : '';
        var healing = getObjects(spell, 'subType', 'hit-points');
        if (healing.length !== 0) {
            healing = healing[0];
            if (healing.type == 'bonus') {
                var bonus = 0;
                if (getObjects(character.classes, 'name', 'Disciple of Life').length > 0) {
                    bonus += (2 + parseInt(spell.definition.level));
                }
                attributes["repeating_spell-" + level + "_" + row + "_spellattack"] = 'None';
                attributes["repeating_spell-" + level + "_" + row + "_spellsave"] = '';
                attributes["repeating_spell-" + level + "_" + row + "_spelldamage"] = '';
                attributes["repeating_spell-" + level + "_" + row + "_spelldamagetype"] = '';
                if (healing.die.diceString != null) {
                    attributes["repeating_spell-" + level + "_" + row + "_spellhealing"] = healing.die.diceString + '+' + (parseInt(healing.die.fixedValue == null ? 0 : healing.die.fixedValue) + bonus);
                }
                else if (healing.die.fixedValue != null) {
                    attributes["repeating_spell-" + level + "_" + row + "_spellhealing"] = (parseInt(healing.die.fixedValue) + bonus) + 'd1';
                }
                attributes["repeating_spell-" + level + "_" + row + "_spelldmgmod"] = healing.usePrimaryStat ? 'Yes' : '0';
                bonus = 0;
                if (getObjects(character.classes, 'name', 'Disciple of Life').length > 0) {
                    bonus += 1;
                }
                var ahl = spell.definition.atHigherLevels.higherLevelDefinitions;
                for (var i in ahl) {
                    if (ahl[i].dice != null) {
                        if (ahl[i].dice.diceValue != null) {
                            attributes["repeating_spell-" + level + "_" + row + "_spellhldie"] = ahl[i].dice.diceCount;
                            attributes["repeating_spell-" + level + "_" + row + "_spellhldietype"] = 'd' + ahl[i].dice.diceValue;
                        }
                        else {
                            attributes["repeating_spell-" + level + "_" + row + "_spellhldie"] = '0';
                            attributes["repeating_spell-" + level + "_" + row + "_spellhldietype"] = 'd4';
                        }
                        attributes["repeating_spell-" + level + "_" + row + "_spellhlbonus"] = parseInt(ahl[i].dice.fixedValue) + bonus;
                    }
                }
                if (healing.hasOwnProperty('atHigherLevels') && healing.atHigherLevels.scaleType === 'spellscale') {
                    if (healing.die.diceValue != null) {
                        attributes["repeating_spell-" + level + "_" + row + "_spellhldie"] = healing.die.diceCount;
                        attributes["repeating_spell-" + level + "_" + row + "_spellhldietype"] = 'd' + healing.die.diceValue;
                    }
                    else {
                        attributes["repeating_spell-" + level + "_" + row + "_spellhldie"] = '0';
                        attributes["repeating_spell-" + level + "_" + row + "_spellhldietype"] = 'd4';
                    }
                    if (healing.die.fixedValue == null)
                        healing.die.fixedValue = 0;
                    attributes["repeating_spell-" + level + "_" + row + "_spellhlbonus"] = parseInt(healing.die.fixedValue) + bonus;
                }
                if (addAttack) {
                    attributes["repeating_spell-" + level + "_" + row + "_spelloutput"] = 'ATTACK';
                }
            }
        }
        // Damage/Attack
        var damages = getObjects(spell, 'type', 'damage');
        if (damages.length !== 0 && (spell.definition.attackType !== "" || spell.definition.saveDcStat !== null)) {
            var doDamage_1 = false;
            damages.forEach(function (damage, i) {
                if (damage.die.diceString != null) {
                    var damageNumber = (i === 0) ? '' : 2;
                    attributes["repeating_spell-" + level + "_" + row + "_spelldamage" + damageNumber] = damage.die.diceString;
                    attributes["repeating_spell-" + level + "_" + row + "_spelldamagetype" + damageNumber] = damage.friendlySubtypeName;
                    if (!doDamage_1) {
                        doDamage_1 = true;
                        var attackType = ['None', 'Melee', 'Ranged'];
                        attributes["repeating_spell-" + level + "_" + row + "_spellattack"] = attackType[spell.definition.attackType == null ? 0 : spell.definition.attackType];
                        attributes["repeating_spell-" + level + "_" + row + "_spellsave"] = (spell.definition.saveDcAbilityId == null) ? '' : ucFirst(_ABILITY[_ABILITIES[spell.definition.saveDcAbilityId]]);
                        var hlDiceCount = '';
                        var hlDiceValue = '';
                        if (damage.hasOwnProperty('atHigherLevels')) {
                            var ahl = spell.definition.atHigherLevels.higherLevelDefinitions;
                            if (spell.definition.level == 0 && ahl.length == 0) {
                                if (spell.definition.atHigherLevels.scaleType == 'characterlevel') {
                                    attributes["repeating_spell-" + level + "_" + row + "_spell_damage_progression"] = 'Cantrip Dice';
                                }
                            }
                            else if (spell.definition.level > 0) {
                                for (var i_2 in ahl) {
                                    if (ahl[i_2].dice == null)
                                        continue;
                                    attributes["repeating_spell-" + level + "_" + row + "_spellhldie"] = ahl[i_2].dice.diceCount;
                                    attributes["repeating_spell-" + level + "_" + row + "_spellhldietype"] = 'd' + ahl[i_2].dice.diceValue;
                                    hlDiceCount = ahl[i_2].dice.diceCount;
                                    hlDiceValue = ahl[i_2].dice.diceValue;
                                }
                                if (damage.atHigherLevels.scaleType === 'spellscale') {
                                    attributes["repeating_spell-" + level + "_" + row + "_spellhldie"] = '1';
                                    attributes["repeating_spell-" + level + "_" + row + "_spellhldietype"] = 'd' + damage.die.diceValue;
                                    hlDiceCount = '1';
                                    hlDiceValue = damage.die.diceValue;
                                }
                            }
                        }
                    }
                }
            });
            if (addAttack && doDamage_1) {
                // attributes["repeating_spell-"+level+"_"+row+"_spelloutput"] = 'SPELLCARD';
                attributes["repeating_spell-" + level + "_" + row + "_spelloutput"] = 'ATTACK';
                spellAttacks.push({ level: level, id: row });
            }
        }
        if (spellTargetInAttacks) {
            var restrictions = calculateRestrictionsComment(damages.concat(healing));
            if (restrictions != null) {
                attributes["repeating_spell-" + level + "_" + row + "_spelltarget"] = replaceChars(restrictions);
                if (attributes["repeating_spell-" + level + "_" + row + "_spelloutput"] == 'ATTACK') {
                    attributes["repeating_spell-" + level + "_" + row + "_includedesc"] = 'partial';
                }
            }
        }
        return attributes;
    };
    var blankIfNull = function (input) {
        return (input === null) ? "" : input;
    };
    // calculates spell restriction comment from damage and hit-points modifiers, as follows:
    //
    // as type selection (different restrictions):
    // (friendlySubtypeName || friendlyTypeName) : restriction\n
    // (friendlySubtypeName || friendlyTypeName) : restriction\n
    // ...
    //
    // as general constraint (single modifier with a restriction):
    // restriction 
    //
    // as multiple choice (same restriction multiple modifiers):
    // restriction
    //
    // NOTE: this function is very defensive about inputs because some entries from beyond have
    // null values and others have empty strings
    var calculateRestrictionsComment = function (modifiers) {
        if (!modifiers) {
            return null;
        }
        if (modifiers.length < 1) {
            return null;
        }
        var restrictions = new Set();
        var first = blankIfNull(modifiers[0].restriction);
        var multiple = false;
        modifiers.forEach(function (modifier, i) {
            var current = blankIfNull(modifier.restriction);
            if (current != first) {
                // even if some types have null restrictions and others have non-blank ones, this still counts as choices
                multiple = true;
            }
            if (current != '') {
                // record all unique combinations
                restrictions.add((modifier.friendlySubtypeName || modifier.friendlyTypeName) + ": " + current);
            }
        });
        var lines = __spreadArrays(restrictions);
        if (multiple && (lines.length > 0)) {
            // NOTE: it is possible to have only one line here because the other choices are blank or null
            return lines.join('\n');
        }
        if (first == '') {
            // convert back to null if all we had was a blank (or null) restriction
            return null;
        }
        return first;
    };
    var ucFirst = function (string) {
        if (string == null)
            return string;
        return string.charAt(0).toUpperCase() + string.slice(1);
    };
    var sendConfigMenu = function (player, first) {
        var playerid = player.id;
        var prefix = (state[state_name][playerid].config.prefix !== '') ? state[state_name][playerid].config.prefix : '[NONE]';
        var prefixButton = makeButton(prefix, '!beyond --config prefix|?{Prefix}', buttonStyle);
        var suffix = (state[state_name][playerid].config.suffix !== '') ? state[state_name][playerid].config.suffix : '[NONE]';
        var suffixButton = makeButton(suffix, '!beyond --config suffix|?{Suffix}', buttonStyle);
        var overwriteButton = makeButton(state[state_name][playerid].config.overwrite, '!beyond --config overwrite|' + !state[state_name][playerid].config.overwrite, buttonStyle);
        var debugButton = makeButton(state[state_name][playerid].config.debug, '!beyond --config debug|' + !state[state_name][playerid].config.debug, buttonStyle);
        // let silentSpellsButton = makeButton(state[state_name][playerid].config.silentSpells, '!beyond --config silentSpells|'+!state[state_name][playerid].config.silentSpells, buttonStyle);
        var listItems = [
            '<span style="float: left; margin-top: 6px;">Overwrite:</span> ' + overwriteButton + '<br /><small style="clear: both; display: inherit;">This option will overwrite an existing character sheet with a matching character name. I recommend making a backup copy just in case.</small>',
            '<span style="float: left; margin-top: 6px;">Prefix:</span> ' + prefixButton,
            '<span style="float: left; margin-top: 6px;">Suffix:</span> ' + suffixButton,
            '<span style="float: left; margin-top: 6px;">Debug:</span> ' + debugButton,
        ];
        var list = '<b>Importer</b>' + makeList(listItems, 'overflow: hidden; list-style: none; padding: 0; margin: 0;', 'overflow: hidden; margin-top: 5px;');
        var languageGroupingButton = makeButton(state[state_name][playerid].config.languageGrouping, '!beyond --config languageGrouping|' + !state[state_name][playerid].config.languageGrouping, buttonStyle);
        var initTieBreakerButton = makeButton(state[state_name][playerid].config.initTieBreaker, '!beyond --config initTieBreaker|' + !state[state_name][playerid].config.initTieBreaker, buttonStyle);
        var spellTargetInAttacksButton = makeButton(state[state_name][playerid].config.spellTargetInAttacks, '!beyond --config spellTargetInAttacks|' + !state[state_name][playerid].config.spellTargetInAttacks, buttonStyle);
        var inPlayerJournalsButton = makeButton(player.get('displayname'), '', buttonStyle);
        var controlledByButton = makeButton(player.get('displayname'), '', buttonStyle);
        if (playerIsGM(playerid)) {
            var players = '';
            var playerObjects = findObjs({
                _type: "player"
            });
            for (var i = 0; i < playerObjects.length; i++) {
                players += '|' + playerObjects[i]['attributes']['_displayname'] + ',' + playerObjects[i].id;
            }
            var ipj = state[state_name][playerid].config.inplayerjournals == '' ? '[NONE]' : state[state_name][playerid].config.inplayerjournals;
            if (ipj != '[NONE]' && ipj != 'all')
                ipj = getObj('player', ipj).get('_displayname');
            inPlayerJournalsButton = makeButton(ipj, '!beyond --config inplayerjournals|?{Player|None,[NONE]|All Players,all' + players + '}', buttonStyle);
            var cb = state[state_name][playerid].config.controlledby == '' ? '[NONE]' : state[state_name][playerid].config.controlledby;
            if (cb != '[NONE]' && cb != 'all')
                cb = getObj('player', cb).get('_displayname');
            controlledByButton = makeButton(cb, '!beyond --config controlledby|?{Player|None,[NONE]|All Players,all' + players + '}', buttonStyle);
        }
        var sheetListItems = [
            '<span style="float: left; margin-top: 6px;">In Player Journal:</span> ' + inPlayerJournalsButton,
            '<span style="float: left; margin-top: 6px;">Player Control Permission:</span> ' + controlledByButton,
            '<span style="float: left; margin-top: 6px;">Language Grouping:</span> ' + languageGroupingButton,
            '<span style="float: left; margin-top: 6px;">Initiative Tie Breaker:</span> ' + initTieBreakerButton,
            '<span style="float: left; margin-top: 6px;">Spell Info in Attacks:</span> ' + spellTargetInAttacksButton
        ];
        var sheetList = '<hr><b>Character Sheet</b>' + makeList(sheetListItems, 'overflow: hidden; list-style: none; padding: 0; margin: 0;', 'overflow: hidden; margin-top: 5px;');
        var debug = '';
        if (state[state_name][playerid].config.debug) {
            var debugListItems = [];
            for (var importItemName in state[state_name][playerid].config.imports) {
                var button = makeButton(state[state_name][playerid].config.imports[importItemName], '!beyond --imports ' + importItemName + '|' + !state[state_name][playerid].config.imports[importItemName], buttonStyle);
                debugListItems.push('<span style="float: left">' + importItemName + ':</span> ' + button);
            }
            debug += '<hr><b>Imports</b>' + makeList(debugListItems, 'overflow: hidden; list-style: none; padding: 0; margin: 0;', 'overflow: hidden; margin-top: 5px;');
        }
        var resetButton = makeButton('Reset', '!beyond --reset', buttonStyle + ' margin: auto; width: 90%; display: block; float: none;');
        var title_text = (first) ? script_name + ' First Time Setup' : script_name + ' Config';
        var text = '<div style="' + style + '">' + makeTitle(title_text) + list + sheetList + debug + '<hr>' + resetButton + '</div>';
        sendChat(script_name, '/w "' + player.get('displayname') + '" ' + text, null, { noarchive: true });
    };
    var sendHelpMenu = function (player) {
        // let configButton = makeButton('Config', '!beyond --config', buttonStyle+' margin: auto; width: 90%; display: block; float: none;');
        var listItems = [
            '<span style="text-decoration: underline; font-size: 90%;">!beyond --help</span><br />Shows this menu.',
            '<span style="text-decoration: underline; font-size: 90%;">!beyond --config</span><br />Shows the configuration menu. (GM only)',
            '<span style="text-decoration: underline; font-size: 90%;">!beyond --import [CHARACTER JSON]</span><br />Imports a character from <a href="http://www.dndbeyond.com" target="_blank">D&D Beyond</a>.',
        ];
        var command_list = makeList(listItems, 'list-style: none; padding: 0; margin: 0;');
        var text = '<div style="' + style + '">';
        text += makeTitle(script_name + ' Help');
        text += '<p>Go to a character on <a href="http://www.dndbeyond.com" target="_blank">D&D Beyond</a>, and put `/json` behind the link. Copy the full contents of this page and paste it behind the command `!beyond --import`.</p>';
        text += '<p>For more information take a look at my <a style="text-decoration: underline" href="https://github.com/sillvva/Roll20-API-Scripts/blob/master/5eOGL-DND-Beyond-Importer/BeyondImporter.js" target="_blank">Github</a> repository.</p>';
        text += '<hr>';
        text += '<b>Commands:</b>' + command_list;
        // text += '<hr>';
        // text += configButton;
        text += '</div>';
        sendChat(script_name, '/w "' + player.get('displayname') + '" ' + text, null, { noarchive: true });
    };
    var makeTitle = function (title) {
        return '<h3 style="margin-bottom: 10px;">' + title + '</h3>';
    };
    var makeButton = function (title, href, style) {
        return '<a style="' + style + '" href="' + href + '">' + title + '</a>';
    };
    var makeList = function (items, listStyle, itemStyle) {
        var list = '<ul style="' + listStyle + '">';
        items.forEach(function (item) {
            list += '<li style="' + itemStyle + '">' + item + '</li>';
        });
        list += '</ul>';
        return list;
    };
    var replaceChars = function (text) {
        text = text.replace('\&rsquo\;', '\'').replace('\&mdash\;', '—').replace('\ \;', ' ').replace('\&hellip\;', '…');
        text = text.replace('\&nbsp\;', ' ');
        text = text.replace('\û\;', 'û').replace('’', '\'').replace(' ', ' ');
        text = text.replace(/<li[^>]+>/gi, '• ').replace(/<\/li>/gi, '');
        text = text.replace(/\r\n(\r\n)+/gm, '\r\n');
        return text;
    };
    var getRepeatingRowIds = function (section, attribute, matchValue, index) {
        var ids = [];
        if (state[state_name][beyond_caller.id].config.overwrite) {
            var matches = findObjs({ type: 'attribute', characterid: object.id })
                .filter(function (attr) {
                return attr.get('name').indexOf('repeating_' + section) !== -1 && attr.get('name').indexOf(attribute) !== -1 && attr.get('current') == matchValue;
            });
            for (var i in matches) {
                var row = matches[i].get('name').replace('repeating_' + section + '_', '').replace('_' + attribute, '');
                ids.push(row);
            }
            if (ids.length == 0)
                ids.push(generateRowID());
        }
        else
            ids.push(generateRowID());
        if (index == null)
            return ids;
        else
            return ids[index] == null && index >= 0 ? generateRowID() : ids[index];
    };
    var createRepeatingTrait = function (object, trait, options) {
        options = options || {};
        var opts = {
            index: 0,
            itemid: ''
        };
        Object.assign(opts, options);
        var row = getRepeatingRowIds('traits', 'name', trait.name, opts.index);
        var attributes = {};
        attributes["repeating_traits_" + row + "_name"] = trait.name;
        attributes["repeating_traits_" + row + "_source"] = trait.source;
        attributes["repeating_traits_" + row + "_source_type"] = trait.source_type;
        attributes["repeating_traits_" + row + "_description"] = replaceChars(trait.description);
        attributes["repeating_traits_" + row + "_options-flag"] = '0';
        return attributes;
    };
    var createRepeatingAttack = function (object, attack, options) {
        options = options || {};
        var opts = {
            index: 0,
            itemid: ''
        };
        Object.assign(opts, options);
        var attackrow = getRepeatingRowIds('attack', 'atkname', attack.name, opts.index);
        var attackattributes = {};
        attackattributes["repeating_attack_" + attackrow + "_options-flag"] = '0';
        attackattributes["repeating_attack_" + attackrow + "_atkname"] = attack.name;
        attackattributes["repeating_attack_" + attackrow + "_itemid"] = opts.itemid;
        attackattributes["repeating_attack_" + attackrow + "_atkflag"] = '{{attack=1}}';
        attackattributes["repeating_attack_" + attackrow + "_atkattr_base"] = '@{' + attack.attack.attribute + '_mod}';
        attackattributes["repeating_attack_" + attackrow + "_atkprofflag"] = '(@{pb})';
        attackattributes["repeating_attack_" + attackrow + "_atkmagic"] = attack.magic;
        attackattributes["repeating_attack_" + attackrow + "_atkrange"] = attack.range;
        attackattributes["repeating_attack_" + attackrow + "_atkmod"] = attack.attack.mod == null ? '' : attack.attack.mod;
        attackattributes["repeating_attack_" + attackrow + "_atkcritrange"] = attack.critrange == null ? '' : attack.critrange;
        attackattributes["repeating_attack_" + attackrow + "_dmgflag"] = '{{damage=1}} {{dmg1flag=1}}';
        attackattributes["repeating_attack_" + attackrow + "_dmgbase"] = typeof attack.damage.diceString == 'string' ? attack.damage.diceString + '' : '';
        attackattributes["repeating_attack_" + attackrow + "_dmgattr"] = (attack.damage.attribute === '0') ? '0' : '@{' + attack.damage.attribute + '_mod}';
        attackattributes["repeating_attack_" + attackrow + "_dmgtype"] = attack.damage.type;
        attackattributes["repeating_attack_" + attackrow + "_dmgcustcrit"] = attack.damage.diceString;
        attackattributes["repeating_attack_" + attackrow + "_dmgmod"] = attack.damage.mod == null ? '' : attack.damage.mod;
        if (attack.damage2 != null) {
            attackattributes["repeating_attack_" + attackrow + "_dmg2flag"] = '{{damage=1}} {{dmg2flag=1}}';
            attackattributes["repeating_attack_" + attackrow + "_dmg2base"] = attack.damage2.diceString;
            attackattributes["repeating_attack_" + attackrow + "_dmg2attr"] = (attack.damage2.attribute === '0') ? '0' : '@{' + attack.damage2.attribute + '_mod}';
            attackattributes["repeating_attack_" + attackrow + "_dmg2type"] = attack.damage2.type;
            attackattributes["repeating_attack_" + attackrow + "_dmg2custcrit"] = attack.damage2.diceString;
        }
        attackattributes["repeating_attack_" + attackrow + "_atk_desc"] = ''; //replaceChars(attack.description);
        return attackattributes;
    };
    var getTotalAbilityScore = function (character, scoreId) {
        var index = scoreId - 1;
        var base = (character.stats[index].value == null ? 10 : character.stats[index].value), bonus = (character.bonusStats[index].value == null ? 0 : character.bonusStats[index].value), override = (character.overrideStats[index].value == null ? 0 : character.overrideStats[index].value), total = base + bonus, modifiers = getObjects(character, '', _ABILITY[_ABILITIES[scoreId]] + "-score");
        if (override > 0)
            total = override;
        if (modifiers.length > 0) {
            var used_ids = [];
            for (var i = 0; i < modifiers.length; i++) {
                if (modifiers[i].type == 'bonus' && used_ids.indexOf(modifiers[i].id) == -1) {
                    total += modifiers[i].value;
                    used_ids.push(modifiers[i].id);
                }
            }
        }
        return total;
    };
    //return an array of objects according to key, value, or key and value matching, optionally ignoring objects in array of names
    var getObjects = function (obj, key, val, except) {
        except = except || [];
        var objects = [];
        for (var i in obj) {
            if (!obj.hasOwnProperty(i))
                continue;
            if (typeof obj[i] == 'object') {
                if (except.indexOf(i) != -1) {
                    continue;
                }
                objects = objects.concat(getObjects(obj[i], key, val));
            }
            else 
            //if key matches and value matches or if key matches and value is not passed (eliminating the case where key matches but passed value does not)
            if (i == key && obj[i] == val || i == key && val == '') { //
                objects.push(obj);
            }
            else if (obj[i] == val && key == '') {
                //only add if the object is not already in the array
                if (objects.lastIndexOf(obj) == -1) {
                    objects.push(obj);
                }
            }
        }
        return objects;
    };
    // Find an existing repeatable item with the same name, or generate new row ID
    var getOrMakeRowID = function (character, repeatPrefix, name) {
        // Get list of all of the character's attributes
        var attrObjs = findObjs({ _type: "attribute", _characterid: character.get("_id") });
        var i = 0;
        while (i < attrObjs.length) {
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
    };
    function generateUUID() {
        var uuidLength = 20;
        var validCharacters = "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";
        var chars = new Array(uuidLength);
        for (var i = 0; i < uuidLength; ++i) {
            chars[i] = validCharacters[Math.floor(Math.random() * validCharacters.length)];
        }
        return chars.join("");
    }
    var generateRowID = function () {
        "use strict";
        return generateUUID().replace(/_/g, "Z");
    };
    var regexIndexOf = function (str, regex, startpos) {
        var indexOf = str.substring(startpos || 0).search(regex);
        return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
    };
    var pre_log = function (message) {
        log('---------------------------------------------------------------------------------------------');
        log(message);
        log('---------------------------------------------------------------------------------------------');
    };
    var checkInstall = function () {
        if (!_.has(state, state_name)) {
            state[state_name] = state[state_name] || {};
        }
        setDefaults();
    };
    var setDefaults = function (reset) {
        var defaults = {
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
                notes: true
            }
        };
        var playerObjects = findObjs({
            _type: "player"
        });
        playerObjects.forEach(function (player) {
            if (!state[state_name][player.id]) {
                state[state_name][player.id] = {};
            }
            if (!state[state_name][player.id].config) {
                state[state_name][player.id].config = defaults;
            }
            for (var item in defaults) {
                if (!state[state_name][player.id].config.hasOwnProperty(item)) {
                    state[state_name][player.id].config[item] = defaults[item];
                }
            }
            for (var item in defaults.imports) {
                if (!state[state_name][player.id].config.imports.hasOwnProperty(item)) {
                    state[state_name][player.id].config.imports[item] = defaults.imports[item];
                }
            }
            if (!state[state_name][player.id].config.hasOwnProperty('firsttime')) {
                if (!reset) {
                    sendConfigMenu(player, true);
                }
                state[state_name][player.id].config.firsttime = false;
            }
        });
    };
    var importClassOptions = function (repeating_attributes, trait, current_class, class_options, repeat_index) {
        if (trait.requiredLevel > current_class.level) {
            // not applied to this character, trait is available at higher levels
            return repeat_index;
        }
        // search for selected options for the given trait
        var selections = getObjects(class_options, 'componentId', trait.id);
        if (selections.length < 1) {
            // no selections, ignore trait
            return repeat_index;
        }
        var index = repeat_index;
        for (var _i = 0, selections_1 = selections; _i < selections_1.length; _i++) {
            selection = selections_1[_i];
            var text = replaceChars("" + selection.definition.description);
            var trait_docs = {
                name: selection.definition.name,
                description: text,
                source: 'Class',
                source_type: current_class.definition.name
            };
            Object.assign(repeating_attributes, createRepeatingTrait(object, trait_docs, index++));
        }
        return index;
    };
    var emitAttributesForModifiers = function (single_attributes, repeating_attributes, modifiers, total_level) {
        var basenames = Object.keys(modifiers);
        basenames.sort();
        // for half proficiency types, we have to set a constant that is only valid for the current level, because
        // the 5e OGL sheet does not understand these types of proficiency
        var proficiency_bonus = (Math.floor((total_level - 1) / 4) + 2);
        for (var _i = 0, basenames_1 = basenames; _i < basenames_1.length; _i++) {
            var basename = basenames_1[_i];
            var modifier = modifiers[basename];
            var mod = 0;
            if (modifier.bonus !== undefined) {
                mod = modifier.bonus;
            }
            log("beyond: final modifier " + basename + " (" + modifier.friendly + ") proficiency " + modifier.proficiency + " bonus " + modifier.bonus);
            if (all_skills.indexOf(basename) !== -1) {
                switch (modifier.proficiency) {
                    case 0:
                        // no proficiency
                        break;
                    case 1:
                        single_attributes[basename + "_prof"] = '';
                        single_attributes[basename + "_flat"] = mod + Math.floor(proficiency_bonus / 2);
                        break;
                    case 2:
                        single_attributes[basename + "_prof"] = '';
                        single_attributes[basename + "_flat"] = mod + Math.ceil(proficiency_bonus / 2);
                        break;
                    case 3:
                        single_attributes[basename + "_prof"] = "(@{pb}*@{" + basename + "_type})";
                        if (mod !== 0) {
                            single_attributes[basename + "_flat"] = mod;
                        }
                        break;
                    case 4:
                        single_attributes[basename + "_prof"] = "(@{pb}*@{" + basename + "_type})";
                        single_attributes[basename + "_type"] = 2;
                        if (mod !== 0) {
                            single_attributes[basename + "_flat"] = mod;
                        }
                        break;
                }
            }
            else if (saving_throws.indexOf(basename) !== -1) {
                switch (modifier.proficiency) {
                    case 0:
                        // no proficiency
                        break;
                    case 1:
                        single_attributes[basename + "_prof"] = '';
                        single_attributes[basename + "_mod"] = mod + Math.floor(proficiency_bonus / 2);
                        break;
                    case 2:
                        single_attributes[basename + "_prof"] = '';
                        single_attributes[basename + "_mod"] = mod + Math.ceil(proficiency_bonus / 2);
                        break;
                    case 3:
                        single_attributes[basename + "_prof"] = "(@{pb})";
                        if (mod !== 0) {
                            single_attributes[basename + "_mod"] = mod;
                        }
                        break;
                    case 4:
                        // this case probably does not exist in the 5e rules, but we can at least support
                        // it in the constant for current level style
                        single_attributes[basename + "_prof"] = '(@{pb})';
                        single_attributes[basename + "_mod"] = proficiency_bonus + mod;
                        break;
                }
            }
            else if (modifier.proficiency > 0) {
                // general proficiency 
                var type = 'OTHER';
                if (basename.includes('weapon')) {
                    type = 'WEAPON';
                }
                else if (basename.includes('armor')) {
                    type = 'ARMOR';
                }
                else if (basename.includes('shield')) {
                    type = 'ARMOR';
                }
                else if (weapons.indexOf(modifier.friendly) !== -1) {
                    type = 'WEAPON';
                }
                var row = getRepeatingRowIds('proficiencies', 'name', modifier.friendly)[0];
                repeating_attributes["repeating_proficiencies_" + row + "_name"] = modifier.friendly;
                repeating_attributes["repeating_proficiencies_" + row + "_prof_type"] = type;
                repeating_attributes["repeating_proficiencies_" + row + "_options-flag"] = '0'; // XXX why is this set as string?
            }
            // XXX implement passive-perception bonus ('passiveperceptionmod') etc.
        }
    };
})();
