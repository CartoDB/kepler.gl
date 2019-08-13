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

import React, {Component} from 'react';
import styled from 'styled-components';
import {Input, withState} from 'kepler.gl/components';
import CartoMap from './carto-map';
import { loadCartoSample } from '../../actions';

const formElement = (element) => styled(element)`
  margin-top: 8px;
`

const StyledLabel = formElement(styled.label`
  display: block;

  input {
    display: block;
  }
`);

const StyledHeader = styled.h2`
  margin-bottom: 0;
`

const StyledErrorText = styled.p`
  color: #F44;
`

class CartoMaps extends Component {

  constructor(props) {
    super(props);

    this.state = {
      apiKey: localStorage.getItem('carto.token') || '',
      userName: localStorage.getItem('carto.username') || '',
      status: 'fetching',
      maps: []
    };
  }

  componentDidMount() {
    this._triggerSearch(0);
  }

  _timeoutId = null

  _triggerSearch(timeout = 500) {
    this.setState({
      status: 'fetching',
      error: null
    });

    clearTimeout(this._timeoutId);

    this._timeoutId = setTimeout(() => {
      this._loadMaps();
    }, timeout);
  }

  _loadMaps() {
    if (!this.state.userName || !this.state.apiKey) {
      return;
    }

    const query = `
      BEGIN;
        CREATE TABLE IF NOT EXISTS kepler_gl_maps (
          name varchar PRIMARY KEY,
          config json,
          dataset_meta json
        );

        SELECT * FROM kepler_gl_maps;
      END;
    `

    fetch(`https://${this.state.userName}.carto.com/api/v2/sql?q=${query}&api_key=${this.state.apiKey}`)
      .then(response => response.json())
      .then(response => {
        const newState = {
          status: 'idle'
        };

        if (response.error) {
          this.setState({
            ...newState,
            error: response.error[0]
          });
          
          return;
        }
        
        if (response.rows && response.rows.length > 0) {
          this.setState({
            ...newState,
            maps: response.rows
          });

          return;
        }

        this.setState(newState);
      });
  }

  _onChangeApiKey = (e) => {
    const apiKey = e.target.value;

    localStorage.setItem('carto.token', apiKey);

    this.setState({
      apiKey
    });

    this._triggerSearch(this.state.mapName);
  }

  _onChangeUserName = (e) => {
    const userName = e.target.value;

    localStorage.setItem('carto.username', userName);

    this.setState({
      userName
    });

    this._triggerSearch(this.state.mapName);
  }

  _onMapDelete = (mapName) => {
    const map = this.state.maps.find((m) => m.name === mapName);

    // Read datasets and delete them?

    console.log('Deleting map', mapName, map);
  }

  _onMapLoad = (mapName) => {
    const map = this.state.maps.find((m) => m.name === mapName);

    // Find datasets from the map config, merge and fire appropriate events.

    console.log('Loading map', mapName, map);

    this.props.onLoadCartoSample(map.config);
  }

  _renderMaps() {
    if (this.state.error) {
      return <StyledErrorText>{this.state.error}</StyledErrorText>
    }

    return this.state.maps.length === 0 ? 'No maps :(' : this.state.maps.map((map) => (
      <CartoMap key={map.name} name={map.name} onDelete={this._onMapDelete} onLoad={this._onMapLoad} />
    ));
  }

  render() {
    return (
      <div>
        <div>
          <StyledHeader>CARTO credentials</StyledHeader>
          <StyledLabel>
            CARTO Api Key
            <Input type="text" value={this.state.apiKey} onChange={this._onChangeApiKey} />
          </StyledLabel>
          <StyledLabel>
            CARTO Username
            <Input type="text" value={this.state.userName} onChange={this._onChangeUserName} />
          </StyledLabel>
        </div>
        {
          (this.state.apiKey.length === 0 || this.state.userName.length === 0)
          ? null
          : <div>
              <StyledHeader>kepler.gl maps saved in CARTO</StyledHeader>
              {
                this.state.status === 'fetching' 
                  ? 'Loading' 
                  : this._renderMaps()
              }
            </div>
        }
      </div>);
  }
}

const CartoMapsWithState = withState(
  [],
  state => ({...state.demo.app}),
  {
    onLoadCartoSample: loadCartoSample
  }
)(CartoMaps);

export default CartoMapsWithState;
