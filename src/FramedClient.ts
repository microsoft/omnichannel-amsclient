import AMSCreateObjectResponse from "./AMSCreateObjectResponse";
import AMSFileInfo from "./AMSFileInfo";
import AMSLogger from "./AMSLogger";
import AMSViewStatusResponse from "./AMSViewStatusResponse";
import {baseUrl, sdkVersion} from "./config";
import FileMetadata from "./FileMetadata";
import GlobalConfiguration from "./GlobalConfiguration";
import InitConfig from "./InitConfig";
import OmnichannelChatToken from "./OmnichannelChatToken";
import platform from "./utils/platform";
import PostMessageEventName from "./PostMessageEventName";
import PostMessageEventType from "./PostMessageEventType";
import PostMessageRequestData from "./PostMessageRequestData";
import { uuidv4 } from "./utils/uuid";

interface RequestCallback {
    resolve: CallableFunction,
    reject: CallableFunction
}

const version = sdkVersion;

const iframePrefix = 'Microsoft_Omnichannel_AMSClient_Iframe_Window';

class FramedClient {
    private clientId: string;
    private iframeId: string;
    private origin: string;
    private targetWindow!: Window; // Reference of window object that sent the message
    private requestCallbacks: Record<string, RequestCallback>;  // eslint-disable-line @typescript-eslint/no-explicit-any
    private debug: boolean;
    private iframeLoaded: boolean;
    private chatToken!: OmnichannelChatToken;
    private logger?: AMSLogger;

    constructor(logger: AMSLogger | undefined = undefined) {
        this.clientId = uuidv4();
        this.origin = window.location.origin;
        this.requestCallbacks = {};
        this.debug = false;
        this.iframeLoaded = false;
        this.logger = logger;
        this.iframeId = iframePrefix;
    }

    /* istanbul ignore next */
    public setDebug(flag: boolean): void {
        this.debug = flag;
    }

    public async setup(): Promise<void> {
        /* istanbul ignore next */
        this.debug && console.log(`[FramedClient][initialize]`);

        this.onMessageEvent((event: MessageEvent) => this.handleEvent(event));  // eslint-disable-line @typescript-eslint/no-explicit-any

        if (!platform.isBrowser()) {
            throw new Error('FramedMode was used in non-Web platform');
        }

        await this.loadIframe();

        if (!this.iframeLoaded) {
            !GlobalConfiguration.silentError && console.error('iframe not loaded');
        }
    }

    public async initialize(initConfig: InitConfig): Promise<void> {
        /* istanbul ignore next */
        this.debug && console.log(`[FramedClient][initialize]`);

        this.chatToken = initConfig.chatToken;

        await this.skypeTokenAuth();
    }

    public async skypeTokenAuth(chatToken: OmnichannelChatToken | null = null): Promise<void> {
        /* istanbul ignore next */
        this.debug && console.log(`[FramedClient][skypeAuth]`);
        const data = {
            chatToken: chatToken || this.chatToken
        };

        await this.loadIframe();

        return new Promise((resolve, reject) => {
            this.postMessage(PostMessageEventType.Request, PostMessageEventName.SkypeTokenAuth, data, resolve, reject);
        })
    }

    public async createObject(id: string, file: File, chatToken: OmnichannelChatToken | null = null): Promise<void> {
        /* istanbul ignore next */
        this.debug && console.log(`[FramedClient][createObject]`);
        const data = {
            id,
            file,
            chatToken: chatToken || this.chatToken
        };

        await this.loadIframe();

        return new Promise((resolve, reject) => {
            this.postMessage(PostMessageEventType.Request, PostMessageEventName.CreateObject, data, resolve, reject);
        })
    }

    public async uploadDocument(documentId: string, file: File | AMSFileInfo, chatToken: OmnichannelChatToken | null = null): Promise<void> {
        /* istanbul ignore next */
        this.debug && console.log(`[FramedClient][uploadDocument]`);
        const data = {
            documentId,
            file,
            chatToken: chatToken || this.chatToken
        };

        await this.loadIframe();

        return new Promise((resolve, reject) => {
            this.postMessage(PostMessageEventType.Request, PostMessageEventName.UploadDocument, data, resolve, reject);
        })
    }

    public async getViewStatus(fileMetadata: FileMetadata, chatToken: OmnichannelChatToken | null = null): Promise<void> {
        const data = {
            fileMetadata,
            chatToken: chatToken || this.chatToken
        }

        await this.loadIframe();

        return new Promise((resolve, reject) => {
            this.postMessage(PostMessageEventType.Request, PostMessageEventName.GetViewStatus, data, resolve, reject);
        })
    }

