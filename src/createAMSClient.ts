import AMSLogger from "./AMSLogger";
import FramedClient from "./FramedClient";
import FramedlessClient from "./FramedlessClient";
import GlobalConfiguration from "./GlobalConfiguration";
import PluggableLogger from "./PluggableLogger";

interface AMSConfig {
    framedMode: boolean,
    debug?: boolean,
    logger?: PluggableLogger,
    silentError?: boolean
}

const createAMSClient = async (config: AMSConfig): Promise<FramedClient | FramedlessClient> => {

    (config as AMSConfig).debug && console.log(`[createAMSClient] ${config.framedMode? 'FramedClient': 'FramedlessClient'}`);

    const logger = new AMSLogger(config.logger);
    const client = config.framedMode? new FramedClient(logger): new FramedlessClient(logger);
    (config as AMSConfig).debug && client.setDebug((config as AMSConfig).debug || false);

    GlobalConfiguration.debug = (config as AMSConfig).debug || false;
    GlobalConfiguration.silentError = (config as AMSConfig).silentError || true;

    return client;
}

export default createAMSClient;