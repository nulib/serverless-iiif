/* eslint-env jest */
const AWS = require('aws-sdk');
const { getCached, makeCache } = require('../src/cache');
const AWSMockS3 = require('./__mocks/mockS3');

describe('cache functions', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules() // Most important - it clears the cache
    process.env = { ...OLD_ENV }; // Make a copy
    AWS.S3 = AWSMockS3.S3Cache;
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore old environment
  });

  describe('getCached', () => {
    it('returns true on a cache hit', async () => {
      process.env.cacheBucket = 'cache-bucket';
      const result = await getCached('cache_hit/default.jpg');
      expect(result).toEqual(true);
    });

    it('returns false on a cache miss', async () => {
      const result = await getCached('cache_miss/default.jpg');
      expect(result).toEqual(false);
    });

    it('returns false if no cache bucket is configured', async () => {
      const result = await getCached('cache_miss/default.jpg');
      expect(result).toEqual(false);
    });
  });

  describe('makeCache', () => {
    it('caches the result', async () => {
      process.env.cacheBucket = 'cache-bucket';
      const result = await makeCache('new_cache_key/default.jpg', '[DATA TO CACHE]');
      expect(AWSMockS3.upload).toHaveBeenCalled();
      expect(result).toEqual(true);
    });

    it('throws an error when no cache bucket is configured', async() => {
      try {
        await makeCache('new_cache_key/default.jpg', '[DATA TO CACHE]');
      } catch(err) {
        expect(err.message).toEqual('Content size (15) exceeds API gateway maximum');
      }
    });

    it('handles errors', async () => {
      process.env.cacheBucket = 'cache-bucket';
      let caught;
      try {
        await makeCache('', '[DATA TO CACHE]')
      } catch (err) {
        caught = err;
      }
      expect(caught).toEqual('unknown cache key')
    });
  });
});

