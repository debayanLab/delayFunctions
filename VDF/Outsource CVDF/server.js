/************** Outsourcing CVDF *****************/ 
/**
 * This code does fully work.
 * The code does work when the final decrypted value is more than N. 
 * I tried using mod N on the final value but it didn't work.
 * I also tried to use Peerjs to communicate between two clients.
 * However, I was not able to transfer bigInteger arrays from one client to another.
 */
var express = require('express');
var app = express();
var server = app.listen(3000);

app.use(express.static('client'));
console.log("My server is running");

var socket = require('socket.io');

var io = socket(server);


//************** CVDF Setup********************** 

var bigInt = require("big-integer");
var crypto = require('crypto');

// Function to convert hex values to decimal
function hextodec(hex_value){
    if (hex_value.length % 2) { hex_value = '0' + hex_value; }
    var bn = BigInt('0x' + hex_value);
    var d = bn.toString(10);
    return d;
}

// Function to generate next-prime of a number
function nextPrime(num){
    var pp;
    if (bigInt(num).isOdd() === true){
        for (let i= bigInt(num); i< bigInt(num).multiply(2); i = bigInt(i).add(2)){
            if ((bigInt(i).mod(3) != 0) && (bigInt(i).mod(5) != 0) ){
                if (bigInt(i).isPrime()){
                    pp = i;
                    break;
                }
            }
        }
    }
    else{
        num = bigInt(num).add(1);
        for (let i= bigInt(num); i< bigInt(num).multiply(2); i = bigInt(i).add(2)){
            if ((bigInt(i).mod(3) != 0) && (bigInt(i).mod(5) != 0) ){
                if (bigInt(i).isPrime()){
                    pp = i;
                    break;
                }
            }
        }
    }
    return pp;
    
};

const lamda = 128//RSA bit-length 
// Generate primes p1 and p2
var DH1 = crypto.createDiffieHellman(lamda/2); // bit length
var p1_hex = DH1.getPrime('hex');
var p1 =bigInt(hextodec(p1_hex));

var DH2 = crypto.createDiffieHellman(lamda/2); // bit length
var p2_hex = DH2.getPrime('hex');
var p2 =bigInt(hextodec(p2_hex));

var N = bigInt(p1).multiply(p2); // RSA modulus of bit size lamda 
var p1_totient = bigInt(p1).prev();
var p2_totient = bigInt(p2).prev();
var totient = bigInt(p1_totient).multiply(p2_totient);// totient of the N

// const t = bigInt.randBetween(0, N); //t ∈ N
const t = 5; // Used this value for checking purpose since with a large value of t, my code does not give correct value

var m = bigInt.randBetween(0, N);

// Connect to Client
io.sockets.on('connection', newConnection);
function newConnection(socket){
    console.log('User connected: '+ socket.id);
    io.emit('send_m', m);
    io.emit('send_t', t);
    io.emit('send_N', N);
    io.emit('send_totient', totient);
    io.emit('send_lamda', lamda);
   
    socket.on('send_x', (data) => {
        
        const x = data;
        socket.on('send_proof', (data) => {
            var proof = data;
            // *********** Verification *************
            socket.on('send_l', (data) => {
                var l = data;
                var r = bigInt(2).modPow(t,l);
                var first = bigInt(proof).modPow(l,N);
                var second = bigInt(x).modPow(r,N);
                var mult = bigInt(first).multiply(second);
                var y = bigInt(mult).mod(N);
                var x_y = bigInt(x).add(y);
                var l_new = nextPrime(x_y);
                if (bigInt(l).equals(l_new)){
                    socket.emit('verify', "Verified!");
                    console.log("Verified!");
                } else{
                    socket.emit('verify', "Could not verify!");
                    console.log("Could not verify!");
                }
            }); 
        });       
    });
}
