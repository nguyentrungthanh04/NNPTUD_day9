var express = require('express');
var router = express.Router();
var path = require('path');
var multer = require('multer');
var mongoose = require('mongoose');

var messageModel = require('../schemas/messages');
var userModel = require('../schemas/users');
var checkLogin = require('../utils/authHandler').checkLogin;

var storageSetting = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    var ext = path.extname(file.originalname);
    var filename = Date.now() + '-' + Math.round(Math.random() * 2E9) + ext;
    cb(null, filename);
  }
});

var uploadAnyFile = multer({
  storage: storageSetting,
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.get('/', checkLogin, async function (req, res, next) {
  try {
    var currentUserId = req.user._id.toString();
    var messages = await messageModel
      .find({
        $or: [
          { from: currentUserId },
          { to: currentUserId }
        ]
      })
      .sort({ createdAt: -1 })
      .populate('from', 'username fullName avatarUrl')
      .populate('to', 'username fullName avatarUrl');

    var latestByPartner = new Map();
    for (var i = 0; i < messages.length; i++) {
      var msg = messages[i];
      var fromId = msg.from._id.toString();
      var toId = msg.to._id.toString();
      var partnerId = fromId === currentUserId ? toId : fromId;
      if (!latestByPartner.has(partnerId)) {
        latestByPartner.set(partnerId, msg);
      }
    }

    res.send(Array.from(latestByPartner.values()));
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

router.get('/:userID', checkLogin, async function (req, res, next) {
  try {
    var currentUserId = req.user._id;
    var userID = req.params.userID;

    if (!mongoose.Types.ObjectId.isValid(userID)) {
      return res.status(400).send({ message: 'userID khong hop le' });
    }

    var messages = await messageModel
      .find({
        $or: [
          { from: currentUserId, to: userID },
          { from: userID, to: currentUserId }
        ]
      })
      .sort({ createdAt: 1 })
      .populate('from', 'username fullName avatarUrl')
      .populate('to', 'username fullName avatarUrl');

    res.send(messages);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

router.post('/:userID', checkLogin, uploadAnyFile.single('file'), async function (req, res, next) {
  try {
    var from = req.user._id;
    var to = req.params.userID;

    if (!mongoose.Types.ObjectId.isValid(to)) {
      return res.status(400).send({ message: 'userID khong hop le' });
    }

    var toUser = await userModel.findById(to);
    if (!toUser || toUser.isDeleted) {
      return res.status(404).send({ message: 'Nguoi nhan khong ton tai' });
    }

    var messageContent;
    if (req.file) {
      messageContent = {
        type: 'file',
        text: req.file.path.replace(/\\/g, '/')
      };
    } else if (req.body.text && req.body.text.trim() !== '') {
      messageContent = {
        type: 'text',
        text: req.body.text.trim()
      };
    } else {
      return res.status(400).send({
        message: 'Noi dung khong hop le: can file hoac text'
      });
    }

    var newMessage = new messageModel({
      from: from,
      to: to,
      messageContent: messageContent
    });

    await newMessage.save();
    await newMessage.populate('from', 'username fullName avatarUrl');
    await newMessage.populate('to', 'username fullName avatarUrl');

    res.send(newMessage);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

module.exports = router;