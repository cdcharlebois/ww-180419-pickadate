define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",
    "mxui/dom",
    "dojo/dom",
    "dojo/dom-prop",
    "dojo/dom-geometry",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-construct",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/text",
    "dojo/html",
    "dojo/_base/event",
    "Pickadate/lib/jquery-1.11.2",
    "Pickadate/lib/picker.date",
    "Pickadate/lib/picker",
    "dojo/text!Pickadate/widget/template/Pickadate.html"
], function(declare, _WidgetBase, _TemplatedMixin, dom, dojoDom, dojoProp, dojoGeometry, dojoClass, dojoStyle, dojoConstruct, dojoArray, lang, dojoText, dojoHtml, dojoEvent, _jQuery, Datepicker, Picker, widgetTemplate) {
    "use strict";

    var $ = _jQuery.noConflict(true);

    return declare("Pickadate.widget.Pickadate", [_WidgetBase, _TemplatedMixin], {

        templateString: widgetTemplate,

        // nodes
        widgetBase: null,
        pickerNode: null,
        errorNode: null,

        // modeler
        attribute: null,
        dateFormat: null,
        disabledEntity: null,
        disabledAttr: null,
        disabledMf: null,

        // Internal variables.
        _handles: null,
        _contextObj: null,
        _picker: null,

        constructor: function() {
            this._handles = [];
        },

        postCreate: function() {
            logger.debug(this.id + ".postCreate");
            dojoClass.add(this.errorNode, "hidden");
            var $input = $(this.pickerNode).pickadate({
                format: this.dateFormat,
                onSet: lang.hitch(this, function(thingSet) {
                    // pass the new value to the context object
                    console.log(thingSet); // {select: 1523023200000}
                    this._contextObj.set(this.attribute, thingSet.select);
                })
            });
            this._picker = $input.pickadate("picker");
        },

        update: function(obj, callback) {
            logger.debug(this.id + ".update");
            this._contextObj = obj;
            this._setDisabledDates();

            this._resetSubcriptions();
            this._updateRendering(callback);
        },

        _setDisabledDates: function() {
            mx.data.action({
                params: {
                    applyto: "selection",
                    actionname: this.disabledMf,
                    guids: [this._contextObj.getGuid()]
                },
                origin: this.mxform,
                callback: lang.hitch(this, function(data) {
                    // console.log(data.map(lang.hitch(this, function(d) { return d.get(this.disabledAttr) })));
                    // use the result to disable dates
                    this._picker.set("disable", data.map(
                        lang.hitch(this, function(mxobj) {
                            return new Date(mxobj.get(this.disabledAttr));
                        })
                    ));
                    // map these mxobjects to dates and then disable them.
                }),
                error: lang.hitch(this, function(err) {

                })
            })
        },

        resize: function(box) {
            logger.debug(this.id + ".resize");
        },

        uninitialize: function() {
            logger.debug(this.id + ".uninitialize");
        },

        _resetSubcriptions: function() {
            this.unsubscribeAll();
            this.subscribe({
                guid: this._contextObj.getGuid(),
                attr: this.attribute,
                callback: lang.hitch(this, function(guid, attr, attrValue) {
                    // the GUID of the object that changed
                    // the attribute name of the attribute whose value changed
                    // the new value of the attribute
                    this._updateRendering();
                    dojoClass.add(this.errorNode, "hidden");
                })
            });
            this.subscribe({
                guid: this._contextObj.getGuid(),
                val: true,
                callback: lang.hitch(this, function(validations) {
                    console.debug(arguments);
                    // an array of validation objects, per object
                    // validations[0] is the feedback
                    // validations[0].getGuid() --> the obect guid
                    // validations[0].getAttributes() --> the list of attributes with errors
                    // validations[0].getReasonByAttribute({attrName}) --> the message for field `attrName`
                    var val = validations[0],
                        message = val.getReasonByAttribute(this.attribute);
                    if (message) { // if there's a validation message on this attribute
                        dojoClass.remove(this.errorNode, "hidden");
                        dojoHtml.set(this.errorNode, message);
                    }
                })
            });
        },

        _updateRendering: function(callback) {
            logger.debug(this.id + "._updateRendering");
            // set the date of the picker
            var date = this._contextObj.get(this.attribute); //1524110321249
            this._picker.set("select", date);
            this._executeCallback(callback);
        },

        _executeCallback: function(cb) {
            if (cb && typeof cb === "function") {
                cb();
            }
        }
    });
});

require(["Pickadate/widget/Pickadate"]);