/// <reference path="../ts/jquery.d.ts" />
/// <reference path="../ts/jqueryui.d.ts" />
declare type jQueryGanttViewMethods = "setSlideWidth";
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
declare namespace JQueryGanttView {
    /**
     * named object
     */
    interface Named {
        /**
         * display name of the instance
         */
        name: string;
    }
    /**
     * timed object
     */
    interface Duration {
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
    interface ChartOptions {
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
            clickable?: boolean;
            /**
             * allow to fire "onDrag" event if this is true.
             * this option is also allow to change a date of GanttElement by user interaction
             */
            draggable?: boolean;
            /**
             * allow to fire "onResize" event if thi is true.
             * this option is also allow to change a date of GanttElement by user interaction
             */
            resizable?: boolean;
            /**
             * event handler for click event
             *
             * @see clickable
             */
            onClick?: jQueryGanttEventHandler<Behavior, JQueryEventObject, boolean>;
            /**
             * event handler for dragging event
             *
             * @see draggable
             */
            onDragging?: jQueryGanttEventHandler<Behavior, JQueryUI.DraggableEventUIParams, boolean>;
            /**
             * event handler for resize event
             */
            onResizing?: jQueryGanttEventHandler<Behavior, JQueryUI.ResizableUIParams, boolean>;
        };
    }
    /**
     * represents groups of GanttElement
     */
    interface GanttGroup extends Named {
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
    interface GanttElement extends Named, Duration {
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
    class SimpleDataElement implements GanttElement {
        name: string;
        originStart: Date;
        originEnd: Date;
        start: Date;
        end: Date;
        color: string;
        constructor(name: string, start: Date, end: Date, color?: string);
        moveStartTo(date: Date): void;
        addOffset(offset: number): void;
    }
    /**
     * typedef of Array<Array<Array<Date>>>. which is used for grouping year-month-day tuple to Date instances.
     */
    type DateMatrix = Array<Array<Array<Date>>>;
    /**
     * Chart
     */
    class Chart implements Duration {
        static monthNames: string[];
        private div;
        slideDiv: JQuery;
        opts: JQueryGanttView.ChartOptions;
        start: Date;
        end: Date;
        constructor(div: JQuery, opts: JQueryGanttView.ChartOptions);
        render(): void;
        private addVtHeader();
        private addHzHeader(dates);
        private addGrid(dates);
        private addBlockContainers();
        private addBlocks();
        private applyLastClass(div);
    }
    class GanttBlock {
        chart: Chart;
        block: JQuery;
        data: GanttElement;
        constructor(chart: Chart, parts: JQuery, data: GanttElement);
        updateBlock(): void;
        updateData(): void;
    }
    /**
     * Behavior
     */
    class Behavior {
        private dates;
        private container;
        private opts;
        constructor(dates: Duration, div: JQuery, opts: JQueryGanttView.ChartOptions);
        apply(): void;
    }
    class ArrayUtils {
        static contains<T>(arr: Array<T>, obj: T): boolean;
    }
    class DateUtils {
        static daysBetween(start: string | Date, end: string | Date): number;
        static isWeekend(date: Date): boolean;
        static getBoundaryDatesFromData(data: JQueryGanttView.GanttGroup[], minDays: number): [Date, Date];
        static addDays(date: Date, days: number): Date;
        static getDates(start: Date, end: Date): DateMatrix;
        static daysToMillisecs(days: number): number;
        static millisecsToDays(millisecs: number): number;
    }
}
