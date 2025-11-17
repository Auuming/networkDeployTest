import { useState } from "react";
import ThemeToggle from "./ThemeToggle";

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
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-10 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-800 relative">
        <div className="absolute top-5 right-5">
          <ThemeToggle />
        </div>
        <h1 className="text-center text-[#00C300] dark:text-[#00E676] text-4xl font-semibold mb-2">
          💬 Linenai Wongman
        </h1>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8 text-sm">
          Connect to start chatting
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="name"
              className="font-medium text-gray-700 dark:text-gray-300 text-sm"
            >
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
              className="p-3 border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-base focus:outline-none focus:border-[#00C300] dark:focus:border-[#00E676] focus:bg-white dark:focus:bg-gray-800 transition-colors placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="age"
              className="font-medium text-gray-700 dark:text-gray-300 text-sm"
            >
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
              className="p-3 border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-base focus:outline-none focus:border-[#00C300] dark:focus:border-[#00E676] focus:bg-white dark:focus:bg-gray-800 transition-colors placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="serverUrl"
              className="font-medium text-gray-700 dark:text-gray-300 text-sm"
            >
              Server URL
            </label>
            <input
              id="serverUrl"
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder={
                window.location.protocol === "https:"
                  ? "https://your-server.railway.app"
                  : "https://appealing-joy-production-1d2e.up.railway.app/"
              }
              required
              className="p-3 border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-base focus:outline-none focus:border-[#00C300] dark:focus:border-[#00E676] focus:bg-white dark:focus:bg-gray-800 transition-colors placeholder-gray-400 dark:placeholder-gray-500"
            />
            <small className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
              {window.location.protocol === "https:"
                ? "Enter your Railway server URL (must use https://)"
                : ""}
            </small>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg border border-red-200 dark:border-red-800 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="bg-[#00C300] dark:bg-gray-700 text-white border-none py-3.5 rounded-lg text-base font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#00C300]/50 dark:hover:shadow-gray-700/50 active:translate-y-0"
          >
            Connect to Server
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginScreen;
