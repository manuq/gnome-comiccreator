// -*- Mode: js; indent-tabs-mode: nil; c-basic-offset: 4; tab-width: 4 -*-
//
// Copyright (c) 2017 Manuel Quiñones <manuel.por.aca@gmail.com>
//
// Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//   * Redistributions of source code must retain the above copyright
//     notice, this list of conditions and the following disclaimer.
//   * Redistributions in binary form must reproduce the above copyright
//     notice, this list of conditions and the following disclaimer in the
//     documentation and/or other materials provided with the distribution.
//   * Neither the name of the GNOME Foundation nor the
//     names of its contributors may be used to endorse or promote products
//     derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE LIABLE FOR ANY
// DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

const Emeus = imports.gi.Emeus;
const Cairo = imports.cairo;
const GLib = imports.gi.GLib;
const GdkPixbuf = imports.gi.GdkPixbuf;
const Gdk = imports.gi.Gdk;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Params = imports.params;

const Util = imports.util;

let bubbleEdit;

const MainWindow = new Lang.Class({
    Name: 'MainWindow',
    Extends: Gtk.ApplicationWindow,
    Template: 'resource:///org/gnome/ComicCreator/main.ui',
    Children: ['main-grid', 'main-search-bar', 'main-search-entry',
               'search-active-button'],
    Properties: { 'search-active': GObject.ParamSpec.boolean('search-active', '', '', GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE, false) },

    _init: function(params) {
        params = Params.fill(params, { title: GLib.get_application_name(),
                                       default_width: 640,
                                       default_height: 480 });
        this.parent(params);

        this._searchActive = false;

        Util.initActions(this,
                         [{ name: 'new',
                             activate: this._new },
                          { name: 'about',
                            activate: this._about },
                          { name: 'search-active',
                            activate: this._toggleSearch,
                            parameter_type: new GLib.VariantType('b'),
                            state: new GLib.Variant('b', false) }]);

        this.bind_property('search-active', this.search_active_button, 'active',
                           GObject.BindingFlags.SYNC_CREATE |
                           GObject.BindingFlags.BIDIRECTIONAL);
        this.bind_property('search-active', this.main_search_bar, 'search-mode-enabled',
                           GObject.BindingFlags.SYNC_CREATE |
                           GObject.BindingFlags.BIDIRECTIONAL);
        this.main_search_bar.connect_entry(this.main_search_entry);
        this.main_search_entry.show();
        this.main_search_bar.show();

        this._view = new MainView();
        this._view.visible_child_name = 'comic-edit';
//        this._view.visible_child_name = 'frame-edit';
        this.main_grid.add(this._view);
        this._view.show();
        this.main_grid.show();
    },

    get search_active() {
        return this._searchActive;
    },

    set search_active(v) {
        if (this._searchActive == v)
            return;

        this._searchActive = v;
        // do something with v
        this.notify('search-active');
    },

    _new: function() {
        log('New something');
    },

    _about: function() {
        let aboutDialog = new Gtk.AboutDialog(
            { authors: [ 'Manuel Quiñones <manuel.quinones@src.gnome.org>' ],
              translator_credits: _("translator-credits"),
              program_name: _("Comic Creator"),
              comments: _("A simple comic creator"),
              copyright: 'Copyright 2017 Manuel Quiñones',
              license_type: Gtk.License.GPL_3_0,
              logo_icon_name: 'org.gnome.ComicCreator',
              version: pkg.version,
              website: 'http://www.example.com/comiccreator/',
              wrap_license: true,
              modal: true,
              transient_for: this
            });

        aboutDialog.show();
        aboutDialog.connect('response', function() {
            aboutDialog.destroy();
        });
    },
});

Emeus.ConstraintLayout.prototype.pack = function(child, name=null, constraints=[]) {
    let layout_child;

    if (child instanceof Emeus.ConstraintLayoutChild) {
        layout_child = child;
    }
    else {
        layout_child = new Emeus.ConstraintLayoutChild({ name: name });
        layout_child.add(child);
        layout_child.show();
    }

    this.add(layout_child);

    constraints.forEach(layout_child.add_constraint, layout_child);
};

