export interface AccountSDKApi {
  initialize(options?: { app?: string; color?: string }): void;
  open(kind: 'profile' | 'account' | 'help' | 'ads', options?: { trigger?: Element | null }): void;
  close(): void;
  getActiveModal(): string | null;
  refreshState(): { signedIn: boolean; creditBalance: number | null; status: string };
  destroy(): void;
}
export function accountSDK() {
  return (window as Window & { PatchmanAccount?: AccountSDKApi }).PatchmanAccount;
}
