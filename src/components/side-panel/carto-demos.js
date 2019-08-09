// Copyright (c) 2019 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

const demos = [
  {
    id: 'basic_style_props',
    name: 'Basic Style Properties',
    username: 'cartovl',
    dataset: 'sf_crime_2019',
    viz: `width: 2.5
color: hsv(0.7, 0.7, 1)
strokeColor: rgba(255, 255, 255, 0.5)
strokeWidth: 0.5
`,
    mapState: {
      longitude: -122.448183, 
      latitude: 37.750759,
      zoom: 11.5
    }
  },
  {
    id: 'ramps_variables_filter',
    name: 'Ramps, Filters and Variables',
    username: 'cartovl',
    dataset: 'sf_crime_2019',
    viz: `@dist: ramp($police_district,bold)

width: 2.5
color: @dist
strokeColor: transparent
filter:
$incident_category in ["Larceny Theft","Motor Vehicle Theft"] and $resolution == "Open or Active"
`,
    mapState: {
      longitude: -122.448183, 
      latitude: 37.750759,
      zoom: 11.5
    }
  },
  {
    id: 'color_top_categories',
    name: 'Color Top Categories',
    username: 'cartovl',
    dataset: 'sf_crime_2019',
    viz: `@cat: ramp(top($police_district,3),[cyan,deeppink,yellow])

width: 2.5
color: @cat
strokeColor: transparent
filter: 
$incident_category in ["Larceny Theft","Motor Vehicle Theft"] and $resolution == "Open or Active"
`,
    mapState: {
      longitude: -122.448183, 
      latitude: 37.750759,
      zoom: 11.5
    }
  },
  {
    id: 'summarize_cluster_buckets',
    name: 'Clusters and Buckets',
    username: 'cartovl',
    dataset: 'sf_crime_2019',
    viz: `@days: ["Friday","Saturday","Sunday"]
@color: [cyan,deeppink,yellow]
    
width: sqrt(clusterCount())
color: ramp(buckets(clusterMODE($incident_day_of_week),@days),@color)
strokeWidth: 0
resolution: 32
`,
    mapState: {
      longitude: -122.448183, 
      latitude: 37.750759,
      zoom: 12
    }
  },
  {
    id: 'viewport_style',
    name: 'Viewport Based Styles',
    username: 'cartovl',
    dataset: 'seattle_collisions',
    viz: `@viewport: viewportEqIntervals($personcount,7)

width: ramp(@viewport,[2,28])
color: ramp(@viewport,reverse(bluyl))
strokeWidth: 0
order: desc(width())
`,
    mapState: {
      longitude: -122.348270,
      latitude: 47.622349,
      zoom: 11
    }
  },
  {
    id: 'interpolation_zoom',
    name: 'Interpolation and Zoom Range',
    username: 'cartovl',
    dataset: 'seattle_collisions',
    viz: `@count: $personcount
    
width: ramp(zoomrange([10,12,16]),[1,@count,@count*2])
color: ramp(zoomrange([10,12]),[#5c53a5,ramp(@count,reverse(sunset))])
strokeColor: transparent
order: desc(width())
`,
    mapState: {
      longitude: -122.314732, 
      latitude: 47.622154,
      zoom: 10
    }
  },
  {
    id: 'linear_scale',
    name: 'Linear Scale',
    username: 'cartovl',
    dataset: 'sfcta_congestion_roads',
    viz: `@palette: [#00BAB9, #DED46C, #C63B66]
@lines: [1,5]
    
color: ramp(linear($auto_speed), @palette)
width: ramp(linear($auto_speed), @lines)
filter: $year >= 2017 and $period == 'AM'
`,
    mapState: {
      longitude: -122.421131,   
      latitude: 37.756982,
      zoom: 11.5
    }
  },
  {
    id: 'logarithmic_scale',
    name: 'Logarithmic Scale',
    username: 'cartovl',
    dataset: 'sfcta_congestion_roads',
    viz: `@palette: [#00BAB9, #DED46C, #C63B66]
@lines: [1,5]
    
color: ramp(linear(log($auto_speed),2,4), @palette)
width: ramp(linear(log($auto_speed),2,4),@lines)
filter: $year >= 2017 and $period == 'AM'
`,
    mapState: {
      longitude: -122.421131,   
      latitude: 37.756982,
      zoom: 11.5
    }
  },
  {
    id: 'color_normalize',
    name: 'Data Driven Color Expression',
    username: 'cartovl',
    dataset: 'county_demog',
    viz: `color: 
rgb(255,0,255)*($black_pop)/($total_pop) + 
limegreen*($hispanic_pop)/($total_pop)

strokeColor: opacity(black,0.2)
strokeWidth: 0.5
`,
    mapState: {
      longitude: -103.456792,   
      latitude: 38.012550,
      zoom: 4
    }
  },
  {
    id: 'data_normalize',
    name: 'Data Driven Normalization',
    username: 'cartovl',
    dataset: 'county_demog',
    viz: `@style: ramp($white_pop/$total_pop,ag_sunset)

color: opacity(@style,0.95)
strokeColor: @style
strokeWidth: 1
`,
    mapState: {
      longitude: -103.456792,   
      latitude: 38.012550,
      zoom: 4
    }
  },
  {
    id: 'alpha_normalize',
    name: 'Data Driven Opacity Expression',
    username: 'cartovl',
    dataset: 'table_30',
    viz: `@style: opacity(ramp(linear($sum_qpf,1,120),temps),($e_totpop/$area_sqmi)/300)

color: @style
strokeColor: @style
`,
    mapState: {
      longitude: -95.944719,    
      latitude: 30.211882,
      zoom: 6
    }
  },
  {
    id: 'manual_classification',
    name: 'Manual Classification',
    username: 'cartovl',
    dataset: 'county_demog',
    viz: `@edu: buckets($higher_ed,[30,50,70])
@color: reverse(purpor)
    
color: opacity(ramp(@edu,@color),0.95)
strokeColor: ramp(@edu,@color)
strokeWidth: 1
`,
    mapState: {
      longitude: -103.456792,   
      latitude: 38.012550,
      zoom: 4
    }
  },
  {
    id: 'animation_cumulative',
    name: 'Cumulative Animation',
    username: 'cartovl',
    dataset: 'cordoba_catastro',
    sql: 'select * from cordoba_catastro where year > 1900',
    viz: `strokeWidth: 0
color: ramp($year, ag_sunset)
filter: animation($year, 20, fade(0.1, hold))
`,
    mapState: {
      latitude: 37.87,
      longitude: -4.79,
      zoom: 12
    }
  },
  {
    id: 'animate_width',
    name: 'Feature Width Animation',
    username: 'cartovl',
    dataset: 'seattle_collisions',
    viz: ` width: ramp(linear($personcount, 2, 5), [5, 20]) * animation(linear($incdate), 20,fade(1, 1))
color: opacity(turquoise, 0.8)
strokeWidth: 0
`,
    mapState: {
      longitude: -122.314732, 
      latitude: 47.622154,
      zoom: 10
    }
  },
  {
    id: 'animation_segments',
    name: 'Segmented Line Animation',
    username: 'cartovl',
    dataset: 'locations_2018_v2',
    viz: `width: ramp($num,[2,8])
color:  ramp(linear($animating_id,-200,1800),[#00ccff,#ff00cc])
filter: animation(linear($animating_id,-200,1800),5,fade(0.1,0.5))+0.04
`,
    mapState: {
      longitude: 0.9022, 
      latitude: 32.5958,
      zoom: 2
    }
  },
  {
    id: 'animation_multivariate',
    name: 'Multivariate Animation',
    username: 'cartovl',
    dataset: 'spend_data',
    viz: `width: sqrt($amount)
color: rgba(255,255,255,0.2)
strokeColor: ramp(top($category,5),vivid)
strokeWidth: 1
filter: animation(linear($tx_date_proc,time('2012-03-01T00:00:07Z'),time('2012-03-02T23:59:57Z')),30,fade(0,0.5))
`,
    mapState: {
      longitude: 2.170892, 
      latitude: 41.386482,
      zoom: 12.5
    }
  }
];

export default demos;
