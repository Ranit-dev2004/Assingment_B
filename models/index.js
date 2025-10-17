const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const db = {};
db.mongoose = mongoose;
db.Profile = require("./Profile");
db.Event = require("./Event");
module.exports=db;