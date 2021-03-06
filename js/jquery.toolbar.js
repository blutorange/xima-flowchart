/**
 * Toolbar.js
 *
 * @fileoverview  jQuery plugin that creates tooltip style toolbars.
 * @link          http://paulkinzett.github.com/toolbar/
 * @author        Paul Kinzett (http://kinzett.co.nz/)
 * @version       1.1.0
 * @requires      jQuery 1.7+
 *
 * @license jQuery Toolbar Plugin v1.1.0
 * http://paulkinzett.github.com/toolbar/
 * Copyright 2013 - 2015 Paul Kinzett (http://kinzett.co.nz/)
 * Released under the MIT license.
 * <https://raw.github.com/paulkinzett/toolbar/master/LICENSE.txt>
 */

/**
 * 
 * Modified by me to fix the positioning of toolbars on the left and right;
 * and to including switching toolbars between top/bottom and left/right
 * depening on the toolbar opener's position on the viewport.
 *
*/

if ( typeof Object.create !== 'function' ) {
    Object.create = function( obj ) {
        function F() {}
        F.prototype = obj;
        return new F();
    };
}

(function( $, window, document, undefined ) {

    var ToolBar = {
        init: function( options, elem ) {
            var self = this;
            self.isHidden = true;
            self.isDisabled = false;
            self.elem = elem;
            self.$elem = $( elem );
            self.options = $.extend( {}, $.fn.toolbar.options, options );
            self.adjustAgainst = $(self.options.adjustAgainst);
            self.metadata = self.$elem.data();
            self.overrideOptions();
            self.toolbar = $('<div class="tool-container" />')
                .addClass('tool-'+self.options.position)
                .addClass('toolbar-'+self.options.style)
                .append('<div class="tool-items" />')
                .append('<div class="arrow" />')
                .appendTo('body')
                .css('opacity', 0)
                .hide();
            self.toolbar_arrow = self.toolbar.find('.arrow');
            self.initializeToolbar();
        },

        overrideOptions: function() {
            var self = this;
            $.each( self.options, function( $option ) {
                if (typeof(self.$elem.data('toolbar-'+$option)) != "undefined") {
                    self.options[$option] = self.$elem.data('toolbar-'+$option);
                }
            });
        },

        initializeToolbar: function() {
            var self = this;
            self.populateContent();
            self.setTrigger();
            self.toolbarWidth = self.toolbar.width();
            self.toolbarHeight = self.toolbar.height();
        },

        setTrigger: function() {
            var self = this;

            if (self.options.event != 'click') {

                var moveTime;
                function decideTimeout () {
                    if (self.$elem.hasClass('pressed')) {
                        moveTime = setTimeout(function() {
                            self.hide();
                        }, 150);
                    } else {
                        clearTimeout(moveTime);
                    };
                };

                self.$elem.on({
                    mouseenter: function(event) {
                        if (self.$elem.hasClass('pressed')) {
                            clearTimeout(moveTime);
                        } else {
                            self.show();
                        }
                    }
                });

                self.$elem.parent().on({
                    mouseleave: function(event){ decideTimeout(); }
                });

                $('.tool-container').on({
                    mouseenter: function(event){ clearTimeout(moveTime); },
                    mouseleave: function(event){ decideTimeout(); }
                });
            }

            if (self.options.event === 'click') {
                self.$elem.on('click', function(event) {
                    if(self.isDisabled===null){self.isDisabled=false;return;}
                    if(self.isDisabled){return;}
                    event.preventDefault();
                    if(self.$elem.hasClass('pressed')) {
                        self.hide();
                    } else {
                        self.show();
                    }
                });

                if (self.options.hideOnClick) {
                    $('html').on("click.toolbar", function ( event ) {
                        if(self.isDisabled===null){self.isDisabled=false;return;}
                        if(self.isDisabled){return;}
                        if (event.target != self.elem &&
                            self.$elem.has(event.target).length === 0 &&
                            self.toolbar.has(event.target).length === 0 &&
                            self.toolbar.is(":visible")) {
                            self.hide();
                        }
                    });
                }
            }

            if (self.options.hover) {
                var moveTime;

                function decideTimeout () {
                    if (self.$elem.hasClass('pressed')) {
                        moveTime = setTimeout(function() {
                            self.hide();
                        }, 150);
                    } else {
                        clearTimeout(moveTime);
                    };
                };

                self.$elem.on({
                    mouseenter: function(event) {
                        if (self.$elem.hasClass('pressed')) {
                            clearTimeout(moveTime);
                        } else {
                            self.show();
                        }
                    }
                });

                self.$elem.parent().on({
                    mouseleave: function(event){ decideTimeout(); }
                });

                $('.tool-container').on({
                    mouseenter: function(event){ clearTimeout(moveTime); },
                    mouseleave: function(event){ decideTimeout(); }
                });
            }

        },

        handleResize: function(){
            if ( self.toolbar.is(":visible") ) {
                self.toolbarCss = self.getCoordinates(self.options.position, 20);
                self.collisionDetection();
                self.toolbar.css( self.toolbarCss );
                self.toolbar_arrow.css( self.arrowCss );
            }
        },

        populateContent: function() {
            var self = this;
            var location = self.toolbar.find('.tool-items');
            var content = $(self.options.content).clone( true ).find('a').addClass('tool-item');
            location.html(content);
            location.find('.tool-item').on('click', function(event) {
                event.preventDefault();
                self.$elem.trigger('toolbarItemClick', this);
            });
        },

        calculatePosition: function() {
            var self = this;
                self.arrowCss = {};
                self.toolbarCss = self.getCoordinates(self.options.position, self.options.adjustment);
                self.toolbarCss.position = 'absolute';
                self.toolbarCss.zIndex = self.options.zIndex;
                self.collisionDetection();
                self.toolbar.css(self.toolbarCss);
                self.toolbar_arrow.css(self.arrowCss);
        },

        getCoordinates: function( position, adjustment ) {
            var self = this;
            self.coordinates = self.$elem.offset();
            var arrowWidth = self.toolbar_arrow.outerWidth();
            var arrowHeight = self.toolbar_arrow.outerHeight();

            if (self.options.autoAdjust) {
                var offset = self.adjustAgainst.offset();
                var cx = self.coordinates.left+self.$elem.outerWidth()/2-offset.left;
                var cy = self.coordinates.top+self.$elem.outerHeight()/2-offset.top;
                var cw = self.adjustAgainst.outerWidth()/2;
                var ch = self.adjustAgainst.outerHeight()/2;

                switch(self.options.position) {
                    case 'top':
                        if (cy<ch) {
                            self.options.position = 'bottom';
                            self.toolbar.removeClass('tool-top').addClass('tool-bottom');
                        }
                        break;
                    case 'left':
                        if (cx<cw) {
                            self.options.position = 'right';
                            self.toolbar.removeClass('tool-left').addClass('tool-right');
                        }
                        break;
                    case 'bottom':
                        if (cy>ch) {
                            self.options.position = 'top';
                            self.toolbar.removeClass('tool-bottom').addClass('tool-top');
                        }
                        break;
                    case 'right':
                        if (cx>cw) {
                            self.options.position = 'left';
                            self.toolbar.removeClass('tool-right').addClass('tool-left');
                        }
                        break;
                }
            }

            if (self.options.adjustment && self.options.adjustment[self.options.position]) {
                adjustment = self.options.adjustment[self.options.position] + adjustment;
            }

            switch(self.options.position) {
                case 'top':
                    return {
                        left: self.coordinates.left-(self.toolbar.width()/2)+(self.$elem.outerWidth()/2),
                        top: self.coordinates.top-self.$elem.outerHeight()-adjustment,
                        right: 'auto'
                    };
                case 'left':
                    return {
                        left: self.coordinates.left-self.toolbar.width()-arrowWidth-adjustment,
                        top: self.coordinates.top-(self.toolbar.height()/2)+(self.$elem.outerHeight()/2),
                        right: 'auto',
                        bottom: 'auto'
                    };
                case 'right':
                    return {
                        left: self.coordinates.left+self.$elem.outerWidth()+arrowWidth+adjustment,
                        top: self.coordinates.top-(self.toolbar.height()/2)+(self.$elem.outerHeight()/2),
                        right: 'auto',
                        bottom: 'auto'
                    };
                case 'bottom':
                    return {
                        left: self.coordinates.left-(self.toolbar.width()/2)+(self.$elem.outerWidth()/2),
                        top: self.coordinates.top+self.$elem.outerHeight()+arrowHeight+adjustment,
                        right: 'auto'
                    };
            }
        },

        collisionDetection: function() {
            var self = this;
            var edgeOffset = 20;
            if(self.options.position == 'top' || self.options.position == 'bottom') {
                self.arrowCss = {left: '50%', right: '50%'};
                if( self.toolbarCss.left < edgeOffset ) {
                    self.toolbarCss.left = edgeOffset;
                    self.arrowCss.left = self.$elem.offset().left + self.$elem.width()/2-(edgeOffset);
                }
                else if(($(window).width() - (self.toolbarCss.left + self.toolbarWidth)) < edgeOffset) {
                    self.toolbarCss.right = edgeOffset;
                    self.toolbarCss.left = 'auto';
                    self.arrowCss.left = 'auto';
                    self.arrowCss.right = ($(window).width()-self.$elem.offset().left)-(self.$elem.width()/2)-(edgeOffset)-5;
                }
            }
            else {
                self.arrowCss = {top: '50%', bottom: '50%'};
                if( self.toolbarCss.top < edgeOffset ) {
                    self.toolbarCss.top = edgeOffset;
                    self.arrowCss.top = self.$elem.offset().top + self.$elem.height()/2-edgeOffset;
                    self.toolbarCss.bottom = 'auto';
                }
                else if(($(window).height() - (self.toolbarCss.top + self.toolbarHeight)) < edgeOffset) {
                    self.toolbarCss.bottom = edgeOffset;
                    self.toolbarCss.top = 'auto';
                    self.arrowCss.top = 'auto';
                    self.arrowCss.bottom = ($(window).height()-self.$elem.offset().top)-(self.$elem.height()/2)-(edgeOffset)-5;
                }
            }
        },

        show: function() {
            var self = this;
            self.$elem.addClass('pressed');
            self.calculatePosition();
            self.toolbar.show().css({'opacity': 1}).addClass('animate-'+self.options.animation);
            self.$elem.trigger('toolbarShown');
            self.isHidden = false;
        },

        hide: function() {
            var self = this;
            var animation = {'opacity': 0};

            self.$elem.removeClass('pressed');
            self.isHidden = true;

            switch(self.options.position) {
                case 'top':
                    animation.top = '+=20';
                    break;
                case 'left':
                    animation.left = '+=20';
                    break;
                case 'right':
                    animation.left = '-=20';
                    break;
                case 'bottom':
                    animation.top = '-=20';
                    break;
            }

            self.toolbar.animate(animation, 200, function() {
                self.toolbar.hide();
            });

            self.$elem.trigger('toolbarHidden');
        },

        getToolbarElement: function () {
            return this.toolbar.find('.tool-items');
        },

        hidden: function() {
            return this.isHidden;
        },

        shown: function() {
            return !this.isHidden;
        },

        disable: function(bool) {
            this.isDisabled = bool;
        }
    };

    $.fn.toolbar = function( options ) {
        if ($.isPlainObject( options )) {
            return this.each(function() {
                var toolbarObj = Object.create( ToolBar );
                toolbarObj.init( options, this );
                $(this).data('toolbarObj', toolbarObj);
            });
        } else if ( typeof options === 'string' && options.indexOf('_') !== 0 ) {
            var toolbarObj = $(this).data('toolbarObj');
            var method = toolbarObj[options];
            return method.apply(toolbarObj, $.makeArray(arguments).slice(1));
        }
    };

    $.fn.toolbar.options = {
        content: '#myContent',
        position: 'top',
        attachTo: null,
        hideOnClick: false,
        zIndex: 120,
        hover: false,
        style: 'default',
        animation: 'standard',
        adjustment: 10,
        adjustAgainst: $(document)
    };

}) ( jQuery, window, document );
