export class AMSError extends Error {
    public requestUrl: string;
    public originalError?: any;

    constructor(message: string, requestUrl: string, originalError?: any) {
        super(message);
        this.name = 'AMSError';
        this.requestUrl = requestUrl;
        this.originalError = originalError;
    }
}