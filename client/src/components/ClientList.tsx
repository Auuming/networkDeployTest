import { Client } from "../types";

interface ClientListProps {
  clients: Client[];
  currentClientId: string;
  onSelectClient: (client: Client) => void;
}

function ClientList({
  clients,
  currentClientId,
  onSelectClient,
}: ClientListProps) {
  return (
    <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex-shrink-0 max-h-[50%] overflow-y-auto bg-white dark:bg-gray-900">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-200">
          Online Users
        </h2>
        <span className="bg-[#00C300] dark:bg-gray-700 text-white px-2.5 py-1 rounded-xl text-xs font-semibold">
          {clients.length}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {clients.length === 0 ? (
          <div className="text-center text-gray-400 dark:text-gray-500 py-5 text-sm">
            No clients connected
          </div>
        ) : (
          clients.map((client) => (
            <div
              key={client.socketId}
              className={`flex items-center gap-3 p-2.5 md:p-3 rounded-lg cursor-pointer transition-colors border ${
                client.socketId === currentClientId
                  ? "bg-[#E8F5E9] dark:bg-gray-800 cursor-default border-[#00C300] dark:border-gray-700 text-gray-900 dark:text-gray-100"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800 border-transparent hover:border-gray-200 dark:hover:border-gray-700"
              }`}
              onClick={() =>
                client.socketId !== currentClientId && onSelectClient(client)
              }
            >
              <div
                style={{
                  background: "#00C300",
                }}
                className="w-10 h-10 md:w-11 md:h-11 rounded-full text-white flex items-center justify-center font-semibold text-base md:text-lg flex-shrink-0"
              >
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className={`font-medium text-sm md:text-base whitespace-nowrap overflow-hidden text-ellipsis ${
                    client.socketId === currentClientId
                      ? "text-gray-900 dark:text-gray-100"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {client.name}
                  {client.socketId === currentClientId && (
                    <span className="text-[#00C300] dark:text-[#00E676] text-xs md:text-sm font-semibold ml-1">
                      {" "}
                      (You)
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ClientList;
