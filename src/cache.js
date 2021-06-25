const AWS = require('aws-sdk');

const cacheConfigured = () => {
  return (typeof process.env.cacheBucket === 'string') && process.env.cacheBucket.length > 0;
};

const getCacheBucket = () => process.env.cacheBucket;

const getCached = (key) => {
  return new Promise((resolve) => {
    if (!cacheConfigured()) {
      resolve(false);
    }

    const s3 = new AWS.S3();
    s3.headObject({ Bucket: getCacheBucket(), Key: key }, (err) => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
};

const makeCache = (key, image) => {
  const cacheBucket = getCacheBucket();

  return new Promise((resolve, reject) => {
    if (!cacheConfigured()) {
      reject(new Error(`Content size (${image.length.toString()}) exceeds API gateway maximum`));
    }

    const s3 = new AWS.S3();
    const uploadParams = {
      Bucket: cacheBucket,
      Key: key,
      Body: image.body,
      ContentType: image.contentType
    };

    s3.upload(uploadParams, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
};

module.exports = {
  getCached,
  makeCache
};
