const UpsService = require('./services/UpsService');
const FedexpService = require('./services/FedexpService');


module.exports = {
  UpsService,
  FedexpService,
  mapShipers: {
    ups: new UpsService(),
    fedex: new FedexpService(),
  },
};