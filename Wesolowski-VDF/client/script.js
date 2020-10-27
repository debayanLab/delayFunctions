const socket = io.connect('http://localhost:3000/');

socket.on('connect', () => {
  console.log('Successfully connected!');
});

var lamda;
socket.on('send_x', (data) => {
  const x = data;
  console.log('x is ',x);
  socket.on('send_y', (data) => {
    const y = data;
    console.log('y is ',y);
    socket.on('send_t', (data) => {
      const t = data;
      console.log('t is ',t);
      socket.on('send_N', (data) => {
        const N = data;
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
            var no = bigInt.randBetween(min, max)
            if(bigInt(no).isPrime()===true) {
              return no;
            } else {
              return getPrime(min, max);
            }
          }
          var l = getPrime(1, find_bit);
          console.log('Prime no. is'+ l + bigInt(l).isPrime());
          socket.emit('send_prime', l);
          socket.on('send_proof', (data) => {
            var proof = data;
            console.log('proof is ',proof);
            const r = bigInt(2).modPow(t, l);
            console.log("r", r)
            first = bigInt(proof).modPow(l, N)
            console.log("first", first)
            second = bigInt(x).modPow(r, N)
            console.log("second", second)
            mult = bigInt(first).multiply(second)
            console.log("mult", mult);
            result = bigInt(mult).mod(N)
            console.log("result", result)
            console.log("y", y) 
            console.log("N", N);
            if (bigInt(result).equals(y)){
              socket.emit('verify', "Verified!");
              console.log("Verified!");
            } else{
              socket.emit('verify', "Could not verify!");
              console.log("Could not verify!");
            }
          });
        
        });
      });
    });
  });
});
