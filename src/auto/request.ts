import Url from 'url-parse';

export const baseApi = import.meta.env.APP_API as string;
const apiBase = import.meta.env.APP_API as string;

let token: string | undefined;

export const setToken = (str?: string) => {
  token = str;
};

type RequestData = BodyInit | null | Record<string, any>;

export type RequestOptions = RequestInit & {
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'all';
  headers?: Record<string, string>;
  data?: RequestData;
};

export const isFullUrl = (url: string) =>
  url.indexOf('//') === 0 ||
  url.indexOf('http://') === 0 ||
  url.indexOf('https://') === 0;

const CONTENT_TYPE = 'Content-Type';
const JSON_TYPE = 'application/json';

let lastGoLogin = 0;
export const request = async <T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> => {
  options.method = options.method?.toUpperCase() || 'GET';
  const { responseType, headers = {}, ...restOptions } = options;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (!headers[CONTENT_TYPE]) {
    headers[CONTENT_TYPE] = JSON_TYPE;
  }
  url = isFullUrl(url) ? url : `${apiBase}${url}`;
  const uriObj = new Url(url, true);
  if (options.method === 'GET' || options.method === 'DELETE') {
    uriObj.set('query', {
      ...uriObj.query,
      ...(restOptions.data as Record<string, any>),
    });
    url = uriObj.href;
    delete restOptions.data;
  }
  if (restOptions.data) {
    if (
      headers[CONTENT_TYPE].indexOf(JSON_TYPE) >= 0 &&
      !isReadableStream(restOptions.data) &&
      !isArrayBuffer(restOptions.data) &&
      !isArrayBufferView(restOptions.data) &&
      !isBlob(restOptions.data) &&
      !isFile(restOptions.data) &&
      !isFormData(restOptions.data)
    ) {
      if (isDate(restOptions.data)) {
        restOptions.body = restOptions.data.toISOString();
      } else if (isRecordStringAny(restOptions.data)) {
        restOptions.body = JSON.stringify(restOptions.data);
      } else {
        restOptions.body = restOptions.data;
      }
    } else {
      restOptions.body = restOptions.data as BodyInit | null;
    }
    delete restOptions.data;
  }
  console.debug('request', url, restOptions);
  return fetch(url, { headers, ...restOptions }).then(res => {
    if (res.status === 401) {
      const now = new Date().getTime();
      if (now - lastGoLogin < 2000) {
        return;
      } else {
        lastGoLogin = now;
      }
    }
    if (options.method === 'HEAD') {
      return res;
    }
    if (res.status >= 500) {
      throw { res };
    }

    if (res.status === 200) {
      switch (responseType) {
        case 'arrayBuffer':
          return res.arrayBuffer();
        case 'blob':
          return res.blob();
        case 'text':
          return res.text();
        case 'all':
          return res;
        case 'json':
        default:
          return res.json();
      }
    }
  });
};

export const get = <T>(
  url: string,
  data?: BodyInit | Record<string, any> | null,
  options?: RequestOptions,
) => {
  return request<T>(url, {
    data,
    method: 'GET',
    ...options,
  });
};

export const post = <T>(
  url: string,
  data?: RequestData,
  options?: RequestOptions,
) => {
  return request<T>(url, {
    data,
    method: 'POST',
    ...options,
  });
};

export const put = <T>(
  url: string,
  data?: RequestData,
  options?: RequestOptions,
) => {
  return request<T>(url, {
    data,
    method: 'PUT',
    ...options,
  });
};
export const head = <T>(
  url: string,
  data?: RequestData,
  options?: RequestOptions,
) => {
  return request<T>(url, {
    data,
    method: 'HEAD',
    ...options,
  });
};

export const del = <T>(
  url: string,
  data?: RequestData,
  options?: RequestOptions,
) => {
  return request<T>(url, {
    data,
    method: 'DELETE',
    ...options,
  });
};
