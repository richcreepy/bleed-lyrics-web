import { useEffect, useState } from "react";
import SpotifyWebApi from "spotify-web-api-js";

const spotifyApi = new SpotifyWebApi();

export default function Home() {
  const [token, setToken] = useState("");
  const [nowPlaying, setNowPlaying] = useState(null);
  const [lyrics, setLyrics] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    // Extract token from URL hash after Spotify login redirect
    if (!token) {
      const hash = window.location.hash;
      if (hash) {
        const tokenFromUrl = hash
          .substring(1)
          .split("&")
          .find((elem) => elem.startsWith("access_token"))
          ?.split("=")[1];
        if (tokenFromUrl) {
          setToken(tokenFromUrl);
          spotifyApi.setAccessToken(tokenFromUrl);
          window.history.pushState({}, null, "/"); // remove token from URL
        }
      }
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    // Poll currently playing track every 5 seconds
    const interval = setInterval(async () => {
      try {
        const playback = await spotifyApi.getMyCurrentPlaybackState();
        if (playback && playback.item) {
          const current = playback.item;
          if (!nowPlaying || nowPlaying.id !== current.id) {
            setNowPlaying(current);
            fetchLyrics(current);
          }
        } else {
          setNowPlaying(null);
          setLyrics("");
        }
      } catch (e) {
        setNowPlaying(null);
        setLyrics("");
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [token, nowPlaying]);

  async function fetchLyrics(track) {
    setSearching(true);
    try {
      const query = `${track.artists[0].name} ${track.name}`;
      const searchRes = await fetch(
        `${process.env.BACKEND_URL}/api/search?q=${encodeURIComponent(query)}`
      );
      const searchData = await searchRes.json();
      if (searchData.length > 0) {
        const songUrl = searchData[0].url;
        const lyricsRes = await fetch(
          `${process.env.BACKEND_URL}/api/lyrics?url=${encodeURIComponent(songUrl)}`
        );
        const lyricsData = await lyricsRes.json();
        setLyrics(lyricsData.lyrics || "Lyrics not found.");
      } else {
        setLyrics("Lyrics not found.");
      }
    } catch {
      setLyrics("Error fetching lyrics.");
    }
    setSearching(false);
  }

  function login() {
    const client_id = "YOUR_SPOTIFY_CLIENT_ID"; // replace with your Spotify app client ID
    const redirect_uri = window.location.origin;
    const scopes = "user-read-currently-playing user-read-playback-state";
    const url =
      "https://accounts.spotify.com/authorize" +
      "?response_type=token" +
      "&client_id=" +
      encodeURIComponent(client_id) +
      "&scope=" +
      encodeURIComponent(scopes) +
      "&redirect_uri=" +
      encodeURIComponent(redirect_uri);
    window.location = url;
  }

  return (
    <div
      style={{
        backgroundColor: "#121212",
        color: "#fff",
        minHeight: "100vh",
        padding: "20px",
        fontFamily: "'SF Pro Text', 'Helvetica Neue', Arial, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}
    >
      {!token ? (
        <button
          onClick={login}
          style={{
            marginTop: "30vh",
            padding: "15px 30px",
            fontSize: "18px",
            backgroundColor: "#1DB954",
            border: "none",
            borderRadius: "25px",
            color: "#fff",
            cursor: "pointer"
          }}
        >
          Log in with Spotify
        </button>
      ) : (
        <>
          <h2>Now Playing</h2>
          {nowPlaying ? (
            <>
              <img
                src={nowPlaying.album.images[0].url}
                alt={nowPlaying.name}
                style={{ width: 250, borderRadius: 10 }}
              />
              <h3 style={{ marginTop: 10 }}>{nowPlaying.name}</h3>
              <p style={{ fontStyle: "italic", marginBottom: 10 }}>
                {nowPlaying.artists.map((a) => a.name).join(", ")}
              </p>
              <div
                style={{
                  whiteSpace: "pre-wrap",
                  maxWidth: 400,
                  textAlign: "center",
                  fontSize: 16,
                  lineHeight: 1.5,
                  backgroundColor: "#222",
                  borderRadius: 10,
                  padding: 20,
                  height: 300,
                  overflowY: "auto"
                }}
              >
                {searching ? "Loading lyrics..." : lyrics}
              </div>
            </>
          ) : (
            <p>No song is currently playing.</p>
          )}
        </>
      )}
    </div>
  );
}
