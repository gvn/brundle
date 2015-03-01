var lwip = require('lwip');

lwip.open('img/statue-0.jpg', function(err, image){
  lwip.open('img/statue-100.jpg', function (err, image2) {
    lwip.create(image.width(), image.height(), 'white', function(err, diffImage) {
      var pixel1, pixel2;

      var batch = diffImage.batch();

      for (var y = 0; y < image.height(); y++) {
        for (var x = 0; x < image.width(); x++) {

          pixel1 = image.getPixel(x,y);
          pixel2 = image2.getPixel(x,y);

          if (pixel1.r !== pixel2.r &&
              pixel1.g !== pixel2.g &&
              pixel1.b !== pixel2.b) {

            // Difference
            // batch.setPixel(x, y, {
            //   r: Math.abs(pixel2.r - pixel1.r),
            //   g: Math.abs(pixel2.g - pixel1.g),
            //   b: Math.abs(pixel2.b - pixel1.b)
            // });

            // Average
            batch.setPixel(x, y, {
              r: Math.floor((pixel2.r + pixel1.r) / 2),
              g: Math.floor((pixel2.g + pixel1.g) / 2),
              b: Math.floor((pixel2.b + pixel1.b) / 2)
            });
          }
        }
        console.log('finished row: ' + y);
      }

      batch.writeFile('img/diff.png', function (err) {
        if (err) {
          console.error(err);
        }
      });
    });
  });
});
