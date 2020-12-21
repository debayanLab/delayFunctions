/*************** Basic CVDF using Wesolowski's Non-Interactive Protocol ****************/
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
const t = 32; // Used this value for checking purpose since with a large value of t, it was taking longer to compute
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
    console.log("outside x");
    socket.on('send_x', (data) => {
        const x = data;
        socket.on('send_proof', (data) => {
            // *********** Verification *************
            var proof = data;
            socket.on('send_l', (data) => {
                var l = data;
                var r = [];
                var l_new=[];
                var k = 1;
                var count = 0;
                // Verify each state
                for (let j = 1; bigInt(j).lesserOrEquals(t); j++ ){
                    r[j] = bigInt(2).modPow(j, l[j]);
                    var first = bigInt(proof[j]).modPow(l[j], N)
                    var second = bigInt(x).modPow(r[j], N)
                    var mult = bigInt(first).multiply(second)
                    var y = bigInt(mult).mod(N);
                    var x_y = bigInt(x).add(y);
        
                    l_new[j] = nextPrime(x_y);

                    if (bigInt(l[j]).equals(l_new[j])){
                        socket.emit('verify', "Verified!");
                        console.log("Verified!");
                        count = count+1;
                    } else{
                        socket.emit('verify', "Could not verify!");
                        console.log("Could not verify!");
                    }    
                    k = k+1;
                }
                k = bigInt(k).minus(1);
                if (bigInt(k).equals(count)){
                    console.log("All verified"); // Check if all the states are verified
                };

            }); 
        }); 
    });
}
