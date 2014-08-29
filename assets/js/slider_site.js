/*Hide or show slider*/
(function(){
        var slider_sett = {
        'show': 0,
            'get_show': function () {
            return this.html;
        },
            '_load': function (callback) {
            $.ajax({
                url: './php/action.php?act=hide_or_show',
                async: false,
                complete: function (data) {
                    var obj = $.parseJSON(data.response);
                    if (obj.hide == 'hide') {
                        $('#slider1_container').remove();
                    } else {
                        this.show = 1;

                    }
                }.bind(this)
            });
        }
    };
    slider_sett._load();
    var show = slider_sett.show;
    console.log(show);
    if(show){
        /*Slider options. See refference http://www.jssor.com/development/reference-options.html*/
        var options = {
            $AutoPlay: true,
            $SlideWidth: 1024,
            $SlideHeight: 400,
            $ArrowNavigatorOptions: {
                $Class: $JssorArrowNavigator$,
                $ChanceToShow: 2
            },
            $BulletNavigatorOptions: {
                $Class: $JssorBulletNavigator$,
                $ChanceToShow: 2
            }
        };
        /*Options end*/

        $.ajax({
            url: './php/action.php?act=get_slides_data',
            async: false,
            complete: function (data) {
                var obj = $.parseJSON(data.response);
                var html = '';
                $.each(obj, function (index, val) {
                    // yes comments yes links  
                    if (val.comment !== '' && val.link !== '') {
                        /*jshint multistr: true */
                        html += "<div><a href='" + val.link + "'><img u='image' src='./files/" + val.img + "'/></a> \
                                <div  class='slider-content'>" + val.comment + "</div></div>";
                        // yes comments no links             
                    } else if (val.comment !== '' && val.link === '') {
                        /*jshint multistr: true */
                        html += "<div><img u='image' src='./files/" + val.img + "'/> \
                                <div  class='slider-content'>" + val.comment + "</div></div>";
                        // no comments yes links           
                    } else if (val.comment === '' && val.link !== '') {
                        html += "<div><a href='" + val.link + "'><img u='image' src='./files/" + val.img + "'/></a></div>";
                        // no comments no links           
                    } else {
                        html += "<div><img u='image' src='./files/" + val.img + "' /></div>";
                    }
                });

                $('.slide-box').append(html);
                var jssor_slider1 = new $JssorSlider$('slider1_container', options);

                //responsive code begin
                function ScaleSlider() {
                    var parentWidth = $('#slider1_container').parent().width();
                    if (parentWidth) {
                        jssor_slider1.$SetScaleWidth(parentWidth);
                    } else window.setTimeout(ScaleSlider, 30);
                }
                //Scale slider after document ready
                ScaleSlider();
                if (!navigator.userAgent.match(/(iPhone|iPod|iPad|BlackBerry|IEMobile)/)) {
                    //Capture window resize event
                    $(window).bind('resize', ScaleSlider);
                }
                //responsive code end           
            }
        });    
    }
})();