import { AMSError } from "../src/AMSError";
import { createOperationError, extractErrorDetails } from "../src/AMSOperationError";

describe('AMSOperationError', () => {
    const rawUrl = 'https://ams/v1/objects/0-wus-d1-abc/views/original/status?x=1';
    const safeUrl = 'https://ams/v1/objects/{id}/views/original/status';

    it('extractErrorDetails should redact the object id from requestUrl', () => {
        const details = extractErrorDetails(new AMSError('AMSGetViewStatusFailed: 401 Unauthorized', rawUrl, undefined, 401));

        expect(details).toEqual({ message: 'AMSGetViewStatusFailed: 401 Unauthorized', status: 401, requestUrl: safeUrl });
    });

    it('createOperationError should redact the object id from requestUrl', () => {
        const error = createOperationError('getViewStatus', { status: 401, requestUrl: rawUrl });

        expect(error.message).toBe('getViewStatus');
        expect(error.status).toBe(401);
        expect(error.requestUrl).toBe(safeUrl);
    });

    it('serialized operation error should not contain the object id', () => {
        const error = createOperationError('getView', extractErrorDetails(new AMSError('AMSGetViewFailed: 404 Not Found', rawUrl, undefined, 404)));

        expect(JSON.stringify(error)).not.toContain('0-wus-d1-abc');
    });
});
