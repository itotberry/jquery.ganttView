/*
jQuery.ganttView v.0.8.8
Copyright (c) 2010 JC Grubbs - jc.grubbs@devmynd.com
MIT License Applies
*/

/// <reference path="./jquery.d.ts" />
/// <reference path="./jqueryui.d.ts" />

type jQueryGanttViewMethods = "setSlideWidth";

/**
 * extension for JQuery
 */
interface JQuery {
	/**
	 * initializes gantt chart to the object
	 * 
	 * @param initial_gantt_option options for gantt view
	 */
	ganttView(initial_gantt_option: JQueryGanttView.ChartOptions): void;

	/**
	 * (experimental)
	 * initializes gantt chart to selected object and widen these width.
	 * 
	 * @param methodName method name
	 * @param params parameters
	 */
	ganttView(methodName: jQueryGanttViewMethods, ...params: any[]): void;
}

/**
 * Generic eventhandler function interface
 */
interface jQueryGanttEventHandler<S, A, R> {
	(data: JQueryGanttView.GanttElement, source: S, arg: A): R;
}

/**
 * jquery.ganttView:
 * 
 * gantt chart
 * 	has series of gantt series
 * 
 * gantt series
 * 	has name
 */
namespace JQueryGanttView {

	/**
	 * named object
	 */
	export interface Named {
		/**
		 * display name of the instance
		 */
		name: string
	}

	/**
	 * timed object
	 */
	export interface Duration {

		/**
		 * day of beginning (inclusive)
		 */
		start: Date;

		/**
		 * day of end (inclusive)
		 */
		end: Date;
	}

	/**
	 * gantt chart options
	 */
	export interface ChartOptions {
		/**
		 * (optional choice):
		 * use if this.dataUrl is null or undefined.
		 * 
		 * 
		 * elements of gantt chart
		 */
		data?: GanttGroup[];

		/**
		 * (optional) visible week ends if true
		 */
		showWeekends?: boolean;

		/**
		 * (optional)
		 */
		cellWidth?: number;

		/**
		 * (optional)
		 */
		cellHeight?: number;

		/**
		 * (optional)
		 */
		slideWidth?: number;

		/**
		 * (optional choide):
		 * loads json data from the url if this.data is null or undefined
		 */
		dataUrl?: string;

		/**
		 * (optional):
		 * reactions for gantt chart
		 */
		behavior?: {
			/**
			 * allow to fire "onClick" event if this is true
			 */
			clickable?: boolean,

			/**
			 * allow to fire "onDrag" event if this is true.
			 * this option is also allow to change a date of GanttElement by user interaction
			 */
			draggable?: boolean,

			/**
			 * allow to fire "onResize" event if thi is true.
			 * this option is also allow to change a date of GanttElement by user interaction
			 */
			resizable?: boolean,

			/**
			 * event handler for click event
			 * 
			 * @see clickable
			 */
			onClick?: jQueryGanttEventHandler<Behavior, JQueryEventObject, boolean>,

			/**
			 * event handler for drag event
			 * 
			 * @see draggable
			 */
			onDrag?: jQueryGanttEventHandler<Behavior, JQueryUI.DraggableEventUIParams, boolean>,

			/**
			 * event handler for resize event
			 */
			onResize?: jQueryGanttEventHandler<Behavior, JQueryUI.ResizableUIParams, boolean>,

		}
	}

	/**
	 * generic function interface for gantt chart events.
	 * 
	 * 
	 * forms: (charts, data_parent: GanttChartData, data_elm: GanttElement): void
	 */
	export interface GanttEventHandler {
		(chart, group: GanttGroup, element: GanttElement): void
	}

	/**
	 * represents groups of GanttElement
	 */
	export interface GanttGroup extends Named {
		/**
		 * 
		 */
		id: any;

		/**
		 * series of gantt data
		 */
		series: Array<GanttElement>;
	}

	/**
	 * represents a gantt chart
	 */
	export interface GanttElement extends Named, Duration {

		/**
		 * (optional) color of the chart
		 */
		color?: string;
	}

