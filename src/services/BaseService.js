const request = require('request-promise');
const _ = require('lodash');


class BaseService {

  timer = Date.now();
  cookie = '';
  company = 'Base';
  delayTimeout = 200;

  constructor() {}

  static formDataEncode(formData) {
    return Object.keys(formData).map(key => {
      const encodedKey = encodeURIComponent(key);
      const encodedValue = encodeURIComponent(formData[key]);
      return `${encodedKey}=${encodedValue}`;
    }).join('&')
  }

  __wait(fn, ms = 0) {
    return new Promise((resolve, reject) => {
        const delay = Date.now() - this.timer;
        if (delay < ms) {
          setTimeout(resolve, delay);
        } else {
          resolve();
        }
      })
      .then(fn)
      .then(res => {
        this.timer = Date.now();
        return res;
      })
      .catch(err => {
        throw err;
      });
  }

  __parseCookies(arrCookies) {
    return new Promise((resolve, reject) => {
      const cookieRegExp = new RegExp('^([a-zA-Z_-]+)=([A-Za-z0-9_+-\/~=]+);');
      const cacheCookie = {};
      arrCookies.forEach(c => {
        const arr = c.match(cookieRegExp);
        if (arr.length >= 3) {
          cacheCookie[arr[1]] = arr[2];
          if (this.cookie) {
            this.cookie += '; ';
          }
          this.cookie += `${arr[1]}=${arr[2]}`;
        }
      })
      resolve(cacheCookie);
    })
  }

  __getCreds(url, cookieKey = 'set-cookie') {
    if (!url) throw new Error(`get Credentials ${this.company} URL for index page is not defined.`);

    const options = {
      uri: url,
      method: 'GET',
      resolveWithFullResponse: true,
    };

    return request(options)
      .then(res => {
        if (res?.statusCode == 200) {
          return this.__parseCookies(res.headers[cookieKey]);
        } else {
          throw new Error(`Request ${this.company} Credentials response Code is NOT Success!`);
        }
      })
      .catch(err => {
        throw err;
      });
  }

  __fetchTrackingStatus(options) {
    return request(options)
      .then(res => {
        if (res?.statusCode != 200) {
          throw new Error(`Request ${this.company} Credentials response Code is NOT Success!`);
        }
        if (!res?.body) {
          throw new Error(`Request ${this.company} response BODU is NOT defined!`);
        }
        return res.body;
      })
      .catch(err => {
        throw err;
      });
  }

  __getTrackingStatus() {
    return Promise.resolve({});
  }

  init() {
    return Promise.resolve();
  }


  getTrackingStatus(trackingNumber, delay = this.delayTimeout) {
    return this.__wait(() => this.__getTrackingStatus(trackingNumber), delay)
  }

  getArrayTrackingStatuses(trackingNumbers, delay = this.delayTimeout) {
    if (_.isString(trackingNumbers)) {
      trackingNumbers = [trackingNumbers];
    }
    if (!Array.isArray(trackingNumbers)) {
      throw new Error(`${this.company} get Trac Statuses: type trackingNumbers variable is not supported!`);
    }
    const result = []
    return trackingNumbers
      .reduce((accum, trackingNumber) => {
        return accum.then(() => {
          return this.getTrackingStatus(trackingNumber, delay);
        })
        .then(res => {
          result.push(res);
        })
      }, Promise.resolve())
      .then(() => {
        return result
      });
  }
};

module.exports = BaseService;