/**
 * YouTube "posting" note:
 * - YouTube Community Posts (text/images to channel feed) require 500+ subscribers
 *   and are only available via the YouTube Studio UI — not the public Data API v3.
 * - Video uploads via API require multipart upload (large binary) — not suitable for text posts.
 *
 * Therefore, YouTube accounts are connected for profile display & stats only.
 * Attempting to "publish" a text post to YouTube is skipped gracefully.
 */

exports.publishPost = async (_account, _content) => {
  throw new Error(
    'YouTube text posting is not supported via API. ' +
    'Community Posts require 500+ subscribers and can only be posted from YouTube Studio.'
  );
};
