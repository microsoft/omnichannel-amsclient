/**
 * @jest-environment jsdom
 */

import API from "../src/API";
import FramedlessClient from "../src/FramedlessClient";

describe('FramedlessClient', () => {

    it('FramedlessClient.setup() should be callable', async () => {
        const client = new FramedlessClient();
        expect(await client.setup()).toBe(undefined);
    });

    it('FramedlessClient.initialize() should call skypeTokenAuth()', async () => {
        const client = new FramedlessClient();
        const token = {
            chatId: '',
            token: ''
        };

        jest.spyOn(client, 'skypeTokenAuth').mockResolvedValue(Promise.resolve({}) as any);

        await client.initialize({chatToken: token});

        expect(client.skypeTokenAuth).toHaveBeenCalledTimes(1);
    });

    it('FramedlessClient.skypeTokenAuth() should call API.skypeTokenAuth()', async () => {
        const client = new FramedlessClient();
        const token = {
            chatId: '',
            token: ''
        };

        jest.spyOn(API, 'skypeTokenAuth').mockResolvedValue(Promise.resolve({}) as any);

        await client.skypeTokenAuth(token);

        expect(API.skypeTokenAuth).toHaveBeenCalledTimes(1);
    });

    it('FramedlessClient.skypeTokenAuth() should throw an error if API call does not succeed', async () => {
        const client = new FramedlessClient();
        const token = {
            chatId: '',
            token: ''
        };

        jest.spyOn(API, 'skypeTokenAuth').mockRejectedValue(Promise.reject());

        try {
            await client.skypeTokenAuth(token);
        } catch (error) {
            expect(error).not.toBe(undefined);
        }
    });

    it('FramedlessClient.createObject() should call API.createObject()', async () => {
        const client = new FramedlessClient();
        const id = 'id';
        const file =  new File([""], "filename", { type: 'text/html' });
        const token = {
            chatId: '',
            token: ''
        };

        jest.spyOn(API, 'createObject').mockResolvedValue(Promise.resolve({}) as any);

        await client.createObject(id, file, token);

        expect(API.createObject).toHaveBeenCalledTimes(1);
    });


    it('FramedlessClient.createObject() should throw an error if API call does not succeed', async () => {
        const client = new FramedlessClient();
        const id = 'id';
        const file =  new File([""], "filename", { type: 'text/html' });
        const token = {
            chatId: '',
            token: ''
        };

        jest.spyOn(API, 'createObject').mockRejectedValue(Promise.reject());

        try {
            await client.createObject(id, file, token);
        } catch (error) {
            expect(error).not.toBe(undefined);
        }
    });

    it('FramedlessClient.uploadDocument() should call API.uploadDocument()', async () => {
        const client = new FramedlessClient();
        const documentId = 'documentId';
        const file =  new File([""], "filename", { type: 'text/html' });
        const token = {
            chatId: '',
            token: ''
        };

        jest.spyOn(API, 'uploadDocument').mockResolvedValue(Promise.resolve({}) as any);

        await client.uploadDocument(documentId, file, token);

        expect(API.uploadDocument).toHaveBeenCalledTimes(1);
    });

    it('FramedlessClient.uploadDocument() should throw an error if API call does not succeed', async () => {
        const client = new FramedlessClient();
        const documentId = 'documentId';
        const file =  new File([""], "filename", { type: 'text/html' });
        const token = {
            chatId: '',
            token: ''
        };

        jest.spyOn(API, 'uploadDocument').mockRejectedValue(Promise.reject());

        try {
            await client.uploadDocument(documentId, file, token);
        } catch (error) {
            expect(error).not.toBe(undefined);
        }
    });

    it('FramedlessClient.getViewStatus() should call API.getViewStatus()', async () => {
        const client = new FramedlessClient();
        const fileMetadata = {
            fileSharingProtocolType: 0,
            id: 'id',
            name: 'name',
            size: 0,
            type: 'type',
            url: 'url'
        };
        const token = {
            chatId: '',
            token: ''
        };

        jest.spyOn(API, 'getViewStatus').mockResolvedValue(Promise.resolve({}) as any);

        await client.getViewStatus(fileMetadata, token);

        expect(API.getViewStatus).toHaveBeenCalledTimes(1);
    });

    it('FramedlessClient.getViewStatus() should throw an error if API call does not succeed', async () => {
        const client = new FramedlessClient();
        const fileMetadata = {
            fileSharingProtocolType: 0,
            id: 'id',
            name: 'name',
            size: 0,
            type: 'type',
            url: 'url'
        };
        const token = {
            chatId: '',
            token: ''
        };

        jest.spyOn(API, 'getViewStatus').mockRejectedValue(Promise.reject());

        try {
            await client.getViewStatus(fileMetadata, token);
        } catch (error) {
            expect(error).not.toBe(undefined);
        }
    });

    it('FramedlessClient.getView() should call API.getView()', async () => {
        const client = new FramedlessClient();
        const fileMetadata = {
            fileSharingProtocolType: 0,
            id: 'id',
            name: 'name',
            size: 0,
            type: 'type',
            url: 'url'
        };
        const viewLocation = 'viewLocation';
        const token = {
            chatId: '',
            token: ''
        };

        jest.spyOn(API, 'getView').mockResolvedValue(Promise.resolve({}) as any);

        await client.getView(fileMetadata, viewLocation, token);

        expect(API.getView).toHaveBeenCalledTimes(1);
    });

    it('FramedlessClient.getView() should throw an error if API call does not succeed', async () => {
        const client = new FramedlessClient();
        const fileMetadata = {
            fileSharingProtocolType: 0,
            id: 'id',
            name: 'name',
            size: 0,
            type: 'type',
            url: 'url'
        };
        const viewLocation = 'viewLocation';
        const token = {
            chatId: '',
            token: ''
        };

        jest.spyOn(API, 'getView').mockRejectedValue(Promise.reject());

        try {
            await client.getView(fileMetadata, viewLocation, token);
        } catch (error) {
            expect(error).not.toBe(undefined);
        }
    });

    it('FramedlessClient.fetchBlob() should fetch the content URL', async () => {
        (global as any).fetch = jest.fn(() => Promise.resolve({
            blob: () => Promise.resolve()
        }));

        const client = new FramedlessClient();
        const contentUrl = 'contentUrl';

        await client.fetchBlob(contentUrl);

        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('FramedlessClient.fetchBlob() should throw an error if API call does not succeed', async () => {
        (global as any).fetch = jest.fn(() => Promise.reject());

        const client = new FramedlessClient();
        const contentUrl = 'contentUrl';

        try {
            await client.fetchBlob(contentUrl);
        } catch (error) {
            expect(error).not.toBe(undefined);
        }
    });
});