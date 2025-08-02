const mongoose = require("mongoose");
const searchPostSchmea = new mongoose.Schema({
    postId: {type: String, required: true, unique: true},
    userId: {type: String, required: true, index: true},
    content: {type: String, required: true,},
    createdAt: {type: Date, required: true, default: Date.now}
}, {timestamps: true});

searchPostSchmea.index({content: "text"});
searchPostSchmea.index({createdAt: -1});

const Search = mongoose.model("Search", searchPostSchmea);

module.exports = {Search};