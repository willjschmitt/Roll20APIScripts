export interface BeyondDNDCharacterSheetJSON {
  name: string;
  modifiers: {
    subType: string,
  };
  classes?: {
    level: number,
    definition: {
      name: string,
    }
    subclassDefinition?: {
      name: string
    }
  }[];
  race: {
    weightSpeeds: {
      normal: {
        burrow: number,
        climb: number,
        fly: number,
        swim: number,
        walk: number,
      }
    }
  }
}

export class BeyonDNDCharacterSheet {
  constructor(private _json: BeyondDNDCharacterSheetJSON) {}

}
