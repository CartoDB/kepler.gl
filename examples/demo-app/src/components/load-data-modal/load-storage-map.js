// Copyright (c) 2020 Uber Technologies, Inc.
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

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import moment from 'moment';
import {Icons, LoadingSpinner} from 'kepler.gl/components';
import {getCloudProvider, getCloudProviders} from '../../cloud-providers';
import ProviderTile from './provider-tile';

const StyledProviderSection = styled.div`
  display: flex;
`;

const StyledSpinner = styled.div`
  text-align: center;
  span {
    margin: 0 auto;
  }
`;

const StyledVisualizationSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
`;

const StyledBackBtn = styled.a`
  font-size: 12px;
  line-height: 14px;
  margin-bottom: 16px;
  color: #3A414C;
  cursor: pointer;

  &:hover {
    font-weight: 500;
  }
`;

const StyledProviderVisSection = styled.div`
  flex: 1 1 auto;
  background-color: #F8F8F9;
  padding: 20px 24px;

  .title {
    font-size: 14px;
    line-height: 16px;
    font-weight: 500;
    margin-bottom: 16px;

    span {
      text-transform: uppercase;
    }
  }
`;

const StyledSeparator = styled.hr`
  border: solid #BFBFBF;
  border-width: 0 0 1px 0;
  margin-bottom: 16px;
`;

const StyledVisualizationList = styled.div`
  display: flex;
  flex-flow: row wrap;
  align-items: stretch;
  justify-content: space-between;
`;

const StyledVisualizationItem = styled.div`
  flex: 0 0 auto;
  width: 208px;
  display: flex;
  flex-direction: column;
  padding: 16px 8px;
  color: #3A414C;
  cursor: pointer;
  font-size: 12px;
  line-height: 18px;

  &:hover {
    .vis_item-icon, .vis_item-thumb, .vis_item-description, .vis_item-modification-date {
      opacity: 1;
    }
  }

  .vis_item-icon, .vis_item-thumb, .vis_item-description, .vis_item-modification-date {
    opacity: .9;
    transition: opacity .4s ease;
  }

  .vis_item-icon {
    flex: 0 0 108px;
    background-color: #6A7484;
    border-radius: 4px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
  }

  .vis_item-thumb {
    flex: 0 0 108px;
    background-size: cover;
    background-position: center;
    border-radius: 4px; 
  }

  .vis_item-title {
    margin-top: 16px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .vis_item-description {
    flex: 1 1 auto;
    margin-top: 8px;
  }

  .vis_item-modification-date {
    margin-top: 16px;
    flex: 1 0 auto;
    color: #6A7484;
    line-height: 15px;
  }
`;

const MapIcon = (props) => {
  return (
    <div {...props}>
      <Icons.IconWrapper height="32px" viewBox={"0 0 16 16"}>
        <path fill="#d3d8d6" d="m13.6 11.572-3.2 2.1336v-9.2776l3.2-2.1336zm-12-7.144 3.2-2.1336v9.2776l-3.2 2.1336zm13.244 8.2376c0.2224-0.148 0.356-0.3984 0.356-0.6656v-11.2c0-0.2952-0.1624-0.5664-0.4224-0.7048-0.26-0.14-0.576-0.1248-0.8216 0.0392l-4.3128 2.876-3.5432-2.8352c-0.1208-0.0936-0.2952-0.1624-0.472-0.1688-0.1648-0.0064-0.348 0.0464-0.472 0.128l-4.8 3.2c-0.2224 0.1488-0.356 0.3984-0.356 0.6656v11.2c0 0.2952 0.1624 0.5664 0.4224 0.7056 0.1184 0.0632 0.248 0.0944 0.3776 0.0944 0.1552 0 0.3096-0.0448 0.444-0.1344l4.3128-2.876 3.5432 2.8352c0.1448 0.116 0.3216 0.1752 0.5 0.1752 0.1184 0 0.236-0.0248 0.3464-0.0784z"/>
      </Icons.IconWrapper>
    </div>
  );
}

const VisualizationItem = ({vis, onClick}) => {
  return (
    <StyledVisualizationItem onClick={onClick}>
      {
        vis.thumbnail
        ? (<div className="vis_item-thumb" style={{backgroundImage: `url(${vis.thumbnail})`}}></div>)
        : (<MapIcon className="vis_item-icon" />)
      }
      <span className="vis_item-title">{vis.title}</span>
      {
      <span className="vis_item-description">
          {vis.description && vis.description.length ? vis.description : ''}
          <span className="vis_item-privacy"> ({vis.privateMap ? 'Private' : 'Public'})</span>
      </span>
      }
      <span className="vis_item-modification-date">Last modified {moment.utc( vis.lastModification).fromNow()}</span>
    </StyledVisualizationItem>
  );
};

export const StyledError = styled.div`
  color: red;
`;

export const StyledErrorDescription = styled.div`
  font-size: 14px;
`;

const Error = ({error}) => (
  <StyledError>
    <StyledErrorDescription>Error loading map: {error.message}</StyledErrorDescription>
  </StyledError>
);

const LoadStorageMap = ({onLoadCloudMap, error}) => {
  const [visualizations, setVisualizations] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);

  const providers = getCloudProviders();

  const selectProvider = (provider) => {
    if (!!provider.getAccessToken()) {
      updateSelectedProvider(provider.name);
    } else {
      provider.login(updateSelectedProvider);
    }
  }

  const updateSelectedProvider = (providerName) => {
    if (providerName) {
      setSelectedProvider(providerName);
      getVisualizations(providerName);
    } else {
      setSelectedProvider(null);
      setVisualizations(null);
    }
  }

  const getVisualizations = async (providerName) => {
    if (providerName) {
      const cloudProvider = getCloudProvider(providerName);
      const visualizations = await cloudProvider.getVisualizations();
      setVisualizations(visualizations);
    }
  };

  return (
    <div>
      {!selectedProvider && (<StyledProviderSection>
        {providers.map(provider => (
          provider.hasPrivateStorage() &&
          <ProviderTile
            key={provider.name}
            Icon={provider.icon}
            isConnected={() => !!provider.getAccessToken()}
            onConnect={() => {selectProvider(provider)}}
            onLogout={() => {provider.logout(updateSelectedProvider)}}
          />
        ))}
      </StyledProviderSection>)}
      {selectedProvider && !visualizations &&
        (<StyledSpinner>
          <LoadingSpinner />
        </StyledSpinner>)
      }
      {selectedProvider && visualizations &&
        (<StyledVisualizationSection>
          <StyledBackBtn onClick={() => updateSelectedProvider()}>
            <Icons.ArrowLeft
              viewBox="0 0 18 18"
              height="14px"
              style={{marginRight: '8px'}}/>
            Back
          </StyledBackBtn>
          <StyledProviderVisSection>
            <span className="title"><span>{selectedProvider}</span> Storage / Maps</span>
            <StyledSeparator/>
            <StyledVisualizationList>
              {visualizations.map(vis => (
                <VisualizationItem
                  key={vis.id}
                  onClick={() => {
                    onLoadCloudMap(vis.loadParams, selectedProvider, true);
                  }}
                  vis={vis}>
                </VisualizationItem>
              ))}
            </StyledVisualizationList>
          </StyledProviderVisSection>
        </StyledVisualizationSection>)}
        {error && (<Error error={error} />)}
    </div>
  );
};

export default LoadStorageMap;
