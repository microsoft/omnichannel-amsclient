import AMSLogData from "./AMSLogData";
import API from "./API";
import fetchClientId from "./utils/fetchClientId";
import fetchDebugConfig from "./utils/fetchDebugConfig";
import fetchTelemetryConfig from "./utils/fetchTelemetryConfig";
import PluggableLogger from "./PluggableLogger";
import PostMessageEventName from "./PostMessageEventName";
import PostMessageEventStatus from "./PostMessageEventStatus";
import PostMessageEventType from "./PostMessageEventType";
import PostMessageRequestData from "./PostMessageRequestData";
import LogLevel from "./LogLevel";
import ScenarioMarker from "./telemetry/ScenarioMarker";
import AMSLogger from "./AMSLogger";


class IframeCommunicator {
    private clientId: string;
    private sourceWindow: Window;
    private targetWindow: Window;
    private debug: boolean;
    private telemetryEnabled: boolean;
    private logger: PluggableLogger;
    private scenarioMarker;

    constructor(clientId: string) {
        this.clientId = clientId;
        this.sourceWindow = window;
        this.targetWindow = window.parent;
        this.debug = false;
        this.telemetryEnabled = false;
        this.logger = {
            logClientSdkTelemetryEvent: (logLevel: LogLevel, event: AMSLogData) => {
                this.sendTelemetry(logLevel, event);
            }
        };
        this.scenarioMarker = new ScenarioMarker(new AMSLogger(this.logger));
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
                this.scenarioMarker.startScenario(PostMessageEventName.SkypeTokenAuth, {
                    AMSClientRuntimeId: data.runtimeId,
                    ChatId: data.chatToken.chatId
                });

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
                        this.scenarioMarker.failScenario(PostMessageEventName.SkypeTokenAuth, {
                            AMSClientRuntimeId: data.runtimeId,
                            ChatId: data.chatToken.chatId,
                            ExceptionDetails: {
                                status: response.status
                            }
                        });
                    } else {
                        this.scenarioMarker.completeScenario(PostMessageEventName.SkypeTokenAuth, {
                            AMSClientRuntimeId: data.runtimeId,
                            ChatId: data.chatToken.chatId,
                        });
                    }

