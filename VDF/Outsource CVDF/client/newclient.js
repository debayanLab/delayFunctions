// const socket = io.connect('http://localhost:3000/');

// const { cipher } = require("node-forge");

// Disables the automatic reconnection
var socket = io.connect('http://localhost:3000/', {
    reconnection: false
});


socket.on('connect', () => {
  console.log('Successfully connected!');
});
var peer1 = new Peer('firstclient'); 


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
function hextodec(hex_value){
  if (hex_value.length % 2) { hex_value = '0' + hex_value; }
  var bn = BigInt('0x' + hex_value);
  var d = bn.toString(10);
  return d;
}

function findpg(bits){
  var n = bigInt.randBetween(bigInt(2).pow(bits-1),bigInt(2).pow(bits));
  var p = nextPrime(n);
  var q = bigInt(bigInt(p).multiply(2)).add(1);

  while (true){
    var g = bigInt.randBetween(2, bigInt(p).minus(3));
    var g_square = bigInt(g).multiply(g);
    var g_1 = bigInt(g_square).mod(p);
    var g_2 = bigInt(g).modPow(q,p);
    if (bigInt(g_1).neq(1) && bigInt(g_2).neq(1)){
      break;
    }
  }
  return [p,g];      
  
}

function keygen(p,g){
  // Generate public and private keys (A, a) given an odd prime p
  //   and a primitive root g.
  var a = bigInt.randBetween(2, bigInt(p).minus(2));
  var A = bigInt(g).modPow(a, p);
  return [A,a];  
}

function encrypt(p,g,A,n){
  // Encrypt number n given the public key p,g,A
  // first find (B,b)
  var key = keygen(p,g);
  var B = key[0];
  var b = key[1];
  var b_pow = bigInt(bigInt(n).multiply(bigInt(A).modPow(b,p))).mod(p);
  return [B, b_pow];
}

function decrypt(p, a, cipherpair){
  //Decrypt a cipher pair (B,c) given the private key p,g,a
  var B = bigInt(cipherpair[0]);
  var c = bigInt(cipherpair[1]);
  var c_minus = bigInt(bigInt(p).minus(1)).minus(a);
  var c_mod = bigInt(B).modPow(c_minus, p);
  var c_mult = bigInt(c).multiply(c_mod);
  var c_pow = bigInt(c_mult).mod(p);
  return c_pow;

}

function entester(bits, msg){
    var pg = findpg(bits);
    var p = pg[0];
    var g = pg[1];
    var key = keygen(p,g);
    var A = key[0];
    var a = key[1];
    var cipherpair = encrypt(p,g,A, msg);
    return [cipherpair,p,a]

}
function homomorphic(bits, v1, v2){
    // bits=200;
    var pg = findpg(bits);
    var p = pg[0];
    var g = pg[1];
    var key = keygen(p,g);
    var A = key[0];
    var a = key[1];

    var cp1 = encrypt(p, g, A, v1);
    var B1 = cp1[0];
    var c1 = cp1[1];
    var cp2 = encrypt(p, g, A, v2);
    var B2 = cp2[0];
    var c2 = cp2[1];
    console.log('B1 is '+ B1 + 'B2 is '+ B2);
    console.log('c1 is '+ B1 + 'c2 is '+ B2);
    var decrypted = decrypt(p,a, [bigInt(B1).multiply(B2), bigInt(c1).multiply(c2)]);
    console.log('decrypted:', decrypted);
    console.log('match homomorphic?', bigInt(decrypted).equals(bigInt(v1).multiply(v2)));
}

//****** */
socket.on('send_m', (data) => {
  const m = data;
  socket.on('send_t', (data) => {
    const t = data;
    socket.on('send_N', (data) => {
      const N = data;
      socket.on('send_totient', (data) => {
        const totient = data;
        socket.on('send_lamda', (data) => {
          
          const lamda = bigInt(data);
          var m_string = bigInt(m).toString();
        
          const hash = CryptoJS.SHA256(m_string)
          hash.toString(CryptoJS.enc.Hex);
          console.log("The hash of the message in string format is", hash);
          const x = bigInt(hextodec(hash)); // x <- H(m)
          
          
          console.log("The hash of the message is", x); 
          var outsource = 7;
          var cal = 8;
          const xpow = bigInt(2).modPow(cal, totient);
          var xpow1 = bigInt(2).modPow(outsource, totient);
          var y = bigInt(2).modPow(xpow1, N); //generate y 
          var y_ori = bigInt(2).modPow(xpow, N);
          console.log("The value of y is", y);
          socket.emit('send_x', x);
          var rem = bigInt(cal).minus(outsource);
          var res = entester(lamda, y);
          var new_res = [];
          new_res[0] = bigInt(res[0][0]);
          new_res[1] = bigInt(res[0][1]);
          var p_key = res[1];
          var private = res[2];
          peer1.on('open', function(id) {
            console.log('My peer ID is: ' + id);
          
            var peer2 = new Peer('secondclient'); 
            peer2.on('open', function(id) {
              var conn1 = peer1.connect('secondclient');
              conn1.on('open', function(){
                //Send messages
                console.log("Sending");
                // conn1.send('encrypt', res[0]);
                
              });

            });
          
            
            
          
            var conn2 = peer2.connect('firstclient');
          });

          // conn1.on('open', function(){
          //   //Send messages
          //   console.log("Sending");
          //   conn1.send('encrypt', res[0]);
            
          // });
          // peer2.on('connection', function(conn2){
          //   console.log("Hello")
          //   conn2.on('encrypt', function(data){
          //     console.log('Received data',data);
          //   })
          // });

          var new_res2 = [bigInt(new_res[0]), bigInt(new_res[1])];
    
          for (let i = 1; i<=rem; i++){
            new_res2[0] = bigInt(new_res2[0]).pow(2);
            new_res2[1] = bigInt(new_res2[1]).pow(2);
          }
          // console.log('new_res2', new_res2);
          var y_new = decrypt(p_key, private, new_res2);
          // console.log('Base 5 is ', (Math.log(y_new))/Math.log(5));
          // console.log('Base 5 original is ', (Math.log(y_ori))/Math.log(5));

          
          console.log('N',N);
          console.log("COmpare", bigInt(N).compare(y_new));
          console.log('New y', bigInt(y_new));
          console.log('Original y', y_ori);

          var x_y = bigInt(x).add(y_new);

        
          var l = nextPrime(x_y);
          
          if (bigInt(l).isPrime()){
            const lmod = bigInt(l).modInv(totient);
            const r = bigInt(2).modPow(t, l); // r = 2^t mod l
            console.log("r", r);
            const r_dash = bigInt(r).mod(totient);
            const q_r = bigInt(xpow).minus(r_dash);
            const q_dash = bigInt(q_r).mod(totient);
            const q_mult = bigInt(q_dash).multiply(lmod);
            const q = bigInt(q_mult).mod(totient);
            proof = bigInt(x).modPow(q, N);
            console.log("The value of proof is", proof);
            // console.timeEnd();
            socket.emit('send_y', y_new);
            socket.emit('send_proof', proof);
            socket.emit('send_l',l);

            socket.on('verify', (data)=>{
              console.log(data);
            });
          } else {
            console.log("l is not prime")
          }
          
          console.log("Out")
          socket.emit('send_x', x);
        
          socket.emit('send_proof', proof);
  
          socket.on('proof_received', (data) => {
            console.log(data);
          });
          socket.emit('send_l', l);


        });
      });
    });
  });
});



  // Reconnects on disconnection
  // socket.on('disconnect', function(){
  //   socket.connect(callback);
  // });

