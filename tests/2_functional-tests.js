/* *
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!) */

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');
var ObjectId = require("mongodb").ObjectID;
var messageId = '5b93c4710e478f1e1c4ec6c4';
var testId = '';
var messageId2 = '5b980019a2670011eb634517';
var replyId = '';
chai.use(chaiHttp);

suite('Functional Tests', function() {

  suite('API ROUTING FOR /api/threads/:board', function() {

    suite('POST', function() {
      test('post a new thread', function(done) {
        chai.request(server).post('/api/threads/q').send({board: 'q', text: 'x', delete_password: 111}).end(function(err, res) {
          if (err)
            done(err);
          assert.equal(res.status, 200);
          assert.isObject(res.body);
          assert.equal(res.body.text, 'x');
          assert.equal(res.body.delete_password, 111);
          assert.equal(res.body.reported, false);
          assert.isArray(res.body.replies);
          assert.isString(res.body._id);
          testId = res.body._id;
          done();
        });
      });
    });

    suite('GET', function() {
      test('get an array of the most recent 10 bumped threads with only the most recent 3 replies', function(done) {
        chai.request(server).get('/api/threads/q').end(function(err, res) {
          if (err)
            done(err);
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.property(res.body[0], '_id');
          assert.property(res.body[0], 'text');
          assert.property(res.body[0], 'replies');
          assert.notProperty(res.body[0], 'delete_password');
          assert.notProperty(res.body[0], 'reported');
          assert.isAtMost(res.body.length, 10);
          assert.isAtMost(res.body[0].replies.length, 3);
          assert.isTrue(res.body[0].bumped_on > res.body[1].bumped_on);
          done();
        });
      });
    });

    suite('DELETE', function() {
      test('Delete a thread', function(done) {
        chai.request(server).delete('/api/threads/q').send({board: 'q', thread_id: testId, delete_password: 111}).end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, '"success"');
          done();
        });
      });
    });

    suite('PUT', function() {
      test('Report a thread and change its reported value to true', function(done) {
        chai.request(server).put('/api/threads/q').send({board: 'q', thread_id: '5b980c037093ed31995e6f63'}).end(function(err, res) {
          assert.equal(res.status, 200)
          assert.equal(res.text, '"success"')
          done()
        })
      })
    })

  })

  suite('API ROUTING FOR /api/replies/:board', function() {

    suite('POST', function() {
      test('post a new reply', function(done) {
        chai.request(server).post('/api/replies/q').send({board: 'q', thread_id: messageId2, text: 'test reply', delete_password: 111}).end(function(err, res) {
          if (err)
            done(err);
          assert.equal(res.status, 200);
          assert.equal(res.body.nModified, 1);
          assert.equal(res.body.ok, 1);
          done();
        });
      });
    });

    suite('GET', function() {
      test('get an entire thread with all its replies', function(done) {
        chai.request(server).get('/api/replies/q?thread_id=' + messageId2).end(function(err, res) {
          if (err)
            done(err);
          assert.equal(res.status, 200);
          assert.isObject(res.body);
          assert.property(res.body, '_id');
          assert.property(res.body, 'text');
          assert.property(res.body, 'created_on');
          assert.property(res.body, 'bumped_on');
          assert.property(res.body, 'replies');
          assert.notProperty(res.body, 'delete_password');
          assert.notProperty(res.body, 'reported');
          replyId = res.body.replies[1]._id;
          done();
        });
      });
    });

    suite('PUT', function() {
      test('Report a reply and change its reported value to true', function(done) {
        chai.request(server).put('/api/replies/test').send({board: 'q', thread_id: '5b980c037093ed31995e6f63', reply_id: '5b9820e253005b0af1be5d07'}).end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, '"success"');
          done();
        });
      });
    });

    suite('DELETE', function() {
      test('Delete a reply post', function(done) {
        chai.request(server).delete('/api/replies/q').send({board: 'q', thread_id: messageId2, reply_id: replyId, delete_password: 111}).end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, '"success"');
          done();
        });
      });
    });

  });

});
