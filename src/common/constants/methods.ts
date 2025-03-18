export const HttpMethod = {
  get: 'get',
  post: 'post',
  put: 'put',
  delete: 'delete',
  patch: 'patch',
} as const;

export type HttpMethod = (typeof HttpMethod)[keyof typeof HttpMethod];
