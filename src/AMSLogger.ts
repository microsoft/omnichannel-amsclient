import AMSLogData from "./AMSLogData";
import LogLevel from "./LogLevel";
import PluggableLogger from "./PluggableLogger";


class AMSLogger {
    private debug = false;
    private logger?: PluggableLogger;

    constructor(logger?: PluggableLogger) {
        this.debug = false;
        this.logger = logger;
    }

    /* istanbul ignore next */
    public setDebug(flag: boolean): void {
        this.debug = flag;
    }

    public log(logLevel: LogLevel, telemetryEvent: string, customData: AMSLogData): void {
        const logData = {
            Event: telemetryEvent,
            ...customData
        }

        /* istanbul ignore next */
        this.debug && console.log(logData);

        this.logger?.logClientSdkTelemetryEvent(logLevel, logData);
    }
}

export default AMSLogger;