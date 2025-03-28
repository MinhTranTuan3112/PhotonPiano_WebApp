import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { API_PROGRESS_URL } from "~/lib/utils/constants";

const useProgressTracking = (userId: string) => {
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");

  useEffect(() => {
    if (!userId)
    {
      return;
    }
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_PROGRESS_URL}?firebaseId=${userId}`) // Change to your API URL
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => {
        console.info('[Progress] Connection started');
      })
      .catch((err) => console.error("Progress connection error:", err));

    connection.on("ReceiveProgress", (progressValue, progressMessage) => {
      console.log("Receive something : ",progress,progressMessage)
      setProgress(progressValue);
      setProgressMessage(progressMessage);
    });

    return () => {
      connection.stop();
      console.log("Progress connection stopped")
    };
  }, [userId]);

  return { progress, progressMessage };
};

export default useProgressTracking;