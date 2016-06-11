import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import Video from '../components/Video'
import Audio from '../components/Audio'
import {
  Client,
  DeviceSource,
  Auth,
  webRtcReady,
  MediaSwitcher,
  MediaBroadcaster,
} from '@cct/libcct'

const AUTH_OPTS = {
  serverUrl: 'http://192.168.99.100:8008',
}

const HQ_CONSTRAINTS = {
  video: {
    width: {ideal: 640},
    height: {ideal: 360},
    frameRate: {ideal: 20},
  },
}

const LQ_CONSTRAINTS = {
  video: {
    width: {ideal: 160},
    height: {ideal: 90},
    frameRate: {max: 10},
  },
}

const AUDIO_CONSTRAINTS = {
  audio: true,
}

const MEDIA_SWITCHER = 'meet_switcher'
const VIDEO_BROADCASTER = 'meet_broadcaster_video'
const AUDIO_BROADCASTER = 'meet_broadcaster_audio'

class RoomPage extends Component {
  constructor (props) {
    super(props)
    this.handleVideoBroadcastSource = this.handleVideoBroadcastSource.bind(this)
    this.handleAudioBroadcastSource = this.handleAudioBroadcastSource.bind(this)
    this.state = {
      switcher: {},
      videoBroadcasters: [],
      audioBroadcasters: [],
    }
    this.client = new Client()
  }

  componentWillMount () {
    let roomName = this.props.params.roomName
    const client = this.client
    webRtcReady()
    .then(() => Auth.anonymous(AUTH_OPTS))
    .then(client.auth)
    .then(() => client.fetchRoomByAlias(roomName))
    .then(room => room.join())
    .catch(() => client.createRoom({
      name: roomName,
      joinRule: 'open',
      alias: roomName,
    }))
    .then(room => {
      const hdCamera = this.hdCamera = new DeviceSource(HQ_CONSTRAINTS)
      const conference = this.conference =  room.startConferenceCall()
      const switcher = new MediaSwitcher()
      switcher.source = hdCamera
      conference.attach(MEDIA_SWITCHER, switcher)
      this.setState({switcher})

      const sdCamera = this.sdCamera = new DeviceSource(LQ_CONSTRAINTS)
      const videoBroadcaster = this.videoBroadcaster = new MediaBroadcaster()
      videoBroadcaster.source = sdCamera
      videoBroadcaster.on('remoteSource', this.handleVideoBroadcastSource)
      conference.attach(VIDEO_BROADCASTER, videoBroadcaster)

      const microphone = this.microphone = new DeviceSource(AUDIO_CONSTRAINTS)
      const audioBroadcaster = this.audioBroadcaster = new MediaBroadcaster()
      audioBroadcaster.source = microphone
      audioBroadcaster.on('remoteSource', this.handleAudioBroadcastSource)
      conference.attach(AUDIO_BROADCASTER, audioBroadcaster)
    })
  }

  componentWillUnmount () {
    this.videoBroadcaster.off('remoteSource', this.handleVideoBroadcastSource)
    this.hdCamera.stop()
    this.sdCamera.stop()
    this.microphone.stop()
    this.conference.detach(MEDIA_SWITCHER)
    this.conference.detach(VIDEO_BROADCASTER)
    this.conference.detach(AUDIO_BROADCASTER)
    this.conference.leave()
    this.client.logout()
  }

  handleVideoBroadcastSource ({source, peer}) {
    source.on('stream', stream => {
      let videoBroadcasters = this.state.videoBroadcasters
      .filter(bc => bc.peer !== peer)

      if (stream !== null) videoBroadcasters.push({source, peer})
      this.setState({videoBroadcasters})
    })
  }

  handleAudioBroadcastSource ({source, peer}) {
    source.on('stream', stream => {
      let audioBroadcasters = this.state.audioBroadcasters
      .filter(bc => bc.peer !== peer)

      if (stream !== null) audioBroadcasters.push({source, peer})
      this.setState({audioBroadcasters})
    })
  }

  render () {
    const {switcher, videoBroadcasters, audioBroadcasters} = this.state
    return (
      <div className="roomPage">
        <div className="mainVideoContainer">
          <Video source={switcher}/>
        </div>
        {videoBroadcasters.length < 2 ? null :
          <div className="thumbnailContainer">
          {videoBroadcasters.map(({source, peer}) => (
            <Video key={peer} source={source}/>
          ))}
          </div>
        }
        {audioBroadcasters.map(({source, peer}) => (
          <Audio key={peer} source={source}/>
        ))}
      </div>
    )
  }
}

RoomPage.propTypes = {
  params: PropTypes.object,
  switchSource: PropTypes.object,
  videoBroadcastSources: PropTypes.arrayOf(PropTypes.object),
}

const mapStateToProps = (state) => {
  const {switchSource, videoBroadcastSources} = state
  return {
    switchSource,
    videoBroadcastSources,
  }
}

export default connect(mapStateToProps)(RoomPage)
