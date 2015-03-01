var lwip = require('lwip');

const PRESERVE_MATCHES = false;

lwip.open('img/dude-90.jpg', function(err, image1){
  lwip.open('img/dude-100.jpg', function (err, image2) {
    lwip.create(image1.width(), image1.height(), 'white', function(err, diffImage) {
      var pixel1, pixel2, savedPixel;

      var batch = diffImage.batch();

      savedPixel = image1.getPixel(0,0);

      for (var y = 0; y < image1.height(); y++) {
        for (var x = image1.width() - 1; x > 0; x--) {

          pixel1 = image1.getPixel(x,y);
          pixel2 = image2.getPixel(x,y);

          if (pixel1.r === pixel2.r &&
              pixel1.g === pixel2.g &&
              pixel1.b === pixel2.b) {

             if (PRESERVE_MATCHES) {
              batch.setPixel(x, y, pixel1);
            }

            savedPixel = pixel1;
          } else {
            // Difference
            // batch.setPixel(x, y, {
            //   r: Math.abs(pixel2.r - pixel1.r),
            //   g: Math.abs(pixel2.g - pixel1.g),
            //   b: Math.abs(pixel2.b - pixel1.b)
            // });

            // Average
            // batch.setPixel(x, y, {
            //   r: Math.floor((pixel2.r + pixel1.r) / 2),
            //   g: Math.floor((pixel2.g + pixel1.g) / 2),
            //   b: Math.floor((pixel2.b + pixel1.b) / 2)
            // });

            // Solid color
            batch.setPixel(x, y, 'black');

            // Saved pixel
            // savedPixel.a = savedPixel.a > 0 ? Math.floor(savedPixel.a - 1) : 0; // Fade out
            // batch.setPixel(x, y, savedPixel);
          }
        }
        console.log('Finished row ' + (y + 1) + ' of ' + image1.height());
      }

      batch.writeFile('img/diff.png', function (err) {
        if (err) {
          console.error(err);
        }
      });
    });
  });
});
