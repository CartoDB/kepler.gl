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
import KeplerGlSchema from 'schemas';
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

const StyledErrorText = styled.p`
  color: #F44;
`

const StyledButton = formElement(Button);

const TYPE_MAP = {
  string: 'text',
  integer: 'numeric',
  timestamp: 'timestamp',
  boolean: 'boolean',
  real: 'real',
  geojson: 'json'
};

const UploadStatus = styled(({ id, label, status, error }) => (
  <div>
    <div>
      {
        id === 'map'
          ? `Map config (${status.toUpperCase()})`
          : `Dataset ${label} as kepler_${id} (${status.toUpperCase()})`
      }
    </div>
    
    <StyledErrorText>{ error }</StyledErrorText>
  </div>
))`
    margin: 8px 0;
`

export default class ExportCartoModal extends Component {

  constructor(props) {
    super(props);

    this.state = {
      apiKey: localStorage.getItem('carto.token') || '',
      userName: localStorage.getItem('carto.username') || '',
      mapName: '',
      filtered: false,
      status: 'idle', // 'fetching', 'idle', 'uploading'
      mapUploading: null,
      uploading: null,
      error: null
    };
  }

  _timeoutId = null

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

  _onChangeMapName = (e) => {
    this.setState({
      mapName: e.target.value
    });

    this._triggerSearch(e.target.value);
  }

  _triggerSearch = (mapName) => {
    this.setState({
      status: 'fetching',
      error: null
    });

    clearTimeout(this._timeoutId);

    this._timeoutId = setTimeout(() => {
      this._checkMapExists(mapName);
    }, 500)
  }

