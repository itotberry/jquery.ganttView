/*
jQuery.ganttView v.0.8.8
Copyright (c) 2010 JC Grubbs - jc.grubbs@devmynd.com
MIT License Applies

compile with tsc over 1.8.10
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
        //let opts: JQueryGanttView.ChartOptions = jQuery.extend(true, defaults, options);
        function _extends(d, b) {
            for (var prop in b)
                if (b.hasOwnProperty(prop)) {
                    if (typeof (b[prop]) === "object") {
                        if (d[prop] === undefined)
                            d[prop] = {};
                        _extends(d[prop], b[prop]);
                    }
                    else if (d[prop] === undefined)
                        d[prop] = b[prop];
                }
            return d;
        }
        var opts = _extends(options, defaults);
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
            var div_1 = $("div.ganttview", this);
            div_1.each(function () {
                var vtWidth = $("div.ganttview-vtheader", div_1).outerWidth();
                $(div_1).width(vtWidth + params[0] + 1);
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
            for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
                var d = data_1[_i];
                var itemDiv = jQuery("<div>", { "class": "ganttview-vtheader-item" });
                itemDiv.append(jQuery("<div>", {
                    "class": "ganttview-vtheader-item-name",
                    "css": { "height": (d.series.length * cellHeight) + "px" }
                }).append(d.name));
                var seriesDiv = jQuery("<div>", { "class": "ganttview-vtheader-series" });
                for (var _a = 0, _b = d.series; _a < _b.length; _a++) {
                    var s = _b[_a];
                    seriesDiv.append(jQuery("<div>", { "class": "ganttview-vtheader-series-name" })
                        .append(s.name));
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
            for (var iy = 0; iy < dates.length; iy++) {
                var y = dates[iy];
                if (y === undefined)
                    continue;
                for (var im = 0; im < y.length; im++) {
                    var m = y[im];
                    var w = m.length * cellWidth;
                    totalW = totalW + w;
                    monthsDiv.append(jQuery("<div>", {
                        "class": "ganttview-hzheader-month",
                        "css": { "width": (w - 1) + "px" }
                    }).append(Chart.monthNames[im] + "/" + iy));
                    for (var _i = 0, m_1 = m; _i < m_1.length; _i++) {
                        var d = m_1[_i];
                        daysDiv.append(jQuery("<div>", { "class": "ganttview-hzheader-day" })
                            .append(d.getDate()));
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
            var showWeekends = this.opts.showWeekends;
            var gridDiv = jQuery("<div>", { "class": "ganttview-grid" });
            var rowDiv = jQuery("<div>", { "class": "ganttview-grid-row" });
            for (var _i = 0, dates_1 = dates; _i < dates_1.length; _i++) {
                var y = dates_1[_i];
                if (y === undefined)
                    continue;
                for (var _a = 0, y_1 = y; _a < y_1.length; _a++) {
                    var m = y_1[_a];
                    for (var _b = 0, m_2 = m; _b < m_2.length; _b++) {
                        var d = m_2[_b];
                        var cellDiv = jQuery("<div>", { "class": "ganttview-grid-row-cell" });
                        if (DateUtils.isWeekend(d) && showWeekends) {
                            cellDiv.addClass("ganttview-weekend");
                        }
                        rowDiv.append(cellDiv);
                    }
                }
            }
            var w = jQuery("div.ganttview-grid-row-cell", rowDiv).length * this.opts.cellWidth;
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
                    var block = $("<div>", { class: "ganttview-block" });
                    block.append(jQuery("<div>", { "class": "ganttview-block-text" }).text("-"));
                    var blockBody = new GanttBlock(this, block, data[i].series[j]);
                    // This allows custom attributes to be added to the series data objects
                    // and makes them available to the 'data' argument of click, resize, and drag handlers
                    block.data("block-data", blockBody);
                    blockBody.updateBlock();
                    jQuery(rows[rowIdx]).append(block);
                    rowIdx = rowIdx + 1;
                }
            }
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
    var GanttBlock = (function () {
        function GanttBlock(chart, parts, data) {
            this.chart = chart;
            this.block = parts;
            this.data = data;
        }
        GanttBlock.prototype.updateBlock = function () {
            var days = DateUtils.daysBetween(this.data.start, this.data.end) + 1;
            var offset = DateUtils.daysBetween(this.chart.start, this.data.start);
            this.block
                .prop("title", this.data.titleText ? this.data.titleText(days) : (this.data.name + ", " + days + " days"))
                .css("top", "")
                .css("left", "")
                .css("position", "relative")
                .css("width", ((days * this.chart.opts.cellWidth) - 9) + "px")
                .css("margin-left", offset * this.chart.opts.cellWidth + "px");
            ;
            if (this.data.color) {
                this.block.css("background-color", this.data.color);
            }
            this.block.find(".ganttview-block-text").html(this.data.labelHtml ? this.data.labelHtml(days) : days.toString());
        };
        GanttBlock.prototype.updateData = function () {
            var scroll = this.chart.slideDiv.scrollLeft();
            var width = this.block.outerWidth();
            var offset = this.block.offset().left - this.chart.slideDiv.offset().left - 1 + scroll;
            // Set new start date
            var newStart = DateUtils.addDays(this.chart.start, Math.round(offset / this.chart.opts.cellWidth));
            this.data.start = newStart;
            // Set new end date
            var numberOfDays = Math.round(width / this.chart.opts.cellWidth) - 1;
            this.data.end = DateUtils.addDays(newStart, numberOfDays);
        };
        return GanttBlock;
    }());
    JQueryGanttView.GanttBlock = GanttBlock;
    /**
     * Behavior
     */
    var Behavior = (function () {
        function Behavior(dates, div, opts) {
            this.dates = dates;
            this.container = div;
            this.opts = opts;
        }
        Behavior.prototype.apply = function () {
            var thiz = this;
            var div = this.container;
            var opts = this.opts;
            var behavior = this.opts.behavior;
            if (behavior.clickable) {
                jQuery("div", this.container).on("click", ".ganttview-block", function (e) {
                    var block = jQuery(this);
                    var gb = block.data("block-data");
                    var accept = !behavior.onClick || !!behavior.onClick(gb, thiz, e);
                });
            }
            if (behavior.resizable) {
                jQuery("div .ganttview-block", this.container).resizable({
                    grid: opts.cellWidth,
                    handles: "e,w",
                    // start: function (e, ui) {},
                    resize: function (e, ui) {
                        var block = jQuery(this);
                        var gb = block.data("block-data");
                        var accept = !behavior.onResizing || !!behavior.onResizing(gb, thiz, ui);
                        if (accept) {
                            // updates data from view
                            gb.updateData();
                        }
                        gb.updateBlock();
                    },
                    stop: function (e, ui) {
                        var block = jQuery(this);
                        var gb = block.data("block-data");
                        gb.updateData();
                        gb.updateBlock();
                    }
                });
            }
            if (behavior.draggable) {
                jQuery("div .ganttview-block", this.container).draggable({
                    axis: "x",
                    grid: [opts.cellWidth, opts.cellWidth],
                    drag: function (e, ui) {
                        var block = jQuery(this);
                        var gb = block.data("block-data");
                        var accept = !behavior.onDragging || !!behavior.onDragging(gb, thiz, ui);
                        if (accept) {
                            // update data with view
                            gb.updateData();
                        }
                        gb.updateBlock();
                    },
                    stop: function (e, ui) {
                        var gb = $(this).data("block-data");
                        gb.updateData();
                        gb.updateBlock();
                    }
                });
            }
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
            return Math.ceil(DateUtils.millisecsToDays(e.getTime() - s.getTime()));
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
            while (last < end) {
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
