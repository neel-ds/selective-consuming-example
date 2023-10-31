import { useRoom } from "@huddle01/react/hooks";
import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import {
  useAudio,
  useEventListener,
  useHuddle01,
  usePeers,
  useVideo,
} from "@huddle01/react/hooks";
import { useAppUtils } from "@huddle01/react/app-utils";
import clsx from "clsx";
import { useMeetPersistStore } from "@/store/meet";
import AudioElem from "@/components/Audio";
import { BasicIcons } from "@/components/BasicIcons";
import VideoElem from "@/components/Video";
import Image from "next/image";

type IRoleEnum =
  | "host"
  | "coHost"
  | "moderator"
  | "speaker"
  | "listener"
  | "peer";

interface IPeer {
  peerId: string;
  role: IRoleEnum;
  mic: MediaStreamTrack | null;
  cam: MediaStreamTrack | null;
  displayName: string;
  avatarUrl: string;
}

interface roomData {
  roomId: string | null;
  partner: string | null;
}

const Home = () => {
  const { isRoomJoined } = useRoom();
  const { push, query } = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { leaveRoom } = useRoom();
  const {
    produceAudio,
    stopProducingAudio,
    stream: micStream,
    fetchAudioStream,
    stopAudioStream,
  } = useAudio();
  const {
    produceVideo,
    stopProducingVideo,
    stream: camStream,
    fetchVideoStream,
    stopVideoStream,
  } = useVideo();
  const {
    isMicMuted,
    isCamOff,
    toggleMicMuted,
    toggleCamOff,
    videoDevice,
    audioInputDevice,
  } = useMeetPersistStore();
  const { peers } = usePeers();
  const { me } = useHuddle01();
  const { changeAvatarUrl, setDisplayName } = useAppUtils();

  const avatarUrl = useMeetPersistStore((state) => state.avatarUrl);
  const displayUserName = useMeetPersistStore((state) => state.displayName);

  useEffect(() => {
    if (!isRoomJoined && query.roomId) {
      push(`/${query.roomId}/lobby`);
      return;
    }
  }, [query.roomId, isRoomJoined]);

  useEventListener("app:cam-on", async () => {
    toggleCamOff(false);
    produceVideo(camStream);
  });

  useEventListener("app:cam-off", async () => {
    toggleCamOff(true);
    stopProducingVideo();
  });

  useEventListener("app:mic-on", async () => {
    toggleMicMuted(false);
    if (micStream) {
      produceAudio(micStream);
    }
  });

  useEventListener("app:mic-off", async () => {
    toggleMicMuted(true);
    stopProducingAudio();
  });

  useEventListener("room:peer-left", () => {
    window.location.href = "/";
  });

  useEffect(() => {
    if (camStream && videoRef.current) {
      videoRef.current.srcObject = camStream;
      produceVideo(camStream);
    }
  }, [camStream]);

  useEffect(() => {
    console.log("isCamOff", isCamOff);
    if (!isCamOff) {
      fetchVideoStream(videoDevice.deviceId);
    }
  }, [isCamOff]);

  useEffect(() => {
    console.log("isCamOff", isCamOff);
    if (!isMicMuted) {
      fetchAudioStream(audioInputDevice.deviceId);
    }
  }, [isMicMuted]);

  useEffect(() => {
    if (micStream) {
      toggleMicMuted(false);
      produceAudio(micStream);
    }
  }, [micStream]);

  useEffect(() => {
    if (!isCamOff) {
      stopVideoStream();
      fetchVideoStream(videoDevice.deviceId);
    }
  }, [videoDevice]);

  useEffect(() => {
    if (!isMicMuted) {
      stopAudioStream();
      fetchAudioStream(audioInputDevice.deviceId);
    }
  }, [audioInputDevice]);

  useEffect(() => {
    if (changeAvatarUrl.isCallable && avatarUrl && isRoomJoined) {
      changeAvatarUrl(avatarUrl);
    }
  }, [changeAvatarUrl.isCallable, isRoomJoined]);

  useEffect(() => {
    if (setDisplayName.isCallable && displayUserName) {
      setDisplayName(displayUserName);
    }
  }, [setDisplayName.isCallable]);

  useEventListener("room:me-left", () => {
    push(`/`);
  });

  return (
    <>
      <div className="my-5 flex h-[75vh] items-center justify-center self-stretch">
        <div className="flex h-full grid-cols-2 items-center justify-center gap-10 rounded-lg ">
          <div
            className={clsx(
              Object.values(peers).length === 0
                ? "my-5 h-full w-[60vw]"
                : "h-[60vh] w-[40vw]",
              "bg-gray-900",
              "relative flex flex-shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-transparent"
            )}
          >
            {!isCamOff ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                className="h-full w-full rounded-lg object-cover -scaleY-100"
              />
            ) : (
              <div className="h-full w-full flex flex-col justify-center items-center">
                <Image
                  src="/4.png"
                  loader={({ src }) => src}
                  unoptimized
                  width={100}
                  height={100}
                  alt="avatar"
                  className="mb-16 mt-16 h-32 w-32 rounded-full"
                />
              </div>
            )}
            <div className="bg-black text-slate-100 absolute bottom-1 left-1 rounded-md py-1 px-2 font-lg flex gap-2">
              {me.displayName ?? "Me"}
              {BasicIcons.ping}
            </div>
          </div>

          {Object.values(peers).map(
            ({ cam, peerId, mic, displayName, avatarUrl }) => (
              <div
                key={peerId}
                className="relative flex h-[60vh] w-[40vw] flex-shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-transparent"
              >
                {cam ? (
                  <VideoElem track={cam} key={peerId} />
                ) : (
                  <div className="h-full w-full flex flex-col justify-center items-center">
                    <Image
                      key={peerId}
                      src={avatarUrl}
                      loader={({ src }) => src}
                      width={100}
                      height={100}
                      alt="avatar"
                      className="mb-16 mt-16 h-32 w-32 rounded-full"
                    />
                  </div>
                )}
                {mic && <AudioElem track={mic} key={peerId} />}
                <div className="bg-black text-slate-100 absolute bottom-1 left-1 rounded-md py-1 px-2 font-lg flex gap-2">
                  {displayName ?? "Guest"}
                  {BasicIcons.ping}
                </div>
              </div>
            )
          )}
        </div>
      </div>
      <div className="flex items-center justify-center self-stretch">
        <div className="flex w-full flex-row items-center justify-center gap-8">
          {isCamOff ? (
            <button
              type="button"
              onClick={() => {
                fetchVideoStream(videoDevice.deviceId);
              }}
              className="bg-brand-500 hover:bg-white/20 flex h-10 w-10 items-center justify-center rounded-xl"
            >
              {BasicIcons.inactive["cam"]}
            </button>
          ) : (
            <button
              type="button"
              onClick={stopVideoStream}
              className={clsx(
                "flex h-10 w-10 items-center bg-gray-800 hover:bg-white/20 justify-center rounded-xl"
              )}
            >
              {BasicIcons.active["cam"]}
            </button>
          )}
          {isMicMuted ? (
            <button
              type="button"
              onClick={() => {
                fetchAudioStream(audioInputDevice.deviceId);
              }}
              className="bg-brand-500 hover:bg-white/20 flex h-10 w-10 items-center justify-center rounded-xl"
            >
              {BasicIcons.inactive["mic"]}
            </button>
          ) : (
            <button
              type="button"
              onClick={stopAudioStream}
              className={clsx(
                "flex h-10 w-10 items-center bg-gray-800 hover:bg-white/20 justify-center rounded-xl"
              )}
            >
              {BasicIcons.active["mic"]}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              leaveRoom();
              window.close();
            }}
            className="bg-red-500 hover:bg-red-500/50 flex h-10 w-10 items-center justify-center rounded-xl"
          >
            {BasicIcons.close}
          </button>
        </div>
      </div>
    </>
  );
};

export default Home;
