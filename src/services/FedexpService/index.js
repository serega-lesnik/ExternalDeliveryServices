const config = require('../config');
const _ = require('lodash');
const BaseService = require('../BaseService');


class FedexpService extends BaseService {

  company = 'FedEx';

  constructor() {
    super();
    Object.assign(this, _.get(config, 'external_delivery.fedex', {}));
  }

  __parseTrackingData(body, trackingNumber) {
    const trackDetails = _.pick(_.get(body, this.detailPath), this.pickDetails);
    let isDelivered = false;
    if (!trackDetails?.shipDt) {
      throw new Error(`Tracking Data of ${this.company}: The tracking number is invalid.`)
    }
    if (trackDetails?.keyStatus === this.deliveryStatus) {
      isDelivered = true;
    }
    return {
      isDelivered,
      data: {
        trackingNumber: trackDetails.trackingNbr,
        packageStatus: trackDetails.keyStatus,
        deliveryDate: trackDetails.displayActDeliveryDt,
        deliveryTime: trackDetails.displayActDeliveryTm,
        receivedBy: trackDetails.receivedByNm,
      },
    };
  }

  __getTrackingStatus(trackingNumber) {
    if (!this.cookie) {
      throw new Error(`${this.company} Credentials is UNDEFINED!`);
    }

    const formData = {
      action: 'trackpackages',
      format: 'json',
      locale: 'en_US',
      version: 1,
      data: JSON.stringify({
        TrackPackagesRequest: {
          appDeviceType: 'DESKTOP',
          appType: 'WTRK',
          processingParameters: {},
          uniqueKey: '',
          supportCurrentLocation: true,
          supportHTML: true,
          trackingInfoList: [{
            trackNumberInfo: {
              trackingNumber: trackingNumber,
              trackingQualifier: null,
              trackingCarrier: null,
            },
          }],
        },
      }),
    };

    const options = {
      uri: this.urlApi,
      method: 'POST',
      resolveWithFullResponse: true,
      json: true,
      headers: {
        cookie: this.cookie,
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
      },
      form: FedexpService.formDataEncode(formData),
    };

    return this.__fetchTrackingStatus(options)
      .then(body => {
        return this.__parseTrackingData(body, trackingNumber);
      });
  }

  getTrackingUrl(trackingNumber) {
    if (!_.isString(trackingNumber)) return null;
    return `https://www.fedex.com/fedextrack/no-results-found?trknbr=${trackingNumber}`;
  }

  init() {
    return super.init()
      .then(() => {
        return this.__getCreds(this.urlRoot);
      })
      .then(() => {
        if (!this.cookie) {
          throw new Error(`Parse ${this.company} Credentials is FAIL!`);
        }
      });
  }
};

module.exports = FedexpService;
