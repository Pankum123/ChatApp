import ParticipantCard from "./ParticipantCard";

const ParticipantGrid = ({
  participants,
  currentUserId,
  localStream,
  remoteStreams,
  callType,
}) => {
  return (
    <div className="grid max-h-[62vh] grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
      {participants.map((participant) => {
        const isLocal = participant.userId === currentUserId;

        return (
          <ParticipantCard
            key={participant.userId}
            participant={participant}
            stream={isLocal ? localStream : remoteStreams[participant.userId]}
            callType={callType}
            isLocal={isLocal}
          />
        );
      })}
    </div>
  );
};

export default ParticipantGrid;
