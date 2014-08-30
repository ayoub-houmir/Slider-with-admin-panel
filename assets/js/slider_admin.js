(function () {
    var slider_ = {
        'files': '',
            '_template_compile': function () {
            /*jshint multistr: true */
            var tmpl_source = '\
            <div class="row">\
                <form class="form-inline">\
                    <div class="col-md-1">\
                    <input type="checkbox"/>\
                    <input type="hidden" class="item_cnt" value="{{item_cnt}}">\
                    </div>\
                    <div class="col-md-5">\
                    <textarea class="content-edit" id="{{editor_id}}">{{comment}}</textarea>\
                    </div>\
                    <div class="col-md-6 controls">\
                    <div class="row">\
                        <div class="col-md-12">\
                            <label class="admin-label col-md-3 control-label">Link URL:</label>\
                            <input class="col-md-5 link" type="text" value="{{link}}">\
                        </div>\
                    </div>\
                    <div class="row">\
                        <div class="col-md-12">\
                        <label class="admin-label col-md-3 control-label">Image:</label>\
                        <select class="slide-img col-md-5" class="form-control">{{{files}}}</select>\
                    </div>\
                    </div>\
                </form>\
            </div>';
            template = Handlebars.compile(tmpl_source);
            return template;
        },
            '_init_handlers': function () {
            $('#add_slide').click(function () {
                var slide_html = '';
                last_id = this._get_last_id(),
                content = {
                    'item_cnt': (last_id + 1),
                        'editor_id': 'editor_' + (last_id + 1),
                        'files': this.files
                };
                var template = this._template_compile();
                slide_html = template(content);
                $('#slides').append(slide_html);
                this._add_tiny(false, last_id + 1);
            }.bind(this));

            $('#del_slide').click(function () {
                $('.item_cnt', '.form-inline').each(function (k, v) {
                    if ($(this).prev().is(':checked')) {
                        var curr_id = $(this).val();
                        $(this).closest('.row').remove();
                        tinyMCE.editors = jQuery.grep(tinyMCE.editors, function (value) {
                            return value.id != 'editor_' + curr_id;
                        });

                    }
                });
            }.bind(this));

            $('#save_slider').click(function (event) { //
                var inst, data = {};

                function isNumeric(n) {
                    return !isNaN(parseFloat(n)) && isFinite(n);
                }

                if (tinyMCE.editors.length > 0) {
                    var num = 1;
                    var img;
                    var link;
                    var index;
                    for (inst in tinyMCE.editors) {
                        if (isNumeric(inst)) {

                            index = inst;

                            if (typeof $('.slide-img option:selected')[index] != 'undefined'){
                                img = $('.slide-img option:selected')[index].value;
                            } else {
                                img='';
                            }
                            
                            if (typeof $('.slide-img option:selected').eq(index).closest('.controls').find('.link').val() != 'undefined') {
                                link = $('.slide-img option:selected').eq(index).closest('.controls').find('.link').val().trim();
                            } else{
                                link = '';
                            }
                            //normalize url
                            if (link) {
                                if (link.match('http')) {
                                    link = link;
                                } else {
                                    link = 'http://' + link;
                                }
                            }

                            data[num] = {
                                number: num,
                                comment: tinyMCE.editors[inst].getContent(),
                                img: img,
                                link: link
                            };
                            
                            num++;
                        }
                    }
                    data.save = 1;
                    $.post('./php/action.php', data, function (data) {
                        var obj = $.parseJSON(data);
                        if ( !! obj.result) {
                            alert('Saved!');
                        } else {
                            alert(obj.error);
                        }
                    });
                }
            }.bind(this));

            $('.slider-hide').change(function () {
                if ($(this).is(':checked')) {
                    $.post('./php/action.php', data = {
                        'hide': 'hide'
                    }, function (data) {
                        var obj = $.parseJSON(data);
                        if ( !! obj.result) {
                            alert('Slider hide!');
                        } else {
                            alert(obj.error);
                        }
                    });
                } else {
                    $.post('./php/action.php', data = {
                        'hide': 'nonehide'
                    }, function (data) {
                        var obj = $.parseJSON(data);
                        if ( !! obj.result) {
                            alert('Slider show!');
                        } else {
                            alert(obj.error);
                        }
                    });
                }
            });

            this._ajax_upload();
        },
            '_build_options': function () {
            $.ajax({
                url: './php/action.php?act=get_files_list',
                complete: function (data) {
                    var obj = $.parseJSON(data.response);
                    for (var i in obj) {
                        this.files += '<option>' + obj[i] + '</option> ';
                    }
                    this._get_slides();

                }.bind(this)
            });
        },
            '_get_slides': function () {
            $.ajax({
                url: './php/action.php?act=get_slides_data',
                complete: function (data) {
                    var obj = $.parseJSON(data.response);

                    var slide_html = '';
                    var item_cnt = 0;
                    for (var i in obj) {
                        var _files = this.files.split(' ').slice(0, -1);
                        for (var j in _files) {
                            re = new RegExp('<option>' + obj[i].img + '</option>', 'gi');
                            found = _files[j].match(re);
                            if (found) _files[j] = '<option selected>' + obj[i].img + '</option>';
                        }
                        var comment = obj[i].comment;
                        var link = obj[i].link;

                        var content = {
                            'item_cnt': item_cnt,
                                'editor_id': 'editor_' + item_cnt,
                                'link': link,
                                'files': _files.join('\n'),
                                'comment': comment
                        };
                        var template = this._template_compile();
                        slide_html = template(content);
                        $('#slides').append(slide_html);
                        item_cnt++;
                    }
                    this._add_tiny(true);

                }.bind(this)
            });
        },
            '_add_tiny': function (get_slides, id) {
            var selector;
            if (get_slides) {
                selector = 'textarea.content-edit';
            } else {
                selector = 'textarea#editor_' + id;
            }
            tinymce.init({
                selector: selector,
                width: 450,
                height: 50,
                menubar: false,
                statusbar: false
            });
        },
            '_get_last_id': function () {
            var result = $('.item_cnt').last().val();
            return result;
        },
            '_ajax_upload': function () {
            var form = document.getElementById('file-form');
            var fileSelect = document.getElementById('file-select');
            var uploadButton = document.getElementById('upload-button');
            form.onsubmit = function (event) {
                event.preventDefault();
                uploadButton.innerHTML = 'Uploading...';
                var files = fileSelect.files;
                // Create a new FormData object.
                var formData = new FormData();
                // Loop through each of the selected files.
                for (var i = 0; i < files.length; i++) {
                    var file = files[i];

                    // Check the file type.
                    if (!file.type.match('image.*')) {
                        continue;
                    }

                    // Add the file to the request.
                    formData.append('photos[]', file, file.name);
                }
                var xhr = new XMLHttpRequest();
                // Open the connection.
                xhr.open('POST', './php/action.php', true);
                // Set up a handler for when the request finishes.
                xhr.onload = function () {
                    if (xhr.status === 200) {
                        // File(s) uploaded.
                        uploadButton.innerHTML = 'Upload';
                        $('#slides').empty();
                        tinyMCE.editors = tinymce.editors = [];
                        this.files = '';
                        this._build_options();
                    } else {
                        alert('Error!');
                    }
                }.bind(this);
                formData.append('file_upload', 1);
                xhr.send(formData);
            }.bind(this);
        },
            'exec': function () {
            this._build_options();
            this._init_handlers();
        }
    };
    slider_.exec();
    $.ajax({
        url: './php/action.php?act=hide_or_show',
        async: false,
        complete: function (data) {
            var obj = $.parseJSON(data.response);
            if (obj.hide == 'hide') {
                $('.slider-hide').attr('checked', true);
            } else {
                $('.slider-hide').attr('checked', false);
            }
        }
    });
})();