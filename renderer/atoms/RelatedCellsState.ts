import { atom } from 'recoil';
import { RelatedCells } from '../models/RelatedCells';

const relatedCellsState = atom<RelatedCells>({
  key: "RelatedCells",
  default: null,
});

export default relatedCellsState;
