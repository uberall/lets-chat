'use strict';

var mongoose = require('mongoose'),
    helpers = require('./helpers');

function RoomManager(options) {
    this.core = options.core;
}

RoomManager.prototype.create = function(options, cb) {
    var Room = mongoose.model('Room');
    var User = mongoose.model('User');

    options.members = options.members.replace(/@/g, '');
    options.members = options.members.split(' ');

    User.find({username: { $in: options.members } }, function(err, members) {
        if (err) {
            // Oh noes, a bad thing happened!
            console.error(err);
            return cb(err);
        }

        options.members = members;

        Room.create(options, function(err, room) {
            if (err) {
                return cb(err);
            }

            if (cb) {
                room = room;
                cb(null, room);
                this.core.emit('rooms:new', room);
            }
        }.bind(this));
    }.bind(this));
};

RoomManager.prototype.update = function(roomId, options, cb) {
    var Room = mongoose.model('Room');
    var User = mongoose.model('User');

    options.members = options.members.replace(/@/g, '');
    options.members = options.members.split(' ');

    User.find({username: { $in: options.members } }, function(err, members) {
        if (err) {
            // Oh noes, a bad thing happened!
            console.error(err);
            return cb(err);
        }

        Room.findById(roomId, function(err, room) {
            if (err) {
                // Oh noes, a bad thing happened!
                console.error(err);
                return cb(err);
            }

            if (!room) {
                return cb('Room does not exist.');
            }

            room.name = options.name;
            // DO NOT UPDATE SLUG
            // room.slug = options.slug;
            room.description = options.description;
            room.members = members;
            room.save(function(err, room) {
                if (err) {
                    console.error(err);
                    return cb(err);
                }
                room = room;
                cb(null, room);
                this.core.emit('rooms:update', room);

            }.bind(this));
        }.bind(this));
    }.bind(this));

};

RoomManager.prototype.archive = function(roomId, cb) {
    var Room = mongoose.model('Room');

    Room.findById(roomId, function(err, room) {
        if (err) {
            // Oh noes, a bad thing happened!
            console.error(err);
            return cb(err);
        }

        if (!room) {
            return cb('Room does not exist.');
        }

        room.archived = true;
        room.save(function(err, room) {
            if (err) {
                console.error(err);
                return cb(err);
            }
            cb(null, room);
            this.core.emit('rooms:archive', room);

        }.bind(this));
    }.bind(this));
};

RoomManager.prototype.list = function(options, cb) {
    options = options || {};

    options = helpers.sanitizeQuery(options, {
        defaults: {
            take: 500
        },
        maxTake: 5000
    });

    var Room = mongoose.model('Room');

    var find = Room.find(
        { archived: { $ne: true }, 
        $or: [{owner: options.user}, {members: options.user}, {members: {$exists: false}}, {members: []}]
    });

    if (options.skip) {
        find.skip(options.skip);
    }

    if (options.take) {
        find.limit(options.take);
    }

    if (options.sort) {
        var sort = options.sort.replace(',', ' ');
        find.sort(sort);
    }

    find.exec(cb);
};

RoomManager.prototype.get = function(identifier, cb) {
    var Room = mongoose.model('Room');
    Room.findOne({
        _id: identifier,
        archived: { $ne: true }
    }, cb);
};

RoomManager.prototype.slug = function(slug, cb) {
    var Room = mongoose.model('Room');
    Room.findOne({
        slug: slug,
        archived: { $ne: true }
    }, cb);
};

module.exports = RoomManager;