                    this.postMessage(PostMessageEventType.Response, PostMessageEventName.SkypeTokenAuth, postMessageData, PostMessageEventStatus.Success);
                } catch (error) {
                    this.postMessage(PostMessageEventType.Response, PostMessageEventName.SkypeTokenAuth, {}, PostMessageEventStatus.Failure);

                    this.scenarioMarker.failScenario(PostMessageEventName.SkypeTokenAuth, {
                        AMSClientRuntimeId: data.runtimeId,
                        ChatId: data.chatToken.chatId,
                        ExceptionDetails: error
                    });
                }
            } else if (event.data.eventName === PostMessageEventName.CreateObject) {
                this.scenarioMarker.startScenario(PostMessageEventName.CreateObject, {
                    AMSClientRuntimeId: data.runtimeId,
                    ChatId: data.chatToken.chatId,
                    MimeType: data.file.type
                });

                try {
                    const response = await API.createObject(data.id, data.file, data.chatToken);
                    const postMessageData = {
                        requestId: data.requestId,
                        eventType: PostMessageEventType.Response,
                        eventName: data.eventName,
                        eventStatus: PostMessageEventStatus.Success,
                        response,
                    };

                    this.scenarioMarker.completeScenario(PostMessageEventName.CreateObject, {
                        AMSClientRuntimeId: data.runtimeId,
                        ChatId: data.chatToken.chatId,
                        DocumentId: response?.id,
                        MimeType: data.file.type
                    });

                    this.postMessage(PostMessageEventType.Response, PostMessageEventName.CreateObject, postMessageData, PostMessageEventStatus.Success);
                } catch (error) {
                    this.postMessage(PostMessageEventType.Response, PostMessageEventName.CreateObject, {}, PostMessageEventStatus.Failure);

                    this.scenarioMarker.failScenario(PostMessageEventName.CreateObject, {
                        AMSClientRuntimeId: data.runtimeId,
                        ChatId: data.chatToken.chatId,
                        MimeType: data.file.type, 
                        ExceptionDetails: error
                    });
                }
            } else if (event.data.eventName === PostMessageEventName.UploadDocument) {
                this.scenarioMarker.startScenario(PostMessageEventName.UploadDocument, {
                    AMSClientRuntimeId: data.runtimeId,
                    ChatId: data.chatToken.chatId,
                    DocumentId: data.documentId,
                    MimeType: data.file.type
                });

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

                    this.scenarioMarker.completeScenario(PostMessageEventName.UploadDocument, {
                        AMSClientRuntimeId: data.runtimeId,
                        ChatId: data.chatToken.chatId,
                        DocumentId: data.documentId,
                        MimeType: data.file.type
                    });

                    this.postMessage(PostMessageEventType.Response, PostMessageEventName.UploadDocument, postMessageData, PostMessageEventStatus.Success);
                } catch (error) {
                    this.postMessage(PostMessageEventType.Response, PostMessageEventName.UploadDocument, {}, PostMessageEventStatus.Failure);

                    this.scenarioMarker.failScenario(PostMessageEventName.UploadDocument, {
                        AMSClientRuntimeId: data.runtimeId,
                        ChatId: data.chatToken.chatId,
                        DocumentId: data.documentId,
                        MimeType: data.file.type,
                        ExceptionDetails: error
                    });
                }
            } else if (event.data.eventName === PostMessageEventName.GetViewStatus) {
                this.scenarioMarker.startScenario(PostMessageEventName.GetViewStatus, {
                    AMSClientRuntimeId: data.runtimeId,
                    ChatId: data.chatToken.chatId,
                    DocumentId: data.fileMetadata?.id,
                    MimeType: data.fileMetadata?.type
                });

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

                    this.scenarioMarker.completeScenario(PostMessageEventName.GetViewStatus, {
                        AMSClientRuntimeId: data.runtimeId,
                        ChatId: data.chatToken.chatId,
                        DocumentId: data.fileMetadata?.id,
                        MimeType: data.fileMetadata?.type
                    });

                    this.postMessage(PostMessageEventType.Response, PostMessageEventName.GetViewStatus, postMessageData, PostMessageEventStatus.Success);
                } catch (error) {
                    this.postMessage(PostMessageEventType.Response, PostMessageEventName.GetViewStatus, {}, PostMessageEventStatus.Failure);

                    this.scenarioMarker.failScenario(PostMessageEventName.GetViewStatus, {
                        AMSClientRuntimeId: data.runtimeId,
                        ChatId: data.chatToken.chatId,
                        DocumentId: data.fileMetadata?.id,
                        MimeType: data.fileMetadata?.type,
                        ExceptionDetails: error
                    });
                }
            } else if (event.data.eventName === PostMessageEventName.GetView) {
                this.scenarioMarker.startScenario(PostMessageEventName.GetView, {
                    AMSClientRuntimeId: data.runtimeId,
                    ChatId: data.chatToken.chatId,
                    DocumentId: data.fileMetadata?.id,
                    MimeType: data.fileMetadata?.type
                });

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

                    this.scenarioMarker.completeScenario(PostMessageEventName.GetView, {
                        AMSClientRuntimeId: data.runtimeId,
                        ChatId: data.chatToken.chatId,
                        DocumentId: data.fileMetadata?.id,
                        MimeType: data.fileMetadata?.type
                    });

                    this.postMessage(PostMessageEventType.Response, PostMessageEventName.GetView, postMessageData, PostMessageEventStatus.Success);
                } catch (error) {
                    this.postMessage(PostMessageEventType.Response, PostMessageEventName.GetView, {}, PostMessageEventStatus.Failure);

                    this.scenarioMarker.failScenario(PostMessageEventName.GetView, {
                        AMSClientRuntimeId: data.runtimeId,
                        ChatId: data.chatToken.chatId,
                        DocumentId: data.fileMetadata?.id,
                        MimeType: data.fileMetadata?.type,
                        ExceptionDetails: error
                    });
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