const eventPath = (event) => {
  if (includeStage(event)) {
    const path = '/' + event.requestContext.stage + event.path;
    return path.replace(/\/*$/, '');
  }
  return event.path.replace(/\/*$/, '');
};

const fileMissing = (event) => {
  return !/\.(jpg|tif|gif|png|webp|json)$/.test(event.path);
};

const getUri = (event) => {
  const scheme = event.headers['X-Forwarded-Proto'] || 'http';
  const host = event.headers['X-Forwarded-Host'] || event.headers.Host;
  const uri = `${scheme}://${host}${eventPath(event)}`;
  return uri;
};

const includeStage = (event) => {
  if ('include_stage' in process.env) {
    return ['true', 'yes'].indexOf(process.env.include_stage.toLowerCase()) > -1;
  } else {
    const host = event.headers.Host;
    return host.match(/\.execute-api\.\w+?-\w+?-\d+?\.amazonaws\.com$/);
  }
};

const isBase64 = (result) => {
  return /^image\//.test(result.contentType);
};

const isTooLarge = (content) => {
  const payloadLimit = (6 * 1024 * 1024) / 1.4;
  return content.length > payloadLimit;
};

const getRegion = (context) => {
  return context.invokedFunctionArn.match(/^arn:aws:lambda:(\w+-\w+-\d+):/)[1];
};

module.exports = {
  eventPath: eventPath,
  fileMissing: fileMissing,
  getUri: getUri,
  includeStage: includeStage,
  isBase64: isBase64,
  isTooLarge: isTooLarge,
  getRegion: getRegion
};
