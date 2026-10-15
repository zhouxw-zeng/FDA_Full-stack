export const CUSTOM_API_MESSAGE = '__customApiMessage';

export interface CustomApiMessage<T> {
  [CUSTOM_API_MESSAGE]: true;
  message: string;
  data: T;
}

export function apiMessage<T>(message: string, data: T): CustomApiMessage<T> {
  return {
    [CUSTOM_API_MESSAGE]: true,
    message,
    data,
  };
}

export function isCustomApiMessage(value: unknown): value is CustomApiMessage<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    CUSTOM_API_MESSAGE in value &&
    (value as Record<string, unknown>)[CUSTOM_API_MESSAGE] === true
  );
}
