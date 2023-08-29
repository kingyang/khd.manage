import { isEmpty, isObject } from 'lodash-unified';
export { isEmpty, isObject };
export function isDate(date: any): date is Date {
  return Object.prototype.toString.call(date) === '[object Date]';
}

export const isReadableStream = (input: any): input is ReadableStream =>
  input instanceof ReadableStream;

export const isArrayBuffer = (input: any): input is ArrayBuffer =>
  input instanceof ArrayBuffer;

export const isArrayBufferView = (input: any): input is ArrayBufferView =>
  input instanceof Int8Array ||
  input instanceof Uint8Array ||
  input instanceof Int16Array ||
  input instanceof Uint16Array ||
  input instanceof Int32Array ||
  input instanceof Uint32Array ||
  input instanceof Float32Array ||
  input instanceof Float64Array;

export const isBlob = (input: any): input is Blob => input instanceof Blob;

export const isFile = (input: any): input is File => input instanceof File;

export const isFormData = (input: any): input is FormData =>
  input instanceof FormData;

/**
 * 仅为了解决Record类型判断
 * @param obj
 * @returns
 */
export function isRecordStringAny(obj: any): obj is Record<string, any> {
  return isObject(obj);
}
