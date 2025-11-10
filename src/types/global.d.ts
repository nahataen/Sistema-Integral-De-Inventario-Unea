declare global {
  interface Window {
    refreshDatabases?: () => void;
  }
}

export {};