	export class SimpleDataElement implements GanttElement {
		name: string;
		originStart: Date;
		originEnd: Date;
		start: Date;
		end: Date;
		color: string;

		constructor(name: string, start: Date, end: Date, color?: string) {
			this.name = name;
			this.start = this.originStart = start;
			this.end = this.originEnd = end;
			this.color = color;
		}

		public moveStartTo(date: Date) {
			this.addOffset(this.start.getTime() - date.getTime());
		}

		public addOffset(offset: number) {
			this.start = new Date(this.start.getTime() + offset);
			this.end = new Date(this.end.getTime() + offset);

		}

	}

	jQuery.fn.ganttView = function (...args: any[]) {
		if (args.length == 1 && typeof (args[0]) == "object") {
			build.call(this, args[0]);
		}

		if (args.length == 2 && typeof (args[0]) == "string") {
			handleMethod.call(this, args[0], args[1]);
		}
		return this;
	}

	function build(options: JQueryGanttView.ChartOptions) {

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

        var opts: JQueryGanttView.ChartOptions = jQuery.extend(true, defaults, options);

		if (opts.data) {
			build();
		} else if (opts.dataUrl) {
			jQuery.getJSON(opts.dataUrl, function (data) { opts.data = data; build(); });
		}

		function build() {
			els.each(function () {
				var container = jQuery(this);
				var div = jQuery("<div>", { "class": "ganttview" });
				let chart = new Chart(div, opts);
				chart.render();
				container.append(div);

				var w = jQuery("div.ganttview-vtheader", container).outerWidth() +
					jQuery("div.ganttview-slide-container", container).outerWidth();
				container.css("width", (w + 2) + "px");

				new Behavior(chart, container, opts).apply();
			});
		}
    }

