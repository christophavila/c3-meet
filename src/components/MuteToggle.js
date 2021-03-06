/*
Copyright 2016 Ericsson AB.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React, {Component, PropTypes} from 'react'

const MuteToggle = class extends Component {
  constructor(props) {
    super(props)
    this.state = {muted: false}
  }
  componentWillMount() {
    this._updateSource(this.props.source, this.state.muted)
  }
  componentWillUpdate(props, state) {
    this._updateSource(props.source, state.muted)
  }
  _updateSource(source, muted) {
    if (source) {
      source.mute.audio = muted
    }
  }
  render() {
    return (
      <button className='muteToggle' onClick={() => this.setState({muted: !this.state.muted})}>
        {this.state.muted ? 'Unmute' : 'Mute'}
      </button>
    )
  }
}

MuteToggle.propTypes = {
  source: PropTypes.object,
}

export default MuteToggle
