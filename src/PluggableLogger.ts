import AMSLogData from "./AMSLogData";
import LogLevel from "./LogLevel";

export default interface PluggableLogger {
    logClientSdkTelemetryEvent(logLevel: LogLevel, event: AMSLogData): void;
}