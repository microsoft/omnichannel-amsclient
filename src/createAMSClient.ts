import AMSLogger from "./AMSLogger";
import FramedClient from "./FramedClient";
import FramedlessClient from "./FramedlessClient";
import PluggableLogger from "./PluggableLogger";

interface AMSConfig {
    framedMode: boolean,
    debug?: boolean,
    logger?: PluggableLogger
}

const createAMSClient = async (config: AMSConfig): Promise<FramedClient | FramedlessClient> => {

    (config as AMSConfig).debug && console.log(`[createAMSClient] ${config.framedMode? 'FramedClient': 'FramedlessClient'}`);

    const logger = new AMSLogger(config.logger);
    const client = config.framedMode? new FramedClient(logger): new FramedlessClient(logger);
    (config as AMSConfig).debug && client.setDebug((config as AMSConfig).debug || false);

    return client;
}

export default createAMSClient;