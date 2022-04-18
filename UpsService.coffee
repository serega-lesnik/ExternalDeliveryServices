config = require 'config'
_ = require 'lodash'
BaseService = require './BaseService'


class UpsService extends BaseService

  company: 'UPS'
  token: ''

  constructor: ->
    {
      @urlRoot
      @urlApi
      @detailPath
      @pickDetails
      @deliveryStatus
    } = config.get 'external_delivery.ups'


  __parseCookies: (arrCookies) ->
    super
    .then (cacheCookie) =>
      @token = cacheCookie['X-XSRF-TOKEN-ST'] or null


  __parseTrackingData: (body, trackingNumber) ->
    trackDetails = _.pick _.get(body, @detailPath), @pickDetails
    isDelivered = false
    if _.isEmpty(trackDetails) or (trackDetails?.trackingNumber isnt trackingNumber)
      throw new Error "Tracking Data of #{@company}: The tracking number is invalid."
    if trackDetails?.packageStatus is @deliveryStatus
      isDelivered = true
    {
      isDelivered
      data:
        trackingNumber: trackDetails.trackingNumber
        packageStatus: trackDetails.packageStatus
        deliveryDate: trackDetails.deliveredDate
        deliveryTime: trackDetails.deliveredTime
        receivedBy: trackDetails.receivedBy
    }


  __getTrackingStatus: (trackingNumber) ->
    unless @cookie or @token
      throw new Error "#{@company} Credentials is UNDEFINED!"
      return Promise.resolve null

    options =
      uri: @urlApi
      method: 'POST'
      resolveWithFullResponse: true
      json: true
      headers:
        cookie: @cookie
        'x-xsrf-token': @token
        # 'Content-Type': 'application/json'
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36'
      body:
        Locale: 'en_US'
        TrackingNumber: [ trackingNumber ]
        Requester: 'wt/trackdetails'
        returnToValue: ''

    @__fetchTrackingStatus options
    .then (body) =>
      @__parseTrackingData body, trackingNumber


  getTrackingUrl: (trackingNumber) ->
    unless _.isString trackingNumber
      return null
    "https://www.ups.com/track?loc=null&tracknum=#{trackingNumber}&requester=WT/trackdetails"


  init: ->
    @__getCreds @urlRoot
    .then =>
      unless @cookie or @token
        throw new Error "Parse #{@company} Credentials is FAIL!"


module.exports = UpsService