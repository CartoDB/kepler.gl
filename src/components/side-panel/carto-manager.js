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

import React, { Component } from 'react';
import styled from 'styled-components';
import {Input} from '../../components/common/styled-components';
import ItemSelector from '../../components/common/item-selector/item-selector';
import demos from './carto-demos';

const FormElement = (component) => styled(component)`
  width: 100%;
  margin-top: 16px;
`;

const VizArea = FormElement(styled.textarea`
  ${props => props.theme.input}
  resize: vertical;
  transition: none;
  height: auto;
`);

const StyledInput = FormElement(Input);

const ErrorText = styled.p`
  color: red;
  font-weight: bold;
`

export default class CartoManager extends Component {

  constructor(props) {
    super(props);

    this.state = { 
      demo: null,
      error: null
    };
  }

  onSelectExample = (demo) => {
    this.props.updateMap(demo.mapState);

    this.updateDemo(demo);
    this.reloadDemo(demo);
  }

  _changeUsername = (e) => {
    const demo = this.state.demo;
    demo.username = e.target.value;
    
    this.updateDemo(demo);
    this.reloadDemo(demo);
  }

  _changeApiKey = (e) => {
    const demo = this.state.demo;
    demo.apiKey = e.target.value;
    
    this.updateDemo(demo);
    this.reloadDemo(demo);
  }

  _changeDataset = (e) => {
    const demo = this.state.demo;
    demo.dataset = e.target.value;
    
    this.updateDemo(demo);
    this.reloadDemo(demo);
  }

  _changeSQL = (e) => {
    const demo = this.state.demo;
    demo.sql = e.target.value;
    
    this.updateDemo(demo);
    this.reloadDemo(demo);
  }

  _changeViz = (e) => {
    const demo = this.state.demo;
    demo.viz = e.target.value;
    
    this.updateDemo(demo);
    this.blendViz(demo.viz);
  }

  updateDemo(demo) {
    this.setState({ demo });
  }

  reloadDemo(demo) {
    if (!demo.username || !(demo.dataset || demo.sql)) {
      return;
    }

    window.loadCartoVLMap(demo);
  }

  blendViz(viz) {
    window.blendNewViz(viz).then(() => {
      this.setState({
        error: null
      });
    })
    .catch((error) => {
      this.setState({
        ...this.state,
        error: JSON.stringify(error)
      });
    });
  }

  _getForm() {
    return (<div>
      <StyledInput type='text' onChange={this._changeUsername} placeholder='CARTO username' value={this.state.demo.username || ''} />
      <StyledInput type='text' onChange={this._changeApiKey} placeholder='API key (defaults to default_public)' value={this.state.demo.apiKey || ''} />
      <StyledInput type='text' onChange={this._changeDataset} placeholder='Dataset' value={this.state.demo.dataset || ''} />
      <StyledInput type='text' onChange={this._changeSQL} placeholder='SQL query (overrides dataset)' value={this.state.demo.sql || ''} />
      <VizArea
        spellcheck="false"
        rows='10'
        onChange={this._changeViz}
        placeholder='Viz string' value={this.state.demo.viz || ''}>
      </VizArea>
    </div>)
  }

  render() {
    const selectBoxCool = (
      <ItemSelector
        multiSelect={false}
        options={demos}
        displayOption={'name'}
        getOptionValue={(demo) => demo}
        filterOption={'name'}
        placeholder='Select an example'
        onChange={this.onSelectExample}
        selectedItems={this.state.demo === null ? null : this.state.demo}
      >
      </ItemSelector>
    )

    const form = !this.state.demo ? null : this._getForm();

    return (<div>
      {selectBoxCool}
      {form}
      {this.state.error && <ErrorText>
        {this.state.error.name}:{this.state.error.type}
      </ErrorText>}
    </div>)
  }
}
