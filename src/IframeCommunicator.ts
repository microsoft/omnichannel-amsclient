import API from "./API";
import fetchClientId from "./utils/fetchClientId";
import fetchDebugConfig from "./utils/fetchDebugConfig";
import fetchTelemetryConfig from "./utils/fetchTelemetryConfig";
import PostMessageEventName from "./PostMessageEventName";
import PostMessageEventStatus from "./PostMessageEventStatus";
import PostMessageEventType from "./PostMessageEventType";
import PostMessageRequestData from "./PostMessageRequestData";
import LogLevel from "./LogLevel";
import AMSLogData from "./AMSLogData";
import { sdkVersion } from "./config";


class IframeCommunicator {
    private clientId: string;
    private sourceWindow: Window;
    private targetWindow: Window;
    private debug: boolean;
    private telemetryEnabled: boolean;

    constructor(clientId: string) {
        this.clientId = clientId;
        this.sourceWindow = window;
        this.targetWindow = window.parent;
        this.debug = false;
        this.telemetryEnabled = false;
    }

    public setDebug(flag: boolean): void {
        this.debug = flag;
    }

    public enableTelemetry(): void {
        this.debug && console.log("[IframeCommunicator][enableTelemetry]");
        this.telemetryEnabled = true;
    }

    public async initialize(): Promise<void> {
        this.onMessageEvent((event: MessageEvent<any>) => this.handleEvent(event));  // eslint-disable-line @typescript-eslint/no-explicit-any

        // Posts message for FramedClient to find target window for posting upcoming messages
        this.postMessage(PostMessageEventType.Response, PostMessageEventName.IframeLoaded, {}, PostMessageEventStatus.Success);
    }

    public onMessageEvent(cb: (this: Window, ev: MessageEvent<any>) => any): void {  // eslint-disable-line @typescript-eslint/no-explicit-any
        this.sourceWindow.addEventListener("message", cb);
    }

    public postMessage(eventType: PostMessageEventType, eventName: PostMessageEventName, data: PostMessageRequestData = {}, eventStatus: PostMessageEventStatus): void {
        this.targetWindow.postMessage({
            clientId: this.clientId,
            eventType,
            eventName,
            eventStatus,
            ...data
        }, '*');
    }

