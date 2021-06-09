import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";

const ChatView = () => {
  const serverUrl = "http://localhost:5000";
  let url = window.location.href;
  url = url.split("/chat/");
  const [room] = useState(url[1]);
  const [uid] = useState(uuidv4());
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const inputRef = useRef();

  const addMessage = (msg) => {
    setMessages((prev) => {
      return [...prev, msg];
    });
  };

  useEffect(() => {
    setSocket(io(serverUrl));
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("connect", () => {
        console.log(`connected to socket: ${socket.id}`);
        if (room) {
          socket.volatile.emit("conversation:join", room);
        }
      });

      socket.on("message", (payload) => {
        addMessage(payload);
      });

      socket.on("disconnect", () => {
        console.log("disconnected");
      });

      socket.on("connect_error", (err) => {
        if (err.message === "xhr poll error") {
          setTimeout(() => {
            console.log("connecting again");
            socket.connect();
          }, 1000);
        }
      });
    }
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [room, socket]);

  useEffect(() => {
    if (room) {
      fetch(`serverUrlchat?convId=${room}`)
        .then((res) => res.json())
        .then((response) => {
          setMessages(response);
        });
    }
  }, [room]);

  return (
    <div>
      <div style={{ textAlign: "left", width: "100%" }}>
        {messages.map((msg, ind) => (
          <pre key={ind}>{JSON.stringify(msg, null, 2)}</pre>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          let payload = {
            message: inputRef.current.value,
            timestamp: Date.now(),
            room,
            uid,
          };
          socket.emit("message:create", payload);
          inputRef.current.value = "";
        }}
      >
        <input ref={inputRef} type="text" />
        <button>Send</button>
      </form>
    </div>
  );
};

export default ChatView;
