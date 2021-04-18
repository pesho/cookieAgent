const http = require("http");
const tough = require("tough-cookie");

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
            const currentUrl = opts.href;
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

module.exports = cookieAgentFactory;
