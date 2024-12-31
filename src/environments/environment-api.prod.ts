export const environment = {
    production: true,
    apiUrl: 'https://sengoku-alexandria-qa.azurewebsites.net/api'
  };
export interface IGameDictionary {
    add(key: number, value: string): void;
    remove(key: number): void;
    containsKey(key: number): boolean;
    keys(): number[];
    values(): string[];
}
export class GameDictionary {
  [key: number]: string;

  _keys: number[] = [];
  _values: string[] = [];

  constructor(init: { key: number, value: string }[]) {
    for(var x = 0; x < init.length; x++) {
      this[init[x].key] = init[x].value;
      this._keys.push(init[x].key);
      this._values.push(init[x].value);
    }
  }
  add(key: number, value: string) {
    this[key] = value;
    this._keys.push(key);
    this._values.push(value);
  }
  remove(key: number) {
    var index = this._keys.indexOf(key, 0);
    this._keys.splice(index, 1);
    this._values.splice(index, 1);

    delete this[key];
  }
  keys(): number[] {
    return this._keys;
  }
  values(): string[] {
    return this._values;
  }
  containsKey(key: number) {
    if (typeof this[key] === "undefined") {
      return false;
    }
    return true;
  }
  toLookup(): IGameDictionary {
    return this;
  }
  tryGetValue(key: number) : string {
    if(this.containsKey(key)) {
      return this[key];
    }
    return '';
  }
}