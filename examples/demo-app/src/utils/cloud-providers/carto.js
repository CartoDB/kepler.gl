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

const name = 'carto';
import DropboxIcon from '../../components/icons/dropbox-icon';

const carto = {};

/**
 * This method will handle the oauth flow by performing the following steps:
 * - Opening a new window
 * - Subscribe to message channel
 * - Receive the token when ready
 * - Close the opened tab
 */
function handleLogin(onCloudLoginSuccess) {
  const scopes = ['user:profile', 'datasets:rw:carto_kepler_gl_maps'];
  const link = `https://carto.com/oauth2/authorize?client_id=${carto.client_id}&response_type=token&state=0&scope=${scopes.join(' ')}&redirect_uri=https://localhost:8080/auth`;
  const authWindow = window.open(link, '_blank', 'width=1024,height=716');
  const handleToken = e => {
    // TODO: add security step to validate which domain the message is coming from
    authWindow.close();
    window.removeEventListener('message', handleToken);
    if (window.localStorage) {
      window.localStorage.setItem('carto.token', e.data.access_token);
      window.localStorage.setItem('carto.user_info_url', e.data.user_info_url)
    }
    onCloudLoginSuccess();
  };
  window.addEventListener('message', handleToken);
}

function setAuthToken (token) {
  carto.client_id = token;
}

function getAccessTokenFromLocation (location) {
  const params = new URLSearchParams(location.hash.substr(1))

  return {
    access_token: params.get('access_token'),
    user_info_url: params.get('user_info_url')
  };
}

// All cloud-providers providers must implement the following properties
export default {
  name,
  getAccessToken: () => console.log('getAccessToken'),
  getAccessTokenFromLocation,
  handleLogin,
  icon: DropboxIcon,
  setAuthToken,
  uploadFile: () => console.log('uploadFil')
};
