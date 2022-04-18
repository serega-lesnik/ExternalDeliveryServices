request = require 'request-promise'
_ = require 'lodash'


class BaseService

  timer: Date.now()
  cookie: ''
  company: 'Base'
  delayTimeout: 200

  constructor: ->

  @formDataEncode: (formData) ->
    formBody = []
    for key,value of formData
      encodedKey = encodeURIComponent key
      encodedValue = encodeURIComponent value
      formBody.push "#{encodedKey}=#{encodedValue}"
    formBody.join '&'


  __wait: (fn, ms = 0) ->
    new Promise (resolve, reject) =>
      delay = Date.now() - @timer
      if delay < ms
        setTimeout(() =>
          resolve
        , delay)
      else
        resolve()
    .then -> fn
    .then (res) ->
      @timer = Date.now()
      res
    .catch (err) -> throw err


  __parseCookies: (arrCookies) ->
    new Promise (resolve, reject) =>
      cookieRegExp = new RegExp '^([a-zA-Z_-]+)=([A-Za-z0-9_+-\/~=]+);'
      cacheCookie = {}
      arrCookies.forEach (c) =>
        arr = c.match(cookieRegExp)
        if arr.length >= 3
          cacheCookie[arr[1]] = arr[2]
          if @cookie
            @cookie += '; '
          @cookie += "#{arr[1]}=#{arr[2]}"
      resolve cacheCookie


  __getCreds: (url, cookieKey = 'set-cookie') ->
    unless url
      throw new Error "get Credentials #{@company} response Code is NOT Success!"
    options =
      uri: url
      method: 'GET'
      resolveWithFullResponse: true

    request options
    .then (res) =>
      if res?.statusCode is 200
        @__parseCookies res.headers[cookieKey]
      else
        throw new Error "Request #{@company} Credentials response Code is NOT Success!"
    .catch (err) ->
      throw err


  __fetchTrackingStatus: (options) ->
    request options
    .then (res) =>
      unless res?.statusCode is 200
        throw new Error "Request #{@company} Credentials response Code is NOT Success!"
      unless res?.body
        throw new Error "Request #{@company} response BODU is NOT defined!"
      res?.body
    .catch (err) ->
      throw err

  __getTrackingStatus: ->
    Promise.resolve {}


  init: ->
    Promise.resolve()


  getTrackingStatus:(trackingNumber, delay = @delayTimeout)  ->
    @__wait @__getTrackingStatus(trackingNumber), delay


  getArrayTrackingStatuses:(trackingNumbers, delay = @delayTimeout)  ->
    if _.isString trackingNumbers
      trackingNumbers = [trackingNumbers]
    unless Array.isArray trackingNumbers
      throw new Error "#{@company} get Trac Statuses: type trackingNumbers variable is not supported!"

    result = []
    trackingNumbers
    .reduce (accum, trackingNumber) =>
      accum.then =>
        @__wait @__getTrackingStatus(trackingNumber), delay
      .then (res) =>
        result.push res
    , Promise.resolve()
    .then -> result


module.exports = BaseService