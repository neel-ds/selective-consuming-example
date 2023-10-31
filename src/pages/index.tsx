import IntroPage from "@/components/IntroPage";
import { useEffect, useState } from "react";

interface RoomDetails {
  message: string;
  data: {
    roomId: string;
  };
}

export default function Home() {
  const [roomId, setRoomId] = useState<string | null>(null);

  const createRandomRoom = async () => {
    const res = await fetch("https://api.huddle01.com/api/v1/create-room", {
      method: "POST",
      body: JSON.stringify({
        title: "Test Room",
      }),
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.NEXT_PUBLIC_API_KEY ?? "",
      },
      cache: "no-store",
    });
    const data: RoomDetails = await res.json();
    const { roomId: RoomID } = data.data;
    setRoomId(RoomID);
  };

  useEffect(() => {
    createRandomRoom();
  }, []);

  return <>{roomId && <IntroPage roomId={roomId} />}</>;
}