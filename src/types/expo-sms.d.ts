declare module 'expo-sms' {
  export function isAvailableAsync(): Promise<boolean>
  export function sendSMSAsync(recipients: string[] | string, message: string): Promise<{ result: string }>
  const _default: {
    isAvailableAsync: typeof isAvailableAsync
    sendSMSAsync: typeof sendSMSAsync
  }
  export default _default
}
