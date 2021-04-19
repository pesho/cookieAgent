const http = require("http");
const https = require("https");
const tough = require("tough-cookie");

let registered = false;
const defaultCookieJar = new tough.CookieJar();

function cookieAgentFactory(BaseClass) {

    class CookieAgent extends BaseClass {
        constructor(options, ...args) {
            super(options, ...args);
            this.cookieJar = (options && options.cookieJar) || defaultCookieJar;
        }

        /**
         * @param {http.ClientRequest} req
         * @param {http.RequestOptions} opts
         */
        addRequest(req, opts, ...args) {
            const currentUrl = req.protocol+"//"+(req.getHeader("Host") || req.host)+req.path;
            const rawCookie = req.getHeader("Cookie");
            const userCookies = rawCookie ? (Array.isArray(rawCookie) ? rawCookie : [rawCookie]) : [];
            const jarCookies = this.cookieJar.getCookiesSync(currentUrl).map((cookie) => cookie.cookieString());
            const allCookies = [...jarCookies, ...userCookies];
            if (allCookies.length) req.setHeader("Cookie", allCookies);
            req.on("response", (res) => {
                const setCookie = res.headers["set-cookie"];
                if (setCookie) {
                    const cookies = setCookie.map(tough.Cookie.parse);
                    cookies.forEach((cookie) => { this.cookieJar.setCookieSync(cookie, currentUrl); })
                }
            });
            return super.addRequest(req, opts, ...args);
        }
    }

    return CookieAgent;
}

function register() {
    if (registered) return;
    const HTTPAgent = cookieAgentFactory(http.Agent);
    const HTTPSAgent = cookieAgentFactory(https.Agent);
    const httpAgent = new HTTPAgent();
    const httpsAgent = new HTTPSAgent();
    http.Agent = HTTPAgent;
    https.Agent = HTTPSAgent;
    http.globalAgent = httpAgent;
    https.globalAgent = httpsAgent;    
    registered = true;
};

exports.cookieAgentFactory = cookieAgentFactory;
exports.register = register;