Emeus.ConstraintLayout.prototype.add_constraints = function(constraints=[]) {
    constraints.forEach(this.add_constraint, this);
};

const ComicStripView = new Lang.Class({
    Name: 'ComicStripView',
    Extends: Gtk.DrawingArea,
    _init: function(params) {
        this.parent(params);

        this.pixbuf1 = GdkPixbuf.Pixbuf.new_from_resource('/org/gnome/ComicCreator/img_1687.jpg');
        this.pixbuf2 = GdkPixbuf.Pixbuf.new_from_resource('/org/gnome/ComicCreator/img_1688.jpg');
        this.pixbuf3 = GdkPixbuf.Pixbuf.new_from_resource('/org/gnome/ComicCreator/img_1690.jpg');

        this.offwin = new Gtk.OffscreenWindow();
        this.bubble = new BubbleView();
        this.offwin.add(this.bubble);
        this.offwin.show_all();

        this.connect('draw', Lang.bind(this, function(widget, ctx) {
            let width = widget.get_allocated_width();
            let height = widget.get_allocated_height();
            ctx.rectangle(0, 0, width, height);
            ctx.setSourceRGBA(1, 1, 1, 1);
            ctx.fill();

            let marginA = 60;
            let marginB = 20;
            let w1 = this.pixbuf1.get_width();
            let h1 = this.pixbuf1.get_height();
            let w2 = this.pixbuf2.get_width();
            let h2 = this.pixbuf2.get_height();
            let w3 = this.pixbuf3.get_width();
            let h3 = this.pixbuf3.get_height();
            let totalWidth = marginA + w1/2 + marginB + w2 + marginB + w3 + marginA;
            let scale = width / totalWidth;

            this.bubble.set_text(bubbleEdit.get_text());
            let bubblePixbuf = this.offwin.get_pixbuf();

            ctx.scale(scale, scale);
            ctx.translate(marginA, marginA);
            Gdk.cairo_set_source_pixbuf(ctx, this.pixbuf1, 0, 0);
            ctx.rectangle(0, 0, w1/2, h1);
            ctx.fill();
            ctx.translate(w1/2 + marginB, 0);
            Gdk.cairo_set_source_pixbuf(ctx, this.pixbuf2, 0, 0);
            ctx.rectangle(0, 0, w2, h2);
            ctx.fill();
            ctx.translate(w2 + marginB, 0);
            Gdk.cairo_set_source_pixbuf(ctx, this.pixbuf3, 0, 0);
            ctx.rectangle(0, 0, w3, h3);
            ctx.fill();

            ctx.translate(w3 / 2, 0);
            ctx.scale(2, 2);
            Gdk.cairo_set_source_pixbuf(ctx, bubblePixbuf, 0, 0);
            ctx.paint();
        }));
    }
});

const ComicFrameView = new Lang.Class({
    Name: 'ComicFrameView',
    Extends: Gtk.DrawingArea,
    _init: function(params) {
        this.parent(params);

        this.pixbuf = GdkPixbuf.Pixbuf.new_from_resource('/org/gnome/ComicCreator/img_1688.jpg')
        this.connect('draw', Lang.bind(this, function(widget, ctx) {
            let width = widget.get_allocated_width();
            let height = widget.get_allocated_height();

            Gdk.cairo_set_source_pixbuf(ctx, this.pixbuf, -220, -260);
            ctx.paint();

        }));
    }
});

