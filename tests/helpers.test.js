/* eslint-env jest */
const { eventPath, fileMissing, getUri, isBase64, isTooLarge, getRegion } = require('../src/helpers');

describe('helper functions', () => {
  describe('eventPath', () => {
    it('does not includesStage', () => {
      delete process.env.include_stage;
      const event = {
        headers: { Host: 'host' },
        path: '/path/'
      };
      expect(eventPath(event)).toEqual('/path');
    });
    it('includesStage', () => {
      process.env.include_stage = 'true';
      const event = {
        headers: { Host: 'host' },
        requestContext: {
          stage: 'prod'
        },
        path: '/path/'
      };
      expect(eventPath(event)).toEqual('/prod/path');
    });
  });

  describe('fileMissing', () => {
    it('has a missing file', () => {
      const event = {
        path: 'http://path'
      };
      expect(fileMissing(event)).toEqual(true);
    });
    it('does not have a missing file', () => {
      const event = {
        path: 'http://path/file.json'
      };
      expect(fileMissing(event)).toEqual(false);
    });
  });

  describe('getUri', () => {
    beforeEach(() => {
      delete process.env.include_stage;
    });
    it('has X-Forwarded headers', () => {
      const event = {
        headers: {
          'X-Forwarded-Proto': 'https',
          'X-Forwarded-Host': 'forward-host',
          Host: 'host'
        },
        path: '/path'
      };
      expect(getUri(event)).toEqual('https://forward-host/path');
    });
    it('does not have X-Forwarded headers', () => {
      const event = {
        headers: {
          Host: 'host'
        },
        path: '/path'
      };
      expect(getUri(event)).toEqual('http://host/path');
    });
  });

  describe('isBase64', () => {
    it('is base64', () => {
      const result = {
        contentType: 'image/jpeg'
      };
      expect(isBase64(result)).toEqual(true);
    });
    it('is not base64', () => {
      const result = {
        contentType: 'text/html'
      };
      expect(isBase64(result)).toEqual(false);
    });
  });

  describe('isTooLarge', () => {
    const payloadLimit = (6 * 1024 * 1024) / 1.4;
    it('is > 6MB', () => {
      const content = {
        length: payloadLimit + 1
      };
      expect(isTooLarge(content)).toEqual(true);
    });
    it('is < 6MB', () => {
      const content = {
        length: payloadLimit - 1
      };
      expect(isTooLarge(content)).toEqual(false);
    });
  });

  describe('getRegion', () => {
    it('returns an AWS region', () => {
      const context = {
        invokedFunctionArn: 'arn:aws:lambda:us-west-2:123456789012:function:my-function'
      };
      expect(getRegion(context)).toEqual('us-west-2');
    });
  });
});
