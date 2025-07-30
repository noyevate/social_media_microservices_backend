const express = require('express');
const {createPost, getallPost, getPost, deletePost} = require('../controllers/post_service_controller');
const {authenticateRequest} = require('../middleware/auth_middleware');
const router = express()

router.use(authenticateRequest)
router.post('/create-post', createPost)
router.get('/all-posts', getallPost)
router.get('/:id', getPost)
router.delete('/:id', deletePost)

module.exports = router