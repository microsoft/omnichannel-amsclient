import sanitizeRequestPath from '../../src/utils/sanitizeRequestPath';

describe('sanitizeRequestPath', () => {
    it.each([
        [undefined, ''],
        ['', ''],
        ['https://ams.example/v1/skypetokenauth', 'https://ams.example/v1/skypetokenauth'],
        ['https://ams.example/v1/objects', 'https://ams.example/v1/objects'],
        ['https://ams.example/v1/objects/0-abc-123/content/imgpsh', 'https://ams.example/v1/objects/{id}/content/imgpsh'],
        ['https://ams.example/v1/objects/0-abc-123/views/original/status', 'https://ams.example/v1/objects/{id}/views/original/status'],
        ['https://ams.example/v1/objects/0-abc-123/views/original?sig=secret#frag', 'https://ams.example/v1/objects/{id}/views/original']
    ])('sanitizes %p', (input, expected) => {
        expect(sanitizeRequestPath(input)).toBe(expected);
    });
});