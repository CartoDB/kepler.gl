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
import { Button, Input } from '../../../dist/components/common/styled-components';
// import KeplerGLSchemaManager from 'schemas/schema-manager';
import {formatCsv} from 'processors/data-processor';
import Wkt from 'wicket';

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

const StyledButton = formElement(Button);

const TYPE_MAP = {
  string: 'text',
  integer: 'numeric',
  timestamp: 'timestamp',
  real: 'real',
  geojson: 'json'
};

export default class ExportCartoModal extends Component {

  constructor(props) {
    super(props);

    this.state = {
      apiKey: localStorage.getItem('carto.token') || '',
      userName: localStorage.getItem('carto.username') || '',
      mapName: '',
      filtered: false,
      status: 'idle', // 'idle', 'uploading'
      uploading: null
    };
  }

  _onChangeApiKey = (e) => {
    const apiKey = e.target.value;

    localStorage.setItem('carto.token', apiKey);

    this.setState({
      apiKey
    });
  }

  _onChangeUserName = (e) => {
    const userName = e.target.value;

    localStorage.setItem('carto.username', userName);

    this.setState({
      userName
    });
  }

  _onChangeMapName = (e) => {
    this.setState({
      mapName: e.target.value
    });
  }

  _getCSVGeometry = (data, geojsonIndex) => {
    if (geojsonIndex === -1) {
      return null;
    }

    const { geometry } = data[geojsonIndex];

    const wkt = new Wkt.Wkt();
    wkt.read(JSON.stringify(geometry));

    return `SRID=4326;${wkt.write()}`;
  }

  _setUploadingState = (id, status) => {
    const uploadStatus = this.state.uploading[id];

    uploadStatus.status = status;

    this.setState({
      uploading: {
        ...this.state.uploading,
        [id]: uploadStatus
      }
    });
  }

  _onSave = (e) => {
    const {visState} = this.props;
    const {datasets} = visState;
    const selectedDatasets = Object.values(datasets);

    if (!selectedDatasets.length) {
      // error: selected dataset not found.
      this._closeModal();
    }

    const uploading = {};

    selectedDatasets.forEach(dataset => {
      uploading[dataset.id] = {
        id: dataset.id,
        label: dataset.label,
        status: 'uploading'
      };
    });

    this.setState({
      status: 'uploading',
      uploading
    });

    selectedDatasets.forEach(selectedData => {
      const {allData, data, fields, id} = selectedData;
      const exportData = this.state.filtered ? data : allData;
      const tableName = `kepler_${id}`;

      const fieldsWithoutGeojson = fields.filter(f => f.name !== '_geojson');

      const columns = fieldsWithoutGeojson
        .map(field => {
          if (TYPE_MAP[field.type] === undefined) {
            console.log(field.type);
          }

          return `${field.name} ${TYPE_MAP[field.type]}`;
        });

      const transactionQuery = `
        BEGIN;

        drop table if exists ${tableName};

        create table ${tableName} (
          the_geom geometry,
          ${columns.join(',\n')}
        );

        select CDB_CartodbfyTable('${this.state.userName}', '${tableName}');

        COMMIT;
      `;

      fetch(`https://roman-carto.carto.com/api/v1/sql?q=${transactionQuery}&api_key=${this.state.apiKey}`)
        .then(response => response.json())
        .then(responseData => {

          if (responseData.error) {
            this._setUploadingState(id, 'error');
            return;
          }

          const realFields = [{ name: 'the_geom', type: 'string', id: 'the_geom', tableFieldIndex: 1 }, ...fieldsWithoutGeojson];
          const geoJsonPosition = fields.findIndex(f => f.name === '_geojson');

          const query = `COPY ${tableName} (${realFields.map((field) => field.name).join(', ')}) FROM STDIN WITH (FORMAT csv, HEADER true);`;

          const realData = exportData.map((d) => {
            const csvGeom = this._getCSVGeometry(d, geoJsonPosition);
    
            if (geoJsonPosition !== -1) {
              // eslint-disable-next-line max-nested-callbacks
              const tempData = d.filter((_d, i) => i !== geoJsonPosition);
              return [csvGeom, ...tempData];
            }
    
            return [csvGeom, ...d];
          });

          const csv = formatCsv(realData, realFields);

          const file = new Blob([csv]);
    
          const xhr = new XMLHttpRequest();
          xhr.open('POST', `https://roman-carto.carto.com/api/v2/sql/copyfrom?api_key=${this.state.apiKey}&q=${query}`);

          xhr.onreadystatechange = () => {
            if (xhr.status === 200 && xhr.readyState === 4) {
              this._setUploadingState(id, 'uploaded');
            }
          }

          xhr.send(file);
        });
    });
  }

  setIdle = () => {
    this.setState({
      status: 'idle',
      uploading: null
    });
  }

  render() {
    if (this.state.status === 'uploading' && this.state.uploading !== null) {
      return (
        <div>
          <StyledHeader>Uploading to CARTO</StyledHeader>
          {
            Object.values(this.state.uploading).map((uploadingStatus) => <div key={uploadingStatus.id}>
              {uploadingStatus.label} as kepler_{uploadingStatus.id} ({uploadingStatus.status.toUpperCase()})
            </div>)
          }
          <Button
            onClick={this.setIdle}
            disabled={Object.values(this.state.uploading).some((u) => u.status === 'uploading')}>
              Done
          </Button>
        </div>
      );
    }

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
        <div>
          <StyledHeader>Save map as...</StyledHeader>
          <StyledLabel>
            Map name
            <Input type="text" value={this.state.mapName} onChange={this._onChangeMapName} />
          </StyledLabel>
        </div>
        <StyledButton onClick={this._onSave}>Save to CARTO</StyledButton>
      </div>
    );
  }
}