    public async handleEvent(event: MessageEvent<any>): Promise<void> {  // eslint-disable-line @typescript-eslint/no-explicit-any
        if (event.data.clientId !== this.clientId) {
            return;
        }

        // Listens to incoming requests & calls AMS
        if (event.data.eventType === PostMessageEventType.Request) {
            this.debug && console.log(`[IframeCommunicator][Request]`);
            const {data} = event;

            if (event.data.eventName === PostMessageEventName.SkypeTokenAuth) {
                try {
                    const response = await API.skypeTokenAuth(data.chatToken);
                    const postMessageData = {
                        requestId: data.requestId,
                        eventType: PostMessageEventType.Response,
                        eventName: data.eventName,
                        eventStatus: PostMessageEventStatus.Success
                    };

                    if (!response.ok) {
                        postMessageData.eventStatus = PostMessageEventStatus.Failure;

                        this.sendTelemetry(
                            LogLevel.ERROR,
                            {
                                ChatId: data.chatToken.chatId,
                                AMSClientVersion: sdkVersion,
                                Event: PostMessageEventName.SkypeTokenAuth,
                                ExceptionDetails: {
                                    status: response.status
                                }
                            }
                        )
                    }

                    this.postMessage(PostMessageEventType.Response, PostMessageEventName.SkypeTokenAuth, postMessageData, PostMessageEventStatus.Success);
                } catch (error) {
                    this.postMessage(PostMessageEventType.Response, PostMessageEventName.SkypeTokenAuth, {}, PostMessageEventStatus.Failure);

                    this.sendTelemetry(
                        LogLevel.ERROR,
                        {
                            ChatId: data.chatToken.chatId,
                            AMSClientVersion: sdkVersion,
                            Event: PostMessageEventName.SkypeTokenAuth,
                            ExceptionDetails: error
                        }
                    )
                }
            } else if (event.data.eventName === PostMessageEventName.CreateObject) {
                try {
                    const response = await API.createObject(data.id, data.file, data.chatToken);
                    const postMessageData = {
                        requestId: data.requestId,
                        eventType: PostMessageEventType.Response,
                        eventName: data.eventName,
                        eventStatus: PostMessageEventStatus.Success,
                        response,
                    };

                    this.postMessage(PostMessageEventType.Response, PostMessageEventName.CreateObject, postMessageData, PostMessageEventStatus.Success);
                } catch (error) {
                    this.postMessage(PostMessageEventType.Response, PostMessageEventName.CreateObject, {}, PostMessageEventStatus.Failure);

                    this.sendTelemetry(
                        LogLevel.ERROR,
                        {
                            ChatId: data.chatToken.chatId,
                            AMSClientVersion: sdkVersion,
                            Event: PostMessageEventName.CreateObject,
                            ExceptionDetails: error
                        }
                    )
                }
            } else if (event.data.eventName === PostMessageEventName.UploadDocument) {
                try {
                    const response = await API.uploadDocument(data.documentId, data.file, data.chatToken);
                    const postMessageData = {
                        requestId: data.requestId,
                        eventType: PostMessageEventType.Response,
                        eventName: data.eventName,
                        eventStatus: PostMessageEventStatus.Success,
                        response,
                        data: response,
                    };

                    this.postMessage(PostMessageEventType.Response, PostMessageEventName.UploadDocument, postMessageData, PostMessageEventStatus.Success);
                } catch (error) {
                    this.postMessage(PostMessageEventType.Response, PostMessageEventName.UploadDocument, {}, PostMessageEventStatus.Failure);

                    this.sendTelemetry(
                        LogLevel.ERROR,
                        {
                            ChatId: data.chatToken.chatId,
                            AMSClientVersion: sdkVersion,
                            Event: PostMessageEventName.UploadDocument,
                            ExceptionDetails: error
                        }
                    )
                }
            } else if (event.data.eventName === PostMessageEventName.GetViewStatus) {
                try {
                    const response = await API.getViewStatus(data.fileMetadata, data.chatToken);
                    const postMessageData = {
                        requestId: data.requestId,
                        eventType: PostMessageEventType.Response,
                        eventName: data.eventName,
                        eventStatus: PostMessageEventStatus.Success,
                        response,
                        data: response,
                    };

                    this.postMessage(PostMessageEventType.Response, PostMessageEventName.GetViewStatus, postMessageData, PostMessageEventStatus.Success);
                } catch (error) {
                    this.postMessage(PostMessageEventType.Response, PostMessageEventName.GetViewStatus, {}, PostMessageEventStatus.Failure);

                    this.sendTelemetry(
                        LogLevel.ERROR,
                        {
                            ChatId: data.chatToken.chatId,
                            AMSClientVersion: sdkVersion,
                            Event: PostMessageEventName.GetViewStatus,
                            ExceptionDetails: error
                        }
                    )
                }
            } else if (event.data.eventName === PostMessageEventName.GetView) {
                try {
                    const response = await API.getView(data.fileMetadata, data.viewLocation, data.chatToken);
                    const postMessageData = {
                        requestId: data.requestId,
                        eventType: PostMessageEventType.Response,
                        eventName: data.eventName,
                        eventStatus: PostMessageEventStatus.Success,
                        response,
                        data: response,
                    };

                    this.postMessage(PostMessageEventType.Response, PostMessageEventName.GetView, postMessageData, PostMessageEventStatus.Success);
                } catch (error) {
                    this.postMessage(PostMessageEventType.Response, PostMessageEventName.GetView, {}, PostMessageEventStatus.Failure);

                    this.sendTelemetry(
                        LogLevel.ERROR,
                        {
                            ChatId: data.chatToken.chatId,
                            AMSClientVersion: sdkVersion,
                            Event: PostMessageEventName.GetView,
                            ExceptionDetails: error
                        }
                    )
                }
            }
        }
    }

    private sendTelemetry(logLevel: LogLevel, logData: AMSLogData): void {
        const data = {
            logLevel,
            logData
        }

        if (this.telemetryEnabled) {
            this.postMessage(PostMessageEventType.Response, PostMessageEventName.SendTelemetry, data, PostMessageEventStatus.Success);
        }
    }
}

export default IframeCommunicator;

(() => {
    const clientId = fetchClientId();
    const telemetryConfig = fetchTelemetryConfig();
    const debugConfig = fetchDebugConfig();

    !debugConfig.disable && console.log("[IframeCommunicator][init]");

    const iframeCommunicator = new IframeCommunicator(clientId);
    iframeCommunicator.initialize();
    iframeCommunicator.setDebug(!debugConfig.disable);
    !telemetryConfig.disable && iframeCommunicator.enableTelemetry();
})();