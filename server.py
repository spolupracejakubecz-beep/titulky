# Jednoduchý místní server pro aplikaci Titulky na Reels.
# Spuštění: python server.py  (pak se otevře prohlížeč na http://localhost:8765)
import http.server, socketserver, webbrowser, os, sys, threading

PORT = int(os.environ.get("PORT", "8765"))
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript", ".mjs": "text/javascript",
        ".wasm": "application/wasm", ".woff2": "font/woff2", ".css": "text/css",
    }
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()
    def log_message(self, *args):
        pass

class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

try:
    httpd = Server(("127.0.0.1", PORT), Handler)
except OSError:
    print(f"Port {PORT} je obsazený - aplikace už možná běží. Otevírám prohlížeč.")
    webbrowser.open(f"http://localhost:{PORT}")
    sys.exit(0)

url = f"http://localhost:{PORT}"
print(f"Titulky na Reels běží na {url}")
print("Okno nech otevřené. Aplikaci ukončíš zavřením tohoto okna (nebo Ctrl+C).")
if "--no-browser" not in sys.argv:
    threading.Timer(0.8, lambda: webbrowser.open(url)).start()
try:
    httpd.serve_forever()
except KeyboardInterrupt:
    pass
