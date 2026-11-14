/**
 * Removes object ids, query strings and fragments from an AMS request URL so it is safe to log.
 */
const sanitizeRequestPath = (url?: string): string => {
    if (!url) {
        return '';
    }

    return url.split(/[?#]/)[0].replace(/\/objects\/[^/]+/, '/objects/{id}');
};

export default sanitizeRequestPath;