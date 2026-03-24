const express        = require('express');
const router         = express.Router();
const multer         = require('multer');
const { protect: authenticate } = require('../middleware/auth');
const ctrl           = require('../controllers/socialController');

const mediaUpload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 100 * 1024 * 1024 }, // 100MB (for videos)
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/mov','video/avi','video/quicktime'];
    cb(null, allowed.includes(file.mimetype));
  },
});
const linkedinOAuth  = require('../controllers/linkedinOAuth');
const twitterOAuth   = require('../controllers/twitterOAuth');
const facebookOAuth  = require('../controllers/facebookOAuth');
const instagramOAuth = require('../controllers/instagramOAuth');
const googleOAuth    = require('../controllers/googleOAuth');

// ── OAuth routes (no auth middleware — these are browser redirect flows) ──
router.get('/auth/linkedin',           linkedinOAuth.initiate);
router.get('/auth/linkedin/callback',  linkedinOAuth.callback);

router.get('/auth/twitter',            twitterOAuth.initiate);
router.get('/auth/twitter/callback',   twitterOAuth.callback);

router.get('/auth/facebook',           facebookOAuth.initiate);
router.get('/auth/facebook/callback',  facebookOAuth.callback);

router.get('/auth/instagram',          instagramOAuth.initiate);
router.get('/auth/instagram/callback', instagramOAuth.callback);

router.get('/auth/youtube',            googleOAuth.initiate);
router.get('/auth/youtube/callback',   googleOAuth.callback);

router.use(authenticate);

// Accounts
router.get   ('/accounts',                    ctrl.getAccounts);
router.post  ('/accounts',                    ctrl.saveAccount);
router.delete('/accounts/:platform',          ctrl.disconnectAccount);

// Posts
router.get   ('/posts',                              ctrl.getPosts);
router.post  ('/posts',                              ctrl.createPost);
router.put   ('/posts/:id',                          ctrl.updatePost);
router.delete('/posts/:id',                          ctrl.deletePost);
router.get   ('/stats',                              ctrl.getStats);

// Media upload
router.post  ('/upload-media', mediaUpload.single('file'), ctrl.uploadMedia);

module.exports = router;
