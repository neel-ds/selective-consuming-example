import React, { useEffect, useRef, useState } from 'react';

import { useEventListener, useHuddle01 } from '@huddle01/react';
import { useDisplayName } from '@huddle01/react/app-utils';
import { Audio, Video } from '@huddle01/react/components';
import {
  useAudio,
  useLobby,
  useMeetingMachine,
  usePeers,
  useRoom,
  useVideo,
} from '@huddle01/react/hooks';

import Input from '@/components/Input';

import Button from '../components/Button';

type THuddleState = {
  projectId: string;
  accessToken: string;
  roomId: string;
  userName: string;
};

const App = () => {
  // Local States
  const [huddleStates, setHuddleStates] = useState<THuddleState>({
    projectId: '',
    accessToken: '',
    roomId: '',
    userName: 'guestUser',
  });

  const { accessToken, userName, projectId, roomId } = huddleStates;
  // refs
  const videoRef = useRef<HTMLVideoElement>(null);

  const { state, send } = useMeetingMachine();

  const { initialize } = useHuddle01();
  const { joinLobby } = useLobby();
  const {
    fetchAudioStream,
    produceAudio,
    stopAudioStream,
    stopProducingAudio,
    stream: micStream,
    createMicConsumer,
    closeMicConsumer,
  } = useAudio();
  const {
    fetchVideoStream,
    produceVideo,
    stopVideoStream,
    stopProducingVideo,
    stream: camStream,
    createCamConsumer,
    closeCamConsumer,
  } = useVideo();
  const { joinRoom, leaveRoom } = useRoom();

  // Event Listner
  useEventListener('lobby:cam-on', () => {
    if (camStream && videoRef.current) videoRef.current.srcObject = camStream;
  });

  const { peers, peerIds } = usePeers();

  const { setDisplayName, error: displayNameError } = useDisplayName();

  useEventListener('room:joined', () => {
    console.log('room:joined');
  });
  useEventListener('lobby:joined', () => {
    console.log('lobby:joined');
  });

  // Func
  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setHuddleStates({ ...huddleStates, [name]: value });
  };

  const [selectedMicPeers, updateSelectedMicPeers] = useState<Set<String>>(
    new Set()
  );

  const [selectedCamPeers, updateSelectedCamPeers] = useState<Set<String>>(
    new Set()
  );

  useEffect(() => {
    if (projectId) {
      initialize(projectId);
    }
  }, [projectId]);

  return (
    <div className="grid grid-cols-2 min-h-screen p-4">
      <div className="">
        <h1 className="text-6xl font-bold">Lumos Example App</h1>

        <Input
          name="projectId"
          placeholder="Your Project Id"
          value={projectId}
          onChange={handleOnChange}
        />

        <br />

        <h2 className="text-3xl text-red-500 font-extrabold">Initialized</h2>
        <div className="flex flex-col w-1/2 gap-2">
          <div className="flex items-center">
            <Input
              name="roomId"
              value={roomId}
              onChange={handleOnChange}
              placeholder="Your Room Id"
            />
            <Input
              name="accessToken"
              placeholder="Your Access Token (optional)"
              value={accessToken}
              onChange={handleOnChange}
            />
          </div>
          <Button
            disabled={!joinLobby.isCallable}
            onClick={() => {
              if (accessToken) joinLobby(roomId, accessToken);
              else joinLobby(roomId);
            }}
          >
            JOIN_LOBBY
          </Button>
        </div>
        <br />

        <h2 className="text-3xl text-yellow-500 font-extrabold">Lobby</h2>
        <div className="flex gap-4 flex-wrap">
          <Input
            name="userName"
            value={userName}
            onChange={handleOnChange}
            placeholder="Your Display Name"
          />
          <Button
            disabled={!setDisplayName.isCallable}
            onClick={() => {
              setDisplayName(userName);
            }}
          >
            {`SET_DISPLAY_NAME error: ${displayNameError}`}
          </Button>
          <Button
            disabled={!fetchVideoStream.isCallable}
            onClick={fetchVideoStream}
          >
            FETCH_VIDEO_STREAM
          </Button>

          <Button
            disabled={!fetchAudioStream.isCallable}
            onClick={fetchAudioStream}
          >
            FETCH_AUDIO_STREAM
          </Button>

          <Button disabled={!joinRoom.isCallable} onClick={joinRoom}>
            JOIN_ROOM
          </Button>

          <Button
            disabled={!state.matches('Initialized.JoinedLobby')}
            onClick={() => send('LEAVE_LOBBY')}
          >
            LEAVE_LOBBY
          </Button>

          <Button
            disabled={!stopVideoStream.isCallable}
            onClick={stopVideoStream}
          >
            STOP_VIDEO_STREAM
          </Button>
          <Button
            disabled={!stopAudioStream.isCallable}
            onClick={stopAudioStream}
          >
            STOP_AUDIO_STREAM
          </Button>
        </div>
        <br />
        <h2 className="text-3xl text-green-600 font-extrabold">Room</h2>
        <div className="flex gap-4 flex-wrap">
          <Button disabled={!leaveRoom.isCallable} onClick={leaveRoom}>
            LEAVE_ROOM
          </Button>
        </div>
      </div>

      <div>
        <div className="flex gap-2">
          <div>
            Me Video:
            <video ref={videoRef} muted autoPlay />
          </div>
          <div className="w-full">
            <div>Enable Produce</div>
            <div className="border border-white p-2 rounded-md h-fit">
              {state.matches('Initialized.JoinedRoom.Mic.Unmuted') ? (
                <Button
                  disabled={!produceAudio.isCallable}
                  style={{ marginRight: '1rem' }}
                  onClick={() =>
                    produceAudio(
                      micStream,
                      Array.from(selectedMicPeers) as string[]
                    )
                  }
                >
                  PRODUCE_MIC
                </Button>
              ) : (
                <Button
                  disabled={!stopProducingAudio.isCallable}
                  onClick={() => stopProducingAudio()}
                  style={{ marginRight: '1rem' }}
                >
                  STOP_PRODUCING_MIC
                </Button>
              )}

              {state.matches('Initialized.JoinedRoom.Cam.On') ? (
                <Button
                  disabled={!produceVideo.isCallable}
                  onClick={() =>
                    produceVideo(
                      camStream,
                      Array.from(selectedCamPeers) as string[]
                    )
                  }
                >
                  PRODUCE_CAM
                </Button>
              ) : (
                <Button
                  disabled={!stopProducingVideo.isCallable}
                  onClick={() => stopProducingVideo()}
                >
                  STOP_PRODUCING_CAM
                </Button>
              )}
              {peerIds.map(peerId => {
                const peer = peers[peerId];

                return (
                  <div key={peer.peerId} className="flex items-center gap-4">
                    <span>
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedMicPeers.has(peer.peerId)}
                          onClick={() => {
                            if (selectedMicPeers.has(peer.peerId)) {
                              selectedMicPeers.delete(peer.peerId);
                            } else {
                              selectedMicPeers.add(peer.peerId);
                            }
                            updateSelectedMicPeers(new Set(selectedMicPeers));
                          }}
                        />
                        Video
                      </label>
                    </span>
                    <span>
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedCamPeers.has(peer.peerId)}
                          onClick={() => {
                            if (selectedCamPeers.has(peer.peerId)) {
                              selectedCamPeers.delete(peer.peerId);
                            } else {
                              selectedCamPeers.add(peer.peerId);
                            }
                            updateSelectedCamPeers(new Set(selectedCamPeers));
                          }}
                        />
                        Audio
                      </label>
                    </span>
                    <span>{peer.peerId}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div>Peers:</div>
          <div className="flex">
            <div className="w-1/2">
              {Object.values(peers)
                .filter(peer => peer.cam)
                .map(peer => (
                  <div className="grid grid-cols-2 gap-2 mt-5 h-1/2">
                    role: {peer.displayName}
                    <Video
                      key={peer.peerId}
                      peerId={peer.peerId}
                      track={peer.cam}
                      debug
                    />
                  </div>
                ))}
              {Object.values(peers)
                .filter(peer => peer.mic)
                .map(peer => (
                  <Audio
                    key={peer.peerId}
                    peerId={peer.peerId}
                    track={peer.mic}
                  />
                ))}
            </div>
            <div className="w-1/2">
              {Object.values(peers).map(peer => (
                <div className="grid grid-cols-2 gap-2 mt-5 ml-5 h-1/2">
                  <label>
                    <input
                      type="checkbox"
                      value={`${peer.peerId} video`}
                      checked={peer.cam?.enabled}
                      className="mr-2"
                      onClick={() => {
                        if (peer.cam?.enabled) {
                          closeCamConsumer(peer.peerId);
                        } else {
                          createCamConsumer(peer.peerId);
                        }
                      }}
                    />
                    Consume Video
                  </label>
                  <br />
                  <label>
                    <input
                      type="checkbox"
                      value={`${peer.peerId} audio`}
                      checked={peer.mic?.enabled}
                      className="mr-2"
                      onClick={() => {
                        if (peer.mic?.enabled) {
                          closeMicConsumer(peer.peerId);
                        } else {
                          createMicConsumer(peer.peerId);
                        }
                      }}
                    />
                    Consume Audio
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