const BubbleView = new Lang.Class({
    Name: 'BubbleView',
    Extends: Gtk.EventBox,
    _init: function(params) {
        params = Params.fill(params, { 'app-paintable': true });
        this.parent(params);
        this.pointer_positions = ['bottom', 'start', 'top', 'end'];
        this.pointer_idx = 0;
        this.pointer_orientation = -1;  // -1, 1
        this.connect('draw', Lang.bind(this, function(widget, ctx) {
            let width = widget.get_allocated_width();
            let height = widget.get_allocated_height();

            let lw = 2;
            let rx = 0;
            let ry = 0;
            let rw = width - 30;
            let rh = height - 30;
            let po = this.pointer_orientation;
            let pax, pay, pbx, pby, pcx, pcy;

            switch (this.pointer_positions[this.pointer_idx]) {
            case 'top':
                ry = 30;
                if (this.pointer_orientation == 1) {
                    rx = 30;
                }
                pax = width/2 + 25*po;
                pay = 30 + lw*2;
                pbx = width/2 - 15*po;
                pby = 0;
                pcx = width/2 + 5*po;
                pcy = pay;
                break;
            case 'bottom':
                if (this.pointer_orientation == -1) {
                    rx = 30;
                }
                pax = width/2 - 25*po;
                pay = height - lw*2 - 30;
                pbx = width/2 + 15*po;
                pby = height;
                pcx = width/2 - 5*po;
                pcy = pay;
                break;
            case 'start':
                rx = 30;
                if (this.pointer_orientation == -1) {
                    ry = 30;
                }
                pax = 30 + lw*2;
                pay = height/2 - 25*po;
                pbx = 0; //
                pby = height/2 + 15*po;
                pcx = pax;
                pcy = height/2 - 5*po;
                break;
            case 'end':
                if (this.pointer_orientation == 1) {
                    ry = 30;
                }
                pax = width - lw*2 - 30;
                pay = height/2 + 25*po;
                pbx = width;
                pby = height/2 - 15*po;
                pcx = pax;
                pcy = height/2 + 5*po;
                break;
            }

            ctx.setLineWidth(lw);
            ctx.setSourceRGBA(0, 0, 0, 1);
            ctx.rectangle(rx+lw/2, ry+lw/2, rw-lw, rh-lw);
            ctx.stroke();

            ctx.moveTo(pax, pay);
            ctx.lineTo(pbx, pby);
            ctx.lineTo(pcx, pcy);
            ctx.stroke();

            ctx.setSourceRGBA(1, 1, 1, 1);
            ctx.rectangle(rx+lw/2, ry+lw/2, rw-lw, rh-lw);
            ctx.fill();

            ctx.moveTo(pax, pay);
            ctx.lineTo(pbx, pby);
            ctx.lineTo(pcx, pcy);
            ctx.fill();

        }));

        this.textview = new Gtk.TextView({ editable: true, justification: Gtk.Justification.CENTER });
        this.textview.get_style_context().add_class('bubble-text');
        this.textview.set_size_request(100, -1);
        this._update_textview_margins();
        this.add(this.textview);
        this.textview.show();
        let buffer = this.textview.get_buffer();
        buffer.set_text(_("Holy widgets,\nBatman!"), -1);

    },
    rotateClockwise: function() {
        if (this.pointer_orientation == 1) {
            this.pointer_orientation = -1;
        } else {
            this.pointer_orientation = 1;
            if (this.pointer_idx + 1 >= this.pointer_positions.length) {
                this.pointer_idx = 0;
            } else {
                this.pointer_idx += 1;
            };
        };
        this._update_textview_margins();
        this.queue_draw();
    },
    rotateCounterClockwise: function() {
        // FIXME rotate orientation
        if (this.pointer_orientation == -1) {
            this.pointer_orientation = 1;
        } else {
            this.pointer_orientation = -1;
            if (this.pointer_idx <= 0) {
                this.pointer_idx = this.pointer_positions.length - 1;
            } else {
                this.pointer_idx -= 1;
            };
        };
        this._update_textview_margins();
        this.queue_draw();
    },
    _update_textview_margins: function() {
        let marginTop = 10;
        let marginBottom = 10;
        let marginStart = 10;
        let marginEnd = 10;

        switch (this.pointer_positions[this.pointer_idx]) {
        case 'top':
            marginTop = 40;
            if (this.pointer_orientation == -1) {
                marginEnd = 40;
            } else {
                marginStart = 40;
            }
            break;
        case 'bottom':
            marginBottom = 40;
            if (this.pointer_orientation == -1) {
                marginStart = 40;
            } else {
                marginEnd = 40;
            }
            break;
        case 'start':
            marginStart = 40;
            if (this.pointer_orientation == -1) {
                marginTop = 40;
            } else {
                marginBottom = 40;
            }
            break;
        case 'end':
            marginEnd = 40;
            if (this.pointer_orientation == -1) {
                marginBottom = 40;
            } else {
                marginTop = 40;
            }
            break;
        }

        this.textview.set_margin_top(marginTop);
        this.textview.set_margin_bottom(marginBottom);
        this.textview.set_margin_start(marginStart);
        this.textview.set_margin_end(marginEnd);
    },
    set_text: function(text) {
        let buffer = this.textview.get_buffer();
        buffer.set_text(_(text), -1);
    },
    get_text: function(text) {
        let buffer = this.textview.get_buffer();
        return buffer.get_text(buffer.get_start_iter(), buffer.get_end_iter(), true);
    },
    
});

