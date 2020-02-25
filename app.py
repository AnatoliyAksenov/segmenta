import os
from aiohttp import web

from routes import restapi

app = web.Application(client_max_size=1024*1024*100)


app.router.add_get("/", lambda request: web.FileResponse("public/app/index.html"))

app.add_routes(restapi)
app.router.add_get('/test', lambda request: web.Response(body="hello"))

app.router.add_static('/', 'public/app/', name='public')


web.run_app(app, host="0.0.0.0", port=os.environ.get("PORT") or 8080)