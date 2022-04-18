UpsService = require './UpsService'
FedexpService = require './FedexpService'


module.exports = {
  UpsService,
  FedexpService,
  mapShipers:
    ups: new UpsService()
    fedex: new FedexpService()
}