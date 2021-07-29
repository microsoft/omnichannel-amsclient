export default interface AMSLogData {
    ChatId: string;
    ElapsedTimeInMilliseconds?: number;
    Event?: string;
    Description?: string;
    ExceptionDetails?: Record<string, unknown>;
    AMSClientVersion: string;
}