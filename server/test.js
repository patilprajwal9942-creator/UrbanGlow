const dns = require("dns");

dns.resolveSrv(
  "_mongodb._tcp.cluster0.vfgxmrl.mongodb.net",
  (err, addresses) => {
    if (err) {
      console.error("Error:", err);
    } else {
      console.log(addresses);
    }
  }
);