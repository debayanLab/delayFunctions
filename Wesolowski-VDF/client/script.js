// const io = require('socket.io-client');
// import * as bigintCryptoUtils from 'bigint-crypto-utils'
const socket = io.connect('http://localhost:3000/');

socket.on('connect', () => {
  console.log('Successfully connected!');
});

var lamda;
socket.on('send_y', (data) => {
  var y = data;
  socket.on('send_t', (data) => {
    var t = data;
    socket.on('send_N', (data) => {
      var N = data;
      socket.on('send_lamda', (data) => {
        // console.log('The value of lamda is ' + data);
        lamda = bigInt(data);
        console.log("lamda is", lamda);
        find_bit = bigInt(2).pow(lamda);
        no_bit = bigInt(find_bit).bitLength();
        console.log('Bit length' + no_bit);
      
        // var l = forge.prime.generateProbablePrime(no_bit);
        // console.log("prime "+l);
        // generate a key pair of required size
        
        function getPrime(min, max){
          x = bigInt.randBetween(min, max)
          if(bigInt(x).isPrime()===true) {
            return x;
          } else {
            return getPrime(min, max);
          }
        }
        var l = getPrime(1, find_bit);
        console.log('Prime no. is'+ l + bigInt(l).isPrime());
        socket.emit('send_prime', l);
        socket.on('send_proof', (data) => {
          var proof = data;
          const r = bigInt(2).modPow(t, l)
          console.log("r", r)
          first = bigInt(proof).modPow(l, N)
          console.log("first", first)
          second = bigInt(x).modPow(r, N)
          console.log("second", second)
          mult = bigInt(first).multiply(second)
          result = bigInt(mult).mod(N)
          console.log("result", result)
          console.log("y", y) 
        });
      
      });
    });
  });
});


socket.emit('message', "Send me the value of N");
// console.log("lamda is"+ s);




// var socket;

// socket = io.connect('http://localhost:3000/');

// socket.emit('message', "Send me the value of N");

// socket.on('mouse', newMessage);
// function newMessage(data){
//   console.log(data)
// }


// socket.on('connect', (data) =>{
//   console.log(data)
// });
