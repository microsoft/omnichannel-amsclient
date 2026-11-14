import AMSFileInfo from "./AMSFileInfo";
import AMSLogData from "./AMSLogData";
import LogLevel from "./LogLevel";
import OmnichannelChatToken from "./OmnichannelChatToken";
import PostMessageEventName from "./PostMessageEventName";
import PostMessageEventStatus from "./PostMessageEventStatus";
import PostMessageEventType from "./PostMessageEventType";
import { AMSOperationErrorDetails } from "./AMSOperationError";

interface PostMessageRequestData {
    requestId?: string;
    replyOnFailure?: boolean;
    id?: string;
    file?: File | AMSFileInfo;
    chatToken?: OmnichannelChatToken;
    documentId?: string;
    fileMetadata?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    viewLocation?: string;
    logLevel?: LogLevel;
    logData?: AMSLogData;
    eventType?: PostMessageEventType;
    eventName?: PostMessageEventName;
    eventStatus?: PostMessageEventStatus;
    error?: AMSOperationErrorDetails;
}

export default PostMessageRequestData;