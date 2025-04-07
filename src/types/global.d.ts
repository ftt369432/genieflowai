declare global {
  interface Window {
    gapi: {
      load: (libraries: string, callback: { callback: () => void; onerror: (error: any) => void }) => void;
      client: {
        init: (options: any) => Promise<void>;
        request: (options: any) => Promise<any>;
      };
      auth2: {
        getAuthInstance: () => any;
      };
    };
  }
  var gapi: any;
}

export {}; 