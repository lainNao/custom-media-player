import { RelatedCell } from "./RelatedCell";

interface RelatedCellsConstructorArgs {
  children: RelatedCell[],
}

export class RelatedCells {

  private children: RelatedCell[];

  constructor(args?: RelatedCellsConstructorArgs) {
    //TODO: 不変条件
    this.children = (args == undefined) ? [] : args.children;
  }

  static fromJSON(json) {
    const children = json.map((relatedCell) => {
      return new RelatedCell({
        id: relatedCell.id,
        columnSpaceId: relatedCell.columnSpaceId,
        cellId: relatedCell.cellId,
      })
    })
    return new RelatedCells({
      children
    });
  }

  toJSON(key) {
    return this.children;
  }

  mapChildren(callback: (value: RelatedCell, index: number, array: RelatedCell[]) => unknown): unknown[]  {
    return this.children.map(callback);
  }
}
