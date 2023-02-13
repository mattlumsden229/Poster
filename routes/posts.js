const express = require('express')
const router = express.Router()
const {ensureAuth} = require('../middleware/auth')

const Post = require('../models/Post')

// @desc    Show add page
// @route   GET /posts/add
router.get('/add', ensureAuth, (req, res) => {
    res.render('posts/add')
})

// @desc    Process add form
// @route   POST /posts
router.post('/', ensureAuth, async (req, res) => {
    try {
        req.body.user = req.user.id
        await Post.create(req.body)
        res.redirect('/dashboard')
    } catch {
        console.error(err)
        res.render('error/500')
    }
})

// @desc    Show all posts
// @route   GET /posts
router.get('/', ensureAuth, async (req, res) => {
    try {
      const posts = await Post.find({ status: 'public' })
        .populate('user')
        .sort({ createdAt: 'desc' })
        .lean()
  
      res.render('posts/index', {
        posts,
      })
    } catch (err) {
      console.error(err)
      res.render('error/500')
    }
  })

// @desc    Show single story
// @route   GET /posts/:id
router.get('/:id', ensureAuth, async (req, res) => {
    try {
      let post = await Post.findById(req.params.id).populate('user').lean()
  
      if (!post) {
        return res.render('error/404')
      }
  
      if (post.user._id != req.user.id && post.status == 'private') {
        res.render('error/404')
      } else {
        res.render('posts/show', {
          post,
        })
      }
    } catch (err) {
      console.error(err)
      res.render('error/500')
    }
})

// @desc    Show edit page
// @route   GET /posts/edit/:id
router.get('/edit/:id', ensureAuth, async (req, res) => {
    try {
        const post = await Post.findOne({
            _id: req.params.id
        }).lean()
    
        if(!post) {
            return res.render('error/404')
        }
    
        if(post.user != req.user.id){
            res.redirect('/posts')
        }else{
            res.render('posts/edit', {
                post,
            }) 
        }
    } catch(err) {
        console.error(err)
        return res.render('error/500')
    }
})

// @desc    Update post
// @route   PUT /posts/:id
router.put('/:id', ensureAuth, async (req, res) => {
    try{
        let post = await Post.findById(req.params.id).lean()
        if(!post) {
            return res.render('error/404')
        }
    
        if(post.user != req.user.id){
            res.redirect('/posts')
        }else{
            post = await Post.findOneAndUpdate({_id: req.params.id}, req.body, {
                new: true,
                runValidators: true,
            })
    
            res.redirect('/dashboard')
        }
    } catch(err) {
        console.error(err)
        return res.render('error/500')
    }
})

// @desc    Delete story
// @route   DELETE /posts/:id
router.delete('/:id', ensureAuth, async (req, res) => {
    try {
      let post = await Post.findById(req.params.id).lean()
  
      if (!post) {
        return res.render('error/404')
      }
  
      if (post.user != req.user.id) {
        res.redirect('/posts')
      } else {
        await Post.remove({ _id: req.params.id })
        res.redirect('/dashboard')
      }
    } catch (err) {
      console.error(err)
      return res.render('error/500')
    }
  })

  // @desc    User posts
// @route   GET /posts/user/:userId
router.get('/user/:userId', ensureAuth, async (req, res) => {
  try {
    const posts = await Post.find({
      user: req.params.userId,
      status: 'public',
    })
      .populate('user')
      .lean()

    res.render('posts/index', {
      posts,
    })
  } catch (err) {
    console.error(err)
    res.render('error/500')
  }
})

//@desc Search posts by title
//@route GET /posts/search/:query
router.get('/search/:query', ensureAuth, async (req, res) => {
  try{
      const posts = await Post.find({title: new RegExp(req.query.query,'i'), status: 'public'})
      .populate('user')
      .sort({ createdAt: 'desc'})
      .lean()
     res.render('posts/index', {posts})
  } catch(err){
      console.log(err)
      res.render('error/404')
  }
})

module.exports = router