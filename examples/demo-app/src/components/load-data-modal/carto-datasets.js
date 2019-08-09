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
import CartoHandler from '../../utils/cloud-providers/carto';
import CartoDataset from './carto-dataset';

export default class CartoDatasets extends Component {

  constructor(props) {
    super(props);

    this.state = {
      authToken: localStorage.getItem('carto.token'),
      userInfoUrl: localStorage.getItem('carto.user_info_url'),
      userInfo: null,
      datasets: [{
        name: 'world_borders'
      },{
        name: 'ne_50m_rivers_lake_centerlines'
      },{
        name: 'ne_10m_airports'
      },{
        name: 'cool_places'
      }]
    };
  }

  componentWillMount() {
    this.fetchUserInfo();
  }

  componentDidUpdate() {
    // Fetch carto datasets
  }

  login = () => {
    CartoHandler.handleLogin(() => {
      const authToken = localStorage.getItem('carto.token');
      const userInfoUrl = localStorage.getItem('carto.user_info_url');

      this.setState({
        authToken
      });

      fetch(`${userInfoUrl}?api_key=${authToken}`)
        .then(response => response.json())
        .then(userInfo => {
          this.setState({
            userInfo
          });

          this.fetchUserInfo();
        })
    });
  }

  selectDataset = dataUrl => {
    this.props.onLoadRemoteMap({
      dataUrl
    });
  }

  fetchUserInfo() {
    if (!this.state.authToken || !this.state.userInfoUrl) {
      return;
    }

    const { authToken, userInfoUrl } = this.state;

    fetch(`${userInfoUrl}?api_key=${authToken}`)
      .then(response => response.json())
      .then(userInfo => {
        this.setState({
          userInfo
        });
      });
  }

  render() {
    if (!this.state.authToken) {
      return <button onClick={this.login}>Login with CARTO</button>;
    }

    if (this.state.datasets) {
      return this.state.datasets.map(
        (dataset) => <CartoDataset key={dataset.name} id={dataset.name} onClick={this.selectDataset} />
      );
    }

    if (this.state.userInfo) {
      return <pre>
        {JSON.stringify(this.state.userInfo)}
      </pre>
    }

    return 'Loading';
  }
}
