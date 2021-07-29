import createAMSClient from "./createAMSClient";
import FramedlessClient from './FramedlessClient';
import FramedClient from './FramedClient';

declare global {
  interface Window {
    Microsoft: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  }
}

export default createAMSClient;

(() => {
  if (typeof window === undefined) {
    throw new Error(`window object not found`);
  }

  // Check existence of global objects to avoid overwrite/clashing
  if (!("Microsoft" in window)) {
    window.Microsoft = {};
  }

  if (!("CRM" in window.Microsoft)) {
    window.Microsoft.CRM = {};
  }

  if (!("Omnichannel" in window.Microsoft.CRM)) {
    window.Microsoft.CRM.Omnichannel = {};
  }

  if (!("AMSClient" in window.Microsoft.CRM.Omnichannel)) {
    window.Microsoft.CRM.Omnichannel.AMS = {
      SDK: {
        createAMSClient,
        FramedClient,
        FramedlessClient,
      }
    };
  }
})();