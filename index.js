#!/usr/bin/env node

var fs = require('fs');
var lwip = require('lwip');
var program = require('commander');
var colors = require('colors');

program
  .version('1.0.0')
  .usage('image1 image2 output-path [options]')
  .option('-p, --preserve-matches', 'Display equivalent pixels.')
  .option('-m, --mode [type]', 'Specify the visualization type for differing pixels. [solid]', 'solid')
  .option('-d, --diffmode [type]', 'Specify the mode in which differences are calculated. [strict]', 'strict')
  .option('-a, --analyze-only', 'Only generate JSON representing varying pixels. [false]', false)
  .parse(process.argv);

if (!program.args.length) {
  program.help();
}

const PRESERVE_MATCHES = program.preserveMatches || false;
const VIZMODE = program.mode;
const DIFFMODE = program.diffmode; // 'strict' or 'any'
const ANALYZE_ONLY = program.analyzeOnly;

const IMAGE1_PATH = program.args[0];
const IMAGE2_PATH = program.args[1];
const OUTPUT_PATH = program.args[2] || (program.analyzeOnly ? 'diff.json' : 'diff.png');

var startTime = Date.now();
var diffData; // For JSON export

if (!IMAGE1_PATH || !IMAGE2_PATH) {
  console.error('Missing a path! 2 image paths are required for comparison.'.red.bold);
  process.exit(1);
}

lwip.open(program.args[0], function(err, image1){
  lwip.open(program.args[1], function (err, image2) {
    if (ANALYZE_ONLY) {
      var diffData = {
        width: image1.width(),
        height: image1.height(),
        points: []
      };
    }

    lwip.create(image1.width(), image1.height(), function(err, diffImage) {
      var
        batch = diffImage.batch(),
        pixel1,
        pixel2,
        savedPixel = image1.getPixel(0,0);

      for (var y = 0, yy = image1.height(); y < yy; y++) {
        for (var x = image1.width() - 1; x > 0; x--) {

          pixel1 = image1.getPixel(x,y);
          pixel2 = image2.getPixel(x,y);

          var diffChecks = {
            strict: function () {
              return (pixel1.r === pixel2.r && pixel1.g === pixel2.g && pixel1.b === pixel2.b);
            },
            any: function () {
              return (pixel1.r === pixel2.r || pixel1.g === pixel2.g || pixel1.b === pixel2.b);
            }
          };

          if ( diffChecks[DIFFMODE]() ) {
            // Equal pixels

            if (!ANALYZE_ONLY && PRESERVE_MATCHES) {
              batch.setPixel(x, y, pixel1);
            }

            savedPixel = pixel1;
          } else {
            // Differing pixels

            var vizModes = {
              difference: function () {
                batch.setPixel(x, y, {
                  r: Math.abs(pixel2.r - pixel1.r),
                  g: Math.abs(pixel2.g - pixel1.g),
                  b: Math.abs(pixel2.b - pixel1.b)
                });
              },
              scaledOpacity: function () {
                // Mapping 0 (identical pixel delta) -> 765 (black and white) to 0 -> 100 (opacity)

                var delta =
                  Math.abs(pixel2.r - pixel1.r) +
                  Math.abs(pixel2.g - pixel1.g) +
                  Math.abs(pixel2.b - pixel1.b);

                var scaled = Math.floor( (delta / 765) * 100 );

                batch.setPixel(x, y, {
                  r: 0,
                  g: 0,
                  b: 0,
                  a: scaled
                });
              },
              average: function () {
                batch.setPixel(x, y, {
                  r: Math.floor((pixel2.r + pixel1.r) / 2),
                  g: Math.floor((pixel2.g + pixel1.g) / 2),
                  b: Math.floor((pixel2.b + pixel1.b) / 2)
                });
              },
              solid: function () {
                batch.setPixel(x, y, 'black');
              },
              original: function () {
                batch.setPixel(x, y, pixel1);
              },
              plus: function () {
                batch.setPixel(x, y, 'black');

                if (x - 1 >= 0) {
                  batch.setPixel(x - 1, y, 'black');
                }

                if (x + 1 < image1.width()) {
                  batch.setPixel(x + 1, y, 'black');
                }

                if (y - 1 >= 0) {
                  batch.setPixel(x, y - 1, 'black');
                }

                if (y + 1 < image1.height()) {
                  batch.setPixel(x, y + 1, 'black');
                }
              },
              savedPixel: function () {
                savedPixel.a = savedPixel.a > 0 ? Math.floor(savedPixel.a - 1) : 0; // Fade out
                batch.setPixel(x, y, savedPixel);
              },
              empty: function () {}
            }

            if (ANALYZE_ONLY) {
              // Append to JSON for export
              diffData.points.push({
                x: x,
                y: y,
                pixel1: {
                  r: pixel1.r,
                  g: pixel1.g,
                  b: pixel1.b
                },
                pixel2: {
                  r: pixel2.r,
                  g: pixel2.g,
                  b: pixel2.b
                }
              });
            } else {
              vizModes[VIZMODE]();
            }
          }
        }
        console.log('Processed row ' + colors.bold(y + 1) + ' of ' + image1.height());
      }



      if (ANALYZE_ONLY) {
        fs.writeFile(OUTPUT_PATH, JSON.stringify(diffData), function(err) {
          if(err) {
            return console.log(err);
          }

          console.log(colors.bold.green('Processing Time: ') + ((Date.now() - startTime) / 1000) + ' seconds');
          console.log("Saved JSON: " + OUTPUT_PATH);
        });
      } else {
        batch.writeFile(OUTPUT_PATH, function (err) {
          if (err) {
            console.error(err.red);
          }

          console.log(colors.bold.green('Processing Time: ') + ((Date.now() - startTime) / 1000) + ' seconds');
        });
      }
    });
  });
});
