config = require 'config'
_ = require 'lodash'
BaseService = require './BaseService'


class FedexpService extends BaseService

  company: 'FedEx'

  constructor: ->
    {
      @urlRoot
      @urlApi
      @detailPath
      @pickDetails
      @deliveryStatus
    } = config.get 'external_delivery.fedex'


  __parseTrackingData: (body, trackingNumber) ->
    trackDetails = _.pick _.get(body, @detailPath), @pickDetails
    isDelivered = false
    unless trackDetails?.shipDt
      throw new Error "Tracking Data of #{@company}: The tracking number is invalid."
    if trackDetails?.keyStatus is @deliveryStatus
      isDelivered = true
    {
      isDelivered
      data:
        trackingNumber: trackDetails.trackingNbr
        packageStatus: trackDetails.keyStatus
        deliveryDate: trackDetails.displayActDeliveryDt
        deliveryTime: trackDetails.displayActDeliveryTm
        receivedBy: trackDetails.receivedByNm
    }


  __getTrackingStatus: (trackingNumber) ->
    unless @cookie
      throw new Error "#{@company} Credentials is UNDEFINED!"
      return Promise.resolve null

    formData =
      action: 'trackpackages'
      format: 'json'
      locale: 'en_US'
      version: 1
      data: JSON.stringify
        TrackPackagesRequest:
          appDeviceType: 'DESKTOP'
          appType: 'WTRK'
          processingParameters: {}
          uniqueKey: ''
          supportCurrentLocation: true
          supportHTML: true
          trackingInfoList: [{
            trackNumberInfo: {
              trackingNumber: trackingNumber
              trackingQualifier: null
              trackingCarrier: null
            }
          }]

    options =
      uri: @urlApi
      method: 'POST'
      resolveWithFullResponse: true
      json: true
      headers:
        cookie: @cookie
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36'
      form: FedexpService.formDataEncode formData

    @__fetchTrackingStatus(options)
    .then (body) =>
      @__parseTrackingData body, trackingNumber


  getTrackingUrl: (trackingNumber) ->
    unless _.isString trackingNumber
      return null
    "https://www.fedex.com/fedextrack/no-results-found?trknbr=#{trackingNumber}"


  init: ->
    @__getCreds @urlRoot
    .then =>
      unless @cookie
        throw new Error "Parse #{@company} Credentials is FAIL!"



module.exports = FedexpService
