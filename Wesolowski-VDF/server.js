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
var p1_totient = bigInt(p1).prev();
var p2_totient = bigInt(p2).prev();
const totient = bigInt(p1_totient).multiply(p2_totient);// totient of the N

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
    io.emit('send_x', x);
    io.emit('send_y', y);
    io.emit('send_t', t);
    io.emit('send_N', N);
    io.emit('send_lamda', lamda);
    

    socket.on('send_prime', (data) => {
        console.log('The value of prime l is '+ data);
        var l = data;
        const lmod = bigInt(l).modInv(totient);
        const r = bigInt(2).modPow(t, l);
        console.log("r", r);
        const r_dash = bigInt(r).mod(totient);
        // var xpow_dash = bigInt(2).pow(t);
        const q_r = bigInt(xpow).minus(r_dash);
        const q_dash = bigInt(q_r).mod(totient);
        const q_mult = bigInt(q_dash).multiply(lmod);
        // const l_totient = bigInt(l).mod(totient);
        // const q_dash = bigInt(q_r).divide(l_totient);
        // console.log("old value of q_dash", q_dash_old);
        // console.log("new value of q_dash", q_dash);

        const q = bigInt(q_mult).mod(totient);
        // const q = Math.floor(q_totient);
        // console.log("The value of t is", t);
        // console.log("The value of xpow is", xpow);
        // console.log("The value of lmod is", lmod);
        // console.log("The value of q is", q);
        proof = bigInt(x).modPow(q, N);
        console.log("The value of proof is", proof);

        io.emit('send_proof', proof);
    });
    socket.on('verify', (data)=>{
        console.log(data);
    });
    
}
