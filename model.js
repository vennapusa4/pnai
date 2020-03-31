const mongoose = require('mongoose');
const { Schema } = mongoose;
const intentSchema = new Schema({
    intent: String,
    intentId:String,
    query: String,
    score:Number,
    train:Boolean
  },{ strict: false });
  
mongoose.model('intents', intentSchema);
  