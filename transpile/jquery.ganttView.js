/*
jQuery.ganttView v.0.8.8
Copyright (c) 2010 JC Grubbs - jc.grubbs@devmynd.com
MIT License Applies
*/
/**
 * jquery.ganttView:
 *
 * gantt chart
 * 	has series of gantt series
 *
 * gantt series
 * 	has name
 */
var JQueryGanttView;
(function (JQueryGanttView) {
    var SimpleDataElement = (function () {
        function SimpleDataElement(name, start, end, color) {
            this.name = name;
            this.start = this.originStart = start;
            this.end = this.originEnd = end;
            this.color = color;
        }
        SimpleDataElement.prototype.moveStartTo = function (date) {
            this.addOffset(this.start.getTime() - date.getTime());
        };
        SimpleDataElement.prototype.addOffset = function (offset) {
            this.start = new Date(this.start.getTime() + offset);
            this.end = new Date(this.end.getTime() + offset);
        };
        return SimpleDataElement;
    }());
    JQueryGanttView.SimpleDataElement = SimpleDataElement;
    jQuery.fn.ganttView = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        if (args.length == 1 && typeof (args[0]) == "object") {
            build.call(this, args[0]);
        }
        if (args.length == 2 && typeof (args[0]) == "string") {
            handleMethod.call(this, args[0], args[1]);
        }
        return this;
    };
    function build(options) {
        var els = this;
        var defaults = {
            showWeekends: true,
            cellWidth: 21,
            cellHeight: 31,
            slideWidth: 400,
            vHeaderWidth: 100,
            behavior: {
                clickable: true,
                draggable: true,
                resizable: true
            }
        };
        var opts = jQuery.extend(true, defaults, options);
        if (opts.data) {
            build();
        }
        else if (opts.dataUrl) {
            jQuery.getJSON(opts.dataUrl, function (data) { opts.data = data; build(); });
        }
        function build() {
            els.each(function () {
                var container = jQuery(this);
                var div = jQuery("<div>", { "class": "ganttview" });
                var chart = new Chart(div, opts);
                chart.render();
                container.append(div);
                var w = jQuery("div.ganttview-vtheader", container).outerWidth() +
                    jQuery("div.ganttview-slide-container", container).outerWidth();
                container.css("width", (w + 2) + "px");
                new Behavior(chart, container, opts).apply();
            });
        }
    }
    function handleMethod(method) {
        var params = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            params[_i - 1] = arguments[_i];
        }
        if (method == "setSlideWidth") {
            var div = $("div.ganttview", this);
            div.each(function () {
                var vtWidth = $("div.ganttview-vtheader", div).outerWidth();
                $(div).width(vtWidth + params[0] + 1);
                $("div.ganttview-slide-container", this).width(params[0]);
            });
        }
    }
    /**
     * Chart
     */
    var Chart = (function () {
        function Chart(div, opts) {
            this.div = div;
            this.opts = opts;
            var minDays = Math.floor((opts.slideWidth / opts.cellWidth) + 5);
            var startEnd = DateUtils.getBoundaryDatesFromData(opts.data, minDays);
            this.start = startEnd[0];
            this.end = startEnd[1];
        }
        Chart.prototype.render = function () {
            this.addVtHeader();
            this.slideDiv = jQuery("<div>", {
                "class": "ganttview-slide-container",
                "css": { "width": this.opts.slideWidth + "px" }
            });
            var dates = DateUtils.getDates(this.start, this.end);
            this.addHzHeader(dates);
            this.addGrid(dates);
            this.addBlockContainers();
            this.addBlocks();
            this.div.append(this.slideDiv);
            this.applyLastClass(this.div.parent());
        };
        Chart.prototype.addVtHeader = function () {
            var div = this.div;
            var data = this.opts.data;
            var cellHeight = this.opts.cellHeight;
            var headerDiv = jQuery("<div>", { "class": "ganttview-vtheader" });
            for (var i = 0; i < data.length; i++) {
                var itemDiv = jQuery("<div>", { "class": "ganttview-vtheader-item" });
                itemDiv.append(jQuery("<div>", {
                    "class": "ganttview-vtheader-item-name",
                    "css": { "height": (data[i].series.length * cellHeight) + "px" }
                }).append(data[i].name));
                var seriesDiv = jQuery("<div>", { "class": "ganttview-vtheader-series" });
                for (var j = 0; j < data[i].series.length; j++) {
                    seriesDiv.append(jQuery("<div>", { "class": "ganttview-vtheader-series-name" })
                        .append(data[i].series[j].name));
                }
                itemDiv.append(seriesDiv);
                headerDiv.append(itemDiv);
            }
            div.append(headerDiv);
        };
        Chart.prototype.addHzHeader = function (dates) {
            var cellWidth = this.opts.cellWidth;
            var headerDiv = jQuery("<div>", { "class": "ganttview-hzheader" });
            var monthsDiv = jQuery("<div>", { "class": "ganttview-hzheader-months" });
            var daysDiv = jQuery("<div>", { "class": "ganttview-hzheader-days" });
            var totalW = 0;
            for (var y in dates) {
                for (var m in dates[y]) {
                    var w = dates[y][m].length * cellWidth;
                    totalW = totalW + w;
                    monthsDiv.append(jQuery("<div>", {
                        "class": "ganttview-hzheader-month",
                        "css": { "width": (w - 1) + "px" }
                    }).append(Chart.monthNames[m] + "/" + y));
                    for (var d in dates[y][m]) {
                        daysDiv.append(jQuery("<div>", { "class": "ganttview-hzheader-day" })
                            .append(dates[y][m][d].getDate().toString()));
                    }
                }
            }
            monthsDiv.css("width", totalW + "px");
            daysDiv.css("width", totalW + "px");
            headerDiv.append(monthsDiv).append(daysDiv);
            this.slideDiv.append(headerDiv);
        };
        Chart.prototype.addGrid = function (dates) {
            var data = this.opts.data;
            var slideWidth = this.opts.slideWidth;
            var showWeekends = this.opts.showWeekends;
            var gridDiv = jQuery("<div>", { "class": "ganttview-grid" });
            var rowDiv = jQuery("<div>", { "class": "ganttview-grid-row" });
            for (var y in dates) {
                for (var m in dates[y]) {
                    for (var d in dates[y][m]) {
                        var cellDiv = jQuery("<div>", { "class": "ganttview-grid-row-cell" });
                        if (DateUtils.isWeekend(dates[y][m][d]) && showWeekends) {
                            cellDiv.addClass("ganttview-weekend");
                        }
                        rowDiv.append(cellDiv);
                    }
                }
            }
            var w = jQuery("div.ganttview-grid-row-cell", rowDiv).length * slideWidth;
            rowDiv.css("width", w + "px");
            gridDiv.css("width", w + "px");
            for (var i = 0; i < data.length; i++) {
                for (var j = 0; j < data[i].series.length; j++) {
                    gridDiv.append(rowDiv.clone());
                }
            }
            this.slideDiv.append(gridDiv);
        };
        Chart.prototype.addBlockContainers = function () {
            var data = this.opts.data;
            var blocksDiv = jQuery("<div>", { "class": "ganttview-blocks" });
            for (var i = 0; i < data.length; i++) {
                for (var j = 0; j < data[i].series.length; j++) {
                    blocksDiv.append(jQuery("<div>", { "class": "ganttview-block-container" }));
                }
            }
            this.slideDiv.append(blocksDiv);
        };
        Chart.prototype.addBlocks = function () {
            var data = this.opts.data;
            var cellWidth = this.opts.cellWidth;
            var start = this.start;
            var rows = jQuery("div.ganttview-blocks div.ganttview-block-container", this.slideDiv);
            var rowIdx = 0;
            for (var i = 0; i < data.length; i++) {
                for (var j = 0; j < data[i].series.length; j++) {
                    var series = data[i].series[j];
                    var size = DateUtils.daysBetween(series.start, series.end) + 1;
                    var offset = DateUtils.daysBetween(start, series.start);
                    var block = jQuery("<div>", {
                        "class": "ganttview-block",
                        "title": series.name + ", " + size + " days",
                        "css": {
                            "width": ((size * cellWidth) - 9) + "px",
                            "margin-left": ((offset * cellWidth) + 3) + "px"
                        }
                    });
                    this.addBlockData(block, data[i], series);
                    if (data[i].series[j].color) {
                        block.css("background-color", data[i].series[j].color);
                    }
                    block.append(jQuery("<div>", { "class": "ganttview-block-text" }).text(size));
                    jQuery(rows[rowIdx]).append(block);
                    rowIdx = rowIdx + 1;
                }
            }
        };
        Chart.prototype.addBlockData = function (block, data, series) {
            // This allows custom attributes to be added to the series data objects
            // and makes them available to the 'data' argument of click, resize, and drag handlers
            var blockData = { id: data.id, name: data.name };
            jQuery.extend(blockData, series);
            block.data("block-data", blockData);
        };
        Chart.prototype.applyLastClass = function (div) {
            jQuery("div.ganttview-grid-row div.ganttview-grid-row-cell:last-child", div).addClass("last");
            jQuery("div.ganttview-hzheader-days div.ganttview-hzheader-day:last-child", div).addClass("last");
            jQuery("div.ganttview-hzheader-months div.ganttview-hzheader-month:last-child", div).addClass("last");
        };
        Chart.monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return Chart;
    }());
    JQueryGanttView.Chart = Chart;
    /**
     * Behavior
     */
    var Behavior = (function () {
        function Behavior(dates, div, opts) {
            this.dates = dates;
            this.div = div;
            this.opts = opts;
        }
        Behavior.prototype.apply = function () {
            var thiz = this;
            var div = this.div;
            var opts = this.opts;
            var behavior = this.opts.behavior;
            if (behavior.clickable) {
                jQuery("div", this.div).on("click", ".ganttview-block", function (e) {
                    var block = jQuery(this);
                    var data = block.data("block-data");
                    var accept = !behavior.onClick || !!behavior.onClick(data, thiz, e);
                    if (!accept)
                        e.stopPropagation();
                });
            }
            if (behavior.resizable) {
                jQuery("div .ganttview-block", this.div).resizable({
                    grid: opts.cellWidth,
                    handles: "e,w",
                    resize: function (e, ui) {
                        var block = jQuery(this);
                        var data = block.data("block-data");
                        var accept = !behavior.onResize || !!behavior.onResize(data, thiz, ui);
                        if (!accept) {
                            ui.position = ui.originalPosition;
                            ui.size = ui.originalSize;
                        }
                        else {
                            thiz.updateDataAndPosition(block);
                        }
                    }
                });
            }
            if (behavior.draggable) {
                jQuery("div .ganttview-block", this.div).draggable({
                    axis: "x",
                    grid: [opts.cellWidth, opts.cellWidth],
                    drag: function (e, ui) {
                        var block = jQuery(this);
                        var data = block.data("block-data");
                        var accept = !behavior.onDrag || !!behavior.onDrag(data, thiz, ui);
                        if (!accept) {
                            ui.position.left = thiz.daysToViewLength(DateUtils.millisecsToDays(data.start.getTime() - thiz.dates.start.getTime()));
                        }
                        else {
                            thiz.updateDataAndPosition(block);
                        }
                    }
                });
            }
        };
        Behavior.prototype.offsetFor = function (block) {
            var container = jQuery("div.ganttview-slide-container", this.div);
            var scroll = container.scrollLeft();
            return block.offset().left - container.offset().left - 1 + scroll;
        };
        Behavior.prototype.viewLengthToDays = function (viewLength) {
            return viewLength / this.opts.cellWidth;
        };
        Behavior.prototype.daysToViewLength = function (days) {
            return days * this.opts.cellWidth;
        };
        Behavior.prototype.offsetToDate = function (offset) {
            return DateUtils.addDays(this.dates.start, this.viewLengthToDays(offset));
        };
        Behavior.prototype.updateDataAndPosition = function (block) {
            var offset = this.offsetFor(block);
            // Set new start date
            var newStart = this.offsetToDate(offset);
            block.data("block-data").start = newStart;
            // Set new end date
            var numberOfDays = Math.round(this.viewLengthToDays(block.outerWidth())) - 1;
            var newEnd = DateUtils.addDays(newStart, numberOfDays);
            block.data("block-data").end = DateUtils.addDays(newStart, numberOfDays);
            jQuery("div.ganttview-block-text", block).text(numberOfDays + 1);
            console.log(newStart + " - " + newEnd);
            // Remove top and left properties to avoid incorrect block positioning,
            // set position to relative to keep blocks relative to scrollbar when scrolling
            block.css("top", "").css("left", "")
                .css("position", "relative").css("margin-left", offset + "px");
        };
        return Behavior;
    }());
    JQueryGanttView.Behavior = Behavior;
    var ArrayUtils = (function () {
        function ArrayUtils() {
        }
        ArrayUtils.contains = function (arr, obj) {
            var has = false;
            for (var i = 0; i < arr.length; i++) {
                if (arr[i] == obj) {
                    has = true;
                }
            }
            return has;
        };
        return ArrayUtils;
    }());
    JQueryGanttView.ArrayUtils = ArrayUtils;
    var DateUtils = (function () {
        function DateUtils() {
        }
        DateUtils.daysBetween = function (start, end) {
            if (!start || !end) {
                return 0;
            }
            var s = start instanceof Date ? start : new Date(Date.parse(start));
            var e = end instanceof Date ? end : new Date(Date.parse(end));
            return Math.ceil((e.getTime() - s.getTime()) / (24 * 60 * 60 * 1000));
            // if (s.getYear() == 1901 || s.getYear() == 8099) { return 0; }
            // var count = 0, date = s.clone();
            // while (date.compareTo(end) == -1) { count = count + 1; date.addDays(1); }
            // return count;
        };
        DateUtils.isWeekend = function (date) {
            return date.getDay() % 6 == 0;
        };
        DateUtils.getBoundaryDatesFromData = function (data, minDays) {
            var minStart = null;
            var maxEnd = null;
            for (var i = 0; i < data.length; i++) {
                for (var j = 0; j < data[i].series.length; j++) {
                    var start = data[i].series[j].start;
                    var end = data[i].series[j].end;
                    if (!minStart || minStart > start)
                        minStart = start;
                    if (!maxEnd || maxEnd < end)
                        maxEnd = end;
                }
            }
            // Insure that the width of the chart is at least the slide width to avoid empty
            // whitespace to the right of the grid
            if (DateUtils.daysBetween(minStart, maxEnd) < minDays) {
                maxEnd = DateUtils.addDays(minStart, minDays);
            }
            return [minStart, maxEnd];
        };
        DateUtils.addDays = function (date, days) {
            return new Date(date.getTime() + DateUtils.daysToMillisecs(days));
        };
        // Creates a 3 dimensional array [year][month][day] of every day 
        // between the given start and end dates
        DateUtils.getDates = function (start, end) {
            var dates = [];
            dates[start.getFullYear()] = [];
            dates[start.getFullYear()][start.getMonth()] = [start];
            var last = start;
            while (last == end) {
                var next = DateUtils.addDays(last, 1);
                if (!dates[next.getFullYear()]) {
                    dates[next.getFullYear()] = [];
                }
                if (!dates[next.getFullYear()][next.getMonth()]) {
                    dates[next.getFullYear()][next.getMonth()] = [];
                }
                dates[next.getFullYear()][next.getMonth()].push(next);
                last = next;
            }
            return dates;
        };
        DateUtils.daysToMillisecs = function (days) {
            return days * 24 * 60 * 60 * 1000;
        };
        DateUtils.millisecsToDays = function (millisecs) {
            return millisecs / (24 * 60 * 60 * 1000);
        };
        return DateUtils;
    }());
    JQueryGanttView.DateUtils = DateUtils;
    ;
})(JQueryGanttView || (JQueryGanttView = {}));
