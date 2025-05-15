import AMSLogger from "./AMSLogger";
import FramedClient from "./FramedClient";
import FramedlessClient from "./FramedlessClient";
import GlobalConfiguration from "./GlobalConfiguration";
import PluggableLogger from "./PluggableLogger";

interface AMSConfig {
    framedMode: boolean,
    debug?: boolean,
    logger?: PluggableLogger,
    silentError?: boolean,
    multiClient?: boolean,
    baseUrl?: string
}

const createAMSClient = async (config: AMSConfig): Promise<FramedClient | FramedlessClient> => {

    (config as AMSConfig).debug && console.log(`[createAMSClient] ${config.framedMode? 'FramedClient': 'FramedlessClient'}`);
    (config as AMSConfig).debug && console.time("createAMSClient");

    const logger = new AMSLogger(config.logger);
    const framedClientConfig = {
        multiClient: config.multiClient || false,
        baseUrl: config.baseUrl || "",
    };

    const client = config.framedMode? new FramedClient(logger, framedClientConfig): new FramedlessClient(logger);
    await client.setup();

    (config as AMSConfig).debug && client.setDebug((config as AMSConfig).debug || false);
    GlobalConfiguration.debug = (config as AMSConfig).debug || false;
    GlobalConfiguration.silentError = (config as AMSConfig).silentError || true;

    (config as AMSConfig).debug && console.timeEnd("createAMSClient");
    return client;
}

export default createAMSClient;