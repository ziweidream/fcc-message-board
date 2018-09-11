/* *
*
*       Complete the API routing below
*
* */

'use strict';

var expect = require('chai').expect
var MongoClient = require('mongodb')
var ObjectId = require('mongodb').ObjectId;
const CONNECTION_STRING = process.env.DB

module.exports = function(app) {

  app.route('/api/threads/:board')
  .get(function(req, res) {
    MongoClient.connect(CONNECTION_STRING, function(err, db) {
      db.collection('fcc-message-board').find({}, {
        reported: 0,
        delete_password: 0,
        'replies.reported': 0,
        'replies.delete_password': 0
      }).sort({"bumped_on": -1}).limit(10).toArray((err, docs) => {
        if (err)
          console.log(err)
        for (let i = 0; i < docs.length; i++) {
          docs[i].replies.sort(compare)
          var extra = docs[i].replies.length - 3
          docs[i].replies.splice(3, extra)
        }
        res.json(docs)
        db.close()
      })
    })
  })
  .post(function(req, res) {
    var newThread = {}
    newThread.text = req.body.text
    newThread.delete_password = req.body.delete_password
    newThread.created_on = new Date()
    newThread.bumped_on = new Date()
    newThread.reported = false
    newThread.replies = []

    MongoClient.connect(CONNECTION_STRING, function(err, db) {
      db.collection('fcc-message-board').insertOne(newThread, (err, response) => {
        if (err) {
          db.close()
          console.log(err)
        }
        res.json(response.ops[0])
      })
    })
  })
  .delete(function(req, res) {
    var m_id = req.body.thread_id
    var password = req.body.delete_password
    var isPassword = false
    var filter = {
      _id: ObjectId(m_id)
    }

    MongoClient.connect(CONNECTION_STRING, function(err, db) {
      db.collection('fcc-message-board').findOne(filter, (err, docs) => {
        if (err)
          console.log(err)

        if (docs.delete_password == password) {
          db.collection('fcc-message-board').deleteOne(filter, (err, docs) => {
            if (err) {
              db.close()
              res.json(err)
              console.log(err)
            };
            if (docs.deletedCount === 0) {
              res.json('incorrect password')
            } else {
              res.json('success')
            }
            db.close();
          })
        } else {
          res.json('incorrect password')
        }
        db.close()
      })
    })
  })
  .put(function(req, res) {
    MongoClient.connect(CONNECTION_STRING, function(err, db) {
      db.collection('fcc-message-board').update({
        _id: ObjectId(req.body.thread_id)
      }, {
        $set: {
          'reported': true
        }
      }, {
        new: true
      }, (err, response) => {
        if (err) {
          db.close()
          console.log(err)
        }
        res.json('success')
      })
    })
  })

  app.route('/api/replies/:board')
  .get(function(req, res) {
    var messageId = req.query.thread_id
    MongoClient.connect(CONNECTION_STRING, function(err, db) {
      db.collection('fcc-message-board').findOne({
        _id: ObjectId(messageId)
      }, {
        reported: 0,
        delete_password: 0,
        'replies.reported': 0,
        'replies.delete_password': 0
      }, (err, docs) => {
        if (err)
          console.log(err)
        docs.replies.sort(compare)
        res.json(docs)
        db.close()
      })
    })
  })
  .post(function(req, res) {
    var threadId = req.body.thread_id
    var newReply = {}
    newReply._id = new ObjectId()
    newReply.text = req.body.text
    newReply.delete_password = req.body.delete_password
    newReply.created_on = new Date()
    newReply.reported = false

    MongoClient.connect(CONNECTION_STRING, function(err, db) {
      db.collection('fcc-message-board').update({
        _id: ObjectId(threadId)
      }, {
        $push: {
          'replies': newReply
        },
        $set: {
          'bumped_on': new Date()
        }
      }, {
        new: true
      }, (err, response) => {
        if (err) {
          db.close()
          console.log(err)
        }
        res.json(response)
      })
    })
  })
  .delete(function(req, res) {
    var ids = {
      _id: ObjectId(req.body.thread_id),
      "replies._id": ObjectId(req.body.reply_id)
    }
    var replyPassword = req.body.delete_password
    MongoClient.connect(CONNECTION_STRING, function(err, db) {
      db.collection('fcc-message-board').findOne(ids, {
        "_id": 1,
        "replies.$": 1
      }, (err, docs) => {
        if (err)
          console.log(err)

        if (docs.replies[0].delete_password === replyPassword) {
          db.collection('fcc-message-board').updateOne(ids, {
            $set: {
              'replies.$': {
                text: "deleted"
              }
            }
          }, (err, docs) => {
            if (err)
              console.log(err);
            if (docs.result.n === 0) {
              res.json('incorrect password');
            } else {
              res.json('success')
            }
            db.close();
          })
        } else {
          res.json('incorrect password')
        }
        db.close()
      })
    })
  })
  .put(function(req, res) {
    var ids2 = {
      _id: ObjectId(req.body.thread_id),
      "replies._id": ObjectId(req.body.reply_id)
    }
    MongoClient.connect(CONNECTION_STRING, function(err, db) {
      db.collection('fcc-message-board').update(ids2, {
        $set: {
          'replies.$': {
            'reported': true
          }
        }
      }, {
        new: true
      }, (err, response) => {
        if (err) {
          db.close()
          console.log(err)
        }
        res.json('success')
      })
    })
  })

  function compare(a, b) {
    if (a.created_on > b.created_on)
      return -1;
    if (a.created_on < b.created_on)
      return 1;
    return 0;
  }

  function isReplyId(replyId, arr) {
    var n = 0
    for (let i = 0; i < arr.length; i++) {
      var str = JSON.stringify(arr[i])
      if (str.includes(replyId)) {
        n += 1
      }
    }
    return n > 0
  }
}
