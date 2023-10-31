import {
  useAudio,
  useEventListener,
  useHuddle01,
  usePeers,
  useRoom,
  useVideo,
} from "@huddle01/react/hooks";
import clsx from "clsx";
import type { FC } from "react";
import { useEffect, useRef } from "react";
import { useMeetPersistStore } from "@/store/meet";
import { useUpdateEffect } from "usehooks-ts";
import { useRouter } from "next/navigation";
import AudioElem from "./Audio";
import { BasicIcons } from "./BasicIcons";
import VideoElem from "./Video";
import Image from "next/image";

const Meet: FC = () => {
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

  const { push } = useRouter();

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

  useUpdateEffect(() => {
    if (!isCamOff) {
      stopVideoStream();
      fetchVideoStream(videoDevice.deviceId);
    }
  }, [videoDevice]);

  useUpdateEffect(() => {
    if (!isMicMuted) {
      stopAudioStream();
      fetchAudioStream(audioInputDevice.deviceId);
    }
  }, [audioInputDevice]);

  useEventListener("room:me-left", () => {
    push(`/`);
  });

  return (
    <>
      <div className="my-10 flex h-[80vh] items-center justify-center self-stretch">
        <div className="flex h-full grid-cols-2 items-center justify-center gap-10 rounded-lg ">
          <div
            className={clsx(
              Object.values(peers).length === 0
                ? "my-10 h-full w-[60vw]"
                : "h-[50vh] w-[40vw]",
              "bg-gray-900",
              "relative flex flex-shrink-0 items-center justify-center rounded-lg"
            )}
          >
            {!isCamOff ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                className="h-full w-full rounded-lg object-cover"
                style={{ transform: "rotateY(180deg)" }}
              />
            ) : (
              <Image
                src={
                  me.avatarUrl ? `${me.avatarUrl}` : `/icons/default-avatar.svg`
                }
                width={100}
                height={100}
                alt="avatar"
                className="mb-16 mt-16 h-32 w-32 rounded-full"
              />
            )}
            <div
              className={clsx(
                "bg-gray-900 text-slate-100",
                "absolute bottom-1 left-1 rounded-lg p-1"
              )}
            >
              {me.displayName ?? "Me"}
            </div>
          </div>

          {Object.values(peers).map(
            ({ cam, peerId, mic, displayName, avatarUrl }) => (
              <div
                key={peerId}
                className={clsx(
                  "relative flex h-[50vh] w-[40vw] bg-gray-900 flex-shrink-0 items-center justify-center rounded-lg"
                )}
              >
                {cam ? (
                  <VideoElem track={cam} key={peerId} />
                ) : (
                  <Image
                    key={peerId}
                    src={"/icons/default-avatar.svg"}
                    width={100}
                    height={100}
                    alt="avatar"
                    className="mb-16 mt-16 h-32 w-32 rounded-full"
                  />
                )}
                {mic && <AudioElem track={mic} key={peerId} />}
                <div
                  className={clsx(
                    "bg-gray-900 text-slate-100",
                    "absolute bottom-1 left-1 rounded-lg p-1"
                  )}
                >
                  {displayName ?? "Me"}
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
              onClick={() => {
                fetchVideoStream(videoDevice.deviceId);
              }}
              className="bg-brand-500 flex h-10 w-10 items-center justify-center rounded-xl"
            >
              {BasicIcons.inactive["cam"]}
            </button>
          ) : (
            <button
              onClick={stopVideoStream}
              className={clsx(
                "flex h-10 w-10 items-center bg-gray-900 justify-center rounded-xl"
              )}
            >
              {BasicIcons.active["cam"]}
            </button>
          )}
          {isMicMuted ? (
            <button
              onClick={() => {
                fetchAudioStream(audioInputDevice.deviceId);
              }}
              className="bg-brand-500 flex h-10 w-10 items-center justify-center rounded-xl"
            >
              {BasicIcons.inactive["mic"]}
            </button>
          ) : (
            <button
              onClick={stopAudioStream}
              className={clsx(
                "flex h-10 w-10 items-center bg-gray-900 justify-center rounded-xl"
              )}
            >
              {BasicIcons.active["mic"]}
            </button>
          )}
          <button
            onClick={() => {
              leaveRoom();
              window.close();
            }}
            className="bg-brand-500 flex h-10 w-10 items-center justify-center rounded-xl"
          >
            {BasicIcons.close}
          </button>
        </div>
      </div>
    </>
  );
};

export default Meet;
