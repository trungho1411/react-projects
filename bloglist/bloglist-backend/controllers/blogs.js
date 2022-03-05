const jwt = require('jsonwebtoken');
const blogRouter = require('express').Router();
const Blog = require('../models/blog');

const getTokenFrom = (request) => {
  const authorization = request.get('authorization');
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.substring(7);
  }
  return null;
};

blogRouter.get('/', async (request, response) => {
  let blogs = await Blog.find({}).populate('user', { username: 1, name: 1 });
  response.json(blogs);
});

blogRouter.get('/:id', async (request, response) => {
  const data = await Blog.findById(request.params.id).populate('user', {
    username: 1,
    name: 1,
  });
  if (data) {
    response.json(data.toJSON());
  } else {
    response.status(404).end();
  }
});

blogRouter.post('/', async (request, response) => {
  const body = request.body;
  const user = request.user;

  const blog = new Blog({
    author: body.author,
    title: body.title,
    url: body.url,
    likes: body.likes,
    user: user.id,
  });
  const savedBlog = await blog.save();
  user.blogs = user.blogs.concat(savedBlog._id);
  await user.save();
  response.json(savedBlog.toJSON());
});

blogRouter.post('/:id/comments', async (request, response) => {
  const comment = request.body.comment;
  const blog = await Blog.findById(request.params.id);

  if (comment.toString() === null && comment.toString() === '') {
    response.status(400).end();
  } else {
    blog.comments = blog.comments.concat(comment);
    const savedBlog = await blog.save();
    response.status(200).json(savedBlog.toJSON()).end();
  }
});

blogRouter.delete('/:id', async (request, response) => {
  const user = request.user;
  const blog = await Blog.findById(request.params.id);
  if (blog.user.toString() === user.id.toString()) {
    await Blog.findByIdAndRemove(request.params.id);
    response.status(204).end();
  } else {
    response
      .status(401)
      .json({ error: 'You dont have permisson to delete this blog!' })
      .end();
  }
});

blogRouter.put('/:id', async (request, response) => {
  const body = request.body;
  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
  };
  const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, {
    new: true,
    runValidator: true,
  });

  response.json(updatedBlog.toJSON());
});

module.exports = blogRouter;
