export type State = {
  stats: {
    users: {
      total: number;
      onboarded: number;
      dau: number;
      wau: number;
      mau: number;
      langs: Record<string, number>;
    };
    alerts: { active: number; users: number };
    referrals: {
      total: number;
      inviters: number;
      top: { uid: number; count: number }[];
    };
  };
  config: {
    channelId: number | null;
    groupId: number | null;
    aiOn: boolean;
    aiPublic: boolean;
    testers: number[];
  };
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe?: { user?: { id: number; first_name?: string } };
        ready(): void;
        expand(): void;
        close(): void;
        themeParams: Record<string, string>;
        colorScheme: 'light' | 'dark';
        showAlert(message: string, cb?: () => void): void;
        showConfirm(message: string, cb?: (ok: boolean) => void): void;
        HapticFeedback?: {
          notificationOccurred(type: 'error' | 'success' | 'warning'): void;
          impactOccurred(style: 'light' | 'medium' | 'heavy'): void;
        };
        MainButton: {
          text: string;
          show(): void;
          hide(): void;
          enable(): void;
          disable(): void;
          showProgress(leaveActive?: boolean): void;
          hideProgress(): void;
          setText(t: string): void;
          onClick(cb: () => void): void;
          offClick(cb: () => void): void;
        };
      };
    };
  }
}