const ComicEditorView = new Lang.Class({
    Name: 'ComicEditorView',
    Extends: Gtk.Bin,
    _init: function(params) {
        params = Params.fill(params, { hexpand: true,
                                       vexpand: true });
        this.parent(params);

        let _layout = new Emeus.ConstraintLayout({ hexpand: true, vexpand: true });
        _layout.get_style_context().add_class('comic-edit');
        this.add(_layout);
        _layout.show();

        let child1 = new ComicFrameView();
        _layout.pack(child1, 'child1');
        child1.show();

        let child2 = new Gtk.Grid({ orientation: Gtk.Orientation.VERTICAL,
                                    halign: Gtk.Align.CENTER,
                                    valign: Gtk.Align.CENTER });
        _layout.pack(child2, 'child2');
        child2.show();

        this.frameEditButton = new Gtk.Button({ label: _("Edit bubble") });
        this.frameEditButton.get_style_context().add_class('suggested-action');
        child2.add(this.frameEditButton);
        this.frameEditButton.show();
        
        let child3 = new ComicStripView();
        _layout.pack(child3, 'child3');
        child3.show();

        _layout.add_constraints([
            new Emeus.Constraint({ target_attribute: Emeus.ConstraintAttribute.START,
                                   relation: Emeus.ConstraintRelation.EQ,
                                   source_object: child1,
                                   source_attribute: Emeus.ConstraintAttribute.START,
                                   constant: -8.0 }),
            new Emeus.Constraint({ target_object: child1,
                                   target_attribute: Emeus.ConstraintAttribute.WIDTH,
                                   relation: Emeus.ConstraintRelation.EQ,
                                   source_object: child2,
                                   source_attribute: Emeus.ConstraintAttribute.WIDTH }),
            new Emeus.Constraint({ target_object: child1,
                                   target_attribute: Emeus.ConstraintAttribute.END,
                                   relation: Emeus.ConstraintRelation.EQ,
                                   source_object: child2,
                                   source_attribute: Emeus.ConstraintAttribute.START,
                                   constant: -4.0 }),
            new Emeus.Constraint({ target_object: child2,
                                   target_attribute: Emeus.ConstraintAttribute.END,
                                   relation: Emeus.ConstraintRelation.EQ,
                                   source_attribute: Emeus.ConstraintAttribute.END,
                                   constant: -8.0 }),
            new Emeus.Constraint({ target_object: child3,
                                   target_attribute: Emeus.ConstraintAttribute.TOP,
                                   relation: Emeus.ConstraintRelation.EQ,
                                   source_attribute: Emeus.ConstraintAttribute.TOP,
                                   constant: 8.0 }),

            new Emeus.Constraint({ target_object: child2,
                                   target_attribute: Emeus.ConstraintAttribute.TOP,
                                   relation: Emeus.ConstraintRelation.EQ,
                                   source_object: child1,
                                   source_attribute: Emeus.ConstraintAttribute.TOP }),
            new Emeus.Constraint({ target_object: child1,
                                   target_attribute: Emeus.ConstraintAttribute.TOP,
                                   relation: Emeus.ConstraintRelation.EQ,
                                   source_object: child3,
                                   source_attribute: Emeus.ConstraintAttribute.BOTTOM,
                                   constant: 4.0 }),
            new Emeus.Constraint({ target_object: child2,
                                   target_attribute: Emeus.ConstraintAttribute.BOTTOM,
                                   relation: Emeus.ConstraintRelation.EQ,
                                   source_object: child1,
                                   source_attribute: Emeus.ConstraintAttribute.BOTTOM }),
            new Emeus.Constraint({ target_object: child1,
                                   target_attribute: Emeus.ConstraintAttribute.BOTTOM,
                                   relation: Emeus.ConstraintRelation.EQ,
                                   source_attribute: Emeus.ConstraintAttribute.BOTTOM,
                                   constant: -8.0 }),
            new Emeus.Constraint({ target_object: child3,
                                   target_attribute: Emeus.ConstraintAttribute.HEIGHT,
                                   relation: Emeus.ConstraintRelation.EQ,
                                   source_object: child1,
                                   source_attribute: Emeus.ConstraintAttribute.HEIGHT }),
            new Emeus.Constraint({ target_object: child2,
                                   target_attribute: Emeus.ConstraintAttribute.HEIGHT,
                                   relation: Emeus.ConstraintRelation.EQ,
                                   source_object: child1,
                                   source_attribute: Emeus.ConstraintAttribute.HEIGHT }),
            new Emeus.Constraint({ target_object: child3,
                                   target_attribute: Emeus.ConstraintAttribute.START,
                                   relation: Emeus.ConstraintRelation.EQ,
                                   source_object: child1,
                                   source_attribute: Emeus.ConstraintAttribute.START }),
            new Emeus.Constraint({ target_object: child3,
                                   target_attribute: Emeus.ConstraintAttribute.END,
                                   relation: Emeus.ConstraintRelation.EQ,
                                   source_object: child2,
                                   source_attribute: Emeus.ConstraintAttribute.END })
        ]);
    },
    link_page_button: function(widget) {
        this.frameEditButton.connect('clicked', Lang.bind(this, function() {
            widget.visible_child_name = 'frame-edit';
        }));
    }
});

