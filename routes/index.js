var express = require('express');
var router = express.Router();
const userModel = require("./users")
const postModel = require("./post")
const passport = require('passport')
const localStrategy = require("passport-local")
const upload = require("./multer")

passport.use(new localStrategy(userModel.authenticate()))

router.get('/', function(req, res) {
  res.render('index', {footer: false});
});

router.get('/login', function(req, res) {
  res.render('login', {footer: false});
});

router.get('/feed', isloggedin , async function(req, res) {
  const user = await userModel.findOne({username: req.session.passport.user})
  const post = await postModel.find().populate("user")
  res.render('feed', {footer: true, post,user});
});
router.get('/userprofile', isloggedin, async function(req, res) {
  const user = await userModel.findOne({username: req.session.passport.user})
  const allusers = await userModel.find().populate("posts")
  res.render('userprofile', {footer: true,user,allusers});
});

router.get('/profile', isloggedin, async function(req, res) {
  const user = await userModel.findOne({username: req.session.passport.user}).populate("posts")

  res.render('profile', {footer: true, user});
});



router.get('/search', function(req, res) {
  res.render('search', {footer: true});
});

router.get('/username/:username', async function(req, res) {
    const regex = new RegExp(`^${req.params.username}`,'i')
    const users = await userModel.find({username: regex})
    res.json(users);
});

router.get('/edit', async function(req, res) {
  const user = await userModel.findOne({username: req.session.passport.user})
  res.render('edit', {footer: true, user});
});

router.get('/upload', function(req, res) {
  res.render('upload', {footer: true});
});

router.post("/register",function(req,res,next){
  const userData = new userModel({
    username: req.body.username,
    name: req.body.name,
    email: req.body.email,
  })

  userModel.register(userData, req.body.password)
  .then(function(){
    passport.authenticate("local")(req,res,function(){
      res.redirect("/profile")
    })
  })
})

router.post("/login",passport.authenticate("local",{
  successRedirect: "/profile",
  failureRedirect: "/login"
}),function(req,res){

})

router.get('/logout', function(req, res, next){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

router.post("/update",upload.single('image'), async function(req,res,next){
  const user = await userModel.findOneAndUpdate({username: req.session.passport.user},{username: req.body.username,name: req.body.name,bio: req.body.bio},{new: true})
  
  if(req.file){
    user.profileImage = req.file.filename
  }
  await user.save();
  res.redirect("/profile");
})

router.post("/upload",isloggedin,upload.single("image"), async function(req,res){
  const user = await userModel.findOne({username: req.session.passport.user})
  const post = await postModel.create({
    picture: req.file.filename,
    user: user._id,
    caption: req.body.caption,

  })
  user.posts.push(post._id)
  await user.save();
  res.redirect("/feed")
})

router.get("/like/post/:id", isloggedin, async function(req,res){
  const user = await userModel.findOne({ username: req.session.passport.user})
  const post = await postModel.findOne({_id: req.params.id})

  if(post.likes.indexOf(user._id) == -1){
    post.likes.push(user._id)
  }
  else{
    post.likes.splice(post.likes.indexOf(user._id), 1)
  }

  await post.save();
  res.redirect("/feed");
})

router.get("/follow/:id", isloggedin, async function(req,res){
  const user = await userModel.findOne({ username: req.session.passport.user})
  const post = await postModel.findOne({_id: req.params.id})

  if(user.followers.indexOf(user._id) == -1){
    user.followers.push(user._id)
  }
  else{
    user.followers.splice(user.followers.indexOf(user._id), 1)
  }

  await user.save();
  res.redirect("/profile");
})
router.get("/follow/userprofile/:id", isloggedin, async function(req,res){
  const user = await userModel.findOne({ username: req.session.passport.user})
  const post = await postModel.findOne({_id: req.params.id})

  if(user.followers.indexOf(user._id) == -1){
    user.followers.push(user._id)
  }
  else{
    user.followers.splice(user.followers.indexOf(user._id), 1)
  }

  if(user.followings.indexOf(user._id) == -1){
    user.followings.push(user._id)
  }
  else{
    user.followings.splice(user.followings.indexOf(user._id), 1)
  }
  await user.save();
  res.redirect("/userprofile");
})
router.get("/following/:id", isloggedin, async function(req,res){
  const user = await userModel.findOne({ username: req.session.passport.user})
  const post = await postModel.findOne({_id: req.params.id})

  if(user.followings.indexOf(user._id) == -1){
    user.followings.push(user._id)
  }
  else{
    user.followings.splice(user.followings.indexOf(user._id), 1)
  }

  await user.save();
  res.redirect("/profile");
})

function isloggedin(req,res,next){
  if(req.isAuthenticated()) return next();
  res.redirect("/login")
}

module.exports = router;
