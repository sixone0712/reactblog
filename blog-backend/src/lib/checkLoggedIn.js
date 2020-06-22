const checkLoggedIn = (ctx, next) => {
  console.log('checkLoggedIn');
  console.log('ctx.state.user', ctx.state.user);
  if (!ctx.state.user) {
    ctx.status = 401; // Unauthorized
    return;
  }
  return next();
};

export default checkLoggedIn;
