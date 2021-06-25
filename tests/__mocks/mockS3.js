/* eslint-env jest */
const destroy = jest.fn();
const end = jest.fn(() => {
  return {
    destroy: destroy
  };
});
const abort = jest.fn();
const S3 = jest.fn().mockImplementation(() => {
  return {
    getObject: function () {
      return {
        createReadStream: () => {
          return {
            end: end
          };
        },
        abort: abort
      };
    },
    headObject: function (params) {
      let md = {};
      if (params.Key === 'dimensions.tif') {
        md = { width: '100', height: '200' };
      };
      return {
        promise: () => {
          return {
            Metadata: md
          };
        }
      };
    }
  };
});

const upload = jest.fn((params, callback) => {
  if (params.Key == "new_cache_key/default.jpg") {
    callback(null, {});
  } else {
    callback("unknown cache key", null);
  }
});

const S3Cache = jest.fn().mockImplementation(() => {
  return {
    headObject: function (params, callback) {
      if (params.Key == 'cache_hit/default.jpg') {
        callback(null, {});
      } else {
        callback("error", null);
      }
    },
    getSignedUrl: function (_params) {
      return '[PRESIGNED S3 CACHE URL]';
    },
    upload: upload
  }
});

module.exports = {
  S3: S3,
  S3Cache: S3Cache,
  abort: abort,
  end: end,
  destroy: destroy,
  upload: upload
};