    public async getView(fileMetadata: FileMetadata, viewLocation: string, chatToken: OmnichannelChatToken | null = null): Promise<void> {
        const data = {
            fileMetadata,
            viewLocation,
            chatToken: chatToken || this.chatToken
        }

        await this.loadIframe();

        return new Promise((resolve, reject) => {
            this.postMessage(PostMessageEventType.Request, PostMessageEventName.GetView, data, resolve, reject);
        })
    }

    public async fetchBlob(contentUrl: string): Promise<Blob> {
        try {
            const response = await fetch(contentUrl);
            const blobResponse = await response.blob();
            return blobResponse;
        } catch (error) {
            !GlobalConfiguration.silentError && console.log(error);
            throw new Error('fetchBlob');
        }
    }

    public onMessageEvent(cb: (event: MessageEvent) => void): void {
        window.addEventListener("message", cb, true);
    }

    public postMessage(eventType: PostMessageEventType, eventName: PostMessageEventName, data: PostMessageRequestData = {}, resolve: CallableFunction = (data: any) => ({}), reject: CallableFunction = (data: any) => ({})): void {  // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
        const requestId = uuidv4();
        this.requestCallbacks[requestId] = {
            resolve,
            reject
        }

        if (!this.targetWindow) {
            !GlobalConfiguration.silentError && console.error('Target window not found!');
            return;
        }

        this.targetWindow.postMessage({
            clientId: this.clientId,
            requestId,
            eventType,
            eventName,
            ...data
        }, '*');
    }

    public async handleEvent(event: MessageEvent): Promise<void> {  // eslint-disable-line @typescript-eslint/no-explicit-any
        if (event.origin !== this.origin && !baseUrl.includes(event.origin)) {
            return;
        }

        /* istanbul ignore next */
        this.debug && console.log(event);

        // Finds target window to post message back
        if (event.source) {
            this.targetWindow = event.source as Window;
        }

        if (event.data.eventType === PostMessageEventType.Response) {
            /* istanbul ignore next */
            this.debug && console.log(`[FramedClient][Response]`);
            const {data} = event;

            if (event.data.eventName === PostMessageEventName.SkypeTokenAuth) {
                if (data.requestId in this.requestCallbacks) {
                    this.requestCallbacks[data.requestId].resolve();
                    delete this.requestCallbacks[data.requestId];
                }
            } else if (event.data.eventName === PostMessageEventName.CreateObject) {
                if (data.requestId in this.requestCallbacks) {
                    this.requestCallbacks[data.requestId].resolve(data.response as AMSCreateObjectResponse);
                    delete this.requestCallbacks[data.requestId];
                }
            } else if (event.data.eventName === PostMessageEventName.UploadDocument) {
                if (data.requestId in this.requestCallbacks) {
                    this.requestCallbacks[data.requestId].resolve(data.response as FileMetadata);
                    delete this.requestCallbacks[data.requestId];
                }
            } else if (event.data.eventName === PostMessageEventName.GetViewStatus) {
                if (data.requestId in this.requestCallbacks) {
                    this.requestCallbacks[data.requestId].resolve(data.response as AMSViewStatusResponse);
                    delete this.requestCallbacks[data.requestId];
                }
            } else if (event.data.eventName === PostMessageEventName.GetView) {
                if (data.requestId in this.requestCallbacks) {
                    this.requestCallbacks[data.requestId].resolve(data.response as Blob);
                    delete this.requestCallbacks[data.requestId];
                }
            } else if (event.data.eventName === PostMessageEventName.SendTelemetry) {
                this.logger?.log(data.logLevel, data.logData.Event, data.logData);
            }
        }
    }

    public dispose(): void {
        document.getElementById(this.iframeId)?.remove();
        this.requestCallbacks = {};
        this.iframeLoaded = false;
    }

    private async loadIframe(): Promise<void> {
        return new Promise ((resolve, reject) => {
            const iframeElements = Array.from(document.getElementsByTagName('iframe'));
            const foundIframeElement = iframeElements.filter(iframeElement => iframeElement.id == this.iframeId);

            // Avoid duplicate load
            if (foundIframeElement.length) {
                return resolve();
            }

            const iframeElement: HTMLIFrameElement = document.createElement('iframe');
            iframeElement.id = this.iframeId;
            iframeElement.src = `${baseUrl}/${version}/iframe.html?clientId=${this.clientId}&debug=${this.debug}&telemetry=true`;

            iframeElement.addEventListener('load', () => {
                /* istanbul ignore next */
                this.debug && console.log('iframe loaded!');
                this.iframeLoaded = true;
                resolve();
            });

            iframeElement.addEventListener('error', () => {
                reject();
            });

            document.head.append(iframeElement);
        });
    }
}

export default FramedClient;