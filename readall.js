var levelup = require('levelup')
var db = levelup('./imagedb', {
  valueEncoding : 'json'
})
var counter = 0
db.createReadStream()
  .on('data', function (data) {
    console.log(data.key, '=', data.value)
    counter++
  })
  .on('error', function (err) {
    console.log('Oh my!', err)
  })
  .on('close', function () {
    // console.log('Stream closed')
  })
  .on('end', function () {
    // console.log('Stream closed')
    console.log(counter)
  })