  _checkMapExists = (mapName) => {
    if (!this.state.userName || !this.state.apiKey || mapName.length === 0) {
      return;
    }

    const query = `
      BEGIN;
        CREATE TABLE IF NOT EXISTS kepler_gl_maps (
          name varchar PRIMARY KEY,
          config json,
          dataset_meta json
        );

        SELECT * FROM kepler_gl_maps where name='${mapName}';
      COMMIT;
    `

    fetch(`https://${this.state.userName}.carto.com/api/v2/sql?q=${query}&api_key=${this.state.apiKey}`)
      .then(response => response.json())
      .then(response => {
        const newState = {
          status: 'idle'
        };

        if (response.rows && response.rows.length > 0) {
          this.setState({
            ...newState,
            error: 'Map already exists'
          });

          return;
        }

        if (response.error) {
          this.setState({
            ...newState,
            error: response.error[0]
          });
          
          return;
        }

        this.setState(newState);
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

  _saveMap = (meta) => {
    // It's not this props, it's { visState, mapState, mapStyle }
    const config = KeplerGlSchema.getConfigToSave(this.props);
    const metaData = { data: meta };

    const transactionQuery = `
      BEGIN;
        CREATE TABLE IF NOT EXISTS kepler_gl_maps (
          name varchar PRIMARY KEY,
          config json,
          dataset_meta json
        );

        INSERT INTO kepler_gl_maps (name, config, dataset_meta)
        VALUES ('${this.state.mapName}', '${JSON.stringify(config)}', '${JSON.stringify(metaData)}');
      COMMIT;
    `;

    const formData = new FormData();
    formData.append('q', transactionQuery);

    this.setState({
      mapUploading: {
        id: 'map',
        label: 'Map Config',
        status: 'uploading',
        error: null
      }
    });

    fetch(`https://${this.state.userName}.carto.com/api/v2/sql?api_key=${this.state.apiKey}`, {
      method: 'POST',
      body: formData
    })
      .then(response => response.json())
      .then(response => {

        if (response.error) {
          this.setState({
            mapUploading: {
              ...this.state.mapUploading,
              status: 'error',
              error: response.detail
            }
          });

          return;
        }

        this.setState({
          mapUploading: {
            ...this.state.mapUploading,
            status: 'uploaded'
          }
        });
      });
  }

  _onSave = () => {
    if (!this.state.mapName) {
      return;
    }

    // TODO: Move this into _saveDatasets
    const {visState} = this.props;
    const {datasets} = visState;
    const selectedDatasets = Object.values(datasets);

    if (!selectedDatasets.length) {
      // error: selected dataset not found.
      this.setState({
        error: 'Please add some data to your map before uploading to CARTO'
      });

      return;
    }

    const uploading = {};

    selectedDatasets.forEach(dataset => {
      uploading[dataset.id] = {
        id: dataset.id,
        label: dataset.label,
        status: 'uploading',
        error: null
      };
    });

    this.setState({
      status: 'uploading',
      uploading
    });

    const datasets_meta = [];

    selectedDatasets.forEach(selectedData => {
      const {allData, data, fields, id} = selectedData;
      const exportData = this.state.filtered ? data : allData;
      const tableName = `kepler_${id}`;

      const fieldsWithoutGeojson = fields.filter(f => f.name !== '_geojson');
      datasets_meta.push({
        name: `kepler_${id}`,
        format: fieldsWithoutGeojson.length === fields.length ? 'csv' : 'geojson'
      });

      const columns = fieldsWithoutGeojson
        .map(field => {
          if (TYPE_MAP[field.type] === undefined) {
            // eslint-disable-next-line no-console
            console.error('Unknown field type:', field.type);
          }

          return `"${field.name}" ${TYPE_MAP[field.type]}`;
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

      fetch(`https://${this.state.userName}.carto.com/api/v1/sql?q=${transactionQuery}&api_key=${this.state.apiKey}`)
        .then(response => response.json())
        .then(responseData => {

          if (responseData.error) {
            this._setUploadingState(id, 'error');
            return;
          }

          const realFields = [
            { name: 'the_geom', type: 'string', id: 'the_geom', tableFieldIndex: 1 }, 
            ...fieldsWithoutGeojson.filter((field) => field.name !== 'the_geom')
          ];
          const geoJsonPosition = fields.findIndex(f => f.name === '_geojson');

          const query = `COPY ${tableName} (${realFields.map((field) => `"${field.name}"`).join(', ')}) FROM STDIN WITH (FORMAT csv, HEADER true);`;

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
          xhr.open('POST', `https://${this.state.userName}.carto.com/api/v2/sql/copyfrom?api_key=${this.state.apiKey}&q=${query}`);

          xhr.onreadystatechange = () => {
            if (xhr.status === 200 && xhr.readyState === 4) {
              this._setUploadingState(id, 'uploaded');
            }
          }

          xhr.send(file);
        });
    });

    this._saveMap(datasets_meta);
  }

  _onClickDone = () => {
    if (this.state.error) {
      return this.setIdle();
    }

    this.props.closeModal();
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
            <UploadStatus 
              id={this.state.mapUploading.id}
              label={this.state.mapUploading.label}
              status={this.state.mapUploading.status}
              error={this.state.mapUploading.error}
            />
          }
          {
            Object.values(this.state.uploading).map(
              (uploadingStatus) => <UploadStatus
                key={uploadingStatus.id}
                id={uploadingStatus.id}
                label={uploadingStatus.label}
                status={uploadingStatus.status}
                error={uploadingStatus.error}
              />
            )
          }
          <Button
            onClick={this._onClickDone}
            disabled={Object.values(this.state.uploading).some((u) => u.status === 'uploading')}>
              OK
          </Button>
        </div>
      );
    }

    const disableUpload = this.state.mapName.length === 0 ||
      this.state.status === 'fetching' ||
      this.state.error !== null ||
      this.state.userName.length === 0 ||
      this.state.apiKey.length === 0;

    return (
      <div>
        <div>
          <StyledHeader>Save map as...</StyledHeader>
          <StyledLabel>
            Map name
            <Input type="text" value={this.state.mapName} onChange={this._onChangeMapName} />
          </StyledLabel>
        </div>
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
        <StyledButton
          onClick={this._onSave}
          disabled={disableUpload}>
            Save to CARTO
        </StyledButton>
        <StyledErrorText>{this.state.error}</StyledErrorText>
      </div>
    );
  }
}
