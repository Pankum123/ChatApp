
import { FiPhone, FiVideo } from "react-icons/fi";
import { useCallContext } from "../context/CallContext";

const CallButtons = ({ receiverId }) => {
  const { call, startCall } = useCallContext();

  const isCallActive = call !== null;

  const handleAudioCall = () => {
    if (!receiverId || isCallActive) return;

    startCall(receiverId, "audio");
  };

  const handleVideoCall = () => {
    if (!receiverId || isCallActive) return;

    startCall(receiverId, "video");
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleAudioCall}
        disabled={isCallActive}
        title="Audio Call"
        className="btn btn-ghost btn-circle text-green-400 hover:bg-green-500/20 disabled:opacity-40"
      >
        <FiPhone size={21} />
      </button>

      <button
        type="button"
        onClick={handleVideoCall}
        disabled={isCallActive}
        title="Video Call"
        className="btn btn-ghost btn-circle text-blue-400 hover:bg-blue-500/20 disabled:opacity-40"
      >
        <FiVideo size={23} />
      </button>
    </div>
  );
};

export default CallButtons;
