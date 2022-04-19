const _ = require('lodash');
const { mapShipers } = require('./src');

const _getTrackingLink = (trackingNumber, shipService) => {
  let trackLink = `"${trackingNumber}"`;
  if (_.isFunction(shipService?.getTrackingUrl)) {
    const link = shipService?.getTrackingUrl(trackingNumber);
    if (link) trackLink = `#<a href="${link}" target="_blank">${trackingNumber}</a>`;
  }
  return trackLink;
};

const getDeliveryStatus = (trackingNumber, company = '') => {
  const shipService = mapShipers[company.toLowerCase()];

  if (!_.isFunction(shipService?.getTrackingStatus)) {
    const message = `Delivery Company "${company}" is not supported. Please track the status of shipment # ${trackingNumber} by yourself.`;
    console.log("--- Undelivered Shipments:\n", message);
    return Promise.resolve();
  }

  return shipService.init()
    .then(() => shipService.getArrayTrackingStatuses(trackingNumber))
    .then(deliveryStatus => {
      const { isDelivered, data } = deliveryStatus;
      if (isDelivered) {
        const message = `Tracking N ${_getTrackingLink(trackingNumber, shipService)} in ${company} is Delivered!`;
        console.log("--- Delivered Shipments:\n", message);
      } else {
        message = `Tracking N ${_getTrackingLink(trackingNumber, shipService)} in "${company}" is not delivered and have Status is "${data?.packageStatus}"`;
        console.log("--- Undelivered Shipments:\n", message);
      }
      console.log("--- Received Delivery status:", deliveryStatus);
      return deliveryStatus;
    })
    .catch(err => {
      const errorMsg = err.message;
      message = `Fetching Track Delivery for ${_getTrackingLink(trackingNumber, shipService)} of "${company}" is FAIL: ${errorMsg}`;
      console.error("--- DELIVERY ERROR:\n", message);
      Promise.resolve({});
    });
};

const upsTrackings = [
  '1Z9306X40310696281', '1Z9306X40310696263', '1Z9306X40310696245', '1Z9306X43510692564', '1Z9306X43510692546'
];
const fedexTrackings = [
  '9278572516', '563221508533', '563221508522', '570469391794', '540840281274'
]

Promise.all([
  getDeliveryStatus(upsTrackings, 'ups').then(res => { console.log('Service UPS status:', JSON.stringify(res, null, 1)) }),
  // getDeliveryStatus(fedexTrackings[0], 'fedex').then(res => { console.log('Service FedEx status:', JSON.stringify(res, null, 1)) })
])
.then(() => {
  console.log('Done!');
})
