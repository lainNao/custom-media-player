import { Button, Textarea } from "@chakra-ui/react"
import React from 'react';
import { useFormik } from 'formik';
import yup from '../../../modules/yup';
import { ColumnDataType } from "../../../resources/ColumnDataType";

type Props = {
  onClickCreateNewCell: any, //TODO
  handleClickNewCellFormClose: any, //TODO
  columnDataType: ColumnDataType,
}

export const NewCellFormModalBodyText: React.FC<Props> = (props) => {

  const formik = useFormik({
    initialValues: {
      text: '',
    },
    validationSchema: yup.object({
      text: yup
        .string()
        .required("必須です")
        .filled("必須です")
    }),
    onSubmit: (values: any) => {
      props.handleClickNewCellFormClose();
      props.onClickCreateNewCell(props.columnDataType, values);
    },
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <Textarea name="text" spellCheck={false} isInvalid={Boolean(formik.errors.text)} rows={6} value={formik.values.text} onChange={formik.handleChange} autoFocus />
      <div className="font-black text-red-700 text-sm">{Boolean(formik.errors.text) ? formik.errors.text : "　"}</div>
      <div className="float-right mt-3 mb-2">
        <Button type="submit" isDisabled={!(formik.isValid && formik.dirty)} colorScheme="blue" mr={3} >作成</Button>
        <Button variant="ghost" onClick={props.handleClickNewCellFormClose}>キャンセル</Button>
      </div>
      {/* TODO たぶん関連づけの操作もこのモーダル上でできるようにしたほうがいいと思う */}
    </form>
  )
}

