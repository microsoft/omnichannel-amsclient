interface TelemetryConfig {
    disable: boolean
}

const fetchTelemetryConfig = (): TelemetryConfig => {
    const telemetryConfig = {
        disable: false
    };

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('telemetry') !== null) {
        telemetryConfig.disable = urlParams.get('telemetry') == 'true'? false: true;
    }

    return telemetryConfig;
}

export default fetchTelemetryConfig;