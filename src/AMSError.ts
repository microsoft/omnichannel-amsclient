export class AMSError extends Error {
    public requestUrl: string;
    public originalError?: any;
    public status?: number;

    constructor(message: string, requestUrl: string, originalError?: any, status?: number) {
        super(message);
        // Keeps instanceof working when compiled to ES5.
        Object.setPrototypeOf(this, AMSError.prototype);
        this.name = 'AMSError';
        this.requestUrl = requestUrl;
        this.originalError = originalError;
        this.status = status;
    }
}