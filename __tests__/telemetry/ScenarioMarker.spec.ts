import AMSLogger from '../../src/AMSLogger';
import LogLevel from '../../src/LogLevel';
import ScenarioMarker from '../../src/telemetry/ScenarioMarker';

describe('ScenarioMarker', () => {
    it('ScenarioMarker.startScenario() should create StopWatch & call logger.log() with LogLevel.INFO', () => {
        const scenario = 'scenario';
        const pluggableLogger = {
            logClientSdkTelemetryEvent: jest.fn()
        };

        const logger: any = new AMSLogger(pluggableLogger);
        logger.log = jest.fn();

        const scenarioMarker: any = new ScenarioMarker(logger);
        scenarioMarker.startScenario(scenario);

        const stopWatch = scenarioMarker.telemetryEvents.get(scenario);

        expect(scenarioMarker.telemetryEvents.has(scenario)).toBe(true);
        expect(scenarioMarker.telemetryEvents.size).toBe(1);
        expect(logger.log.mock.calls[0][0]).toBe(LogLevel.INFO);
        expect(logger.log).toHaveBeenCalledTimes(1);
        expect(stopWatch).not.toBe(undefined);
    });

    it('ScenarioMarker.failScenario() should remove StopWatch & call logger.log() with LogLevel.ERROR', () => {
        const scenario = 'scenario';
        const pluggableLogger = {
            logClientSdkTelemetryEvent: jest.fn()
        };

        const logger: any = new AMSLogger(pluggableLogger);
        logger.log = jest.fn();

        const scenarioMarker: any = new ScenarioMarker(logger);
        scenarioMarker.startScenario(scenario);
        scenarioMarker.failScenario(scenario);

        const stopWatch = scenarioMarker.telemetryEvents.get(scenario);

        expect(scenarioMarker.telemetryEvents.has(scenario)).toBe(false);
        expect(scenarioMarker.telemetryEvents.size).toBe(0);
        expect(logger.log).toHaveBeenCalledTimes(2);
        expect(logger.log.mock.calls[0][0]).toBe(LogLevel.INFO);
        expect(logger.log.mock.calls[1][0]).toBe(LogLevel.ERROR);
        expect(stopWatch).toBe(undefined);
    });

    it('ScenarioMarker.completeScenario() should remove StopWatch & call logger.log() with LogLevel.INFO', () => {
        const scenario = 'scenario';
        const pluggableLogger = {
            logClientSdkTelemetryEvent: jest.fn()
        };

        const logger: any = new AMSLogger(pluggableLogger);
        logger.log = jest.fn();

        const scenarioMarker: any = new ScenarioMarker(logger);
        scenarioMarker.startScenario(scenario);
        scenarioMarker.completeScenario(scenario);

        const stopWatch = scenarioMarker.telemetryEvents.get(scenario);

        expect(scenarioMarker.telemetryEvents.has(scenario)).toBe(false);
        expect(scenarioMarker.telemetryEvents.size).toBe(0);
        expect(logger.log).toHaveBeenCalledTimes(2);
        expect(logger.log.mock.calls[0][0]).toBe(LogLevel.INFO);
        expect(logger.log.mock.calls[1][0]).toBe(LogLevel.INFO);
        expect(stopWatch).toBe(undefined);
    });
});