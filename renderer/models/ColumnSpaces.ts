import { TrimedFilledString } from "../value-objects/TrimedFilledString";
import { Column } from "./Column";
import { Columns } from "./Columns";
import { ColumnSpace } from "./ColumnSpace";

interface ColumnSpacesConstructorArgs {
  children: ColumnSpace[],
}

/*// TODO 以下をまとめる
  ただしsがつかないやつはRelatedCell以外はエンティティだと思う。プログラム上でもミュータブルにするかどうかは、一般的にはするのかな。プログラム上ではイミュータブルにしてもいいらしいけどまあおまかせで。
*/
export class ColumnSpaces {

  private _children: ColumnSpace[];

  constructor(args?: ColumnSpacesConstructorArgs) {
    this._children = (args == undefined) ? [] : args.children;
  }

  get children(): ColumnSpace[] { return this._children; }

  static fromJSON(json) {
    return new ColumnSpaces({
      children: json.map((columnSpace) => new ColumnSpace({
        id: columnSpace.id,
        name: new TrimedFilledString(columnSpace.name),
        childColumnSpaces: ColumnSpaces.fromJSON(columnSpace.childColumnSpaces),
        columns: Columns.fromJSON(columnSpace.columns),
      }))
    });
  }

  toJSON(key) {
    return this._children;
  }

  mapChildren(callback: (value: ColumnSpace, index: number, array: ColumnSpace[]) => unknown): unknown[]  {
    return this._children.map(callback);
  }

  // 子孫のカラムスペースから指定IDのものを探して返す
  findDescendantColumnSpace(targetId: string): ColumnSpace {
    for (let i=0; i<this._children.length; i++) {
      if (this._children[i].id === targetId) {
        return this._children[i];
      }
      const columnSpace = this._children[i].findDescendantColumnSpace(targetId);
      if (columnSpace) {
        return columnSpace;
      }
    }
  }

  // 子のカラムスペースから指定IDのものを削除
  removeChildColumnSpace(targetId: string): ColumnSpaces {
    for (let i=0; i<this._children.length; i++) {
      if (this._children[i].id === targetId) {
        this._children.splice(i, 1);
        return this;
      }
    }
    // TODO これはここに例外出す処理書きやすいな。でも他のそういうことしづらいやつのとの兼ね合いも含めやるかやらないか、やるならどうやるか後で考えて
  }

  // 子孫のカラムスペースから指定IDのものを削除
  removeDescendantColumnSpace(targetId: string): ColumnSpaces {
    for (let i=0; i<this._children.length; i++) {
      if (this._children[i].id === targetId) {
        return this.removeChildColumnSpace(targetId);
      }
      this._children[i].removeDescendantColumnSpace(targetId);
    }
    return this;
  }

  // 子に新規カラムスペースを追加
  push(columnSpace: ColumnSpace): ColumnSpaces {
    this._children.push(columnSpace);
    return this;
  }

  // 子孫のカラムスペースを上書き
  updateDescendantColumnSpace(columnSpace: ColumnSpace): ColumnSpaces {
    for (let i=0; i<this._children.length; i++) {
      if (this._children[i].id === columnSpace.id) {
        this._children[i] = columnSpace;
        return this;
      }
      this._children[i].updateDescendantColumnSpace(columnSpace);
    }
    return this;
  }

  // 子孫のカラムスペースに指定カラムスペースを追加
  addDescendantColumnSpace(columnSpace: ColumnSpace, toId: string): ColumnSpaces {
    for (let i=0; i<this._children.length; i++) {
      if (this._children[i].id === toId) {
        this._children[i].addChildColumnSpace(columnSpace);
        return this;
      }
      this._children[i].addDescendantColumnSpace(columnSpace, toId);
    }
    return this;
  }

  // 子孫のカラムスペースに指定カラムを追加
  addDescendantColumn(column: Column, toId: string): ColumnSpaces {
    for (let i=0; i<this._children.length; i++) {
      if (this._children[i].id === toId) {
        this._children[i].addColumn(column);
        return this;
      }
      this._children[i].addDescendantColumn(column, toId);
    }
    return this;
  }

  // 指定IDのカラムスペースを、トップレベルのカラムスペース配下に移動
  moveColumnSpaceToTopLevel(id: string): ColumnSpaces {
    if (!this.canMoveColumnSpaceToTopLevel(id)) {
      throw new Error("移動できません");
    }
    const immigrant = this.findDescendantColumnSpace(id);
    const newColumnSpaces = this.removeDescendantColumnSpace(id);
    return newColumnSpaces.push(immigrant);
  }

  // 指定IDのカラムスペースを、指定IDのカラムスペース配下に移動
  moveDescendantColumnSpace(id: string, toId: string): ColumnSpaces {
    if (!this.canMoveDescendantColumnSpace(id, toId)) {
      throw new Error("移動できません");
    }
    const immigrant = this.findDescendantColumnSpace(id);
    const newColumnSpaces = this.removeDescendantColumnSpace(id);
    return newColumnSpaces.addDescendantColumnSpace(immigrant, toId);
  }

  // 指定IDのカラムスペースを、指定IDのカラムスペース配下に移動可能か
  canMoveColumnSpaceToTopLevel(id: string): boolean {

    // カラムスペースとして取得できない場合はもちろん移動できない
    const columnSpace = this.findDescendantColumnSpace(id);
    if (!columnSpace) {
      return false;
    }

    return true;
  }

  // 指定IDのカラムスペースを、指定IDのカラムスペース配下に移動可能か
  canMoveDescendantColumnSpace(id: string, toId: string): boolean {
    // 自分と相手が同じなら移動できない
    const isSame: boolean = (id === toId);
    if (isSame) {
      return false;
    }

    // カラムを持っている相手には移動できない
    const toColumnSpace = this.findDescendantColumnSpace(toId);
    if (!toColumnSpace || toColumnSpace.hasColumns()) {
      return false;
    }

    // カラムスペースとして取得できない場合はもちろん移動できない
    // NOTE: この本質的な判定をメソッドの一番上に持ってこないのは検索コスト削減のため
    const columnSpace = this.findDescendantColumnSpace(id);
    if (!columnSpace) {
      return false;
    }

    return true;
  }

  // 子カラムを追加できるかどうか
  canAddColumn(): boolean {
    return this._children.length === 0;
  }

  // 子カラムスペースを持つかどうか
  hasChildColumnSpace(): boolean {
    return this._children.length > 0;
  }

}