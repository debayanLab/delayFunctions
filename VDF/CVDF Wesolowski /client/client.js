/*************** Basic CVDF using Wesolowski's Non-Interactive Protocol ****************/
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
          // *************** Evaluation ****************         
          const hash = CryptoJS.SHA256(m_string)
          hash.toString(CryptoJS.enc.Hex);
          const x = bigInt(hextodec(hash)); // x <- H(m)
         
          var l = [];
          var proof = [];
          var j = 1;
          var t_new = 1;
          var xpow= [];
          var y = [];
          var x_y = [];
          var r = [];
          var lmod, r_dash, q_r, q_dash, q_mult, q;

          // Prepare proofs for each state
          for (let k = 1; bigInt(k).lesserOrEquals(t); k++ ){
            xpow[k] = bigInt(2).modPow(k, totient);
            y[k] = bigInt(x).modPow(xpow[k], N); //generate y 
            x_y[k] = bigInt(x).add(y[k]);
            l[k] = nextPrime(x_y[k]);
            lmod = bigInt(l[k]).modInv(totient);
            r[k] = bigInt(2).modPow(k, l[k]); // r = 2^t mod l
            r_dash = bigInt(r[k]).mod(totient);
            q_r = bigInt(xpow[k]).minus(r_dash);
            q_dash = bigInt(q_r).mod(totient);
            q_mult = bigInt(q_dash).multiply(lmod);
            q = bigInt(q_mult).mod(totient);
            proof[k] = bigInt(x).modPow(q, N);
            j = j+1;
          }
          socket.emit('send_x', x);
          socket.emit('send_proof', proof);
          socket.emit('send_l', l);
        });
      });
    });
  });
});

