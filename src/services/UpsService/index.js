const config = require('../config');
const _ = require('lodash');
const BaseService = require('../BaseService');


class UpsService extends BaseService {

  company = 'UPS';
  token = '';

  constructor() {
    super();
    Object.assign(this, _.get(config, 'external_delivery.ups', {}));
  }

  __parseCookies(arrCookies) {
    return super.__parseCookies(arrCookies)
    .then(cacheCookie => {
      this.token = cacheCookie['X-XSRF-TOKEN-ST'] || null;
    });
  }

  __parseTrackingData(body, trackingNumber) {
    const trackDetails = _.pick(_.get(body, this.detailPath), this.pickDetails);
    let isDelivered = false;
    if (_.isEmpty(trackDetails) || (trackDetails?.trackingNumber !== trackingNumber)) {
      throw new Error(`Tracking Data of ${this.company}: The tracking number is invalid.`);
    }
    if (trackDetails?.packageStatus === this.deliveryStatus) {
      isDelivered = true;
    }
    return {
      isDelivered,
      data: {
        trackingNumber: trackDetails.trackingNumber,
        packageStatus: trackDetails.packageStatus,
        deliveryDate: trackDetails.deliveredDate,
        deliveryTime: trackDetails.deliveredTime,
        receivedBy: trackDetails.receivedBy,
      },
    };
  }

  __getTrackingStatus(trackingNumber) {
    if (!this.cookie || !this.token) {
      throw new Error(`${this.company} Credentials is UNDEFINED!`);
    }

    const options = {
      uri: this.urlApi,
      method: 'POST',
      resolveWithFullResponse: true,
      json: true,
      headers: {
        cookie: this.cookie,
        'x-xsrf-token': this.token,
        // 'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
      },
      body: {
        Locale: 'en_US',
        TrackingNumber: [ trackingNumber ],
        Requester: 'wt/trackdetails',
        returnToValue: '',
      },
    };
    return this.__fetchTrackingStatus(options)
      .then(body => {
        return this.__parseTrackingData(body, trackingNumber);
      });
  }

  getTrackingUrl(trackingNumber) {
    if (!_.isString(trackingNumber)) return null;
    return `https://www.ups.com/track?loc=null&tracknum=${trackingNumber}&requester=WT/trackdetails`;
  }

  init() {
    return this.__getCreds(this.urlRoot)
      .then(() => {
        if (!this.cookie || !this.token) {
          throw new Error(`Parse ${this.company} Credentials is FAIL!`);
        }
      });
  }

};

module.exports = UpsService;