/*
jQuery.ganttView v.0.8.8
Copyright (c) 2010 JC Grubbs - jc.grubbs@devmynd.com
MIT License Applies

compile with tsc over 1.8.10
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
	(data: JQueryGanttView.GanttBlock, source: S, arg: A): R;
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
			 * event handler for dragging event
			 * 
			 * @see draggable
			 */
			onDragging?: jQueryGanttEventHandler<Behavior, JQueryUI.DraggableEventUIParams, boolean>,

			/**
			 * event handler for resize event
			 */
			onResizing?: jQueryGanttEventHandler<Behavior, JQueryUI.ResizableUIParams, boolean>,

		}
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

		/**
		 * getter for "title" text of the gantt parts.
		 * this text is used for .ganttview-block element's title attributes
		 */
		titleText?: (days: number) => string;

		/**
		 * getter for "label" text of the gantt parts.
		 * this text is used for .ganttview-block-text inner text
		 */
		labelHtml?: (days: number) => string;
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

		let els: JQuery = this;
        let defaults = {
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
		function _extends(d: any, b: any) {
			for (let prop in b)
				if (b.hasOwnProperty(prop)) {
					if (typeof (b[prop]) === "object") {
						if (d[prop] === undefined)
							d[prop] = {};
						_extends(d[prop], b[prop]);
					} else if (d[prop] === undefined)
						d[prop] = b[prop];
				}
			return d;
		}
		let opts = _extends(options, defaults);

		if (opts.data) {
			build();
		} else if (opts.dataUrl) {
			jQuery.getJSON(opts.dataUrl, function (data) { opts.data = data; build(); });
		}

		function build() {
			els.each(function () {
				let container = jQuery(this);
				let div = jQuery("<div>", { "class": "ganttview" });
				let chart = new Chart(div, opts);
				chart.render();
				container.append(div);

				let w = jQuery("div.ganttview-vtheader", container).outerWidth() +
					jQuery("div.ganttview-slide-container", container).outerWidth();
				container.css("width", (w + 2) + "px");

				new Behavior(chart, container, opts).apply();
			});
		}
    }

	function handleMethod(method: jQueryGanttViewMethods, ...params: any[]) {

		if (method == "setSlideWidth") {
			let div = $("div.ganttview", this);
			div.each(function () {
				let vtWidth = $("div.ganttview-vtheader", div).outerWidth();
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

		public slideDiv: JQuery;

		public opts: JQueryGanttView.ChartOptions;

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
			for (let d of data) {
                let itemDiv = jQuery("<div>", { "class": "ganttview-vtheader-item" });
                itemDiv.append(jQuery("<div>", {
                    "class": "ganttview-vtheader-item-name",
                    "css": { "height": (d.series.length * cellHeight) + "px" }
                }).append(d.name));
                let seriesDiv = jQuery("<div>", { "class": "ganttview-vtheader-series" });
				for (let s of d.series) {
                    seriesDiv.append(jQuery("<div>", { "class": "ganttview-vtheader-series-name" })
						.append(s.name));
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
			for (let iy = 0; iy < dates.length; iy++) {
				let y = dates[iy];
				if (y === undefined)
					continue;
				for (let im = 0; im < y.length; im++) {
					let m = y[im];
					if (m === undefined)
						continue;
					let w = m.length * cellWidth;
					totalW = totalW + w;
					monthsDiv.append(jQuery("<div>", {
						"class": "ganttview-hzheader-month",
						"css": { "width": (w - 1) + "px" }
					}).append(Chart.monthNames[im] + "/" + iy));
					for (let d of m) {
						if (d === undefined)
							continue;
						daysDiv.append(jQuery("<div>", { "class": "ganttview-hzheader-day" })
							.append(d.getDate() as any));
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
			let showWeekends = this.opts.showWeekends;
            let gridDiv = jQuery("<div>", { "class": "ganttview-grid" });
            let rowDiv = jQuery("<div>", { "class": "ganttview-grid-row" });
			for (let y of dates) {
				if (y === undefined)
					continue;
				for (let m of y) {
					if (m === undefined)
						continue;
					for (let d of m) {
						if (d === undefined)
							continue;
						let cellDiv = jQuery("<div>", { "class": "ganttview-grid-row-cell" });
						if (DateUtils.isWeekend(d) && showWeekends) {
							cellDiv.addClass("ganttview-weekend");
						}
						rowDiv.append(cellDiv);
					}
				}
			}
            let w = jQuery("div.ganttview-grid-row-cell", rowDiv).length * this.opts.cellWidth;
            rowDiv.css("width", w + "px");
            gridDiv.css("width", w + "px");
            for (let i = 0; i < data.length; i++) {
                for (let j = 0; j < data[i].series.length; j++) {
                    gridDiv.append(rowDiv.clone());
                }
            }
            this.slideDiv.append(gridDiv);
        }

		private addBlockContainers() {
			let data = this.opts.data;
            let blocksDiv = jQuery("<div>", { "class": "ganttview-blocks" });
            for (let i = 0; i < data.length; i++) {
                for (let j = 0; j < data[i].series.length; j++) {
                    blocksDiv.append(jQuery("<div>", { "class": "ganttview-block-container" }));
                }
            }
            this.slideDiv.append(blocksDiv);
        }

		private addBlocks() {
			let data = this.opts.data;
			let cellWidth = this.opts.cellWidth;
			let start = this.start;
            let rows = jQuery("div.ganttview-blocks div.ganttview-block-container", this.slideDiv);
            let rowIdx = 0;

            for (let i = 0; i < data.length; i++) {
                for (let j = 0; j < data[i].series.length; j++) {
					let block = $("<div>", {class: "ganttview-block"});
					block.append(jQuery("<div>", { "class": "ganttview-block-text" }).text("-"));
					let blockBody = new GanttBlock(this, block, data[i].series[j]);

					// This allows custom attributes to be added to the series data objects
					// and makes them available to the 'data' argument of click, resize, and drag handlers
					block.data("block-data", blockBody);
					blockBody.updateBlock();
                    jQuery(rows[rowIdx]).append(block);
                    rowIdx = rowIdx + 1;
                }
            }
        }

		private applyLastClass(div) {
            jQuery("div.ganttview-grid-row div.ganttview-grid-row-cell:last-child", div).addClass("last");
            jQuery("div.ganttview-hzheader-days div.ganttview-hzheader-day:last-child", div).addClass("last");
            jQuery("div.ganttview-hzheader-months div.ganttview-hzheader-month:last-child", div).addClass("last");
        }

	}

	export class GanttBlock {

		public chart: Chart;

		public block: JQuery;

		public data: GanttElement;

		constructor(chart: Chart, parts: JQuery, data: GanttElement) {
			this.chart = chart;
			this.block = parts;
			this.data = data;
		}

		public updateBlock() {
			let days = DateUtils.daysBetween(this.data.start, this.data.end) + 1;
			let offset = DateUtils.daysBetween(this.chart.start, this.data.start);
			this.block
				.prop("title", this.data.titleText ? this.data.titleText(days) : (this.data.name + ", " + days + " days"))
				.css("top", "")
				.css("left", "")
				.css("position", "relative")
				.css("width", ((days * this.chart.opts.cellWidth) - 9) + "px")
				.css("margin-left", offset * this.chart.opts.cellWidth + "px");
			if (this.data.color) {
				this.block.css("background-color", this.data.color);
			}
			this.block.find(".ganttview-block-text").html(this.data.labelHtml ? this.data.labelHtml(days) : days.toString());
		}

		public updateData() {
			let scroll = this.chart.slideDiv.scrollLeft();
			let width = this.block.outerWidth();
			let offset = this.block.offset().left - this.chart.slideDiv.offset().left - 1 + scroll;

			// Set new start date
			let newStart = DateUtils.addDays(this.chart.start, Math.round(offset / this.chart.opts.cellWidth));
			this.data.start = newStart;

			// Set new end date
			let numberOfDays = Math.round(width / this.chart.opts.cellWidth) - 1;
			this.data.end = DateUtils.addDays(newStart, numberOfDays);
		}

	}

	/**
	 * Behavior
	 */
	export class Behavior {

		private dates: Duration;

		private container: JQuery;

		private opts: JQueryGanttView.ChartOptions;

		constructor(dates: Duration, div: JQuery, opts: JQueryGanttView.ChartOptions) {
			this.dates = dates;
			this.container = div;
			this.opts = opts;
		}

		public apply() {
			let thiz = this;
			let div = this.container;
			let opts = this.opts;
			let behavior = this.opts.behavior;
			if (behavior.clickable) {
				jQuery("div", this.container).on("click", ".ganttview-block", function (e) {
					let block = jQuery(this);
					let gb = block.data("block-data") as GanttBlock;
					let accept = !behavior.onClick || !!behavior.onClick(gb, thiz, e);
				});
			}

            if (behavior.resizable) {
				jQuery("div .ganttview-block", this.container).resizable({
					grid: opts.cellWidth,
					handles: "e,w",
					// start: function (e, ui) {},
					resize: function (e, ui) {
						let block = jQuery(this);
						let gb = block.data("block-data") as GanttBlock;
						let accept = !behavior.onResizing || !!behavior.onResizing(gb, thiz, ui);
						
						if (accept) {
							// updates data from view
							gb.updateData();
						} else
							gb.updateBlock();
					},
					stop: function (e, ui) {
						let block = jQuery(this);
						let gb = block.data("block-data") as GanttBlock;
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
						let block = jQuery(this);
						let gb = block.data("block-data") as GanttBlock;
						let accept = !behavior.onDragging || !!behavior.onDragging(gb, thiz, ui);

						if (accept) {
							// update data with view
							gb.updateData();
						} else {
							// buggy
							// gb.updateBlock();
						}
					},
					stop: function (e, ui) {
						let gb = $(this).data("block-data") as GanttBlock;
						gb.updateData();
						gb.updateBlock();
					}
				});
			}
		}

	}

    export class ArrayUtils {
		public static contains<T>(arr: Array<T>, obj: T): boolean {
			let has = false;
            for (let i = 0; i < arr.length; i++) { if (arr[i] == obj) { has = true; } }
            return has;
		}
	}

    export class DateUtils {

        public static daysBetween(start: string | Date, end: string | Date): number {
            if (!start || !end) { return 0; }
			let s = start instanceof Date ? start : new Date(Date.parse(start));
			let e = end instanceof Date ? end : new Date(Date.parse(end));
			return Math.ceil(DateUtils.millisecsToDays(e.getTime() - s.getTime()));
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
			while (last < end) {
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