	function handleMethod(method: jQueryGanttViewMethods, ...params: any[]) {

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
	 * typedef of Array<Array<Array<Date>>>. which is used for grouping year-month-day tuple to Date instances.
	 */
	export type DateMatrix = Array<Array<Array<Date>>>;

	/**
	 * Chart
	 */
	export class Chart implements Duration {

		public static monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

		private div: JQuery;

		private slideDiv: JQuery;

		private opts: JQueryGanttView.ChartOptions;

		public start: Date;

		public end: Date;

		constructor(div: JQuery, opts: JQueryGanttView.ChartOptions) {
			this.div = div;
			this.opts = opts;

			let minDays = Math.floor((opts.slideWidth / opts.cellWidth) + 5);
			let startEnd = DateUtils.getBoundaryDatesFromData(opts.data, minDays);
			this.start = startEnd[0];
			this.end = startEnd[1];
		}

		public render() {
			this.addVtHeader();

            this.slideDiv = jQuery("<div>", {
                "class": "ganttview-slide-container",
                "css": { "width": this.opts.slideWidth + "px" }
            });

            let dates = DateUtils.getDates(this.start, this.end);
            this.addHzHeader(dates);
            this.addGrid(dates);
            this.addBlockContainers();
            this.addBlocks();
            this.div.append(this.slideDiv);
            this.applyLastClass(this.div.parent());
		}

		private addVtHeader() {
			let div = this.div;
			let data = this.opts.data;
			let cellHeight = this.opts.cellHeight;
            let headerDiv = jQuery("<div>", { "class": "ganttview-vtheader" });
            for (let i = 0; i < data.length; i++) {
                let itemDiv = jQuery("<div>", { "class": "ganttview-vtheader-item" });
                itemDiv.append(jQuery("<div>", {
                    "class": "ganttview-vtheader-item-name",
                    "css": { "height": (data[i].series.length * cellHeight) + "px" }
                }).append(data[i].name));
                let seriesDiv = jQuery("<div>", { "class": "ganttview-vtheader-series" });
                for (let j = 0; j < data[i].series.length; j++) {
                    seriesDiv.append(jQuery("<div>", { "class": "ganttview-vtheader-series-name" })
						.append(data[i].series[j].name));
                }
                itemDiv.append(seriesDiv);
                headerDiv.append(itemDiv);
            }
            div.append(headerDiv);
        }

		private addHzHeader(dates: DateMatrix) {
			let cellWidth = this.opts.cellWidth;
            let headerDiv = jQuery("<div>", { "class": "ganttview-hzheader" });
            let monthsDiv = jQuery("<div>", { "class": "ganttview-hzheader-months" });
            let daysDiv = jQuery("<div>", { "class": "ganttview-hzheader-days" });
            let totalW = 0;
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
        }

		private addGrid(dates: DateMatrix) {
			let data = this.opts.data;
			let slideWidth = this.opts.slideWidth;
			let showWeekends = this.opts.showWeekends;
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
        }

		private addBlockContainers() {
			let data = this.opts.data;
            var blocksDiv = jQuery("<div>", { "class": "ganttview-blocks" });
            for (var i = 0; i < data.length; i++) {
                for (var j = 0; j < data[i].series.length; j++) {
                    blocksDiv.append(jQuery("<div>", { "class": "ganttview-block-container" }));
                }
            }
            this.slideDiv.append(blocksDiv);
        }

		private addBlocks() {
			let data = this.opts.data;
			let cellWidth = this.opts.cellWidth;
			let start = this.start;
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
        }

		private addBlockData(block: JQuery, data: GanttGroup, series: GanttElement) {
			// This allows custom attributes to be added to the series data objects
			// and makes them available to the 'data' argument of click, resize, and drag handlers
			var blockData = { id: data.id, name: data.name };
			jQuery.extend(blockData, series);
			block.data("block-data", blockData);
        }

		private applyLastClass(div) {
            jQuery("div.ganttview-grid-row div.ganttview-grid-row-cell:last-child", div).addClass("last");
            jQuery("div.ganttview-hzheader-days div.ganttview-hzheader-day:last-child", div).addClass("last");
            jQuery("div.ganttview-hzheader-months div.ganttview-hzheader-month:last-child", div).addClass("last");
        }

	}

	/**
	 * Behavior
	 */
	export class Behavior {

		private dates: Duration;

		private div: JQuery;

		private opts: JQueryGanttView.ChartOptions;

		constructor(dates: Duration, div: JQuery, opts: JQueryGanttView.ChartOptions) {
			this.dates = dates;
			this.div = div;
			this.opts = opts;
		}

		public apply() {
			let thiz = this;
			let div = this.div;
			let opts = this.opts;
			let behavior = this.opts.behavior;
			if (behavior.clickable) {
				jQuery("div", this.div).on("click", ".ganttview-block", function (e) {
					let block = jQuery(this);
					let data: GanttElement = block.data("block-data");
					let accept = !behavior.onClick || !!behavior.onClick(data, thiz, e);
					if (!accept)
						e.stopPropagation();
				});
			}

            if (behavior.resizable) {
				jQuery("div .ganttview-block", this.div).resizable({
					grid: opts.cellWidth,
					handles: "e,w",
					resize: function (e, ui) {
						let block = jQuery(this);
						let data: GanttElement = block.data("block-data");
						let accept = !behavior.onResize || !!behavior.onResize(data, thiz, ui);
						if (!accept) {
							ui.position = ui.originalPosition;
							ui.size = ui.originalSize;
						} else {
							thiz.updateDataAndPosition(block);
						}
					},
				});
			}

            if (behavior.draggable) {
				jQuery("div .ganttview-block", this.div).draggable({
					axis: "x",
					grid: [opts.cellWidth, opts.cellWidth],
					drag: function (e, ui) {
						let block = jQuery(this);
						let data: GanttElement = block.data("block-data");
						let accept = !behavior.onDrag || !!behavior.onDrag(data, thiz, ui);

						if (!accept) {
							ui.position.left = thiz.daysToViewLength(DateUtils.millisecsToDays(data.start.getTime() - thiz.dates.start.getTime()));
						} else {
							thiz.updateDataAndPosition(block);
						}
					},
				});
			}
		}

		private offsetFor(block: JQuery) {
			var container = jQuery("div.ganttview-slide-container", this.div);
			var scroll = container.scrollLeft();
			return block.offset().left - container.offset().left - 1 + scroll;
		}

		private viewLengthToDays(viewLength: number): number {
			return viewLength / this.opts.cellWidth;
		}

		private daysToViewLength(days: number): number {
			return days * this.opts.cellWidth;
		}

		private offsetToDate(offset: number): Date {
			return DateUtils.addDays(this.dates.start, this.viewLengthToDays(offset));
		}

        private updateDataAndPosition(block: JQuery) {
			var offset = this.offsetFor(block);

			// Set new start date
			let newStart = this.offsetToDate(offset);
			block.data("block-data").start = newStart;

			// Set new end date
			var numberOfDays = Math.round(this.viewLengthToDays(block.outerWidth())) - 1;
			let newEnd = DateUtils.addDays(newStart, numberOfDays);
			block.data("block-data").end = DateUtils.addDays(newStart, numberOfDays);
			jQuery("div.ganttview-block-text", block).text(numberOfDays + 1);
			console.log(newStart + " - " + newEnd);

			// Remove top and left properties to avoid incorrect block positioning,
			// set position to relative to keep blocks relative to scrollbar when scrolling
			block.css("top", "").css("left", "")
				.css("position", "relative").css("margin-left", offset + "px");
        }

	}

    export class ArrayUtils {
		public static contains<T>(arr: Array<T>, obj: T): boolean {
			var has = false;
            for (var i = 0; i < arr.length; i++) { if (arr[i] == obj) { has = true; } }
            return has;
		}
	}

    export class DateUtils {

        public static daysBetween(start: string | Date, end: string | Date): number {
            if (!start || !end) { return 0; }
			let s = start instanceof Date ? start : new Date(Date.parse(start));
			let e = end instanceof Date ? end : new Date(Date.parse(end));
			return Math.ceil((e.getTime() - s.getTime()) / (24 * 60 * 60 * 1000));
            // if (s.getYear() == 1901 || s.getYear() == 8099) { return 0; }
            // var count = 0, date = s.clone();
            // while (date.compareTo(end) == -1) { count = count + 1; date.addDays(1); }
            // return count;
        }

		public static isWeekend(date: Date) {
			return date.getDay() % 6 == 0;
		}

		public static getBoundaryDatesFromData(data: JQueryGanttView.GanttGroup[], minDays: number): [Date, Date] {
			let minStart: Date = null;
			let maxEnd: Date = null;
			for (let i = 0; i < data.length; i++) {
				for (let j = 0; j < data[i].series.length; j++) {
					let start = data[i].series[j].start;
					let end = data[i].series[j].end;
					if (!minStart || minStart > start) minStart = start;
					if (!maxEnd || maxEnd < end) maxEnd = end;
				}
			}

			// Insure that the width of the chart is at least the slide width to avoid empty
			// whitespace to the right of the grid
			if (DateUtils.daysBetween(minStart, maxEnd) < minDays) {
				maxEnd = DateUtils.addDays(minStart, minDays);
			}
			return [minStart, maxEnd];
		}

		public static addDays(date: Date, days: number) {
			return new Date(date.getTime() + DateUtils.daysToMillisecs(days));
		}

		// Creates a 3 dimensional array [year][month][day] of every day 
		// between the given start and end dates
        public static getDates(start: Date, end: Date): DateMatrix {
            let dates: DateMatrix = [];
			dates[start.getFullYear()] = [];
			dates[start.getFullYear()][start.getMonth()] = [start]
			let last = start;
			while (last == end) {
				let next = DateUtils.addDays(last, 1);
				if (!dates[next.getFullYear()]) { dates[next.getFullYear()] = []; }
				if (!dates[next.getFullYear()][next.getMonth()]) {
					dates[next.getFullYear()][next.getMonth()] = [];
				}
				dates[next.getFullYear()][next.getMonth()].push(next);
				last = next;
			}
			return dates;
        }

		public static daysToMillisecs(days: number) {
			return days * 24 * 60 * 60 * 1000;
		}

		public static millisecsToDays(millisecs: number) {
			return millisecs / (24 * 60 * 60 * 1000);
		}
    };

}
