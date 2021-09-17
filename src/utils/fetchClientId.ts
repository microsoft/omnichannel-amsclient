const fetchClientId = (): string => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('clientId') !== null) {
        return urlParams.get('clientId') as string;
    }

    return '';
}

export default fetchClientId;