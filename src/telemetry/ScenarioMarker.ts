import AMSLogger from "../AMSLogger";
import LogLevel from "../LogLevel";
import { sdkVersion } from "../config";
import { completeEvent, failEvent, startEvent } from "./EventMarker";
import StopWatch from "./StopWatch";
import AMSLogData from "../AMSLogData";

class ScenarioMarker {
    private runtimeId = '';
    private sdkVersion = '';
    private telemetryEvents: Map<string, StopWatch>;
    private logger: AMSLogger;

    constructor(logger: AMSLogger) {
        this.logger = logger;
        this.sdkVersion = sdkVersion;
        this.telemetryEvents = new Map();
    }

    public setRuntimeId(runtimeId: string): void {
        this.runtimeId = runtimeId;
    }

    public startScenario(event: string, additionalProperties = {}): void {
        if (!this.telemetryEvents.has(event)) {
            const stopWatch = new StopWatch();
            stopWatch.start();
            this.telemetryEvents.set(event, stopWatch);
        }

        const properties = {
            AMSClientRuntimeId: this.runtimeId,
            Event: startEvent(event),
            AMSClientVersion: this.sdkVersion,
            ...additionalProperties
        };

        this.logger.log(LogLevel.INFO, event, properties as AMSLogData);
    }

    public failScenario(event: string, additionalProperties = {}): void {
        if (!this.telemetryEvents.has(event)) {
            console.warn(`'${event}' event has not started.`);
            return;
        }

        const stopWatch = this.telemetryEvents.get(event);
        this.telemetryEvents.delete(event);

        const properties = {
            AMSClientRuntimeId: this.runtimeId,
            Event: failEvent(event),
            AMSClientVersion: this.sdkVersion,
            ElapsedTimeInMilliseconds: stopWatch!.stop(), // eslint-disable-line @typescript-eslint/no-non-null-assertion
            ...additionalProperties
        };

        this.logger.log(LogLevel.ERROR, event, properties as AMSLogData);
    }

    public completeScenario(event: string, additionalProperties = {}): void {
        if (!this.telemetryEvents.has(event)) {
            console.warn(`'${event}' event has not started.`);
            return;
        }

        const stopWatch = this.telemetryEvents.get(event);
        this.telemetryEvents.delete(event);

        const properties = {
            AMSClientRuntimeId: this.runtimeId,
            Event: completeEvent(event),
            AMSClientVersion: this.sdkVersion,
            ElapsedTimeInMilliseconds: stopWatch!.stop(), // eslint-disable-line @typescript-eslint/no-non-null-assertion
            ...additionalProperties
        };

        this.logger.log(LogLevel.INFO, event, properties as AMSLogData);
    }
}

export default ScenarioMarker;