export interface Envelope<T> {
  success: boolean
  message: string
  errorCode: string | null
  data: T
  timestamp: string
}

export function ok<T>(data: T, message = 'OK'): Envelope<T> {
  return {
    success: true,
    message,
    errorCode: null,
    data,
    timestamp: new Date().toISOString(),
  }
}

export function fail(errorCode: string, message: string): Envelope<null> {
  return {
    success: false,
    message,
    errorCode,
    data: null,
    timestamp: new Date().toISOString(),
  }
}
