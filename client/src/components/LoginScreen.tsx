import { useState } from "react";

interface LoginScreenProps {
  onLogin: (name: string, age: number, serverUrl: string) => void;
  serverUrl: string;
  error: string;
}

function LoginScreen({
  onLogin,
  serverUrl: initialServerUrl,
  error,
}: LoginScreenProps) {
  const [name, setName] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [serverUrl, setServerUrl] = useState<string>(initialServerUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ageNum = Number.parseInt(age, 10);
    if (Number.isNaN(ageNum) || ageNum < 1 || ageNum > 150) {
      return;
    }
    onLogin(name, ageNum, serverUrl);
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-5">
      <div className="bg-gray-900 rounded-2xl p-10 max-w-md w-full shadow-2xl border border-gray-800">
        <h1 className="text-center text-primary text-4xl font-semibold mb-2">
          💬 Linenai Wongman
        </h1>
        <p className="text-center text-gray-400 mb-8 text-sm">
          Connect to start chatting
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="font-medium text-gray-300 text-sm">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your unique name"
              autoFocus
              required
              className="p-3 border-2 border-gray-700 bg-gray-800 text-white rounded-lg text-base focus:outline-none focus:border-[#87BAC3] focus:bg-[#D6F4ED] focus:text-gray-900 transition-colors placeholder-gray-500"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="age" className="font-medium text-gray-300 text-sm">
              Your Age
            </label>
            <input
              id="age"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Enter your age"
              min="1"
              max="150"
              required
              className="p-3 border-2 border-gray-700 bg-gray-800 text-white rounded-lg text-base focus:outline-none focus:border-[#87BAC3] focus:bg-[#D6F4ED] focus:text-gray-900 transition-colors placeholder-gray-500"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="serverUrl"
              className="font-medium text-gray-300 text-sm"
            >
              Server URL
            </label>
            <input
              id="serverUrl"
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="http://localhost:3001"
              required
              className="p-3 border-2 border-gray-700 bg-gray-800 text-white rounded-lg text-base focus:outline-none focus:border-[#87BAC3] focus:bg-[#D6F4ED] focus:text-gray-900 transition-colors placeholder-gray-500"
            />
            <small className="text-gray-400 text-xs leading-relaxed">
              Use your computer's IP address for network access
              <br />
              Example: http://192.168.1.100:3001
            </small>
          </div>

          {error && (
            <div className="bg-red-900/30 text-red-400 p-3 rounded-lg border border-red-800 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            style={{
              background: "linear-gradient(to right, #473472, #53629E)",
            }}
            className="text-white border-none py-3.5 rounded-lg text-base font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#473472]/50 active:translate-y-0"
          >
            Connect to Server
          </button>
        </form>

        <div className="mt-8 p-5 bg-gray-800 rounded-lg border border-gray-700">
          <h3 className="text-gray-200 mb-3 text-base font-semibold">
            📋 Features
          </h3>
          <ul className="list-none p-0">
            <li className="text-gray-400 py-1.5 pl-5 relative text-sm before:content-['✓'] before:absolute before:left-0 before:text-primary before:font-bold">
              Private messaging between clients
            </li>
            <li className="text-gray-600 py-1.5 pl-5 relative text-sm before:content-['✓'] before:absolute before:left-0 before:text-primary before:font-bold">
              Create and join group chats
            </li>
            <li className="text-gray-600 py-1.5 pl-5 relative text-sm before:content-['✓'] before:absolute before:left-0 before:text-primary before:font-bold">
              See all connected clients
            </li>
            <li className="text-gray-600 py-1.5 pl-5 relative text-sm before:content-['✓'] before:absolute before:left-0 before:text-primary before:font-bold">
              Real-time message updates
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;
