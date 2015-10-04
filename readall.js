var fs = require('fs')
var levelup = require('levelup')
var db = levelup('./imagedb', {
  valueEncoding : 'json'
})
var rawdata = []
db.createReadStream()
  .on('data', function (data) {
    // console.log(data.key, '=', data.value)
    rawdata.push(data)
  })
  .on('error', function (err) {
    console.log('Oh my!', err)
  })
  .on('close', function () {
    // console.log('Stream closed')
  })
  .on('end', function () {
    // console.log('Stream closed')
    fs.writeFile('data.json', JSON.stringify(rawdata, null, 2))
  })
