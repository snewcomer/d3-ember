/* global Tether */
import Ember from 'ember';
import { select } from 'd3-selection';
import { scaleLinear, scaleBand } from 'd3-scale';
import 'd3-transition';

export default Ember.Component.extend({
  'on-click': null,
  highlightedLabel: Ember.computed.or('selectedLabel', 'hoveredLabel'),
  tooltipTarget: Ember.computed('didRenderChart', 'highlightedLabel', function() {
    return select(this.$('svg')[0]).selectAll('rect')
      .filter(data => data.label === this.get('highlightedLabel'))
      .node();
  }),
  didInsertElement() {
    // separate static from dynamic part
    this.set('yScale', scaleLinear().range([0, 100]));
    this.set('xScale', scaleBand().range([0, 100]).paddingInner(0.12));
    this.set('colorScale', scaleLinear().range(['#bbdefb', '#2196f3'])); //domain - min max values of dataet, range of y scale is how tall it should be

    this.renderChart();
    this.set('didRenderChart', true);
  },

  didUpdateAttrs() {
    this.renderChart();
  },

  renderChart() {
    let data = this.get('data').sortBy('label');

    let dataCounts = data.map(data => data.count);

    // static parts - never changes even if data changes

    this.get('colorScale').domain([0, Math.max(...dataCounts)]);
    this.get('yScale').domain([0, Math.max(...dataCounts)]);
    this.get('xScale').domain(data.map(data => data.label));

    // let xScale = scaleBand()
    //   .domain(data.map(data => data.label))
    //   .range([0, 100])
    //   .paddingInner(0.12);

    const svg = select(this.$('svg')[0]);

    // dynamic
    // setup d3 data join
    let barsUpdate = svg.selectAll('rect').data(data, data => data.label); //.data has default for update...append returns d3 data baound selection
    // for new bars, append rect to dom
    let barsEnter = barsUpdate.enter()
      .append('rect').
      attr('opacity', 0); // call enter on update subselection
    let barsExit = barsUpdate.exit(); // call enter on update subselection

    let rafId;
    barsEnter
      .merge(barsUpdate) // merge existing bars
      .transition() // turn selection into a transition.  Selections have same methods as transition
      .attr('width', `${this.get('xScale').bandwidth()}%`)
      .attr('height', (data) => `${this.get('yScale')(data.count)}%`)
      .attr('x', data => `${this.get('xScale')(data.label)}%`)
      .attr('y', data => `${100 - this.get('yScale')(data.count)}%`)
      .attr('fill', data => this.get('colorScale')(data.count))
      .attr('opacity', data => {
        let selected = this.get('selectedLabel');

        return (selected && data.label !== selected) ? '0.5': '1.0';
      })
      .on('start', (data, index) => { // to make sure tether moves smoothly
        if (index === 0) {
          (function updateTether() {
            Tether.position();
            rafId = requestAnimationFrame(updateTether);
          })();
        }
      })
      .on('end interrupt', (data, index) => {
        if (index === 0) {
          cancelAnimationFrame(rafId);
        }
      })


    // remove bars corresponding to exiting data in DOM
    barsExit
      .transition()
      .attr('opacity', 0)
      .remove()

    // event handlers on initial render
    barsEnter.on('mouseover', (data) => {
      this.set('hoveredLabel', data.label);
    })
    .on('mouseout', () => {
      this.set('hoveredLabel', null);
    })
    .on('click', (data) => {
      let clickedLabel = data.label;

      if (this.get('on-click')) {
        this.get('on-click')(clickedLabel);
      } else {
        if (clickedLabel === this.get('selectedLabel')) {
          this.set('selectedLabel', '');
        } else {
          this.set('selectedLabel', clickedLabel);
        }

        this.renderChart();
      }

    });

  }
});
