interface DebugConfig {
    disable: boolean
}

const fetchDebugConfig = (): DebugConfig => {
    const debugConfig = {
        disable: true
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('debug') !== null) {
        debugConfig.disable = urlParams.get('debug') == 'true'? false: true;
    }

    return debugConfig;
}

export default fetchDebugConfig;