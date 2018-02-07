'use strict';

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // CommonJS
        factory(require('jquery'));
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function($){
    $.fn.spin = function(opts, color) {
        var presets = {
            'tiny': { lines: 9, length: 2, width: 2, radius: 4, trail: 70, speed: 1 },
            'small': { lines: 8, length: 4, width: 3, radius: 5 },
            'large': { lines: 10, length: 8, width: 4, radius: 8 },
            'smartpigs': { lines: 10, length: 8, width: 4, radius: 8, position: 'fixed' }
        };

        // define overlay wrapper
        var overlay = $('<div class="overlay" style="position: fixed; background: rgba(0,0,0,0.25); z-index: 10000;"></div>');

        if (window.Spinner) {
            return this.each(function() {
                var $this = $(this),
                    data = $this.data();

                if (data.spinner) {
                    data.spinner.stop();
                    delete data.spinner;
                }
                if (opts !== false) {
                    if (typeof opts === 'string') {
                        if (opts in presets) {
                            opts = presets[opts];
                        } else {
                            opts = presets.tiny;
                        }
                        if (color) {
                            opts.color = color;
                        }
                    }
                    // else {
                    //     opts = presets['tiny'];
                    // }

                    // http://stackoverflow.com/questions/1145850/how-to-get-height-of-entire-document-with-javascript#1147768
                    var height,
                        body = document.body,
                        html = document.documentElement;

                    // get document height
                    height = Math.max( body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight );

                    // update spinner css
                    overlay.css({
                        width: $this.innerWidth(),
                        height: $this.innerHeight(),
                        // height: height,
                        left: 0,
                        top: 0
                    });

                    // append overlay element
                    overlay.appendTo(this);

                    // update data spinner
                    data.spinner = new window.Spinner($.extend({color: $this.css('color')}, opts)).spin(this);
                }
                else{
                    $this.find('.overlay').remove();
                }

            });
        } else {
            throw 'Spinner class not available.';
        }
    };
}));
