var brain = require("brain.js")
const net = new brain.recurrent.LSTM( {
    iterations: 100,
    erroThresh: 0.011})

net.train([
  { input: 'good movie', output: 'happy' },
  { input: 'bad movie!', output: 'sad' },
])
console.log(22)
const output = net.run('awesome movie!') // 'happy'
const output2 = net.run('worst movie');
const output3 = net.run('I feel great about the people!') ;
const output4 = net.run('I am happy with people!')  // 'happy'
console.log(output);
console.log(output2);
console.log(output3);
console.log(output4);
