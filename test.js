const http = require("http");
const https = require("https");
const cookieAgentFactory = require("./cookieAgent");

const HTTPAgent = cookieAgentFactory(http.Agent);
const httpAgent = new HTTPAgent();
http.globalAgent = httpAgent;

const HTTPSAgent = cookieAgentFactory(https.Agent);
const httpsAgent = new HTTPSAgent();
https.globalAgent = httpsAgent;

const req1 = https.request("https://www.google.com/");
req1.on("error", (e) => { console.error("error1:", e.message); });
req1.on("response", (res) => { 
    console.log("headers1:", res.headers);

    const req2 = https.request("https://www.google.com/");
    req2.on("error", (e) => { console.error("error2:", e.message); });
    req2.on("response", (res) => { 
        console.log("headers2:", res.headers);
    });
    req2.end();
});
req1.end();
