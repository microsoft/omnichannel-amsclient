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
        
        try {
            jest.spyOn(API, 'skypeTokenAuth').mockRejectedValue("Error");
            await client.skypeTokenAuth(token);
            fail("Error expected");
        } catch (error) {
            expect(error).not.toBe(undefined);
        }
    });



});