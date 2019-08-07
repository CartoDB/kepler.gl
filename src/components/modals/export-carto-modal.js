import React, { Component } from 'react';
import styled from 'styled-components';
import { Button, Input } from '../../../dist/components/common/styled-components';

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

export default class ExportCartoModal extends Component {

  constructor(props) {
    super(props);

    this.state = {
      apiKey: localStorage.getItem('carto.token') || '',
      userName: localStorage.getItem('carto.username') || '',
      mapName: ''
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
        <div>
          <StyledHeader>Save map as...</StyledHeader>
          <StyledLabel>
            Map name
            <Input type="text" value={this.state.mapName} onChange={this._onChangeMapName} />
          </StyledLabel>
        </div>
        <StyledButton>Save to CARTO</StyledButton>
      </div>
    );
  }
}
