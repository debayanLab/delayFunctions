/************** Outsourcing CVDF *****************/
/**
 * This code does fully work.
 * The code does work when the final decrypted value (i.e. y = x^{2^t})is more than N. 
 * I tried using mod N on the final value but it didn't work. 
 * The code, however, works if the final decrypted value (i.e. y = x^{2^t}) comes out to be less than N.
 * I also tried to use Peerjs to communicate between two clients.
 * However, I was not able to transfer bigInteger arrays from one client to another.
 */
var socket = io.connect('http://localhost:3000/', {
    reconnection: false
});


socket.on('connect', () => {
  console.log('Successfully connected!');
});

// Function to convert hex values to decimal
function hextodec(hex_value){
  if (hex_value.length % 2) { hex_value = '0' + hex_value; }
  var bn = BigInt('0x' + hex_value);
  var d = bn.toString(10);
  return d;
};

// Function to generate next-prime of a number
function nextPrime(num){
  var pp;
  if (bigInt(num).isOdd() === true){
    // console.log("Odd")
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
    // console.log("Even")
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

// Function to generate prime p and primitive root g for El-Gamal Encryption
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
};

// Function to generate public and private keys (A, a) given an odd prime p and a primitive root g.
function keygen(p,g){
  var a = bigInt.randBetween(2, bigInt(p).minus(2));
  var A = bigInt(g).modPow(a, p);
  return [A,a];  
};

// Function to encrypt number n given the public key p,g,A 
function encrypt(p,g,A,n){
  //first find (B,b)
  var key = keygen(p,g);
  var B = key[0];
  var b = key[1];
  var b_pow = bigInt(bigInt(n).multiply(bigInt(A).modPow(b,p))).mod(p);
  return [B, b_pow];
}

// Function to decrypt a cipher pair (B,c) given the private key p,g,a
function decrypt(p, a, cipherpair){
  var B = bigInt(cipherpair[0]);
  var c = bigInt(cipherpair[1]);
  var c_minus = bigInt(bigInt(p).minus(1)).minus(a);
  var c_mod = bigInt(B).modPow(c_minus, p);
  var c_mult = bigInt(c).multiply(c_mod);
  var c_pow = bigInt(c_mult).mod(p);
  return c_pow;

}

// Function that puts all the other functions needed to encrypt a message together and returns ciphertext, public and private keys
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

// Function used to test Multiplicative Homomorphic property 
function homomorphic(bits, v1, v2){
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
          // const x = bigInt(hextodec(hash)); // x <- H(m)
          const x = 5; // Used this value since with a large value of x, my code does not work
          socket.emit('send_x', x);
          var outsource = 3; // This represents the time that the first person computes the function for before outsourcing
          const xpow = bigInt(2).modPow(t, totient);
          var xpow1 = bigInt(2).modPow(outsource, totient);
          var y = bigInt(x).modPow(xpow1, N); //generate y 

          var rem = bigInt(t).minus(outsource);
          var res = entester(lamda, y);
          var new_res = [];
          new_res[0] = bigInt(res[0][0]);
          new_res[1] = bigInt(res[0][1]);
          var p_key = res[1];
          var private = res[2];
         /* 
         // Tried to use peerjs to communcate between two clients. 
         // This did not work since I was not able to send bigInteger arrays from one client to another

          peer1.on('open', function(id) {
            console.log('My peer ID is: ' + id);
            var send_res = [];
            send_res[0] = Number(res[0][0]);
            send_res[1] = Number(res[0][1]);
          
            var peer2 = new Peer('secondclient'); 
              var conn1 = peer1.connect('secondclient');
              conn1.on('open', function(){
                console.log("Sending", [send_res[0],send_res[1]]);
                conn1.send([send_res[0],send_res[1]]);
                });
                peer2.on('connection', function(conn2) {
                // conn2.on('open', function(){
                  conn2.on('data', (data)=> {
                    console.log(data);
                  });
              });
          });*/

          var new_res2 = [bigInt(new_res[0]), bigInt(new_res[1])];
          for (let i = 1; i<=rem; i++){
            new_res2[0] = bigInt(new_res2[0]).pow(2);
            new_res2[1] = bigInt(new_res2[1]).pow(2);
          }
          var y_new = decrypt(p_key, private, new_res2);
          y_new = bigInt(y_new).mod(N); // Tried doing this for values that are larger than N, but does not work        
 
          var x_y = bigInt(x).add(y_new);
          var l = nextPrime(x_y);
          if (bigInt(l).isPrime()){
            const lmod = bigInt(l).modInv(totient);
            const r = bigInt(2).modPow(t, l); // r = 2^t mod l
            const r_dash = bigInt(r).mod(totient);
            const q_r = bigInt(xpow).minus(r_dash);
            const q_dash = bigInt(q_r).mod(totient);
            const q_mult = bigInt(xpow).divide(l);
            const q = bigInt(q_mult).mod(totient);
            proof = bigInt(x).modPow(q, N);
            socket.emit('send_proof', proof);
            socket.emit('send_l',l);

            console.log(l);
            socket.on('verify', (data)=>{
              console.log(data);
            });
          } else {
            console.log("l is not prime")
          }
        });
      });
    });
  });
});


