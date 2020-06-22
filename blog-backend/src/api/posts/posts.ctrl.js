import Post from '../../models/post';
import mongoose from 'mongoose';
import Joi from '@hapi/joi';

const { ObjectId } = mongoose.Types;

export const checkObjectId = (ctx, next) => {
  const { id } = ctx.params;
  if (!mongoose.isValidObjectId(id)) {
    ctx.status = 400; // Bad Reqeust
    return;
  }

  return next();
};

export const getPostById = async (ctx, next) => {
  const { id } = ctx.params;
  if (!mongoose.isValidObjectId(id)) {
    ctx.status = 400; // Bad Request
    return;
  }
  try {
    const post = await Post.findById(id);
    if (!post) {
      ctx.status = 404;
      return;
    }
    ctx.state.post = post;
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const checkOwnPost = (ctx, next) => {
  const { user, post } = ctx.state;
  if (post.user._id.toString() !== user._id) {
    ctx.status = 403;
    return;
  }
  return next();
};

export const write = async (ctx) => {
  console.log('[posts.ctrl.js][write]');
  const schema = Joi.object().keys({
    title: Joi.string().required(),
    body: Joi.string().required(),
    tags: Joi.array().items(Joi.string()).required(),
  });

  const result = schema.validate(ctx.request.body);
  if (result.error) {
    ctx.status = 400; // Bad Request
    ctx.body = result.error;
    return;
  }

  const { title, body, tags } = ctx.request.body;
  const post = new Post({
    title,
    body,
    tags,
    user: ctx.state.user,
  });

  try {
    await post.save();
    ctx.body = post;
  } catch (e) {
    return ctx.throw(500, e); // Internal Server Error
  }

  ctx.body = post;
};

export const list = async (ctx) => {
  console.log('[posts.ctrl][list]');
  const page = parseInt(ctx.query.page || '1', 10);

  if (page < 1) {
    ctx.status = 400; // Bad Request
  }

  console.log('ctx.query', ctx.query);

  const { tag, username } = ctx.query;

  console.log('tag', tag);
  console.log('username', username);

  // 주의 : query 값에는 undefined 데이터가 들어가면 조회가 되질 않는다.
  const query = {
    ...(username ? { 'user.username': username } : {}),
    ...(tag ? { tags: tag } : {}),
  };

  console.log('query', query);

  try {
    const posts = await Post.find(query)
      .sort({ _id: -1 }) // id의 역순으로 Sort / 내림차
      .limit(10)
      .skip((page - 1) * 10) // .skip(2) : 2개 생략하고 그 다음부터 출력
      .lean() // 순수 자바 스크립트 객체를 리턴(Document 대신, Document는 너무 무겁다)
      .exec();

    const postCount = await Post.countDocuments(query).exec();
    ctx.set('Last-Page', Math.ceil(postCount / 10));
    ctx.body = posts.map((post) => ({
      ...post,
      body: post.body.length < 200 ? post.body : `${post.body.slice(0, 200)}`,
    }));
  } catch (e) {
    ctx.throw(500, e); // Internal Server Error
  }
};

export const read = async (ctx) => {
  ctx.body = ctx.state.post;
};

export const remove = async (ctx) => {
  const { id } = ctx.params;

  try {
    await Post.findByIdAndDelete(id).exec();
    ctx.stats = 204; // No Content (성공은 했지만 응답할 데이터는 없음)
  } catch (e) {
    ctx.status = 400; // Internal Server Error
  }
};

export const update = async (ctx) => {
  const { id } = ctx.params;

  const schema = Joi.object().keys({
    title: Joi.string(),
    body: Joi.string(),
    tags: Joi.array().items(Joi.string()),
  });

  const result = schema.validate(ctx.request.body);
  if (result.error) {
    ctx.stats = 400; // Bad Request
    ctx.body = result.error;
    return;
  }

  try {
    const post = await Post.findByIdAndUpdate(id, ctx.request.body, {
      new: true, // 이 값을 설정하면 업데이트된 데이터를 반환합니다.
      // false 일 때에는 업데이트 되기 전의 데이터를 반환합니다.
    });

    if (!post) {
      ctx.stats = 404; // Not Found
      return;
    }
  } catch (e) {
    ctx.throw(500, e); // Internal Server Error
  }
};
