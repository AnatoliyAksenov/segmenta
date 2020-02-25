from aiohttp import web
import pickle

from sqlalchemy_aio import ASYNCIO_STRATEGY
from sqlalchemy import create_engine

restapi = web.RouteTableDef()

engine = create_engine(
        # In-memory sqlite database cannot be accessed from different
        # threads, use file.
        'sqlite:///segmenta.db', strategy=ASYNCIO_STRATEGY
    )

BASE_URL = '/api/v1'

q_id = "select last_insert_rowid() as id"

@restapi.post(f'{BASE_URL}/mask2rle')
async def mask2rle(request):
    postdata = await request.post()
    class_name = postdata.get('data[class_name]')
    res = postdata.getall('data[mask][]')
    res = [float(x) for x in res]

    url = postdata.get('data[src]')

    return web.json_response({"result": "OK"})


@restapi.post(f'{BASE_URL}/insert_image')
async def insert_image(request):
    json = await request.json()

    project_id = json.get('project_id')
    image = json.get('image')

    conn = await engine.connect()
    q = """
    insert into images(project_id, image_name, image_size, last_modified_date, image_type, src)
    values (:project_id, :name, :size, :last_modified, :image_type, :src)
    """

    params = {}
    params['project_id'] = project_id
    params['name'] = image.get('name')
    params['size'] = image.get('size')
    params['last_modified'] = image.get('lastModifiedDate')
    params['image_type'] = image.get('type')
    params['src'] = image.get('src')

    await conn.execute(q, **params)

    reader = await conn.execute(q_id)
    result = await reader.fetchall()

    image_id = [dict(x) for x in result][0]['id']
    
    return web.json_response({"result": "OK", "project_id": project_id, "image_id": image_id})


@restapi.get(f'{BASE_URL}/get_images/{{project_id}}')
async def get_images(request):
    project_id = request.match_info['project_id']
    conn = await engine.connect()

    q = """select id, 
                  project_id, 
                  image_name `name`, 
                  image_type `type`, 
                  image_size `size`, 
                  last_modified_date `lastModifiedDate`,
                  src
             from images where project_id = :project_id"""
    reader = await conn.execute(q, project_id=project_id)
    result = await reader.fetchall()

    data = [dict(x) for x in result]
    
    return web.json_response(data)


@restapi.get(f'{BASE_URL}/get_projects')
async def get_projects(request):
    conn = await engine.connect()

    q = 'select id, name, description from projects'
    result = await conn.execute(q)
    
    projects = await result.fetchall()
    res = [dict(x) for x in projects]
    await conn.close()
    
    return web.json_response(res)


@restapi.post(f'{BASE_URL}/new_project')
async def new_project(request):
    # postdata = await request.post() # empty if used $http.post
    json = await request.json()
    # r = await request.read() # contain raw bites if used $http.post 
    param = {}
    param['name'] = json.get('name')
    param['description'] = json.get('description')

    conn = await engine.connect()

    await conn.execute('insert into projects (name, description) values (:name, :description)', **param)
    await conn.close()

    return web.json_response({"result": "OK"})


@restapi.post(f'{BASE_URL}/add_project_mask')
async def add_project_mask(request):
    json = await request.json()
    
    param = {}
    param['project_id'] = json.get('projet_id')
    param['class_name'] = json.get('class_name')
    param['class_color'] = json.get('class_color')

    conn = await engine.connect()

    await conn.execute('insert into project_masks (project_id, mask_name, mask_color) values (:project_id, :class_name, :class_color)', **param)
    reader = await conn.execute(q_id)
    result = await reader.fetchall()
    class_id = [dict(x) for x in result][0]['id']

    await conn.close()

    return web.json_response({"result": "OK", "class_id": class_id})

