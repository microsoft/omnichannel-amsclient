/**
 * @jest-environment jsdom
 */

import API from "../src/API";
import { AMSError } from "../src/AMSError";
import FramedClient from "../src/FramedClient";
import IframeCommunicator from "../src/IframeCommunicator";
import PostMessageEventName from "../src/PostMessageEventName";
import PostMessageEventStatus from "../src/PostMessageEventStatus";
import PostMessageEventType from "../src/PostMessageEventType";

describe('IframeCommunicator', () => {
    const clientId = 'clientId';
    const chatToken = { chatId: 'chatId', token: 'token' };
    const fileMetadata = { fileSharingProtocolType: 0, id: 'id', name: 'name.txt', size: 0, type: 'text/plain', url: 'url' };
    const file = new File([""], "filename.txt", { type: 'text/plain' });

    const cases: [PostMessageEventName, keyof typeof API, Record<string, unknown>][] = [
        [PostMessageEventName.SkypeTokenAuth, 'skypeTokenAuth', {}],
        [PostMessageEventName.CreateObject, 'createObject', { id: 'id', file }],
        [PostMessageEventName.UploadDocument, 'uploadDocument', { documentId: 'id', file }],
        [PostMessageEventName.GetViewStatus, 'getViewStatus', { fileMetadata }],
        [PostMessageEventName.GetView, 'getView', { fileMetadata, viewLocation: 'viewLocation' }]
    ];

    beforeEach(() => {
        jest.restoreAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    it.each(cases)('%s failure should reply with requestId and HTTP status', async (eventName, apiName, request) => {
        const communicator = new IframeCommunicator(clientId);
        const postMessage = jest.spyOn(communicator, 'postMessage').mockImplementation(() => {});
        jest.spyOn(API, apiName).mockRejectedValue(new AMSError('AMS failed: 401 Unauthorized', 'https://ams/v1/objects', undefined, 401));

        await communicator.handleEvent({
            data: { clientId, runtimeId: 'runtimeId', requestId: 'requestId', eventType: PostMessageEventType.Request, eventName, replyOnFailure: true, chatToken, ...request }
        } as any);

        expect(postMessage).toHaveBeenCalledWith(
            PostMessageEventType.Response,
            eventName,
            expect.objectContaining({
                requestId: 'requestId',
                eventStatus: PostMessageEventStatus.Failure,
                error: expect.objectContaining({ status: 401 })
            }),
            PostMessageEventStatus.Failure
        );
    });

    it.each(cases)('%s failure from a legacy parent keeps its existing reply shape', async (eventName, apiName, request) => {
        const communicator = new IframeCommunicator(clientId);
        const postMessage = jest.spyOn(communicator, 'postMessage').mockImplementation(() => {});
        jest.spyOn(API, apiName).mockRejectedValue(new AMSError('AMS failed: 401 Unauthorized', 'https://ams/v1/objects', undefined, 401));

        await communicator.handleEvent({
            data: { clientId, runtimeId: 'runtimeId', requestId: 'requestId', eventType: PostMessageEventType.Request, eventName, chatToken, ...request }
        } as any);

        const isView = eventName === PostMessageEventName.GetViewStatus || eventName === PostMessageEventName.GetView;
        expect(postMessage).toHaveBeenCalledWith(
            PostMessageEventType.Response,
            eventName,
            isView ? {} : expect.objectContaining({ requestId: 'requestId', eventStatus: PostMessageEventStatus.Failure }),
            PostMessageEventStatus.Failure
        );
    });

    it.each(cases.slice(3))('%s failure round trip rejects with status instead of resolving file data', async (eventName, apiName, request) => {
        const client = new FramedClient();
        const sendRequest = jest.fn();
        (client as any).targetWindow = { postMessage: sendRequest };
        const resolve = jest.fn();
        const reject = jest.fn();

        client.postMessage(PostMessageEventType.Request, eventName, { chatToken, ...request }, resolve, reject);

        const requestData = sendRequest.mock.calls[0][0];
        const communicator = new IframeCommunicator(requestData.clientId);
        const sendResponse = jest.spyOn(communicator, 'postMessage').mockImplementation(() => {});
        jest.spyOn(API, apiName).mockRejectedValue(new AMSError('AMS failed: 401 Unauthorized', 'https://ams/v1/objects/object-id/views/original?secret=value', undefined, 401));

        await communicator.handleEvent({ data: requestData } as MessageEvent);
        const [eventType, responseEventName, data, eventStatus] = sendResponse.mock.calls[0];
        await client.handleEvent({
            origin: window.location.origin,
            source: null,
            data: { clientId: requestData.clientId, eventType, eventName: responseEventName, eventStatus, ...data }
        } as MessageEvent);

        expect(resolve).not.toHaveBeenCalled();
        expect(reject).toHaveBeenCalledTimes(1);
        expect(reject.mock.calls[0][0]).toMatchObject({
            message: apiName,
            status: 401,
            requestUrl: 'https://ams/v1/objects/{id}/views/original'
        });
        expect((client as any).requestCallbacks).toEqual({});
    });
});