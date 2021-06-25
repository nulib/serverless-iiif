/* eslint-env jest */
const IIIF = require('iiif-processor');
const { handler } = require('../src/index');
const cache = require('../src/cache');
const helpers = require('../src/helpers');
const errorHandler = require('../src/error');

describe('index.handler', () => {
  let callback;
  const context = {};

  beforeEach(() => {
    jest.mock('../src/helpers');
    helpers.getRegion = jest.fn().mockImplementation(() => {
      return 'AWS REGION';
    });

    helpers.eventPath = jest.fn().mockImplementation(() => '[EVENT PATH]');
    callback = (arg1, arg2) => {
      return {
        arg1: arg1,
        arg2: arg2
      };
    };
  });

  it('responds to OPTIONS REQUEST', async () => {
    const event = {
      httpMethod: 'OPTIONS'
    };

    const expected = {
      arg1: null,
      arg2: { statusCode: 204, body: null }
    };
    const result = await handler(event, context, callback);
    expect(result).toEqual(expected);
  });

  it('responds to INFO.JSON REQUEST', async () => {
    const body = '[INFO JSON]';
    helpers.fileMissing = jest.fn().mockImplementationOnce(() => false);
    helpers.getUri = jest.fn().mockImplementationOnce(() => 'https://iiif.example.edu/iiif/2/image_id/info.json');

    IIIF.Processor = jest.fn().mockImplementationOnce(() => {
      return {
        filename: 'info.json',
        execute: async function () {
          return { content_type: 'application/json', body: Buffer.from(body) };
        }
      };
    });
    const event = {};
    const expected = {
      arg1: null, 
      arg2: {
        statusCode: 200,
        headers: { 'Content-Type': undefined, 'Access-Control-Allow-Origin': '*' },
        isBase64Encoded: false,
        body: Buffer.from(body)
      }
    }
    const result = await handler(event, context, callback);
    expect(result).toEqual(expected);
  });

  it('redirects to INFO.JSON if filename missing', async () => {
    helpers.fileMissing = jest.fn().mockImplementationOnce(() => true);
    
    const event = {};

    const expected = {
      arg1: null,
      arg2: { statusCode: 302, headers: { Location: '[EVENT PATH]/info.json' }, body: 'Redirecting to info.json' }
    };
    const result = await handler(event, context, callback);
    expect(result).toEqual(expected);
  });

  // IMAGE REQUEST
  describe('responds to IMAGE REQUEST', () => {
    const body = '[CONTENT BODY]';
    const event = {};
    beforeEach(() => {
      helpers.fileMissing = jest.fn().mockImplementationOnce(() => false);
      helpers.getUri = jest.fn().mockImplementationOnce(() => 'https://iiif.example.edu/iiif/2/image_id/full/full/0/default.jpg');
    });

    it('works with base64 image.', async () => {
      cache.getCached = jest.fn().mockImplementationOnce(async () => null);
      helpers.isBase64 = jest.fn().mockImplementationOnce(() => true);
      helpers.isTooLarge = jest.fn().mockImplementationOnce(() => false);

      IIIF.Processor = jest.fn().mockImplementationOnce(() => {
        return {
          execute: async function () {
            return { body: Buffer.from(body) };
          }
        };
      });

      const expected = {
        arg1: null,
        arg2: {
          statusCode: 200,
          headers: { 'Content-Type': undefined, 'Access-Control-Allow-Origin': '*' },
          isBase64Encoded: true,
          body:  Buffer.from(body).toString('base64')
        }
      };
      const result = await handler(event, context, callback);
      expect(result).toEqual(expected);
    });

    it('works with nonbase64 image.', async () => {
      IIIF.Processor = jest.fn().mockImplementationOnce(() => {
        return {
          execute: async function () {
            return { body: body };
          }
        };
      });
      cache.getCached = jest.fn().mockImplementationOnce(async () => null);
      helpers.isBase64 = jest.fn().mockImplementationOnce(() => false);
      helpers.isTooLarge = jest.fn().mockImplementationOnce(() => false);

      const expected = {
        arg1: null,
        arg2: {
          statusCode: 200,
          headers: { 'Content-Type': undefined, 'Access-Control-Allow-Origin': '*' },
          isBase64Encoded: false,
          body: body
        }
      };
      const result = await handler(event, context, callback);
      expect(result).toEqual(expected);
    });

    it('returns 404 to force failover when cached file exists', async () => {
      cache.getCached = jest.fn().mockImplementationOnce(async () => '[PRESIGNED CACHE URL]');

      IIIF.Processor = jest.fn().mockImplementationOnce(() => {
        return {
          execute: async function () {
            return { body: body };
          }
        };
      });

      const expected = {
        arg1: null,
        arg2: {
          statusCode: 404,
          isBase64Encoded: false,
          body: ''
        }
      }
      const result = await handler(event, context, callback);
      expect(result).toEqual(expected);
    });

    it('caches file and returns 404 to force failover when result is too large to return directly', async () => {
      cache.getCached = jest.fn().mockImplementationOnce(async () => null);
      cache.makeCache = jest.fn().mockImplementationOnce(async () => '[PRESIGNED CACHE URL]');
      helpers.isBase64 = jest.fn().mockImplementationOnce(() => false);
      helpers.isTooLarge = jest.fn().mockImplementationOnce(() => true);
      errorHandler.errorHandler = jest.fn().mockImplementationOnce(() => null);
      IIIF.Processor = jest.fn().mockImplementationOnce(() => {
        return {
          execute: async function () {
            return { body: body };
          }
        };
      });

      const expected = {
        arg1: null,
        arg2: {
          statusCode: 404,
          isBase64Encoded: false,
          body: ''
        }
      }
      const result = await handler(event, context, callback);
      expect(cache.makeCache).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });

    it('handles errors that arise during processing', async () => {
      cache.getCached = jest.fn().mockImplementationOnce(() => Promise.reject('ERROR'));
      errorHandler.errorHandler = jest.fn().mockImplementationOnce(() => null);
      result = await handler(event, context, callback);
      expect(errorHandler.errorHandler).toHaveBeenCalled();
    });
  });
});