const FrameEditorView = new Lang.Class({
    Name: 'FrameEditorView',
    Extends: Gtk.Bin,
    _init: function(params) {
        params = Params.fill(params, { hexpand: true,
                                       vexpand: true });
        this.parent(params);
        let _layout = new Emeus.ConstraintLayout({ hexpand: true, vexpand: true });
        _layout.get_style_context().add_class('frame-edit');
        this.add(_layout);
        _layout.show();
        
        let bubbleview = new BubbleView();
        bubbleEdit = bubbleview;
        _layout.pack(bubbleview, 'child1');
        bubbleview.show();

        let buttonRotate = new Gtk.Button();
        buttonRotate.get_style_context().add_class('image-button');
        buttonRotate.connect('clicked', Lang.bind(this, function() {
            bubbleview.rotateClockwise();
        }));
        _layout.pack(buttonRotate, 'child2');
        buttonRotate.show();
        let buttonRatateImage = new Gtk.Image({ 'icon-name': 'object-rotate-right' });
        buttonRotate.add(buttonRatateImage);
        buttonRatateImage.show();

        let buttonRotate2 = new Gtk.Button();
        buttonRotate.get_style_context().add_class('image-button');
        buttonRotate2.connect('clicked', Lang.bind(this, function() {
            bubbleview.rotateCounterClockwise();
        }));
        _layout.pack(buttonRotate2, 'child3');
        buttonRotate2.show();
        let buttonRatateImage2 = new Gtk.Image({ 'icon-name': 'object-rotate-left' });
        buttonRotate2.add(buttonRatateImage2);
        buttonRatateImage2.show();

        this._buttonBack = new Gtk.Button({ label: _("Back") });
        this._buttonBack.get_style_context().add_class('suggested-action');
        _layout.pack(this._buttonBack, 'child4');
        this._buttonBack.show();

        _layout.add_constraints([
            new Emeus.Constraint({ target_object: bubbleview,
                                   target_attribute: Emeus.ConstraintAttribute.CENTER_X,
                                   relation: Emeus.ConstraintRelation.EQ,
                                   source_attribute: Emeus.ConstraintAttribute.CENTER_X }),
            new Emeus.Constraint({ target_object: bubbleview,
                                   target_attribute: Emeus.ConstraintAttribute.CENTER_Y,
                                   relation: Emeus.ConstraintRelation.EQ,
                                   source_attribute: Emeus.ConstraintAttribute.CENTER_Y }),
            new Emeus.Constraint({ target_object: buttonRotate,
                                   target_attribute: Emeus.ConstraintAttribute.START,
                                   relation: Emeus.ConstraintRelation.EQ,
                                   source_object: bubbleview,
                                   source_attribute: Emeus.ConstraintAttribute.END,
                                   constant: 4.0 }),
            new Emeus.Constraint({ target_object: buttonRotate,
                                   target_attribute: Emeus.ConstraintAttribute.TOP,
                                   relation: Emeus.ConstraintRelation.EQ,
                                   source_object: bubbleview,
                                   source_attribute: Emeus.ConstraintAttribute.BOTTOM,
                                   constant: 4.0 }),
            new Emeus.Constraint({ target_object: buttonRotate2,
                                   target_attribute: Emeus.ConstraintAttribute.END,
                                   relation: Emeus.ConstraintRelation.EQ,
                                   source_object: bubbleview,
                                   source_attribute: Emeus.ConstraintAttribute.START,
                                   constant: -4.0 }),
            new Emeus.Constraint({ target_object: buttonRotate2,
                                   target_attribute: Emeus.ConstraintAttribute.TOP,
                                   relation: Emeus.ConstraintRelation.EQ,
                                   source_object: bubbleview,
                                   source_attribute: Emeus.ConstraintAttribute.BOTTOM,
                                   constant: 4.0 }),
            new Emeus.Constraint({ target_object: this._buttonBack,
                                   target_attribute: Emeus.ConstraintAttribute.BOTTOM,
                                   relation: Emeus.ConstraintRelation.EQ,
                                   source_attribute: Emeus.ConstraintAttribute.BOTTOM,
                                   constant: -8.0 }),
            new Emeus.Constraint({ target_object: this._buttonBack,
                                   target_attribute: Emeus.ConstraintAttribute.START,
                                   relation: Emeus.ConstraintRelation.EQ,
                                   source_attribute: Emeus.ConstraintAttribute.START,
                                   constant: 8.0 })
        ]);
    },
    link_page_button: function(widget) {
        this._buttonBack.connect('clicked', Lang.bind(this, function() {
            widget.visible_child_name = 'comic-edit';
        }));
    }
});

const MainView = new Lang.Class({
    Name: 'MainView',
    Extends: Gtk.Stack,

    _init: function(params) {
        params = Params.fill(params, { hexpand: true,
                                       vexpand: true,
                                       'transition-type': Gtk.StackTransitionType.SLIDE_LEFT_RIGHT,
                                       'transition-duration': 400 });
        this.parent(params);
        // this._settings = Util.getSettings(pkg.name);
        
        let comicEditor = new ComicEditorView();
        comicEditor.link_page_button(this, 'frame-edit');
        this.add_named(comicEditor, 'comic-edit');
        comicEditor.show();
        let frameEditor = new FrameEditorView();
        frameEditor.link_page_button(this, 'comic-edit');
        this.add_named(frameEditor, 'frame-edit');
        frameEditor.show();
    }
});
