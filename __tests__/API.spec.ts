/**
 * @jest-environment jsdom
 */

import API from "../src/API";

describe('API', () => {

    describe('object ID request paths', () => {
        const identifierCases: [string, string, string, string, string][] = [
            ['0-wus-d1_A09', '0-wus-d1_A09', 'text/plain', 'original', 'original'],
            ['part/next?x=1#view', 'part%2Fnext%3Fx%3D1%23view', 'text/plain', 'original', 'original'],
            ['raw%2F\\name', 'raw%252F%5Cname', 'image/png', 'imgpsh', 'imgpsh_fullsize_anim'],
            ['r\u00e9sum\u00e9 1', 'r%C3%A9sum%C3%A9%201', 'image/png', 'imgpsh', 'imgpsh_fullsize_anim']
        ];
        const endpoint = 'https://ams.example.test';
        const token = {
            chatId: 'chatId',
            token: 'token',
            amsEndpoint: endpoint,
            regionGTMS: { ams: 'https://regional.example.test' }
        };

        it.each(identifierCases)('uploadDocument encodes ID %s without changing upload metadata or request options', async (id, encodedId, type, content) => {
            const file = new File(['content'], 'filename', { type });
            const fetchMock = jest.fn().mockResolvedValue({ ok: true });
            global.fetch = fetchMock;
            const url = `${endpoint}/v1/objects/${encodedId}/content/${content}`;

            const metadata = await API.uploadDocument(id, file, token);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(fetchMock).toHaveBeenCalledWith(url, expect.objectContaining({
                method: 'PUT',
                body: file,
                headers: expect.objectContaining({
                    Authorization: 'skype_token token',
                    'Content-Type': 'application/x-www-form-urlencoded'
                })
            }));
            expect(metadata).toEqual({
                id,
                name: file.name,
                size: file.size,
                type,
                url,
                fileSharingProtocolType: 0
            });
        });

        it.each(identifierCases)('getViewStatus encodes ID %s without changing the view or response', async (id, encodedId, type, _content, view) => {
            const metadata = { id, type, fileSharingProtocolType: 0 };
            const response = { view_location: 'https://ams.example.test/view', view_state: 'ready' };
            const fetchMock = jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(response)
            });
            global.fetch = fetchMock;

            await expect(API.getViewStatus(metadata, token)).resolves.toBe(response);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(fetchMock).toHaveBeenCalledWith(`${endpoint}/v1/objects/${encodedId}/views/${view}/status`, expect.objectContaining({
                method: 'GET',
                headers: expect.objectContaining({ Authorization: 'skype_token token' })
            }));
            expect(metadata.id).toBe(id);
        });

        it('createObject keeps the permissions key unchanged and out of the request path', async () => {
            const id = 'user/path?x#y%';
            const file = new File(['content'], 'filename', { type: 'text/plain' });
            const response = { id: 'objectId' };
            const fetchMock = jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(response)
            });
            global.fetch = fetchMock;

            await expect(API.createObject(id, file, token)).resolves.toBe(response);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(fetchMock).toHaveBeenCalledWith(`${endpoint}/v1/objects`, expect.objectContaining({
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify({
                    filename: file.name,
                    permissions: { [id]: ['read'] },
                    type: 'sharing/file'
                })
            }));
        });
    });

    it('API.skypeTokenAuth() should call fetch', async () => {
        const token = {
            chatId: '',
            token: ''
        };

        (global as any).fetch = jest.fn(() => Promise.resolve({
            ok: true
        }));

        await API.skypeTokenAuth(token);

        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('API.skypeTokenAuth() should throw error when response.ok is false', async () => {
        const token = {
            chatId: '',
            token: ''
        };

        (global as any).fetch = jest.fn(() => Promise.resolve({
            ok: false,
            status: 401,
            statusText: 'Unauthorized'
        }));

        try {
            await API.skypeTokenAuth(token);
            fail('skypeTokenAuth should throw');
        } catch (error) {
            expect(error).not.toBe(undefined);
        }
    });

    it('API.skypeTokenAuth() should throw an error if API does not succeed', async () => {
        const token = {
            chatId: '',
            token: ''
        };

        (global as any).fetch = jest.fn(() => Promise.reject());

        try {
            await API.skypeTokenAuth(token);
        } catch (error) {
            expect(error).not.toBe(undefined);
        }
    });

    it('API.createObject() should call fetch', async () => {
        const id = 'id';
        const file =  new File([""], "filename", { type: 'text/html' });
        const token = {
            chatId: '',
            token: ''
        };

        (global as any).fetch = jest.fn(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({})
        }));

        await API.createObject(id, file, token);

        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('API.createObject() should throw error when response.ok is false', async () => {
        const id = 'id';
        const file =  new File([""], "filename", { type: 'text/html' });
        const token = {
            chatId: '',
            token: ''
        };

        (global as any).fetch = jest.fn(() => Promise.resolve({
            ok: false,
            json: () => Promise.resolve({})
        }));

        try {
            await API.createObject(id, file, token);
            fail('createObject should throw');
        } catch (error) {
            expect(error).not.toBe(undefined);
        }
    });

    it('API.createObject() should throw an error if API does not succeed', async () => {
        const id = 'id';
        const file =  new File([""], "filename", { type: 'text/html' });
        const token = {
            chatId: '',
            token: ''
        };

        (global as any).fetch = jest.fn(() => Promise.reject());

        try {
            await API.createObject(id, file, token);
        } catch (error) {
            expect(error).not.toBe(undefined);
        }
    });

    it('API.uploadDocument() should call fetch', async () => {
        const documentId = 'documentId';
        const file =  new File([""], "filename", { type: 'text/html' });
        const token = {
            chatId: '',
            token: ''
        };

        (global as any).fetch = jest.fn(() => {
            return new Promise((resolve, reject) => {
                resolve({ok: true})
            })
        });

        await API.uploadDocument(documentId, file, token);

        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('API.uploadDocument() should throw error when response.ok is false', async () => {
        const documentId = 'documentId';
        const file =  new File([""], "filename", { type: 'text/html' });
        const token = {
            chatId: '',
            token: ''
        };

        (global as any).fetch = jest.fn(() => Promise.resolve({ok: false}));

        try {
            await API.uploadDocument(documentId, file, token);
            fail('uploadDocument should throw');
        } catch (error) {
            expect(error).not.toBe(undefined);
        }
    });

    it('API.uploadDocument() should throw an error if API does not succeed', async () => {
        const documentId = 'documentId';
        const file =  new File([""], "filename", { type: 'text/html' });
        const token = {
            chatId: '',
            token: ''
        };

        (global as any).fetch = jest.fn(() => Promise.reject());

        try {
            await API.uploadDocument(documentId, file, token);
        } catch (error) {
            expect(error).not.toBe(undefined);
        }
    });

    it('API.getViewStatus() should call fetch', async () => {
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

        (global as any).fetch = jest.fn(() => Promise.resolve({
            json: () => Promise.resolve({
                view_location: 'view_location'
            })
        }));

        await API.getViewStatus(fileMetadata, token);

        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('API.getViewStatus() should throw an error if API does not succeed', async () => {
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

        (global as any).fetch = jest.fn(() => Promise.reject());

        try {
            await API.getViewStatus(fileMetadata, token);
        } catch (error) {
            expect(error).not.toBe(undefined);
        }
    });

    it('API.getView() should call fetch', async () => {
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

        (global as any).fetch = jest.fn(() => Promise.resolve({
            blob: () => Promise.resolve()
        }));

        await API.getView(fileMetadata, viewLocation, token);

        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('API.getView() should throw an error if API does not succeed', async () => {
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

        (global as any).fetch = jest.fn(() => Promise.reject());

        try {
            await API.getView(fileMetadata, viewLocation, token);
        } catch (error) {
            expect(error).not.toBe(undefined);
        }
    });
})