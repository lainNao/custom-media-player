import React, { useEffect, useState } from 'react';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useToast, useDisclosure } from "@chakra-ui/react"
import selectedColumnSpaceIdState from '../../../../recoils/atoms/selectedColumnSpaceIdState';
import displaySettingsState from '../../../../recoils/atoms/displaySettingsState';
import { Input, Select, IconButton, Button, RadioGroup, Radio, Stack } from "@chakra-ui/react"
import { DisplaySetting, DisplaySettings } from '../../../../models/DisplaySettings';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';
import { useRecoilCallback, useRecoilValue } from 'recoil';
import { Field, FieldArray, Form, Formik } from 'formik';
import yup from '../../../../modules/yup';
import { RelatedCellsDisplayType } from '../../../../resources/RelatedCellsDisplayType';
import specificColumnSpaceState from '../../../../recoils/selectors/specificColumnSpaceState';
import { updateDisplaySettingUsecase } from '../../../../usecases/updateDisplaySettingUsecase';


const notNullableStringRule = yup.string().min(1).required("必須です").filled("必須です");

type Props = {
  isOpen: boolean,
  onClose: any, //TODO 何の型
  displaySetting: DisplaySetting,
}

export const DisplaySettingUpdateModal: React.FC<Props> = props => {
  const toast = useToast();
  const currentSelectedColumnSpaceId = useRecoilValue(selectedColumnSpaceIdState);
  const currentSelectedColumnSpace = useRecoilValue(specificColumnSpaceState(currentSelectedColumnSpaceId));
  const [initialValues, setInitialValues] = useState<{
    name: string,
    mainColumn: string,
    sortColumns: string[],
    relatedCellsDisplaySetting: {
      type: string,
      typeDetails: any,
    }
  }>({
    name: "",
    mainColumn: "",
    sortColumns: [],
    relatedCellsDisplaySetting: {
      type: "",
      typeDetails: undefined,
    }
  });

  // initialValuesの設定
  useEffect(() => {
    const displaySettingJson = JSON.parse(JSON.stringify(props.displaySetting));
    delete displaySettingJson.id;
    setInitialValues(displaySettingJson as any);
  }, [props.displaySetting])

  const handleOnChangeMainColumn = (event, setFieldValue, currentTypeDetailsColumnLength?: number) => {  //TODO 型
    setFieldValue("mainColumn", event.target.value);
    setFieldValue("sortColumns", [""]);
    if (currentTypeDetailsColumnLength) {
      for (let i=0; i<currentTypeDetailsColumnLength; i++) {
        setFieldValue(`relatedCellsDisplaySetting.typeDetails.columns.${i}.columnId`, "");
      }
    }
  }

  const handleOnChangeSortColumn = (event, index: number, setFieldValue, currentTypeDetailsColumnLength?: number) => {  //TODO 型
    setFieldValue(`sortColumns.${index}`, event.target.value);
    if (currentTypeDetailsColumnLength) {
      for (let i=0; i<currentTypeDetailsColumnLength; i++) {
        setFieldValue(`relatedCellsDisplaySetting.typeDetails.columns.${i}.columnId`, "");
      }
    }
  }

  const handleSubmitDisplaySettingAddForm = useRecoilCallback(({set}) => async (values, {setSubmitting, setErrors, setStatus, resetForm}) => {

    /// 現在のカラムスペース用の表示設定を一つ追加
    try {
      setSubmitting(true);
      values["id"] = props.displaySetting.id;
      const displaySetting = DisplaySetting.createNewFromJSON(values);
      const newDisplaySettings = await updateDisplaySettingUsecase(currentSelectedColumnSpaceId, displaySetting);
      set(displaySettingsState, newDisplaySettings);
      toast({ title: "更新しました", status: "success", position: "bottom-right", isClosable: true, duration: 1500 });
      setStatus({success: true})
      props.onClose();
    } catch (e) {
      console.log(e.stack);
      toast({ title: e.message, status: "error", position: "bottom-right", isClosable: true, duration: 10000 });
      setStatus({success: false})
    } finally {
      setSubmitting(false);
    }

  }, [currentSelectedColumnSpaceId, props.displaySetting]);

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose} size="xl" closeOnEsc={false} closeOnOverlayClick={false} >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>表示設定編集 / {props.displaySetting.name}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Formik
            enableReinitialize={true}
            initialValues={initialValues}
            onSubmit={(values, {setSubmitting, setErrors, setStatus, resetForm}) => handleSubmitDisplaySettingAddForm(values, {setSubmitting, setErrors, setStatus, resetForm})}
            validationSchema={
              yup.object({
                name: notNullableStringRule,
                mainColumn: notNullableStringRule,
                sortColumns: yup.array(notNullableStringRule).required("必須です").unique("同時に同じものを指定できません"),
                relatedCellsDisplaySetting: yup.object({
                  type: notNullableStringRule,
                  typeDetails: yup.object().when("type", type => {
                    if (type === "HListSeparator") {
                      return yup.object({
                        separator: yup.string().required("必須です"),
                      });
                    }
                    return yup.object().nullable();
                  })
                })
              })
            }
          >
            {(formState) => {
              return (
                <Form>
                  {/* 中央 */}
                  <div className="font-bold">中央</div>
                  <div className="pl-4 mt-3">

                    {/* 表示名 */}
                    <div className="flex flex-row">
                      <div className="w-1/3">表示名</div>
                      <div className="w-2/3">
                        <Field name="name">
                          {({field, form, ...props}) => <Input {...field} {...props} spellCheck={false} isInvalid={formState.touched.name && formState.errors.name}/>}
                        </Field>
                      </div>
                    </div>

                    {/* メインカラム */}
                    <div className="flex flex-row mt-3">
                      <div className="w-1/3">メインカラム</div>
                      <div className="w-2/3">
                        <Field name="mainColumn">
                          {({field, form, ...props}) => (
                            <Select
                              {...field} {...props}
                              placeholder="選択してください"
                              isInvalid={formState.touched.mainColumn && formState.errors.mainColumn}
                              onChange={e => handleOnChangeMainColumn(e, formState.setFieldValue, formState.values.relatedCellsDisplaySetting.typeDetails?.columns?.length)}
                            >
                              {currentSelectedColumnSpace.columns.mapChildren(column => {
                                return <option key={column.id} value={column.id}>{column.name}</option>
                              })}
                            </Select>
                          )}
                        </Field>
                      </div>
                    </div>

                    {/* ソートカラム */}
                    <div className="flex flex-row mt-3">
                      <div className="w-1/3">ソートカラム</div>
                      <div className="w-2/3">
                        <FieldArray name="sortColumns">
                          {({remove, push}) => (
                            <div>
                              {formState.values.sortColumns.length > 0 && formState.values.sortColumns.map((sortColumn, index) => {
                                return (
                                  <div key={index} className={`${index !== 0 && "mt-2"}`}>
                                    <Field name={`sortColumns.${index}`} key={index}>
                                      {({field, form, ...props}) => (
                                        <Select
                                          {...field} {...props}
                                          placeholder="選択してください"
                                          isInvalid={formState.touched.sortColumns?.[index] && formState.errors.sortColumns?.[index]}
                                          onChange={e => handleOnChangeSortColumn(e, index, formState.setFieldValue, formState.values.relatedCellsDisplaySetting.typeDetails?.columns?.length)}
                                        >
                                          {currentSelectedColumnSpace.columns.children
                                            .filter(column => column.id !== formState.values.mainColumn)
                                            .map(column => <option key={column.id} value={column.id}>{column.name}</option>)}
                                        </Select>
                                      )}
                                    </Field>
                                  </div>
                                )
                              })}

                              {/* エラーメッセージ */}
                              <div className="flex justify-center">
                                {(formState.errors.sortColumns &&
                                  typeof formState.errors.sortColumns === "string") &&
                                  <div className="text-red-600">{formState.errors.sortColumns}</div>
                                }
                              </div>

                              {/* 削除ボタン・追加ボタン */}
                              <div className="mt-2">
                                <IconButton disabled={formState.values.sortColumns.length <= DisplaySetting.MIN_SORT_COLUMN_LENGTH} aria-label="remove" icon={<MinusIcon />} onClick={() => {
                                  if (formState.values.sortColumns.length <= DisplaySetting.MIN_SORT_COLUMN_LENGTH) return;
                                  remove(formState.values.sortColumns.length-1)
                                }} />
                                <IconButton disabled={!DisplaySetting.isValidSortColumnLength(formState.values.sortColumns.length)} className="ml-3" aria-label="add" icon={<AddIcon />} onClick={() => push("")} />
                              </div>

                            </div>
                          )}
                        </FieldArray>
                      </div>
                    </div>

                  </div>

                  {/* 右サイド */}
                  <div className="font-bold">右サイド</div>
                  <div className="pl-4 mt-3">

                    {/* 関連セル表示形式 */}
                    <div className="flex flex-row mt-3">
                      <div className="w-1/3">関連セル表示形式</div>
                      <div className="w-2/3">
                        <Field name={`relatedCellsDisplaySetting.type`}>
                          {({field, form, ...props}) => (
                            <Select
                              {...field} {...props}
                              placeholder="選択してください"
                              isInvalid={formState.touched.relatedCellsDisplaySetting?.type && formState.errors.relatedCellsDisplaySetting?.type}
                            >
                              {Object.entries(RelatedCellsDisplayType).map(([key, value]) => <option key={key} value={value}>{value}</option>)}
                            </Select>
                          )}
                        </Field>
                      </div>
                    </div>

                    {/* HListSeparatorの場合 */}
                    {formState.values.relatedCellsDisplaySetting.type === "HListSeparator" &&

                      // セパレータ
                      <div className="flex flex-row mt-3">
                        <div className="w-1/3">セパレータ</div>
                        <div className="w-2/3">
                          <Field name={`relatedCellsDisplaySetting.typeDetails.separator`}>
                            {({field, form, ...props}) => {
                              return (
                                <Input {...field} {...props} spellCheck={false} isInvalid={(formState.touched.relatedCellsDisplaySetting?.typeDetails as any)?.separator && (formState.errors.relatedCellsDisplaySetting?.typeDetails as any)?.separator}/>
                              )
                            }}
                          </Field>
                        </div>
                      </div>
                    }

                    <div className="text-right mt-6">
                      <Button type="submit" colorScheme="blue" mr={3} isDisabled={!formState.dirty || !formState.isValid || formState.isSubmitting}>確定</Button>
                    </div>

                  </div>
                </Form>
              )
            }}
          </Formik>
    </ModalBody>
      </ModalContent>
    </Modal>
  )
}
