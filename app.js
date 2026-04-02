var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
let mongoose = require('mongoose')

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/carts', require('./routes/carts'));
app.use('/api/v1/products', require('./routes/products'))
app.use('/api/v1/categories', require('./routes/categories'))
app.use('/api/v1/roles', require('./routes/roles'))
app.use('/api/v1/upload', require('./routes/upload'))
app.use('/api/v1/messages', require('./routes/messages'))

const mongoUri = 'mongodb+srv://sinntrungthanh_db_user:6x5G5Bjja1s9Yjkd@day9.n4voyhr.mongodb.net/NNPTUD-C5?appName=day9';

mongoose.connect(mongoUri)
  .then(function () {
    console.log('MongoDB Atlas connected');
  })
  .catch(function (error) {
    console.error('MongoDB Atlas connection error:', error.message);
  });

mongoose.connection.on('disconnected', function () {
  console.log('MongoDB disconnected');
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send(err.message);
});

module.exports = app;
