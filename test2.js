var natural = require('natural');
var fs = require('fs');
var classifier = new natural.LogisticRegressionClassifier();

let rawdata = fs.readFileSync('classifierdata.json');
let classifierdata = JSON.parse(rawdata);
classifier.events.on('trainedWithDocument', function (obj) {

    console.log(33);
    /* {
    *   total: 23 // There are 23 total documents being trained against
    *   index: 12 // The index/number of the document that's just been trained against
    *   doc: {...} // The document that has just been indexed
    *  }
    */
 });
 console.log(1241);
 classifierdata.forEach(e=>{
    classifier.addDocument(e.input, e.output);
})
console.log(121);
classifier.train();
classifier.save('classifier.json', function(err, classifier) {
    console.log(141);

});
console.log(11);
