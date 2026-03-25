import AMSLogger from "./AMSLogger";
import FramedClient from "./FramedClient";
import FramedlessClient from "./FramedlessClient";
import GlobalConfiguration from "./GlobalConfiguration";
import PluggableLogger from "./PluggableLogger";
import { isSafariOrIOSWebView } from "./utils/platform";

interface AMSConfig {
    framedMode: boolean,
    debug?: boolean,
    logger?: PluggableLogger,
    silentError?: boolean,
    multiClient?: boolean,
    baseUrl?: string
}

const applyGlobalConfig = (client: FramedClient | FramedlessClient, config: AMSConfig): void => {
    config.debug && client.setDebug(config.debug || false);
    GlobalConfiguration.debug = config.debug || false;
    GlobalConfiguration.silentError = config.silentError || true;
};

const createAMSClient = async (config: AMSConfig): Promise<FramedClient | FramedlessClient> => {
    const logger = new AMSLogger(config.logger);
    const hasValidBaseUrl = !!config.baseUrl && config.baseUrl.startsWith('http');
    const useFramed = config.framedMode && !isSafariOrIOSWebView() && hasValidBaseUrl;

    config.debug && console.log(`[createAMSClient] ${useFramed ? 'FramedClient' : 'FramedlessClient'}${config.framedMode && !useFramed ? ` (fallback: ${!hasValidBaseUrl ? 'no baseUrl' : 'Safari/iOS'})` : ''}`);
    config.debug && console.time("createAMSClient");

    if (useFramed) {
        try {
            const framedClientConfig = {
                multiClient: config.multiClient || false,
                baseUrl: config.baseUrl || "",
            };
            const client = new FramedClient(logger, framedClientConfig);
            await client.setup();
            applyGlobalConfig(client, config);
            config.debug && console.timeEnd("createAMSClient");
            return client;
        } catch (error) {
            config.debug && console.warn('[createAMSClient] FramedClient setup failed, falling back to FramedlessClient:', error);
            // Fall through to FramedlessClient
        }
    }

    const client = new FramedlessClient(logger);
    await client.setup();
    applyGlobalConfig(client, config);
    config.debug && console.timeEnd("createAMSClient");
    return client;
}

export default createAMSClient;