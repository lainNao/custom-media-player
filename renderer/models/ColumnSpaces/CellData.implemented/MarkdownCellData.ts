import { CellData } from "../CellData";

interface ConstructorArgs {
  text: string,
}

interface FromJsonArgs {
  text: string,
}

export class MarkdownCellData implements CellData {
  private _text: string;

  get text() { return this._text; }

  constructor(args: ConstructorArgs) {
    this._text = args.text;
  }

  toJSON() {
    return {
      text: this._text,
    }
  }

  static fronJSON(json: FromJsonArgs): CellData {
    return new MarkdownCellData({
      text: json.text,
    });
  }

}
