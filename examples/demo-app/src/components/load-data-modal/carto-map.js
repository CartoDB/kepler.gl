import React, {Component} from 'react';
import styled from 'styled-components';
import { Button } from '../../../../../dist/components/common/styled-components';

const MapWrapper = styled.div`
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  margin-bottom: 8px;
`;

const StyledButton = styled(Button)`
  margin-left: 8px;

  &:hover ~ span {
    text-decoration: underline;
  }
`

const MapName = styled.span`
  cursor: pointer;
  flex: 1;

  &:hover {
    text-decoration: underline;
  }
`

export default class CartoMap extends Component {

  _onDelete = (e) => {
    this.props.onDelete(this.props.name);
  }

  _onLoad = (e) => {
    this.props.onLoad(this.props.name);
  }

  render() {
    const { name } = this.props;

    return (<MapWrapper>
      <StyledButton small negative onClick={this._onDelete}>X</StyledButton>
      <MapName onClick={this._onLoad}>{name}</MapName>
    </MapWrapper>
    )
  }
}
