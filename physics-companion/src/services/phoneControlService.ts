import { Capacitor, registerPlugin } from '@capacitor/core';

interface PhoneControlPlugin {
  requestAllPermissions(): Promise<void>;
  openOverlaySettings(): Promise<{ canDrawOverlays: boolean }>;
  startWakeService(opts: { accessKey: string }): Promise<void>;
  pauseWakeService(): Promise<void>;
  resumeWakeService(): Promise<void>;
  stopWakeService(): Promise<void>;
  openApp(opts: { appName: string }): Promise<{ opened: string }>;
  setAlarm(opts: { hour: number; minute: number; message?: string }): Promise<void>;
  toggleFlashlight(opts: { enabled: boolean }): Promise<void>;
  setVolume(opts: { level: number }): Promise<void>;
  callPhone(opts: { target: string }): Promise<void>;
  openSystemPanel(opts: { panel: string }): Promise<void>;
  addListener(eventName: 'wakeTriggered', cb: () => void): Promise<{ remove: () => void }>;
}

const NativePhoneControl = registerPlugin<PhoneControlPlugin>('PhoneControl');
export const isAndroidNative = () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

export const PhoneControl = {
  async setupPermissionsAndOverlay() {
    if (!isAndroidNative()) return;
    await NativePhoneControl.requestAllPermissions();
    await NativePhoneControl.openOverlaySettings();
  },
  async startWakeService() {
    if (!isAndroidNative()) return;
    await NativePhoneControl.requestAllPermissions();
    await NativePhoneControl.startWakeService({ accessKey: '' });
  },
  async pauseWakeService() { if (isAndroidNative()) await NativePhoneControl.pauseWakeService(); },
  async resumeWakeService() { if (isAndroidNative()) await NativePhoneControl.resumeWakeService(); },
  async stopWakeService() { if (isAndroidNative()) await NativePhoneControl.stopWakeService(); },
  onWakeTriggered(cb: () => void) {
    return isAndroidNative() ? NativePhoneControl.addListener('wakeTriggered', cb) : Promise.resolve({ remove: () => {} });
  },
  openApp: (appName: string) => isAndroidNative() ? NativePhoneControl.openApp({ appName }) : Promise.resolve(),
  setAlarm: (hour: number, minute: number, message?: string) => isAndroidNative() ? NativePhoneControl.setAlarm({ hour, minute, message }) : Promise.resolve(),
  toggleFlashlight: (enabled: boolean) => isAndroidNative() ? NativePhoneControl.toggleFlashlight({ enabled }) : Promise.resolve(),
  setVolume: (level: number) => isAndroidNative() ? NativePhoneControl.setVolume({ level }) : Promise.resolve(),
  callPhone: (target: string) => isAndroidNative() ? NativePhoneControl.callPhone({ target }) : Promise.resolve(),
  openSystemPanel: (panel: string) => isAndroidNative() ? NativePhoneControl.openSystemPanel({ panel }) : Promise.resolve(),
};