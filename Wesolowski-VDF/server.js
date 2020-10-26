var express = require('express');
var app = express();
var server = app.listen(3000);

app.use(express.static('client'));
console.log("My server is running");

var socket = require('socket.io');

var io = socket(server);


//**************VDF Setup********************** 
const bigintCryptoUtils = require('bigint-crypto-utils')
var bigInt = require("big-integer");
// var forge = require('node-forge');

var crypto = require('crypto');

function hextodec(hex_value){
    if (hex_value.length % 2) { hex_value = '0' + hex_value; }
    var bn = BigInt('0x' + hex_value);
    var d = bn.toString(10);
    return d;
}

const lamda = 256 //RSA bit-length 
// Generate primes p1 and p2
var DH1 = crypto.createDiffieHellman(lamda/2); // bit length
var p1_hex = DH1.getPrime('hex');
var p1 =bigInt(hextodec(p1_hex));

var DH2 = crypto.createDiffieHellman(lamda/2); // bit length
var p2_hex = DH2.getPrime('hex');
var p2 =bigInt(hextodec(p2_hex));

// confirm if p1 and p2 are prime numbers
console.log(bigInt(p1).isPrime());
console.log(bigInt(p2).isPrime());

const N = bigInt(p1).multiply(p2); // RSA modulus of bit size lamda 
const totient = bigInt(p1-1).multiply(p2-1);// totient of the N

// security parameter (typically between 128 and 256)
const k = 128;


var m = bigInt.randBetween(0, N-1);
m_string = bigInt(m).toString();

const hash = crypto.createHash('sha256').update(m_string).digest('hex'); //hash H : {0, 1}^* -> {0, 1}^ 2k 
console.log("The hash of the message in string format is", hash);
const x = bigInt(hextodec(hash)); // x <- H(m)
console.log("The hash of the message is", x); 

const t = bigInt.randBetween(0, N); //t ∈ N

const xpow = bigInt(2).modPow(t, totient);
const y = bigInt(x).modPow(xpow, N); //generate y 
console.log("The value of y is", y);

io.on('connection', newConnection);

function newConnection(socket){
    console.log('User connected: '+ socket.id);
    // console.log("Helo")
    io.emit('send_y', y);
    io.emit('send_t', t);
    io.emit('send_N', N);
    io.emit('send_lamda', lamda);
    

    socket.on('send_prime', (data) => {
        console.log('The value of prime l is '+ data);
        var l = data;
        const lmod = bigInt(l).modInv(totient)
        const q = bigInt(xpow).multiply(lmod)
        console.log("The value of t is", t)
        console.log("The value of xpow is", xpow)
        console.log("The value of lmod is", lmod)
        console.log("The value of q is", q)
        proof = bigInt(x).modPow(q, N)
        console.log("The value of proof is", proof)

        io.emit('send_proof', proof);
    });
    
}

/*
// Fiat-shamir
var count = 0;
function nextPrime(n){
    if (bigInt(n).isOdd() === true){
        for (var i = bigInt(n+2); i <2*n; i+2){
            if (bigInt(i).isPrime() === true){
                return i;
            }
        } 
    }
    if (bigInt(n).isEven() === true){
        for (var i = bigInt(n+1); i < 2*n; i+2){
            if (bigInt(i).isPrime() === true){
                return i;
            }
        } 
    }  
}

const nearestPrime = num => {
    if (bigInt(num).isOdd()===true){
        while(!bigInt(num).isPrime()){
            num = num+2;
        };
    } else {
        num = num+1;
        while(!bigInt(num).isPrime()){
            num = num+2;
        };
    }
    
    return num;
 };
console.log("the next prime of 1000 is", nearestPrime(2000));
const sum = bigInt(x).add(y); // x+y
const sum_string =  bigInt(sum).toString();
const hash_sum = crypto.createHash('sha256').update(sum_string).digest('hex');
var H_sum = bigInt(hextodec(hash_sum));
console.log("Sum of x and y is", H_sum);
var l = nearestPrime(H_sum);
console.log("The next prime of"+ H_sum + "is: " +l);

var DH3 = crypto.createDiffieHellman(256); // bit length
var H_prime = DH3.getPrime('hex');
var l = bigInt(hextodec(H_prime));
while ((bigInt(H_sum).greaterOrEquals(l)=== true)){
    DH3 = crypto.createDiffieHellman(256); // bit length
    H_prime = DH3.getPrime('hex');
    l =bigInt(hextodec(H_prime));
  }
console.log("value of hash is", H_sum);
console.log("value of next prime is", l);

// const q_pow = bigInt(2).modPow(t, totient)
// const qpow = (bigInt(2).pow(t)).divide(l)
const lmod = bigInt(l).modInv(totient)
// const g = xpow/lmod
const q = bigInt(xpow).multiply(lmod)
console.log("The value of t is", t)
// console.log("The value of g is", g)
console.log("The value of xpow is", xpow)
console.log("The value of lmod is", lmod)
console.log("The value of q is", q)
proof = bigInt(x).modPow(q, N)
console.log("The value of proof is", proof)

io.sockets.on('connection', newConnection);

function newConnection(socket){
    console.log('new connection: ' + socket.id);
    // console.log("New connection",socket);
    // socket.on('mouse', mouseMsg);

    // function mouseMsg(data){
    //     console.log(data);
    // }
} 
*/

