var levelup = require('levelup')
var request = require('request')
var async = require('async')
var child_process = require('child_process')
var fs = require('fs')
var babyparse = require('babyparse')
var images = require('./images.json')
var sizeOf = require('image-size')

var db = levelup('./imagedb', {
  valueEncoding : 'json'
})

async.eachLimit(images, 4, function (image, done) {
  db.get(image.id, function (err, item) {
    if(item === undefined) {
      console.log('working', image)
      work(image, done)
    } else {
      console.log('cached', image.id)
      done()
    }
  })
})

function work (image, done) {
  console.log(image.url)
  var imageFileName = 'image' + image.id  + '.jpg'
  var imageFile = fs.createWriteStream(imageFileName)
  request.get(image.url).pipe(imageFile)
  // request.get('http://hack4dk.dr.dk/Batch04/DR-ubehandlet/17123_16_253517.jpg').pipe(imageFile)
  imageFile.on('close', function () {
    var command = 'docker run --rm -v $(pwd):/tmp/downloads/ kevinsimper/openbr bash -c "br -algorithm AgeEstimation -enrollAll -enroll ' + imageFileName + ' ' + image.id + '.csv && cat ' + image.id + '.csv"'
    console.log('command', command)
    child_process.exec(command, function (error, stdout, stderr) {
      console.log('docker:', stdout)
      var dimensions = sizeOf(imageFileName)
      console.log(dimensions)
      try {
        var csvfile = fs.readFileSync(image.id + '.csv', 'utf8')
        var parseCsv = babyparse.parse(csvfile).data
        db.put(image.id, {
          data: parseCsv,
          dimensions: dimensions,
          image: image.url
        }, function () {
          console.log('done')
          fs.unlinkSync(imageFileName)
          done()
        })
      } catch (e) {
        // This means there were no persons on the picture
        // fs.unlinkSync(imageFileName)
        console.log('Caught error: ', e)
        db.put(image.id, {
          data: null,
          dimensions: dimensions,
          image: image.url
        }, function () {
          console.log('done - no people')
          fs.unlinkSync(imageFileName)
          done()
        })
      }
      // done
    })
  })
}
